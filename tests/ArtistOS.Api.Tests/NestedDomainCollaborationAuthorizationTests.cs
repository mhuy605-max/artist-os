using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class NestedDomainCollaborationAuthorizationTests
{
    [Fact]
    public async Task Audio_metadata_authorization_follows_c4_role_matrix_and_route_binding()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var asset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id, "mix.wav");
        var otherAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.OtherSong.Id, "other.wav");
        var deleteAsset = await CreateAudioAssetAsync(scenario.OwnerClient, scenario.Song.Id, "delete.wav");

        Assert.Equal(HttpStatusCode.OK, (await scenario.OwnerClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{otherAsset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}", AudioPayload("Master", "editor.wav", "Final"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}", AudioPayload("Master", "viewer.wav", "Final"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}", AudioPayload("Master", "blocked.wav", "Final"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await scenario.EditorClient.PostAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}/versions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PostAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{asset.Id}/versions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/audio-assets/{deleteAsset.Id}")).StatusCode);
    }

    [Fact]
    public async Task Visual_metadata_authorization_follows_c4_role_matrix_and_route_binding()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var asset = await CreateVisualAssetAsync(scenario.OwnerClient, scenario.Song.Id, "cover.png");
        var otherAsset = await CreateVisualAssetAsync(scenario.OwnerClient, scenario.OtherSong.Id, "other.png");
        var deleteAsset = await CreateVisualAssetAsync(scenario.OwnerClient, scenario.Song.Id, "delete.png");

        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/visual-assets")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{otherAsset.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}", VisualPayload("CoverArt", "editor.png", "Final"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}", VisualPayload("CoverArt", "viewer.png", "Final"))).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await scenario.EditorClient.PostAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}/versions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PostAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{asset.Id}/versions", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/visual-assets/{deleteAsset.Id}")).StatusCode);
    }

    [Fact]
    public async Task Release_checklist_and_readiness_authorization_follows_c4_role_matrix()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var release = await CreateReleaseAsync(scenario.OwnerClient, scenario.Song.Id);
        var checklist = await scenario.EditorClient.GetFromJsonAsync<List<ReleaseChecklistItemResponse>>($"/api/songs/{scenario.Song.Id}/release/checklist");
        var checklistItem = checklist!.First(item => item.Key == "Credits");

        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/release/readiness")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/release/readiness")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/release", ReleasePayload("Scheduled"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/release", ReleasePayload("Planning"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/release/checklist/{checklistItem.Id}", new { isCompleted = true, notes = "Ready" })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/release/checklist/{checklistItem.Id}", new { isCompleted = false, notes = "Nope" })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.OtherSong.Id}/release/checklist/{checklistItem.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/release")).StatusCode);
        Assert.True(release.Id > 0);
    }

    [Fact]
    public async Task Content_credit_and_analytics_authorization_follows_c4_role_matrix()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var content = await CreateContentItemAsync(scenario.OwnerClient, scenario.Song.Id, "Teaser");
        var credit = await CreateCreditAsync(scenario.OwnerClient, scenario.Song.Id, "Producer");
        var snapshot = await CreateAnalyticsSnapshotAsync(scenario.OwnerClient, scenario.Song.Id, "YouTube");
        var otherContent = await CreateContentItemAsync(scenario.OwnerClient, scenario.OtherSong.Id, "Other");

        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/credits/{credit.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/analytics/{snapshot.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items/{otherContent.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Created, (await scenario.EditorClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/content-items", ContentPayload("Editor content"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/content-items", ContentPayload("Viewer content"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/credits/{credit.Id}", CreditPayload("Engineer"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/credits/{credit.Id}", CreditPayload("Writer"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/analytics/{snapshot.Id}", AnalyticsPayload("Spotify", views: 20))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/analytics/{snapshot.Id}", AnalyticsPayload("TikTok", views: 30))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}")).StatusCode);
    }

    [Fact]
    public async Task Credit_contributor_metadata_does_not_grant_workspace_access()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory, addNoAccessAsCredit: true);

        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.GetAsync($"/api/songs/{scenario.Song.Id}/credits")).StatusCode);
    }

    [Fact]
    public async Task Role_changes_and_member_removal_are_evaluated_on_each_nested_request()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var content = await CreateContentItemAsync(scenario.OwnerClient, scenario.Song.Id, "Dynamic role");

        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}", ContentPayload("Editor update"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.OwnerClient.PatchAsJsonAsync($"/api/songs/{scenario.Song.Id}/members/{scenario.EditorMember.Id}", new { role = "VIEWER" })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}", ContentPayload("Viewer blocked"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.OwnerClient.PatchAsJsonAsync($"/api/songs/{scenario.Song.Id}/members/{scenario.EditorMember.Id}", new { role = "EDITOR" })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.EditorClient.PutAsJsonAsync($"/api/songs/{scenario.Song.Id}/content-items/{content.Id}", ContentPayload("Editor again"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await scenario.OwnerClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{scenario.EditorMember.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items")).StatusCode);
    }

    [Fact]
    public async Task Pending_invitation_grants_no_nested_access_until_accepted()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory, addEditorMember: false);
        await CreateContentItemAsync(scenario.OwnerClient, scenario.Song.Id, "Invite gated");
        var invite = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.Song.Id}/invitations",
            new { email = scenario.Editor.Email, role = "EDITOR" });
        var invitation = (await invite.Content.ReadFromJsonAsync<SongInvitationResponse>())!;

        Assert.Equal(HttpStatusCode.NotFound, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.PostAsync($"/api/invitations/{invitation.Id}/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/content-items")).StatusCode);
    }

    [Fact]
    public async Task Editor_still_cannot_delete_entire_song()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);

        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.DeleteAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.NoAccessClient.DeleteAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
    }

    private static async Task<Scenario> CreateScenarioAsync(
        ArtistOsApiFactory factory,
        bool addEditorMember = true,
        bool addNoAccessAsCredit = false)
    {
        var id = Guid.NewGuid().ToString("N");
        var ownerClient = await factory.CreateAuthenticatedClientAsync($"owner-{id}@example.com");
        var editorClient = await factory.CreateAuthenticatedClientAsync($"editor-{id}@example.com");
        var viewerClient = await factory.CreateAuthenticatedClientAsync($"viewer-{id}@example.com");
        var noAccessClient = await factory.CreateAuthenticatedClientAsync($"noaccess-{id}@example.com");
        var owner = await GetUserByEmailAsync(factory, $"owner-{id}@example.com");
        var editor = await GetUserByEmailAsync(factory, $"editor-{id}@example.com");
        var viewer = await GetUserByEmailAsync(factory, $"viewer-{id}@example.com");
        var noAccess = await GetUserByEmailAsync(factory, $"noaccess-{id}@example.com");
        var song = await CreateSongAsync(ownerClient, "C4 Nested Song");
        var otherSong = await CreateSongAsync(ownerClient, "C4 Other Song");
        SongMember? editorMember = null;

        if (addEditorMember)
        {
            editorMember = await AddMemberAsync(factory, song.Id, editor.Id, SongMemberRole.EDITOR);
            await AddMemberAsync(factory, otherSong.Id, editor.Id, SongMemberRole.EDITOR);
        }

        await AddMemberAsync(factory, song.Id, viewer.Id, SongMemberRole.VIEWER);
        await AddMemberAsync(factory, otherSong.Id, viewer.Id, SongMemberRole.VIEWER);

        if (addNoAccessAsCredit)
        {
            await CreateCreditAsync(ownerClient, song.Id, noAccess.Email);
        }

        return new Scenario(
            ownerClient,
            editorClient,
            viewerClient,
            noAccessClient,
            owner,
            editor,
            viewer,
            noAccess,
            song,
            otherSong,
            editorMember!);
    }

    private static async Task<User> GetUserByEmailAsync(ArtistOsApiFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await dbContext.Users.SingleAsync(user => user.NormalizedEmail == email.ToUpperInvariant());
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new { title, status = "Demo" });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<SongMember> AddMemberAsync(ArtistOsApiFactory factory, int songId, int userId, SongMemberRole role)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var member = new SongMember { SongId = songId, UserId = userId, Role = role, JoinedAt = now, UpdatedAt = now };
        dbContext.SongMembers.Add(member);
        await dbContext.SaveChangesAsync();
        return member;
    }

    private static async Task<AudioAssetResponse> CreateAudioAssetAsync(HttpClient client, int songId, string fileName)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", AudioPayload("Mix", fileName, "Draft"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
    }

    private static async Task<VisualAssetResponse> CreateVisualAssetAsync(HttpClient client, int songId, string fileName)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", VisualPayload("CoverArt", fileName, "Draft"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
    }

    private static async Task<ReleaseResponse> CreateReleaseAsync(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", ReleasePayload("Planning"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ReleaseResponse>())!;
    }

    private static async Task<ContentItemResponse> CreateContentItemAsync(HttpClient client, int songId, string title)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/content-items", ContentPayload(title));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ContentItemResponse>())!;
    }

    private static async Task<CreditResponse> CreateCreditAsync(HttpClient client, int songId, string contributorName)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/credits", CreditPayload(contributorName));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreditResponse>())!;
    }

    private static async Task<AnalyticsSnapshotResponse> CreateAnalyticsSnapshotAsync(HttpClient client, int songId, string platform)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/analytics", AnalyticsPayload(platform, views: 10));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>())!;
    }

    private static object AudioPayload(string type, string fileName, string status) =>
        new { type, fileName, status, durationSeconds = 120, fileSizeBytes = 1024 };

    private static object VisualPayload(string type, string fileName, string status) =>
        new { type, fileName, status, width = 3000, height = 3000, fileSizeBytes = 2048 };

    private static object ReleasePayload(string status) =>
        new { releaseDate = new DateOnly(2026, 10, 1), releaseType = "Single", distributor = "Distro", isrc = "ISRC", upc = "UPC", status, platforms = new[] { "Spotify" } };

    private static object ContentPayload(string title) =>
        new { title, type = "TikTok", status = "Scheduled", platform = "TikTok", ownerName = "Owner", dueDate = new DateOnly(2026, 9, 20), scheduledAt = new DateOnly(2026, 9, 21), publishedAt = (DateOnly?)null, notes = "Notes" };

    private static object CreditPayload(string contributorName) =>
        new { contributorName, role = "Producer", contact = "producer@example.com", status = "Confirmed", splitPercentage = 10, notes = "Notes" };

    private static object AnalyticsPayload(string platform, long views) =>
        new { platform, snapshotDate = new DateOnly(2026, 9, 1).AddDays((int)views), views, likes = 2, comments = 1, watchTimeMinutes = 3, subscribersGained = 4 };

    private sealed record Scenario(
        HttpClient OwnerClient,
        HttpClient EditorClient,
        HttpClient ViewerClient,
        HttpClient NoAccessClient,
        User Owner,
        User Editor,
        User Viewer,
        User NoAccess,
        SongResponse Song,
        SongResponse OtherSong,
        SongMember EditorMember);
}
