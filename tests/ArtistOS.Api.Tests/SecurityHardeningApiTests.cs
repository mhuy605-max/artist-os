using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class SecurityHardeningApiTests
{
    [Fact]
    public async Task Repeated_login_is_throttled_without_leaking_limiter_internals()
    {
        await using var factory = CreateFactory(new()
        {
            ["Security:RateLimits:AuthStrict:PermitLimit"] = "2"
        });
        using var client = factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/auth/login", LoginPayload());
        var second = await client.PostAsJsonAsync("/api/auth/login", LoginPayload());
        var throttled = await client.PostAsJsonAsync("/api/auth/login", LoginPayload());
        var body = await throttled.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, first.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, throttled.StatusCode);
        Assert.Contains("Try again shortly", body);
        Assert.DoesNotContain("user:", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("ip:", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Repeated_register_is_throttled()
    {
        await using var factory = CreateFactory(new()
        {
            ["Security:RateLimits:AuthStrict:PermitLimit"] = "2"
        });
        using var client = factory.CreateClient();

        var first = await client.PostAsJsonAsync("/api/auth/register", RegisterPayload("artist@example.com"));
        var second = await client.PostAsJsonAsync("/api/auth/register", RegisterPayload("artist@example.com"));
        var throttled = await client.PostAsJsonAsync("/api/auth/register", RegisterPayload("other@example.com"));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, throttled.StatusCode);
    }

    [Fact]
    public async Task Excessive_passwords_are_rejected_before_hashing_paths_are_used()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();
        var longPassword = new string('x', LoginRequest.PasswordMaxLength + 1);

        var register = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "artist@example.com",
            password = longPassword
        });
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "artist@example.com",
            password = longPassword
        });

        Assert.Equal(HttpStatusCode.BadRequest, register.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, login.StatusCode);
    }

    [Fact]
    public async Task Normal_api_policy_throttles_abusive_authenticated_reads()
    {
        await using var factory = CreateFactory(new()
        {
            ["Security:RateLimits:NormalApi:PermitLimit"] = "2"
        });
        using var client = await factory.CreateAuthenticatedClientAsync();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/songs")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/songs")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/api/songs")).StatusCode);
    }

    [Fact]
    public async Task Aggregate_policy_throttles_repeated_dashboard_requests()
    {
        await using var factory = CreateFactory(new()
        {
            ["Security:RateLimits:Aggregates:PermitLimit"] = "1"
        });
        using var client = await factory.CreateAuthenticatedClientAsync();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/api/dashboard")).StatusCode);
    }

    [Fact]
    public async Task Media_stream_policy_throttles_without_changing_normal_first_stream()
    {
        await using var factory = CreateFactory(new()
        {
            ["Security:RateLimits:MediaStream:PermitLimit"] = "1"
        });
        using var client = await factory.CreateAuthenticatedClientAsync();
        var access = await CreateLinkedAudioAccessAsync(factory, client);
        var pathAndQuery = ToPathAndQuery(access.MediaUrl);

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(pathAndQuery)).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync(pathAndQuery)).StatusCode);
    }

    [Fact]
    public async Task Upload_concurrency_policy_rejects_second_simultaneous_upload_for_same_user()
    {
        var fakeDrive = new FakeGoogleDriveApiClient { UploadDelay = TimeSpan.FromMilliseconds(500) };
        await using var factory = CreateFactory(
            new() { ["Security:RateLimits:Uploads:ConcurrencyLimit"] = "1" },
            fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSongAsync(client);
        var firstAsset = await CreateAudioAssetAsync(client, song.Id, "one.wav");
        var secondAsset = await CreateAudioAssetAsync(client, song.Id, "two.wav");
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var firstUpload = client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{firstAsset.Id}/upload",
            CreateMultipartFile("one.wav", "audio/wav", [1, 2, 3]));
        await Task.Delay(100);
        var secondUpload = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{secondAsset.Id}/upload",
            CreateMultipartFile("two.wav", "audio/wav", [4, 5, 6]));

        Assert.Equal(HttpStatusCode.TooManyRequests, secondUpload.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await firstUpload).StatusCode);
    }

    [Fact]
    public async Task Trusted_public_api_url_controls_google_redirect_uri_not_request_host()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(
            PublicUrlConfiguration(),
            fakeGoogle);
        using var client = await factory.CreateAuthenticatedClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/integrations/google-drive/connect");
        request.Headers.Host = "evil.example";

        var response = await client.SendAsync(request);

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<GoogleDriveConnectResponse>();
        Assert.NotNull(body);
        Assert.Contains("redirect_uri=https%3A%2F%2Fapi.artistos.test%2Fapi%2Fintegrations%2Fgoogle-drive%2Fcallback", body.AuthorizationUrl);
        Assert.DoesNotContain("evil.example", body.AuthorizationUrl);
    }

    [Fact]
    public async Task Google_callback_redirects_to_trusted_frontend_base_url()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(PublicUrlConfiguration(), fakeGoogle);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        await TestAuth.RegisterAsync(client);
        var connect = await client.PostAsJsonAsync("/api/integrations/google-drive/connect", new { });
        var authorization = (await connect.Content.ReadFromJsonAsync<GoogleDriveConnectResponse>())!;
        var state = ReadQueryValue(authorization.AuthorizationUrl, "state");

        var callback = await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(state)}");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Equal(
            "https://app.artistos.test/settings?googleDrive=connected",
            callback.Headers.Location?.ToString());
    }

    [Fact]
    public void Production_without_data_protection_key_ring_fails_startup()
    {
        using var factory = new ArtistOsApiFactory(
            new()
            {
                ["AllowedHosts"] = "api.artistos.test",
                ["PublicUrls:ApiBaseUrl"] = "https://api.artistos.test",
                ["PublicUrls:FrontendBaseUrl"] = "https://app.artistos.test",
                ["Cors:AllowedOrigins:0"] = "https://app.artistos.test"
            },
            environmentName: "Production");

        var exception = Assert.Throws<InvalidOperationException>(() => factory.CreateClient());
        Assert.Contains("DataProtection:KeyRingPath", exception.ToString());
    }

    [Fact]
    public async Task Production_security_headers_and_cors_are_configured_without_wildcard_origin()
    {
        await using var factory = new ArtistOsApiFactory(
            PublicProductionLikeConfiguration(),
            environmentName: "Production");
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://api.artistos.test")
        });
        using var preflight = new HttpRequestMessage(HttpMethod.Options, "/api/songs");
        preflight.Headers.Add("Origin", "https://app.artistos.test");
        preflight.Headers.Add("Access-Control-Request-Method", "GET");

        var unauthorized = await client.GetAsync("/api/auth/me");
        var cors = await client.SendAsync(preflight);

        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);
        Assert.True(unauthorized.Headers.Contains("Content-Security-Policy"));
        Assert.True(unauthorized.Headers.Contains("Strict-Transport-Security"));
        Assert.True(cors.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Equal("https://app.artistos.test", Assert.Single(origins));
        Assert.DoesNotContain("*", origins);
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

    private static Dictionary<string, string?> PublicProductionLikeConfiguration()
    {
        var keyRingPath = Path.Combine(Path.GetTempPath(), "artist-os-test-keys", Guid.NewGuid().ToString("N"));
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

    private static object LoginPayload()
    {
        return new
        {
            email = "missing@example.com",
            password = "password123"
        };
    }

    private static object RegisterPayload(string email)
    {
        return new
        {
            email,
            password = "password123"
        };
    }

    private static async Task<MediaAccessResponse> CreateLinkedAudioAccessAsync(
        ArtistOsApiFactory factory,
        HttpClient client)
    {
        var song = await CreateSongAsync(client);
        var asset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var upload = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav", [1, 2, 3]));
        upload.EnsureSuccessStatusCode();

        var access = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/media-access",
            null);
        access.EnsureSuccessStatusCode();
        return (await access.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Night Protocol",
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<AudioAssetResponse> CreateAudioAssetAsync(
        HttpClient client,
        int songId,
        string fileName = "metadata.wav")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", new
        {
            type = "Demo",
            fileName,
            version = 1,
            status = "Draft",
            durationSeconds = 120,
            fileSizeBytes = 123,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
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

    private static string ReadQueryValue(string url, string key)
    {
        var uri = new Uri(url);
        var query = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .ToDictionary(
                pair => Uri.UnescapeDataString(pair[0]),
                pair => pair.Length > 1 ? Uri.UnescapeDataString(pair[1]) : string.Empty);

        return query[key];
    }
}
