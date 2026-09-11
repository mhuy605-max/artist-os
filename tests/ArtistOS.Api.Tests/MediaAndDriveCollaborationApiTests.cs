using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class MediaAndDriveCollaborationApiTests
{
    [Fact]
    public async Task DriveWorkspaceReadAllowsMembersButProvisionRemainsOwnerOnly()
    {
        await using var factory = CreateFactory();
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        await ProvisionWorkspaceAsync(scenario.OwnerClient, scenario.Song.Id);

        var editorRead = await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/drive-workspace");
        var viewerRead = await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/drive-workspace");
        var editorProvision = await scenario.EditorClient.PostAsync($"/api/songs/{scenario.Song.Id}/drive-workspace/provision", null);
        var viewerProvision = await scenario.ViewerClient.PostAsync($"/api/songs/{scenario.Song.Id}/drive-workspace/provision", null);
        var unrelatedRead = await scenario.UnrelatedClient.GetAsync($"/api/songs/{scenario.Song.Id}/drive-workspace");
        var unrelatedProvision = await scenario.UnrelatedClient.PostAsync($"/api/songs/{scenario.Song.Id}/drive-workspace/provision", null);

        Assert.Equal(HttpStatusCode.OK, editorRead.StatusCode);
        Assert.Equal(HttpStatusCode.OK, viewerRead.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, editorProvision.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, viewerProvision.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unrelatedRead.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unrelatedProvision.StatusCode);
    }

    [Fact]
    public async Task EditorAudioUploadUsesOwnerDriveEvenWhenEditorHasNoDriveConnection()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(fakeGoogle);
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        var audioAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);

        var response = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("editor-demo.wav", "audio/wav", [1, 2, 3, 4]));

        response.EnsureSuccessStatusCode();
        Assert.All(fakeGoogle.RefreshRequests, request => Assert.Equal(scenario.Owner.Id.ToString(), request.UserId));
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var reference = await dbContext.ExternalFileReferences
            .Include(existing => existing.GoogleDriveConnection)
            .SingleAsync(existing => existing.LinkedResourceType == nameof(AudioAsset) && existing.LinkedResourceId == audioAsset.Id);
        Assert.Equal(scenario.Owner.Id, reference.OwnerUserId);
        Assert.Equal(scenario.Owner.Id, reference.GoogleDriveConnection!.UserId);
    }

    [Fact]
    public async Task EditorVisualUploadIgnoresEditorPersonalDriveAndViewerUploadIsForbidden()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(fakeGoogle);
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        await CreateGoogleConnectionAsync(factory, scenario.Editor.Id);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var visualAsset = await CreateVisualAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        var viewerAsset = await CreateVisualAssetAsync(scenario.OwnerClient, scenario.Song.Id, "viewer-metadata.png");

        var editorUpload = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/visual-assets/{visualAsset.Id}/upload",
            CreateMultipartFile("cover.png", "image/png", [9, 8, 7]));
        var viewerUpload = await scenario.ViewerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/visual-assets/{viewerAsset.Id}/upload",
            CreateMultipartFile("viewer-cover.png", "image/png"));

        editorUpload.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, viewerUpload.StatusCode);
        Assert.All(fakeGoogle.RefreshRequests, request => Assert.Equal(scenario.Owner.Id.ToString(), request.UserId));
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var reference = await dbContext.ExternalFileReferences
            .Include(existing => existing.GoogleDriveConnection)
            .SingleAsync(existing => existing.LinkedResourceType == nameof(VisualAsset) && existing.LinkedResourceId == visualAsset.Id);
        Assert.Equal(scenario.Owner.Id, reference.OwnerUserId);
        Assert.Equal(scenario.Owner.Id, reference.GoogleDriveConnection!.UserId);
    }

    [Fact]
    public async Task EditorReplaceUsesOwnerDriveAndViewerReplaceIsForbidden()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        await using var factory = CreateFactory(fakeGoogle);
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var audioAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        var upload = await scenario.OwnerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("demo.wav", "audio/wav", [1, 2, 3]));
        upload.EnsureSuccessStatusCode();
        var linked = (await upload.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
        await UpdateAudioStatusAsync(scenario.OwnerClient, scenario.Song.Id, linked, "Final");

        var replace = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/replace-file",
            CreateMultipartFile("demo-fixed.wav", "audio/wav", [4, 5, 6, 7]));
        var viewerReplace = await scenario.ViewerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/replace-file",
            CreateMultipartFile("viewer-fixed.wav", "audio/wav"));

        replace.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, viewerReplace.StatusCode);
        var replaced = (await replace.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
        Assert.Equal("demo-fixed.wav", replaced.FileName);
        Assert.Equal("Review", replaced.Status);
        Assert.Equal(1, replaced.Version);
        Assert.True(replaced.IsCurrent);
        Assert.All(fakeGoogle.RefreshRequests, request => Assert.Equal(scenario.Owner.Id.ToString(), request.UserId));
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var oldReference = await dbContext.ExternalFileReferences.SingleAsync(reference => reference.Id == linked.LinkedFile!.Id);
        var newReference = await dbContext.ExternalFileReferences.SingleAsync(reference => reference.Id == replaced.LinkedFile!.Id);
        Assert.Null(oldReference.LinkedResourceType);
        Assert.Null(oldReference.LinkedResourceId);
        Assert.Equal(scenario.Owner.Id, newReference.OwnerUserId);
    }

    [Fact]
    public async Task MediaAccessAllowsReaderRolesAndOldTokenStopsAfterMemberRemoval()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeGoogle, fakeDrive);
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        var viewerMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var audioAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        await scenario.OwnerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("stream.wav", "audio/wav", [1, 2, 3, 4, 5, 6]));
        var accessResponse = await scenario.ViewerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/media-access",
            null);
        accessResponse.EnsureSuccessStatusCode();
        var access = (await accessResponse.Content.ReadFromJsonAsync<MediaAccessResponse>())!;
        var mediaPath = ToPathAndQuery(access.MediaUrl);

        var full = await scenario.ViewerClient.GetAsync(mediaPath);
        var rangeRequest = new HttpRequestMessage(HttpMethod.Get, mediaPath);
        rangeRequest.Headers.Range = new System.Net.Http.Headers.RangeHeaderValue(0, 1);
        var range = await scenario.ViewerClient.SendAsync(rangeRequest);
        var invalidRangeRequest = new HttpRequestMessage(HttpMethod.Get, mediaPath);
        invalidRangeRequest.Headers.TryAddWithoutValidation("Range", "bytes=100-200");
        var invalidRange = await scenario.ViewerClient.SendAsync(invalidRangeRequest);
        var head = await scenario.ViewerClient.SendAsync(new HttpRequestMessage(HttpMethod.Head, mediaPath));
        var remove = await scenario.OwnerClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{viewerMember.Id}");
        var afterRemoval = await scenario.ViewerClient.GetAsync(mediaPath);

        Assert.Equal(HttpStatusCode.OK, full.StatusCode);
        Assert.Equal([1, 2, 3, 4, 5, 6], await full.Content.ReadAsByteArrayAsync());
        Assert.Equal(HttpStatusCode.PartialContent, range.StatusCode);
        Assert.Equal([1, 2], await range.Content.ReadAsByteArrayAsync());
        Assert.Equal(HttpStatusCode.RequestedRangeNotSatisfiable, invalidRange.StatusCode);
        Assert.Equal(HttpStatusCode.OK, head.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, remove.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, afterRemoval.StatusCode);
        Assert.All(fakeGoogle.RefreshRequests, request => Assert.Equal(scenario.Owner.Id.ToString(), request.UserId));
    }

    [Fact]
    public async Task RoleChangesImmediatelyAffectUploadButKeepReadAccess()
    {
        await using var factory = CreateFactory();
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        var editorMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        var viewerMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var editorAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        var viewerAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id, "viewer-metadata.wav");

        var editorUpload = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{editorAsset.Id}/upload",
            CreateMultipartFile("editor.wav", "audio/wav"));
        var demote = await PatchJsonAsync(
            scenario.OwnerClient,
            $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}",
            new { role = "VIEWER" });
        var demotedEditorAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id, "demoted-editor.wav");
        var demotedEditorUpload = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{demotedEditorAsset.Id}/upload",
            CreateMultipartFile("demoted-editor.wav", "audio/wav"));
        var demotedEditorRead = await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{editorAsset.Id}");
        var viewerUploadBeforePromotion = await scenario.ViewerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{viewerAsset.Id}/upload",
            CreateMultipartFile("viewer.wav", "audio/wav"));
        var promote = await PatchJsonAsync(
            scenario.OwnerClient,
            $"/api/songs/{scenario.Song.Id}/members/{viewerMember.Id}",
            new { role = "EDITOR" });
        var viewerUploadAfterPromotion = await scenario.ViewerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{viewerAsset.Id}/upload",
            CreateMultipartFile("viewer.wav", "audio/wav"));

        editorUpload.EnsureSuccessStatusCode();
        demote.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, demotedEditorUpload.StatusCode);
        Assert.Equal(HttpStatusCode.OK, demotedEditorRead.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, viewerUploadBeforePromotion.StatusCode);
        promote.EnsureSuccessStatusCode();
        viewerUploadAfterPromotion.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task PendingInvitationDoesNotGrantMediaOrDriveAccess()
    {
        await using var factory = CreateFactory();
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        var audioAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        await scenario.OwnerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("pending.wav", "audio/wav"));
        await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id);

        var workspace = await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/drive-workspace");
        var mediaAccess = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/media-access",
            null);
        var upload = await scenario.EditorClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/replace-file",
            CreateMultipartFile("pending-fixed.wav", "audio/wav"));

        Assert.Equal(HttpStatusCode.NotFound, workspace.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, mediaAccess.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, upload.StatusCode);
    }

    [Fact]
    public async Task CrossSongUploadReplaceAndMediaAccessReturnNotFound()
    {
        await using var factory = CreateFactory();
        var scenario = await CreateScenarioAsync(factory);
        await CreateGoogleConnectionAsync(factory, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        var songB = await CreateSongAsync(scenario.OwnerClient, "Other Song");
        var audioAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id);
        var upload = await scenario.OwnerClient.PostAsync(
            $"/api/songs/{scenario.Song.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("original.wav", "audio/wav"));
        upload.EnsureSuccessStatusCode();

        var crossUpload = await scenario.EditorClient.PostAsync(
            $"/api/songs/{songB.Id}/audio-assets/{audioAsset.Id}/upload",
            CreateMultipartFile("cross.wav", "audio/wav"));
        var crossReplace = await scenario.EditorClient.PostAsync(
            $"/api/songs/{songB.Id}/audio-assets/{audioAsset.Id}/replace-file",
            CreateMultipartFile("cross-fixed.wav", "audio/wav"));
        var crossMedia = await scenario.EditorClient.PostAsync(
            $"/api/songs/{songB.Id}/audio-assets/{audioAsset.Id}/media-access",
            null);

        Assert.Equal(HttpStatusCode.NotFound, crossUpload.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, crossReplace.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, crossMedia.StatusCode);
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

    private static async Task<Scenario> CreateScenarioAsync(ArtistOsApiFactory factory)
    {
        var id = Guid.NewGuid().ToString("N");
        var ownerClient = await factory.CreateAuthenticatedClientAsync($"owner-{id}@example.com");
        var editorClient = await factory.CreateAuthenticatedClientAsync($"editor-{id}@example.com");
        var viewerClient = await factory.CreateAuthenticatedClientAsync($"viewer-{id}@example.com");
        var unrelatedClient = await factory.CreateAuthenticatedClientAsync($"unrelated-{id}@example.com");
        var owner = await GetUserByEmailAsync(factory, $"owner-{id}@example.com");
        var editor = await GetUserByEmailAsync(factory, $"editor-{id}@example.com");
        var viewer = await GetUserByEmailAsync(factory, $"viewer-{id}@example.com");
        var unrelated = await GetUserByEmailAsync(factory, $"unrelated-{id}@example.com");
        var song = await CreateSongAsync(ownerClient, "Collaboration Media Song");
        return new Scenario(ownerClient, editorClient, viewerClient, unrelatedClient, owner, editor, viewer, unrelated, song);
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new { title, status = "Demo" });
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
            status = "Draft",
            durationSeconds = 120,
            fileSizeBytes = 123
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
    }

    private static async Task<VisualAssetResponse> CreateVisualAssetAsync(
        HttpClient client,
        int songId,
        string fileName = "metadata.png")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type = "CoverArt",
            fileName,
            status = "Draft",
            width = 1200,
            height = 1200,
            fileSizeBytes = 123
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
    }

    private static async Task UpdateAudioStatusAsync(
        HttpClient client,
        int songId,
        AudioAssetResponse asset,
        string status)
    {
        var response = await client.PutAsJsonAsync($"/api/songs/{songId}/audio-assets/{asset.Id}", new
        {
            type = asset.Type,
            fileName = asset.FileName,
            status,
            durationSeconds = asset.DurationSeconds,
            fileSizeBytes = asset.FileSizeBytes
        });
        response.EnsureSuccessStatusCode();
    }

    private static MultipartFormDataContent CreateMultipartFile(
        string fileName,
        string contentType,
        byte[]? bytes = null)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes ?? [1, 2, 3]);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);
        return content;
    }

    private static async Task CreateGoogleConnectionAsync(
        ArtistOsApiFactory factory,
        int userId,
        string status = GoogleDriveConnectionStatuses.Connected)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var protector = scope.ServiceProvider
            .GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");

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

    private static async Task<SongMember> AddMemberAsync(
        ArtistOsApiFactory factory,
        int songId,
        int userId,
        SongMemberRole role)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var member = new SongMember
        {
            SongId = songId,
            UserId = userId,
            Role = role,
            JoinedAt = now,
            UpdatedAt = now
        };
        dbContext.SongMembers.Add(member);
        await dbContext.SaveChangesAsync();
        return member;
    }

    private static async Task CreateInvitationAsync(
        ArtistOsApiFactory factory,
        int songId,
        int invitedUserId,
        int invitedByUserId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.SongInvitations.Add(new SongInvitation
        {
            SongId = songId,
            InvitedUserId = invitedUserId,
            InvitedByUserId = invitedByUserId,
            Role = SongMemberRole.EDITOR,
            Status = SongInvitationStatus.PENDING,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
    }

    private static async Task ProvisionWorkspaceAsync(HttpClient client, int songId)
    {
        var response = await client.PostAsync($"/api/songs/{songId}/drive-workspace/provision", null);
        response.EnsureSuccessStatusCode();
    }

    private static async Task<HttpResponseMessage> PatchJsonAsync(HttpClient client, string path, object payload)
    {
        return await client.PatchAsJsonAsync(path, payload);
    }

    private static async Task<User> GetUserByEmailAsync(ArtistOsApiFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var normalizedEmail = email.Trim().ToUpperInvariant();
        return await dbContext.Users.SingleAsync(user => user.NormalizedEmail == normalizedEmail);
    }

    private static string ToPathAndQuery(string mediaUrl)
    {
        var uri = new Uri(mediaUrl);
        return uri.PathAndQuery;
    }

    private sealed record Scenario(
        HttpClient OwnerClient,
        HttpClient EditorClient,
        HttpClient ViewerClient,
        HttpClient UnrelatedClient,
        User Owner,
        User Editor,
        User Viewer,
        User Unrelated,
        SongResponse Song);
}
