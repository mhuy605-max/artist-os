using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class SongVisibilityCollaborationTests
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    [Fact]
    public async Task SongList_ReturnsOwnedAndSharedSongsWithAccessMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var ownedSong = await CreateSongAsync(scenario.CollaboratorClient, "Owned By Collaborator", "Demo");
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);
        await CreateInvitationAsync(factory, scenario.PendingOnlySong.Id, scenario.Collaborator.Id, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.LegacyUnownedSongId, scenario.Collaborator.Id, SongMemberRole.EDITOR);

        var songs = await scenario.CollaboratorClient.GetFromJsonAsync<List<SongResponse>>("/api/songs");

        Assert.NotNull(songs);
        Assert.Equal(3, songs.Count);
        Assert.Equal(songs.Select(song => song.Id).Distinct().Count(), songs.Count);
        AssertSongAccess(songs.Single(song => song.Id == ownedSong.Id), "OWNER", canEdit: true, canManageMembers: true);
        AssertSongAccess(songs.Single(song => song.Id == scenario.EditorSong.Id), "EDITOR", canEdit: true, canManageMembers: false);
        AssertSongAccess(songs.Single(song => song.Id == scenario.ViewerSong.Id), "VIEWER", canEdit: false, canManageMembers: false);
        Assert.DoesNotContain(songs, song => song.Id == scenario.UnrelatedSong.Id);
        Assert.DoesNotContain(songs, song => song.Id == scenario.PendingOnlySong.Id);
        Assert.DoesNotContain(songs, song => song.Id == scenario.LegacyUnownedSongId);
    }

    [Fact]
    public async Task SongDetail_AllowsOwnerEditorViewerAndBlocksNoAccessPendingAndLegacy()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);
        await CreateInvitationAsync(factory, scenario.PendingOnlySong.Id, scenario.Collaborator.Id, scenario.Owner.Id);
        await AddMemberAsync(factory, scenario.LegacyUnownedSongId, scenario.Collaborator.Id, SongMemberRole.EDITOR);

        var ownerDetail = await scenario.OwnerClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");
        var editorDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");
        var viewerDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.ViewerSong.Id}");

        Assert.NotNull(ownerDetail);
        AssertSongAccess(ownerDetail, "OWNER", canEdit: true, canManageMembers: true);
        Assert.NotNull(editorDetail);
        AssertSongAccess(editorDetail, "EDITOR", canEdit: true, canManageMembers: false);
        Assert.NotNull(viewerDetail);
        AssertSongAccess(viewerDetail, "VIEWER", canEdit: false, canManageMembers: false);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.UnrelatedSong.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.PendingOnlySong.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.LegacyUnownedSongId}")).StatusCode);
    }

    [Fact]
    public async Task SongDetail_OwnerPrecedenceWinsOverInconsistentMembership()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync("precedence@example.com");
        var owner = await GetUserByEmailAsync(factory, "precedence@example.com");
        var song = await CreateSongAsync(client, "Owner Still Owner", "Demo");
        await AddMemberAsync(factory, song.Id, owner.Id, SongMemberRole.VIEWER);

        var response = await client.GetFromJsonAsync<SongResponse>($"/api/songs/{song.Id}");

        Assert.NotNull(response);
        AssertSongAccess(response, "OWNER", canEdit: true, canManageMembers: true);
    }

    [Fact]
    public async Task SongCreateUpdateAndDelete_RespectC3RoleBoundary()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var createdByCollaborator = await CreateSongAsync(scenario.CollaboratorClient, "Creator Owns", "Demo");
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);

        var editorUpdate = await scenario.CollaboratorClient.PutAsJsonAsync(
            $"/api/songs/{scenario.EditorSong.Id}",
            new { title = "Editor Updated", status = "Mixing", ownerUserId = scenario.Collaborator.Id });
        var viewerUpdate = await scenario.CollaboratorClient.PutAsJsonAsync(
            $"/api/songs/{scenario.ViewerSong.Id}",
            new { title = "Viewer Blocked", status = "Mixing" });
        var unrelatedUpdate = await scenario.CollaboratorClient.PutAsJsonAsync(
            $"/api/songs/{scenario.UnrelatedSong.Id}",
            new { title = "No Access", status = "Mixing" });
        var editorDelete = await scenario.CollaboratorClient.DeleteAsync($"/api/songs/{scenario.EditorSong.Id}");
        var viewerDelete = await scenario.CollaboratorClient.DeleteAsync($"/api/songs/{scenario.ViewerSong.Id}");
        var unrelatedDelete = await scenario.CollaboratorClient.DeleteAsync($"/api/songs/{scenario.UnrelatedSong.Id}");
        var ownerDelete = await scenario.OwnerClient.DeleteAsync($"/api/songs/{scenario.EditorSong.Id}");

        Assert.Equal(HttpStatusCode.NoContent, editorUpdate.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, viewerUpdate.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unrelatedUpdate.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, editorDelete.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, viewerDelete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unrelatedDelete.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, ownerDelete.StatusCode);
        Assert.Equal(scenario.Collaborator.Id, createdByCollaborator.OwnerUserId);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await dbContext.SongMembers.AnyAsync(member => member.SongId == createdByCollaborator.Id && member.UserId == scenario.Collaborator.Id));
        Assert.False(await dbContext.Songs.AnyAsync(song => song.Id == scenario.EditorSong.Id));
        Assert.False(await dbContext.SongMembers.AnyAsync(member => member.SongId == scenario.EditorSong.Id));
        Assert.Equal(scenario.Owner.Id, (await dbContext.Songs.SingleAsync(song => song.Id == scenario.ViewerSong.Id)).OwnerUserId);
    }

    [Fact]
    public async Task Dashboard_IncludesAccessibleSongsAndPreservesAggregateSemantics()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);
        var removedMember = await AddMemberAsync(factory, scenario.RemovedSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await CreateInvitationAsync(factory, scenario.PendingOnlySong.Id, scenario.Collaborator.Id, scenario.Owner.Id);
        await CreateReleaseAsync(factory, scenario.EditorSong.Id, Today.AddDays(1), status: "Scheduled", platforms: ["AppleMusic"]);
        await CreateReleaseAsync(factory, scenario.ViewerSong.Id, Today.AddDays(2), status: "Scheduled");
        await CreateReleaseAsync(factory, scenario.PendingOnlySong.Id, Today.AddDays(3), status: "Scheduled");
        await CreateReleaseAsync(factory, scenario.RemovedSong.Id, Today.AddDays(4), status: "Scheduled");
        await CreateContentItemAsync(factory, scenario.EditorSong.Id, Today.AddDays(5));
        await CreateContentItemAsync(factory, scenario.ViewerSong.Id, Today.AddDays(6));
        await CreateAnalyticsSnapshotAsync(factory, scenario.EditorSong.Id, "YouTube", Today.AddDays(-5), 100);
        await CreateAnalyticsSnapshotAsync(factory, scenario.EditorSong.Id, "YouTube", Today.AddDays(-1), 200);
        await CreateAnalyticsSnapshotAsync(factory, scenario.ViewerSong.Id, "Spotify", Today.AddDays(-2), 300);
        await RemoveMemberAsync(factory, removedMember.Id);

        var dashboard = await scenario.CollaboratorClient.GetFromJsonAsync<DashboardResponse>("/api/dashboard");

        Assert.NotNull(dashboard);
        Assert.Equal(2, dashboard.Summary.TotalSongs);
        Assert.Equal(2, dashboard.Summary.ActiveSongs);
        Assert.Equal(2, dashboard.Summary.UpcomingReleases);
        Assert.Equal(2, dashboard.Summary.ScheduledContent);
        Assert.Equal(2, dashboard.Pipeline.Single(item => item.Status == "Demo").Count);
        Assert.Contains(dashboard.Upcoming, item => item.SongId == scenario.EditorSong.Id);
        Assert.Contains(dashboard.Upcoming, item => item.SongId == scenario.ViewerSong.Id);
        Assert.DoesNotContain(dashboard.Upcoming, item => item.SongId == scenario.PendingOnlySong.Id || item.SongId == scenario.RemovedSong.Id);
        Assert.Contains(dashboard.ReleaseReadiness, item => item.SongId == scenario.EditorSong.Id);
        Assert.Contains(dashboard.ReleaseReadiness, item => item.SongId == scenario.ViewerSong.Id);
        Assert.Equal(2, dashboard.AnalyticsOverview.Count);
        Assert.Contains(dashboard.AnalyticsOverview, item => item.SongId == scenario.EditorSong.Id && item.Platform == "YouTube" && item.Views == 200);
        Assert.Contains(dashboard.AnalyticsOverview, item => item.SongId == scenario.ViewerSong.Id && item.Platform == "Spotify");
        Assert.DoesNotContain(dashboard.AnalyticsOverview, item => item.SongId == scenario.PendingOnlySong.Id);
        Assert.DoesNotContain(dashboard.RecentActivity, item =>
            item.SongId == scenario.PendingOnlySong.Id ||
            item.SongId == scenario.RemovedSong.Id ||
            item.SongId == scenario.UnrelatedSong.Id);
    }

    [Fact]
    public async Task Calendar_IncludesAccessibleSongEventsAndPreservesDateFiltering()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);
        var removedMember = await AddMemberAsync(factory, scenario.RemovedSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await CreateInvitationAsync(factory, scenario.PendingOnlySong.Id, scenario.Collaborator.Id, scenario.Owner.Id);
        await CreateReleaseAsync(factory, scenario.EditorSong.Id, new DateOnly(2026, 9, 10));
        await CreateContentItemAsync(factory, scenario.ViewerSong.Id, new DateOnly(2026, 9, 11));
        await CreateReleaseAsync(factory, scenario.UnrelatedSong.Id, new DateOnly(2026, 9, 12));
        await CreateContentItemAsync(factory, scenario.PendingOnlySong.Id, new DateOnly(2026, 9, 13));
        await CreateReleaseAsync(factory, scenario.RemovedSong.Id, new DateOnly(2026, 9, 14));
        await RemoveMemberAsync(factory, removedMember.Id);

        var entries = await scenario.CollaboratorClient.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar?from=2026-09-10&to=2026-09-11");

        Assert.NotNull(entries);
        Assert.Equal(2, entries.Count);
        Assert.Equal(entries.Select(entry => $"{entry.SourceType}:{entry.SourceId}:{entry.EventType}").Distinct().Count(), entries.Count);
        Assert.Contains(entries, entry => entry.SongId == scenario.EditorSong.Id && entry.EventType == "ReleaseDate");
        Assert.Contains(entries, entry => entry.SongId == scenario.ViewerSong.Id && entry.EventType == "ContentScheduled");
        Assert.DoesNotContain(entries, entry =>
            entry.SongId == scenario.UnrelatedSong.Id ||
            entry.SongId == scenario.PendingOnlySong.Id ||
            entry.SongId == scenario.RemovedSong.Id);
    }

    [Fact]
    public async Task InvitationAcceptMakesSongVisibleAndMemberRemovalHidesIt()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await CreateReleaseAsync(factory, scenario.EditorSong.Id, Today.AddDays(1));

        var beforeAcceptSongs = await scenario.CollaboratorClient.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var invite = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.EditorSong.Id}/invitations",
            new { email = scenario.Collaborator.Email, role = "EDITOR" });
        invite.EnsureSuccessStatusCode();
        var invitation = (await invite.Content.ReadFromJsonAsync<SongInvitationResponse>())!;
        var stillBeforeAccept = await scenario.CollaboratorClient.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var accept = await scenario.CollaboratorClient.PostAsync($"/api/invitations/{invitation.Id}/accept", null);
        accept.EnsureSuccessStatusCode();

        var afterAcceptSongs = await scenario.CollaboratorClient.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var afterAcceptDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");
        var afterAcceptDashboard = await scenario.CollaboratorClient.GetFromJsonAsync<DashboardResponse>("/api/dashboard");
        var afterAcceptCalendar = await scenario.CollaboratorClient.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar");

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var member = await dbContext.SongMembers.SingleAsync(member => member.SongId == scenario.EditorSong.Id && member.UserId == scenario.Collaborator.Id);
            dbContext.SongMembers.Remove(member);
            await dbContext.SaveChangesAsync();
        }

        var afterRemoveSongs = await scenario.CollaboratorClient.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var afterRemoveDetail = await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.EditorSong.Id}");
        var afterRemoveDashboard = await scenario.CollaboratorClient.GetFromJsonAsync<DashboardResponse>("/api/dashboard");
        var afterRemoveCalendar = await scenario.CollaboratorClient.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar");

        Assert.NotNull(beforeAcceptSongs);
        Assert.DoesNotContain(beforeAcceptSongs, song => song.Id == scenario.EditorSong.Id);
        Assert.NotNull(stillBeforeAccept);
        Assert.DoesNotContain(stillBeforeAccept, song => song.Id == scenario.EditorSong.Id);
        Assert.Contains(afterAcceptSongs!, song => song.Id == scenario.EditorSong.Id);
        Assert.NotNull(afterAcceptDetail);
        Assert.Equal("EDITOR", afterAcceptDetail.CurrentUserRole);
        Assert.Contains(afterAcceptDashboard!.ReleaseReadiness, item => item.SongId == scenario.EditorSong.Id);
        Assert.Contains(afterAcceptCalendar!, entry => entry.SongId == scenario.EditorSong.Id);
        Assert.DoesNotContain(afterRemoveSongs!, song => song.Id == scenario.EditorSong.Id);
        Assert.Equal(HttpStatusCode.NotFound, afterRemoveDetail.StatusCode);
        Assert.DoesNotContain(afterRemoveDashboard!.ReleaseReadiness, item => item.SongId == scenario.EditorSong.Id);
        Assert.DoesNotContain(afterRemoveCalendar!, entry => entry.SongId == scenario.EditorSong.Id);
    }

    [Fact]
    public async Task RoleChangeImmediatelyUpdatesSongCapabilities()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var member = await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);

        var editorDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");
        var toViewer = await scenario.OwnerClient.PatchAsJsonAsync(
            $"/api/songs/{scenario.EditorSong.Id}/members/{member.Id}",
            new { role = "VIEWER" });
        toViewer.EnsureSuccessStatusCode();
        var viewerDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");
        var toEditor = await scenario.OwnerClient.PatchAsJsonAsync(
            $"/api/songs/{scenario.EditorSong.Id}/members/{member.Id}",
            new { role = "EDITOR" });
        toEditor.EnsureSuccessStatusCode();
        var editorAgainDetail = await scenario.CollaboratorClient.GetFromJsonAsync<SongResponse>($"/api/songs/{scenario.EditorSong.Id}");

        AssertSongAccess(editorDetail!, "EDITOR", canEdit: true, canManageMembers: false);
        AssertSongAccess(viewerDetail!, "VIEWER", canEdit: false, canManageMembers: false);
        AssertSongAccess(editorAgainDetail!, "EDITOR", canEdit: true, canManageMembers: false);
    }

    [Fact]
    public async Task NestedWorkspaceReadEndpointsAllowCollaboratorsAfterC4()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.EditorSong.Id, scenario.Collaborator.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.ViewerSong.Id, scenario.Collaborator.Id, SongMemberRole.VIEWER);

        Assert.Equal(HttpStatusCode.OK, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.EditorSong.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.EditorSong.Id}/audio-assets")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.CollaboratorClient.GetAsync($"/api/songs/{scenario.ViewerSong.Id}/release/readiness")).StatusCode);
    }

    private static void AssertSongAccess(SongResponse song, string role, bool canEdit, bool canManageMembers)
    {
        Assert.Equal(role, song.CurrentUserRole);
        Assert.Equal(canEdit, song.CanEdit);
        Assert.Equal(canManageMembers, song.CanManageMembers);
    }

    private static async Task<Scenario> CreateScenarioAsync(ArtistOsApiFactory factory)
    {
        var id = Guid.NewGuid().ToString("N");
        var ownerClient = await factory.CreateAuthenticatedClientAsync($"owner-{id}@example.com");
        var collaboratorClient = await factory.CreateAuthenticatedClientAsync($"collab-{id}@example.com");
        var unrelatedClient = await factory.CreateAuthenticatedClientAsync($"unrelated-{id}@example.com");
        var owner = await GetUserByEmailAsync(factory, $"owner-{id}@example.com");
        var collaborator = await GetUserByEmailAsync(factory, $"collab-{id}@example.com");
        var unrelated = await GetUserByEmailAsync(factory, $"unrelated-{id}@example.com");

        var editorSong = await CreateSongAsync(ownerClient, "Editor Shared", "Demo");
        var viewerSong = await CreateSongAsync(ownerClient, "Viewer Shared", "Demo");
        var pendingOnlySong = await CreateSongAsync(ownerClient, "Pending Only", "Demo");
        var removedSong = await CreateSongAsync(ownerClient, "Removed Member", "Demo");
        var unrelatedSong = await CreateSongAsync(unrelatedClient, "Unrelated", "Demo");
        var legacyUnownedSongId = await CreateLegacyUnownedSongAsync(factory);

        return new Scenario(
            ownerClient,
            collaboratorClient,
            unrelatedClient,
            owner,
            collaborator,
            unrelated,
            editorSong,
            viewerSong,
            pendingOnlySong,
            removedSong,
            unrelatedSong,
            legacyUnownedSongId);
    }

    private static async Task<User> GetUserByEmailAsync(ArtistOsApiFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var normalizedEmail = email.Trim().ToUpperInvariant();
        return await dbContext.Users.SingleAsync(user => user.NormalizedEmail == normalizedEmail);
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client, string title, string status = "Demo")
    {
        var response = await client.PostAsJsonAsync("/api/songs", new { title, status });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
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

    private static async Task RemoveMemberAsync(ArtistOsApiFactory factory, int memberId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var member = await dbContext.SongMembers.SingleAsync(member => member.Id == memberId);
        dbContext.SongMembers.Remove(member);
        await dbContext.SaveChangesAsync();
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

    private static async Task<int> CreateLegacyUnownedSongAsync(ArtistOsApiFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = "Legacy Unowned",
            Status = "Demo",
            OwnerUserId = null,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();
        return song.Id;
    }

    private static async Task CreateReleaseAsync(
        ArtistOsApiFactory factory,
        int songId,
        DateOnly releaseDate,
        string status = "Scheduled",
        string[]? platforms = null)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        dbContext.Releases.Add(new Release
        {
            SongId = songId,
            ReleaseDate = releaseDate,
            ReleaseType = "Single",
            Status = status,
            Platforms = string.Join(',', platforms ?? ["Spotify"]),
            CreatedAt = now,
            UpdatedAt = now
        });
        await dbContext.SaveChangesAsync();
    }

    private static async Task CreateContentItemAsync(
        ArtistOsApiFactory factory,
        int songId,
        DateOnly scheduledAt)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        dbContext.ContentItems.Add(new ContentItem
        {
            SongId = songId,
            Title = $"Content {songId}",
            Type = "TikTok",
            Status = "Scheduled",
            Platform = "TikTok",
            ScheduledAt = scheduledAt,
            CreatedAt = now,
            UpdatedAt = now
        });
        await dbContext.SaveChangesAsync();
    }

    private static async Task CreateAnalyticsSnapshotAsync(
        ArtistOsApiFactory factory,
        int songId,
        string platform,
        DateOnly snapshotDate,
        long views)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.AnalyticsSnapshots.Add(new AnalyticsSnapshot
        {
            SongId = songId,
            Platform = platform,
            SnapshotDate = snapshotDate,
            Views = views,
            Likes = 10,
            Comments = 1,
            WatchTimeMinutes = 25,
            SubscribersGained = 2,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
    }

    private sealed record Scenario(
        HttpClient OwnerClient,
        HttpClient CollaboratorClient,
        HttpClient UnrelatedClient,
        User Owner,
        User Collaborator,
        User Unrelated,
        SongResponse EditorSong,
        SongResponse ViewerSong,
        SongResponse PendingOnlySong,
        SongResponse RemovedSong,
        SongResponse UnrelatedSong,
        int LegacyUnownedSongId);
}
