using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class AssetFileUploadApiTests
{
    [Fact]
    public async Task Audio_upload_requires_authentication()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/api/songs/1/audio-assets/1/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Audio_upload_for_cross_user_asset_returns_not_found()
    {
        await using var factory = CreateFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("b@example.com");
        var song = await CreateSong(userA);
        var audioAsset = await CreateAudioAsset(userA, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await userB.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Audio_upload_for_cross_song_asset_returns_not_found()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var songA = await CreateSong(client);
        var songB = await CreateSong(client, "Other Song");
        var audioAsset = await CreateAudioAsset(client, songA.Id);
        await CreateGoogleConnectionAsync(factory, songA.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{songB.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Empty_file_is_rejected()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("empty.wav", "audio/wav", []));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unsupported_audio_file_is_rejected()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("notes.txt", "text/plain"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Unsupported_visual_file_is_rejected()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var visualAsset = await CreateVisualAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{visualAsset.Id}/upload",
            CreateMultipartFile("cover.gif", "image/gif"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Oversized_audio_file_is_rejected()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        using var scope = factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<GoogleDriveAssetUploadService>();
        var file = CreateFormFile(
            "too-big.wav",
            "audio/wav",
            GoogleDriveUploadLimits.AudioMaxBytes + 1);

        var result = await service.UploadAudioAssetAsync(
            song.OwnerUserId!.Value,
            song.Id,
            audioAsset.Id,
            file,
            CancellationToken.None);

        Assert.Equal(GoogleDriveAssetUploadStatus.FileTooLarge, result.Status);
    }

    [Fact]
    public async Task Valid_audio_upload_uses_audio_folder_and_associates_reference()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id, "old-name.wav");
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var workspace = await ProvisionWorkspace(client, song.Id);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("master.wav", "audio/wav", [1, 2, 3, 4]));

        response.EnsureSuccessStatusCode();
        var uploaded = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(uploaded);
        Assert.Equal("master.wav", uploaded.FileName);
        Assert.Equal(4, uploaded.FileSizeBytes);
        Assert.NotNull(uploaded.LinkedFile);
        Assert.Equal("GoogleDrive", uploaded.LinkedFile.Provider);
        Assert.Equal("AudioAssetFile", uploaded.LinkedFile.ResourceType);
        Assert.Equal("master.wav", uploaded.LinkedFile.DisplayName);
        Assert.Equal("audio/wav", uploaded.LinkedFile.MimeType);
        Assert.Equal(4, uploaded.LinkedFile.SizeBytes);
        Assert.NotNull(uploaded.LinkedFile.WebViewLink);

        var upload = Assert.Single(fakeDrive.UploadedFiles);
        Assert.Equal("master.wav", upload.Name);
        Assert.Equal(workspace.Folders.Audio!.ExternalId, upload.ParentFolderId);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var reference = await dbContext.ExternalFileReferences
            .SingleAsync(reference => reference.ResourceType == ExternalResourceTypes.AudioAssetFile);
        var savedAsset = await dbContext.AudioAssets.SingleAsync(asset => asset.Id == audioAsset.Id);
        Assert.Equal(reference.Id, savedAsset.ExternalFileReferenceId);
        Assert.Equal("AudioAsset", reference.LinkedResourceType);
        Assert.Equal(audioAsset.Id, reference.LinkedResourceId);
    }

    [Fact]
    public async Task Valid_visual_upload_uses_visuals_folder_and_associates_reference()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var visualAsset = await CreateVisualAsset(client, song.Id, "old-cover.png");
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var workspace = await ProvisionWorkspace(client, song.Id);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{visualAsset.Id}/upload",
            CreateMultipartFile("cover.png", "image/png", [5, 6, 7]));

        response.EnsureSuccessStatusCode();
        var uploaded = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(uploaded);
        Assert.Equal("cover.png", uploaded.FileName);
        Assert.Equal(3, uploaded.FileSizeBytes);
        Assert.NotNull(uploaded.LinkedFile);
        Assert.Equal("VisualAssetFile", uploaded.LinkedFile.ResourceType);

        var upload = Assert.Single(fakeDrive.UploadedFiles);
        Assert.Equal(workspace.Folders.Visuals!.ExternalId, upload.ParentFolderId);
    }

    [Fact]
    public async Task Second_upload_when_asset_already_linked_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var first = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));
        first.EnsureSuccessStatusCode();

        var second = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo-2.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Missing_google_connection_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Reauth_required_connection_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(
            factory,
            song.OwnerUserId!.Value,
            GoogleDriveConnectionStatuses.ReauthRequired);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Token_refresh_failure_marks_connection_reauth_required()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient { FailRefresh = true };
        await using var factory = CreateFactory(fakeGoogle);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();
        Assert.Equal(GoogleDriveConnectionStatuses.ReauthRequired, connection.Status);
    }

    [Fact]
    public async Task Drive_upload_failure_does_not_create_reference_or_association()
    {
        var fakeDrive = new FakeGoogleDriveApiClient { FailUpload = true };
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var savedAsset = await dbContext.AudioAssets.SingleAsync(asset => asset.Id == audioAsset.Id);
        Assert.Null(savedAsset.ExternalFileReferenceId);
        Assert.DoesNotContain(
            await dbContext.ExternalFileReferences.ToListAsync(),
            reference => reference.ResourceType == ExternalResourceTypes.AudioAssetFile);
    }

    [Fact]
    public async Task Persistence_failure_after_drive_success_attempts_cleanup()
    {
        var fakeDrive = new FakeGoogleDriveApiClient { FixedUploadFileId = "duplicate-file-id" };
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            dbContext.ExternalFileReferences.Add(new ExternalFileReference
            {
                OwnerUserId = song.OwnerUserId!.Value,
                SongId = song.Id,
                Provider = ExternalFileProviders.GoogleDrive,
                ExternalId = "duplicate-file-id",
                ResourceType = ExternalResourceTypes.AudioAssetFile,
                IsFolder = false,
                DisplayName = "existing.wav",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await dbContext.SaveChangesAsync();
        }

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Contains("duplicate-file-id", fakeDrive.DeletedFileIds);
    }

    [Fact]
    public async Task Upload_response_does_not_return_google_token_material()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav"));
        var raw = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain("refresh-token-secret-123", raw);
        Assert.DoesNotContain("fake-access-token", raw);
        Assert.DoesNotContain("ProtectedRefreshToken", raw);
    }

    [Fact]
    public async Task Metadata_only_asset_without_reference_still_reads()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var audioAsset = await CreateAudioAsset(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/audio-assets/{audioAsset.Id}");

        response.EnsureSuccessStatusCode();
        var saved = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(saved);
        Assert.Null(saved.LinkedFile);
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

    private static MultipartFormDataContent CreateMultipartFile(
        string fileName,
        string contentType,
        byte[]? bytes = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes ?? [1, 2, 3]);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);
        return content;
    }

    private static IFormFile CreateFormFile(
        string fileName,
        string contentType,
        long length)
    {
        var stream = new MemoryStream([1]);
        return new FormFile(stream, 0, length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = contentType
        };
    }

    private static async Task<SongResponse> CreateSong(HttpClient client, string title = "Night Protocol")
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<AudioAssetResponse> CreateAudioAsset(
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

    private static async Task<VisualAssetResponse> CreateVisualAsset(
        HttpClient client,
        int songId,
        string fileName = "metadata.png")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type = "CoverArt",
            fileName,
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

    private static async Task<DriveWorkspaceResponse> ProvisionWorkspace(HttpClient client, int songId)
    {
        var response = await client.PostAsync($"/api/songs/{songId}/drive-workspace/provision", null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<DriveWorkspaceResponse>())!;
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
}
