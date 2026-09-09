using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;

namespace ArtistOS.Api.Tests;

public class SecurityAttackVerificationTests
{
    [Theory]
    [InlineData("modified-payload")]
    [InlineData("invalid-signature")]
    [InlineData("wrong-issuer")]
    [InlineData("wrong-audience")]
    public async Task Jwt_attack_variants_fail_without_echoing_token_or_stack_trace(string variant)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var token = variant switch
        {
            "modified-payload" => CreateTamperedPayloadToken(),
            "invalid-signature" => CreateToken(signingKey: "wrong-signing-key-that-is-still-long-enough"),
            "wrong-issuer" => CreateToken(issuer: "https://issuer.attacker.test"),
            "wrong-audience" => CreateToken(audience: "WrongAudience"),
            _ => throw new InvalidOperationException("Unknown JWT attack variant.")
        };
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/auth/me");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.DoesNotContain(token, body, StringComparison.Ordinal);
        Assert.DoesNotContain("stack", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ArtistOS.Api", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Hostile_cors_origin_is_not_allowed_in_production_like_configuration()
    {
        await using var factory = new ArtistOsApiFactory(
            PublicProductionLikeConfiguration(),
            environmentName: "Production");
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://api.artistos.test")
        });
        using var preflight = new HttpRequestMessage(HttpMethod.Options, "/api/songs");
        preflight.Headers.Add("Origin", "https://evil.example");
        preflight.Headers.Add("Access-Control-Request-Method", "GET");
        preflight.Headers.Add("Access-Control-Request-Headers", "authorization");

        var response = await client.SendAsync(preflight);

        Assert.False(response.Headers.TryGetValues("Access-Control-Allow-Origin", out _));
        Assert.False(response.Headers.TryGetValues("Access-Control-Allow-Credentials", out _));
    }

    [Fact]
    public async Task Trusted_public_api_url_controls_media_access_url_not_request_host()
    {
        await using var factory = CreateFactory(PublicUrlConfiguration());
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset.Id}/media-access");
        request.Headers.Host = "evil.example";

        var response = await client.SendAsync(request);

        response.EnsureSuccessStatusCode();
        var access = (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
        Assert.StartsWith("https://api.artistos.test/", access.MediaUrl, StringComparison.Ordinal);
        Assert.DoesNotContain("evil.example", access.MediaUrl, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Data_protection_keys_persist_across_restart_when_same_key_ring_is_configured()
    {
        var keyRingPath = Path.Combine(Path.GetTempPath(), "artist-os-s4a-keys", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(keyRingPath);
        var configuration = PublicProductionLikeConfiguration(keyRingPath);
        string protectedValue;

        await using (var firstFactory = new ArtistOsApiFactory(configuration, environmentName: "Production"))
        {
            using var firstClient = firstFactory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://api.artistos.test")
            });
            _ = await firstClient.GetAsync("/api/auth/me");
            var protector = firstFactory.Services
                .GetRequiredService<IDataProtectionProvider>()
                .CreateProtector("ArtistOS.S4A.PersistenceProbe");
            protectedValue = protector.Protect("survives-restart");
        }

        await using var secondFactory = new ArtistOsApiFactory(configuration, environmentName: "Production");
        using var secondClient = secondFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://api.artistos.test")
        });
        _ = await secondClient.GetAsync("/api/auth/me");
        var secondProtector = secondFactory.Services
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("ArtistOS.S4A.PersistenceProbe");

        Assert.Equal("survives-restart", secondProtector.Unprotect(protectedValue));
    }

    [Fact]
    public void Data_protection_purposes_are_not_interchangeable()
    {
        using var factory = new ArtistOsApiFactory();
        using var scope = factory.Services.CreateScope();
        var dataProtectionProvider = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
        var refreshProtector = dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");
        var protectedRefreshToken = refreshProtector.Protect("refresh-token-secret-123");

        var mediaTokenService = scope.ServiceProvider.GetRequiredService<MediaTokenService>();
        var oauthStateProtector = scope.ServiceProvider.GetRequiredService<GoogleDriveOAuthStateProtector>();

        Assert.False(mediaTokenService.TryUnprotect(protectedRefreshToken, out _));
        Assert.False(oauthStateProtector.TryUnprotect(protectedRefreshToken, out _));
    }

    [Fact]
    public async Task Double_extension_uploads_are_rejected_and_path_segments_are_stripped()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSongAsync(client);
        var audioAsset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var rejected = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("song.mp3.exe", "audio/mpeg", [1, 2, 3]));

        Assert.Equal(HttpStatusCode.BadRequest, rejected.StatusCode);

        var accepted = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile(@"..\demo.wav", "audio/wav", [1, 2, 3]));

        accepted.EnsureSuccessStatusCode();
        Assert.Equal("demo.wav", Assert.Single(fakeDrive.UploadedFiles).Name);
    }

    [Fact]
    public async Task Malformed_and_multi_range_requests_fail_before_provider_request()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);

        foreach (var rangeHeader in new[] { "bytes=abc-def", "bytes=0-1,2-3" })
        {
            fakeDrive.MediaRequests.Clear();
            using var request = new HttpRequestMessage(HttpMethod.Get, ToPathAndQuery(access.MediaUrl));
            request.Headers.TryAddWithoutValidation("Range", rangeHeader);

            var response = await client.SendAsync(request);

            Assert.Equal(HttpStatusCode.RequestedRangeNotSatisfiable, response.StatusCode);
            Assert.Empty(fakeDrive.MediaRequests);
            var cacheControl = response.Headers.CacheControl!.ToString();
            Assert.Contains("private", cacheControl, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("no-store", cacheControl, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task Valid_media_token_replay_within_lifetime_remains_allowed_for_native_media_requests()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client, bytes: [1, 2, 3, 4]);
        var access = await CreateAudioAccessAsync(client, scenario);
        var path = ToPathAndQuery(access.MediaUrl);

        var first = await client.GetAsync(path);
        var second = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
    }

    [Fact]
    public async Task Security_headers_are_present_on_production_like_api_response()
    {
        await using var factory = new ArtistOsApiFactory(
            PublicProductionLikeConfiguration(),
            environmentName: "Production");
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://api.artistos.test")
        });

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
        Assert.True(response.Headers.Contains("Permissions-Policy"));
        Assert.True(response.Headers.Contains("Strict-Transport-Security"));
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
    }

    private static ArtistOsApiFactory CreateFactory(
        Dictionary<string, string?>? configurationOverrides = null,
        FakeGoogleDriveOAuthClient? fakeGoogle = null,
        FakeGoogleDriveApiClient? fakeDrive = null)
    {
        fakeGoogle ??= new FakeGoogleDriveOAuthClient();
        fakeDrive ??= new FakeGoogleDriveApiClient();

        return new ArtistOsApiFactory(configurationOverrides, services =>
        {
            services.RemoveAll<IGoogleDriveOAuthClient>();
            services.RemoveAll<IGoogleDriveApiClient>();
            services.AddSingleton<IGoogleDriveOAuthClient>(fakeGoogle);
            services.AddSingleton<IGoogleDriveApiClient>(fakeDrive);
        });
    }

    private static Dictionary<string, string?> PublicProductionLikeConfiguration(string? keyRingPath = null)
    {
        keyRingPath ??= Path.Combine(Path.GetTempPath(), "artist-os-s4a-keys", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(keyRingPath);

        var values = PublicUrlConfiguration();
        values["AllowedHosts"] = "api.artistos.test";
        values["DataProtection:KeyRingPath"] = keyRingPath;
        values["Cors:AllowedOrigins:0"] = "https://app.artistos.test";
        return values;
    }

    private static Dictionary<string, string?> PublicUrlConfiguration()
    {
        return new Dictionary<string, string?>
        {
            ["PublicUrls:ApiBaseUrl"] = "https://api.artistos.test",
            ["PublicUrls:FrontendBaseUrl"] = "https://app.artistos.test"
        };
    }

    private static string CreateToken(
        string issuer = "ArtistOS.Api.Tests",
        string audience = "ArtistOS.Tests",
        string signingKey = ArtistOsApiFactory.TestJwtSigningKey,
        int userId = 123)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var now = DateTime.UtcNow;
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, "attacker@example.com")
            ],
            notBefore: now.AddMinutes(-1),
            expires: now.AddMinutes(20),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string CreateTamperedPayloadToken()
    {
        var token = CreateToken();
        var parts = token.Split('.');
        var payload = JsonSerializer.SerializeToUtf8Bytes(new
        {
            sub = "999999",
            email = "attacker@example.com",
            iss = "ArtistOS.Api.Tests",
            aud = "ArtistOS.Tests",
            exp = DateTimeOffset.UtcNow.AddMinutes(20).ToUnixTimeSeconds(),
            nbf = DateTimeOffset.UtcNow.AddMinutes(-1).ToUnixTimeSeconds()
        });
        parts[1] = Base64UrlEncoder.Encode(payload);
        return string.Join('.', parts);
    }

    private static async Task<MediaScenario> CreateLinkedAudioScenarioAsync(
        ArtistOsApiFactory factory,
        HttpClient client,
        byte[]? bytes = null)
    {
        var song = await CreateSongAsync(client);
        var asset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var upload = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav", bytes ?? [1, 2, 3, 4]));
        upload.EnsureSuccessStatusCode();
        var uploaded = (await upload.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
        return new MediaScenario(song, uploaded);
    }

    private static async Task<MediaAccessResponse> CreateAudioAccessAsync(
        HttpClient client,
        MediaScenario scenario)
    {
        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset.Id}/media-access",
            null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "S4A Attack Surface",
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<AudioAssetResponse> CreateAudioAssetAsync(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", new
        {
            type = "Demo",
            fileName = "metadata.wav",
            version = 99,
            status = "Draft",
            durationSeconds = 120,
            fileSizeBytes = 123,
            isCurrent = false,
            assetFamilyId = Guid.NewGuid(),
            externalFileReferenceId = 999999,
            uploadedAt = DateTime.UtcNow.AddYears(10)
        });
        response.EnsureSuccessStatusCode();
        var created = (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
        Assert.Equal(1, created.Version);
        Assert.True(created.IsCurrent);
        Assert.Null(created.LinkedFile);
        return created;
    }

    private static MultipartFormDataContent CreateMultipartFile(
        string fileName,
        string contentType,
        byte[] bytes)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);
        return content;
    }

    private static async Task CreateGoogleConnectionAsync(
        ArtistOsApiFactory factory,
        int userId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dataProtectionProvider = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
        var protector = dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");

        if (await dbContext.GoogleDriveConnections.AnyAsync(connection => connection.UserId == userId))
        {
            return;
        }

        dbContext.GoogleDriveConnections.Add(new GoogleDriveConnection
        {
            UserId = userId,
            GoogleSubject = $"google-subject-{userId}",
            GoogleEmail = $"artist-{userId}@example.com",
            GoogleEmailVerified = true,
            GrantedScopes = "openid email https://www.googleapis.com/auth/drive.file",
            ProtectedRefreshToken = protector.Protect("refresh-token-secret-123"),
            Status = GoogleDriveConnectionStatuses.Connected,
            ConnectedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastSuccessfulRefreshAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }

    private static string ToPathAndQuery(string mediaUrl)
    {
        var uri = new Uri(mediaUrl);
        return uri.PathAndQuery;
    }

    private sealed record MediaScenario(SongResponse Song, AudioAssetResponse AudioAsset);
}
