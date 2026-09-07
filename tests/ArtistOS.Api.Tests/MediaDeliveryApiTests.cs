using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class MediaDeliveryApiTests
{
    [Fact]
    public async Task Audio_media_access_requires_authentication()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/api/songs/1/audio-assets/1/media-access",
            null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Owned_linked_audio_asset_returns_media_access()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);

        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);

        response.EnsureSuccessStatusCode();
        var access = (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
        Assert.Contains(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset.Id}/media",
            access.MediaUrl);
        Assert.Contains("token=", access.MediaUrl);
        Assert.Equal("audio/wav", access.MimeType);
        Assert.Equal("demo.wav", access.FileName);
        Assert.Equal(6, access.SizeBytes);
    }

    [Fact]
    public async Task Owned_linked_visual_asset_returns_media_access()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedVisualScenarioAsync(factory, client);

        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/visual-assets/{scenario.VisualAsset!.Id}/media-access",
            null);

        response.EnsureSuccessStatusCode();
        var access = (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
        Assert.Contains(
            $"/api/songs/{scenario.Song.Id}/visual-assets/{scenario.VisualAsset.Id}/media",
            access.MediaUrl);
        Assert.Equal("image/png", access.MimeType);
        Assert.Equal("cover.png", access.FileName);
        Assert.Equal(5, access.SizeBytes);
    }

    [Fact]
    public async Task Cross_user_media_access_returns_not_found()
    {
        await using var factory = CreateFactory();
        using var owner = await factory.CreateAuthenticatedClientAsync("owner@example.com");
        using var other = await factory.CreateAuthenticatedClientAsync("other@example.com");
        var scenario = await CreateLinkedAudioScenarioAsync(factory, owner);

        var response = await other.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Asset_from_another_song_returns_not_found()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var otherSong = await CreateSongAsync(client, "Other Song");

        var response = await client.PostAsync(
            $"/api/songs/{otherSong.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Asset_without_external_reference_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSongAsync(client);
        var asset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Disconnected_google_drive_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var connection = await dbContext.GoogleDriveConnections.SingleAsync();
            dbContext.GoogleDriveConnections.Remove(connection);
            await dbContext.SaveChangesAsync();
        }

        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Reauth_required_google_drive_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSongAsync(client);
        var asset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(
            factory,
            song.OwnerUserId!.Value,
            GoogleDriveConnectionStatuses.ReauthRequired);
        await LinkAudioReferenceAsync(factory, song, asset, "drive-file-reauthed", [1, 2, 3]);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Media_access_response_does_not_expose_main_jwt_or_google_credentials()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var mainJwt = client.DefaultRequestHeaders.Authorization!.Parameter!;
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);

        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);
        var raw = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain(mainJwt, raw);
        Assert.DoesNotContain("refresh-token-secret-123", raw);
        Assert.DoesNotContain("fake-access-token", raw);
        Assert.DoesNotContain("ProtectedRefreshToken", raw);
        Assert.DoesNotContain(scenario.ExternalId, raw);
    }

    [Fact]
    public async Task Valid_media_token_streams_full_audio_content()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client, bytes: [10, 20, 30, 40, 50, 60]);
        var access = await CreateAudioAccessAsync(client, scenario);

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));
        var bytes = await response.Content.ReadAsByteArrayAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal([10, 20, 30, 40, 50, 60], bytes);
        Assert.Equal("audio/wav", response.Content.Headers.ContentType!.MediaType);
        Assert.Equal("bytes", response.Headers.AcceptRanges.Single());
        Assert.Equal(6, response.Content.Headers.ContentLength);
        var providerRequest = Assert.Single(fakeDrive.MediaRequests);
        Assert.Null(providerRequest.Range);
    }

    [Fact]
    public async Task Valid_media_token_streams_full_visual_content()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedVisualScenarioAsync(factory, client, bytes: [1, 2, 3, 4, 5]);
        var access = await CreateVisualAccessAsync(client, scenario);

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("image/png", response.Content.Headers.ContentType!.MediaType);
        Assert.Equal([1, 2, 3, 4, 5], await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task Valid_range_request_returns_partial_content_and_forwards_range_to_provider()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(
            factory,
            client,
            bytes: [0, 1, 2, 3, 4, 5, 6, 7]);
        var access = await CreateAudioAccessAsync(client, scenario);
        var request = new HttpRequestMessage(HttpMethod.Get, ToPathAndQuery(access.MediaUrl));
        request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(2, 5);

        var response = await client.SendAsync(request);
        var bytes = await response.Content.ReadAsByteArrayAsync();

        Assert.Equal(HttpStatusCode.PartialContent, response.StatusCode);
        Assert.Equal([2, 3, 4, 5], bytes);
        Assert.Equal("bytes 2-5/8", response.Content.Headers.ContentRange!.ToString());
        Assert.Equal(4, response.Content.Headers.ContentLength);
        var providerRequest = Assert.Single(fakeDrive.MediaRequests);
        Assert.Equal(2, providerRequest.Range!.Start);
        Assert.Equal(5, providerRequest.Range.End);
    }

    [Fact]
    public async Task Invalid_range_returns_range_not_satisfiable_without_provider_request()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);
        var request = new HttpRequestMessage(HttpMethod.Get, ToPathAndQuery(access.MediaUrl));
        request.Headers.TryAddWithoutValidation("Range", "bytes=5-1");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.RequestedRangeNotSatisfiable, response.StatusCode);
        Assert.Equal("bytes */6", response.Content.Headers.ContentRange!.ToString());
        Assert.Empty(fakeDrive.MediaRequests);
    }

    [Fact]
    public async Task Provider_unsatisfiable_range_returns_416()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client, bytes: [1, 2, 3]);
        var access = await CreateAudioAccessAsync(client, scenario);
        var request = new HttpRequestMessage(HttpMethod.Get, ToPathAndQuery(access.MediaUrl));
        request.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(99, 100);

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.RequestedRangeNotSatisfiable, response.StatusCode);
        Assert.Equal("bytes */3", response.Content.Headers.ContentRange!.ToString());
    }

    [Fact]
    public async Task Head_returns_metadata_without_provider_body_request()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);

        var response = await client.SendAsync(
            new HttpRequestMessage(HttpMethod.Head, ToPathAndQuery(access.MediaUrl)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("audio/wav", response.Content.Headers.ContentType!.MediaType);
        Assert.Equal(6, response.Content.Headers.ContentLength);
        Assert.Equal("bytes", response.Headers.AcceptRanges.Single());
        Assert.Empty(await response.Content.ReadAsByteArrayAsync());
        Assert.Empty(fakeDrive.MediaRequests);
    }

    [Fact]
    public async Task Malformed_media_token_returns_unauthorized()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/songs/1/audio-assets/1/media?token=not-a-valid-token");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Expired_media_token_returns_unauthorized()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var expiredToken = CreateProtectedMediaToken(
            factory,
            new MediaAccessTokenPayload
            {
                UserId = scenario.Song.OwnerUserId!.Value,
                SongId = scenario.Song.Id,
                AssetKind = MediaAssetKinds.Audio,
                AssetId = scenario.AudioAsset!.Id,
                ExternalFileReferenceId = scenario.ExternalFileReferenceId,
                Purpose = "stream"
            },
            TimeSpan.FromMilliseconds(1));
        await Task.Delay(30);

        var response = await client.GetAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset.Id}/media?token={Uri.EscapeDataString(expiredToken)}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Audio_token_cannot_access_visual_route()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var audio = await CreateLinkedAudioScenarioAsync(factory, client);
        var visual = await CreateLinkedVisualScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, audio);
        var token = ExtractToken(access.MediaUrl);

        var response = await client.GetAsync(
            $"/api/songs/{visual.Song.Id}/visual-assets/{visual.VisualAsset!.Id}/media?token={Uri.EscapeDataString(token)}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Token_for_asset_a_cannot_access_asset_b()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var a = await CreateLinkedAudioScenarioAsync(factory, client, "A");
        var b = await CreateLinkedAudioScenarioAsync(factory, client, "B");
        var access = await CreateAudioAccessAsync(client, a);
        var token = ExtractToken(access.MediaUrl);

        var response = await client.GetAsync(
            $"/api/songs/{b.Song.Id}/audio-assets/{b.AudioAsset!.Id}/media?token={Uri.EscapeDataString(token)}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Route_song_mismatch_returns_unauthorized()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var otherSong = await CreateSongAsync(client, "Other");
        var access = await CreateAudioAccessAsync(client, scenario);
        var token = ExtractToken(access.MediaUrl);

        var response = await client.GetAsync(
            $"/api/songs/{otherSong.Id}/audio-assets/{scenario.AudioAsset!.Id}/media?token={Uri.EscapeDataString(token)}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Asset_link_changed_after_token_issuance_fails_safely()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var asset = await dbContext.AudioAssets.SingleAsync(asset => asset.Id == scenario.AudioAsset!.Id);
            asset.ExternalFileReferenceId = null;
            await dbContext.SaveChangesAsync();
        }

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Provider_404_maps_safely()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        fakeDrive.Files.Remove(scenario.ExternalId);
        fakeDrive.FileBytes.Remove(scenario.ExternalId);
        var access = await CreateAudioAccessAsync(client, scenario);

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Provider_403_maps_safely()
    {
        var fakeDrive = new FakeGoogleDriveApiClient { MediaFailureStatus = GoogleDriveMediaStatus.Forbidden };
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task Provider_refresh_failure_maps_to_reauth_required_and_marks_connection()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(fakeGoogle);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var scenario = await CreateLinkedAudioScenarioAsync(factory, client);
        var access = await CreateAudioAccessAsync(client, scenario);
        fakeGoogle.FailRefresh = true;

        var response = await client.GetAsync(ToPathAndQuery(access.MediaUrl));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();
        Assert.Equal(GoogleDriveConnectionStatuses.ReauthRequired, connection.Status);
    }

    private static ArtistOsApiFactory CreateFactory(
        FakeGoogleDriveOAuthClient? fakeGoogle = null,
        FakeGoogleDriveApiClient? fakeDrive = null)
    {
        fakeGoogle ??= new FakeGoogleDriveOAuthClient();
        fakeDrive ??= new FakeGoogleDriveApiClient();

        return new ArtistOsApiFactory(configureTestServices: services =>
        {
            services.RemoveAll<IGoogleDriveOAuthClient>();
            services.RemoveAll<IGoogleDriveApiClient>();
            services.AddSingleton<IGoogleDriveOAuthClient>(fakeGoogle);
            services.AddSingleton<IGoogleDriveApiClient>(fakeDrive);
        });
    }

    private static async Task<MediaScenario> CreateLinkedAudioScenarioAsync(
        ArtistOsApiFactory factory,
        HttpClient client,
        string title = "Night Protocol",
        byte[]? bytes = null)
    {
        var song = await CreateSongAsync(client, title);
        var asset = await CreateAudioAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var upload = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes ?? [1, 2, 3, 4, 5, 6]);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav");
        upload.Add(file, "file", "demo.wav");
        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}/upload",
            upload);
        response.EnsureSuccessStatusCode();
        var uploaded = (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
        var externalId = await GetExternalIdAsync(factory, uploaded.LinkedFile!.Id);
        return new MediaScenario(song, uploaded, null, uploaded.LinkedFile.Id, externalId);
    }

    private static async Task<MediaScenario> CreateLinkedVisualScenarioAsync(
        ArtistOsApiFactory factory,
        HttpClient client,
        byte[]? bytes = null)
    {
        var song = await CreateSongAsync(client, "Visual Song");
        var asset = await CreateVisualAssetAsync(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var upload = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes ?? [1, 2, 3, 4, 5]);
        file.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        upload.Add(file, "file", "cover.png");
        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{asset.Id}/upload",
            upload);
        response.EnsureSuccessStatusCode();
        var uploaded = (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
        var externalId = await GetExternalIdAsync(factory, uploaded.LinkedFile!.Id);
        return new MediaScenario(song, null, uploaded, uploaded.LinkedFile.Id, externalId);
    }

    private static async Task LinkAudioReferenceAsync(
        ArtistOsApiFactory factory,
        SongResponse song,
        AudioAssetResponse asset,
        string externalId,
        byte[] bytes)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();
        var fakeDrive = scope.ServiceProvider.GetRequiredService<IGoogleDriveApiClient>() as FakeGoogleDriveApiClient;
        fakeDrive!.Files[externalId] = new GoogleDriveUploadedFile
        {
            Id = externalId,
            Name = "manual.wav",
            MimeType = "audio/wav",
            SizeBytes = bytes.Length,
            WebViewLink = "https://drive.google.test/manual"
        };
        fakeDrive.FileBytes[externalId] = bytes;

        var reference = new ExternalFileReference
        {
            OwnerUserId = song.OwnerUserId!.Value,
            SongId = song.Id,
            GoogleDriveConnectionId = connection.Id,
            Provider = ExternalFileProviders.GoogleDrive,
            ExternalId = externalId,
            ResourceType = ExternalResourceTypes.AudioAssetFile,
            IsFolder = false,
            DisplayName = "manual.wav",
            MimeType = "audio/wav",
            SizeBytes = bytes.Length,
            LinkedResourceType = nameof(AudioAsset),
            LinkedResourceId = asset.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.ExternalFileReferences.Add(reference);
        await dbContext.SaveChangesAsync();

        var savedAsset = await dbContext.AudioAssets.SingleAsync(saved => saved.Id == asset.Id);
        savedAsset.ExternalFileReferenceId = reference.Id;
        await dbContext.SaveChangesAsync();
    }

    private static async Task<MediaAccessResponse> CreateAudioAccessAsync(
        HttpClient client,
        MediaScenario scenario)
    {
        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{scenario.AudioAsset!.Id}/media-access",
            null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
    }

    private static async Task<MediaAccessResponse> CreateVisualAccessAsync(
        HttpClient client,
        MediaScenario scenario)
    {
        var response = await client.PostAsync(
            $"/api/songs/{scenario.Song.Id}/visual-assets/{scenario.VisualAsset!.Id}/media-access",
            null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
    }

    private static async Task<SongResponse> CreateSongAsync(
        HttpClient client,
        string title = "Night Protocol")
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
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
            version = 1,
            status = "Draft",
            durationSeconds = 120,
            fileSizeBytes = 123,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
    }

    private static async Task<VisualAssetResponse> CreateVisualAssetAsync(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "metadata.png",
            version = 1,
            status = "Draft",
            width = 1200,
            height = 1200,
            fileSizeBytes = 123,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
    }

    private static async Task CreateGoogleConnectionAsync(
        ArtistOsApiFactory factory,
        int userId,
        string status = GoogleDriveConnectionStatuses.Connected)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dataProtectionProvider = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
        var protector = dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");

        var existing = await dbContext.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId);
        if (existing is not null)
        {
            existing.Status = status;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.LastSuccessfulRefreshAt = status == GoogleDriveConnectionStatuses.Connected
                ? DateTime.UtcNow
                : null;
            await dbContext.SaveChangesAsync();
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
            Status = status,
            ConnectedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastSuccessfulRefreshAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }

    private static async Task<string> GetExternalIdAsync(
        ArtistOsApiFactory factory,
        int referenceId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var reference = await dbContext.ExternalFileReferences
            .AsNoTracking()
            .SingleAsync(reference => reference.Id == referenceId);
        return reference.ExternalId;
    }

    private static string CreateProtectedMediaToken(
        ArtistOsApiFactory factory,
        MediaAccessTokenPayload payload,
        TimeSpan lifetime)
    {
        using var scope = factory.Services.CreateScope();
        var protector = scope.ServiceProvider
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("ArtistOS.MediaAccessToken.v1")
            .ToTimeLimitedDataProtector();

        return protector.Protect(JsonSerializer.Serialize(payload), lifetime);
    }

    private static string ToPathAndQuery(string mediaUrl)
    {
        var uri = new Uri(mediaUrl);
        return uri.PathAndQuery;
    }

    private static string ExtractToken(string mediaUrl)
    {
        var uri = new Uri(mediaUrl);
        return uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .Where(pair => pair.Length == 2)
            .Where(pair => string.Equals(pair[0], "token", StringComparison.Ordinal))
            .Select(pair => Uri.UnescapeDataString(pair[1]))
            .Single();
    }

    private sealed record MediaScenario(
        SongResponse Song,
        AudioAssetResponse? AudioAsset,
        VisualAssetResponse? VisualAsset,
        int ExternalFileReferenceId,
        string ExternalId);
}
