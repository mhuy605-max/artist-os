using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class OwnershipAuthorizationTests
{
    [Theory]
    [InlineData("/api/songs")]
    [InlineData("/api/songs/1")]
    [InlineData("/api/songs/1/audio-assets")]
    [InlineData("/api/songs/1/visual-assets")]
    [InlineData("/api/songs/1/release")]
    [InlineData("/api/songs/1/release/checklist")]
    [InlineData("/api/songs/1/content-items")]
    [InlineData("/api/songs/1/credits")]
    [InlineData("/api/songs/1/analytics")]
    [InlineData("/api/calendar")]
    [InlineData("/api/dashboard")]
    public async Task ProtectedEndpoints_WhenUnauthenticated_ReturnUnauthorized(string path)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SongEndpoints_AreScopedToCurrentUser()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = factory.CreateClient();
        using var userB = factory.CreateClient();
        var accountA = await TestAuth.RegisterAsync(userA, "artist-a@example.com");
        var accountB = await TestAuth.RegisterAsync(userB, "artist-b@example.com");

        var spoofed = await userA.PostAsJsonAsync("/api/songs", new
        {
            title = "Spoofed Owner Song",
            status = "Demo",
            ownerUserId = accountB.Id
        });
        var songA = (await spoofed.Content.ReadFromJsonAsync<SongResponse>())!;
        var songB = await CreateSong(userB, "User B Song");
        var unownedSongId = await CreateUnownedSong(factory, "Legacy Unowned Song");

        Assert.Equal(accountA.Id, songA.OwnerUserId);

        var userASongs = await userA.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var userBSongs = await userB.GetFromJsonAsync<List<SongResponse>>("/api/songs");

        Assert.NotNull(userASongs);
        Assert.NotNull(userBSongs);
        Assert.Contains(userASongs, song => song.Id == songA.Id);
        Assert.DoesNotContain(userASongs, song => song.Id == songB.Id || song.Id == unownedSongId);
        Assert.Contains(userBSongs, song => song.Id == songB.Id);
        Assert.DoesNotContain(userBSongs, song => song.Id == songA.Id || song.Id == unownedSongId);

        Assert.Equal(HttpStatusCode.NotFound, (await userA.GetAsync($"/api/songs/{songB.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userA.GetAsync($"/api/songs/{unownedSongId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userA.PutAsJsonAsync($"/api/songs/{songB.Id}", SongPayload("Blocked", "Mixing"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userA.DeleteAsync($"/api/songs/{songB.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await userB.GetAsync($"/api/songs/{songB.Id}")).StatusCode);
    }

    [Fact]
    public async Task AudioAndVisualAssets_AreScopedThroughOwnedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("audio-a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("audio-b@example.com");
        var songA = await CreateSong(userA, "User A Asset Song");
        var songB = await CreateSong(userB, "User B Asset Song");

        var audio = await CreateAudioAsset(userA, songA.Id);
        await AssertForbiddenNestedAccess(
            userB,
            userA,
            $"/api/songs/{songA.Id}/audio-assets",
            $"/api/songs/{songA.Id}/audio-assets/{audio.Id}",
            $"/api/songs/{songB.Id}/audio-assets/{audio.Id}",
            AudioPayload("blocked.wav"),
            AudioPayload("updated.wav"));
        Assert.Equal(HttpStatusCode.NoContent, (await userA.PutAsJsonAsync($"/api/songs/{songA.Id}/audio-assets/{audio.Id}", AudioPayload("owner-update.wav"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/audio-assets/{audio.Id}")).StatusCode);

        var visual = await CreateVisualAsset(userA, songA.Id);
        await AssertForbiddenNestedAccess(
            userB,
            userA,
            $"/api/songs/{songA.Id}/visual-assets",
            $"/api/songs/{songA.Id}/visual-assets/{visual.Id}",
            $"/api/songs/{songB.Id}/visual-assets/{visual.Id}",
            VisualPayload("blocked.png"),
            VisualPayload("updated.png"));
        Assert.Equal(HttpStatusCode.NoContent, (await userA.PutAsJsonAsync($"/api/songs/{songA.Id}/visual-assets/{visual.Id}", VisualPayload("owner-update.png"))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/visual-assets/{visual.Id}")).StatusCode);
    }

    [Fact]
    public async Task ReleaseAndChecklist_AreScopedThroughOwnedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("release-a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("release-b@example.com");
        var songA = await CreateSong(userA, "User A Release Song");

        var release = await CreateRelease(userA, songA.Id);
        var checklist = await userA.GetFromJsonAsync<List<ReleaseChecklistItemResponse>>($"/api/songs/{songA.Id}/release/checklist");
        Assert.NotNull(checklist);
        Assert.NotEmpty(checklist);
        var checklistItem = checklist[0];

        Assert.Equal(HttpStatusCode.OK, (await userA.GetAsync($"/api/songs/{songA.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.GetAsync($"/api/songs/{songA.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.PostAsJsonAsync($"/api/songs/{songA.Id}/release", ReleasePayload())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.PutAsJsonAsync($"/api/songs/{songA.Id}/release", ReleasePayload())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.DeleteAsync($"/api/songs/{songA.Id}/release")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.GetAsync($"/api/songs/{songA.Id}/release/checklist")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.GetAsync($"/api/songs/{songA.Id}/release/checklist/{checklistItem.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await userB.PutAsJsonAsync($"/api/songs/{songA.Id}/release/checklist/{checklistItem.Id}", new { isCompleted = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await userA.PutAsJsonAsync($"/api/songs/{songA.Id}/release/checklist/{checklistItem.Id}", new { isCompleted = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/release")).StatusCode);
        Assert.Equal(songA.Id, release.SongId);
    }

    [Fact]
    public async Task ContentCreditAndAnalytics_AreScopedThroughOwnedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("metadata-a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("metadata-b@example.com");
        var songA = await CreateSong(userA, "User A Metadata Song");
        var songB = await CreateSong(userB, "User B Metadata Song");

        var content = await CreateContentItem(userA, songA.Id);
        await AssertForbiddenNestedAccess(
            userB,
            userA,
            $"/api/songs/{songA.Id}/content-items",
            $"/api/songs/{songA.Id}/content-items/{content.Id}",
            $"/api/songs/{songB.Id}/content-items/{content.Id}",
            ContentPayload("Blocked Content"),
            ContentPayload("Updated Content"));
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/content-items/{content.Id}")).StatusCode);

        var credit = await CreateCredit(userA, songA.Id);
        await AssertForbiddenNestedAccess(
            userB,
            userA,
            $"/api/songs/{songA.Id}/credits",
            $"/api/songs/{songA.Id}/credits/{credit.Id}",
            $"/api/songs/{songB.Id}/credits/{credit.Id}",
            CreditPayload("Blocked Person"),
            CreditPayload("Updated Person"));
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/credits/{credit.Id}")).StatusCode);

        var snapshot = await CreateAnalyticsSnapshot(userA, songA.Id);
        await AssertForbiddenNestedAccess(
            userB,
            userA,
            $"/api/songs/{songA.Id}/analytics",
            $"/api/songs/{songA.Id}/analytics/{snapshot.Id}",
            $"/api/songs/{songB.Id}/analytics/{snapshot.Id}",
            AnalyticsPayload(DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-2)),
            AnalyticsPayload(DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1)));
        Assert.Equal(HttpStatusCode.NoContent, (await userA.DeleteAsync($"/api/songs/{songA.Id}/analytics/{snapshot.Id}")).StatusCode);
    }

    [Fact]
    public async Task CalendarAndDashboard_AggregateOnlyCurrentUsersData()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("aggregate-a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("aggregate-b@example.com");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var songA = await CreateSong(userA, "Aggregate A");
        var songB = await CreateSong(userB, "Aggregate B");
        await CreateRelease(userA, songA.Id, today.AddDays(3));
        await CreateRelease(userB, songB.Id, today.AddDays(4));
        await CreateContentItem(userA, songA.Id, today.AddDays(5));
        await CreateContentItem(userB, songB.Id, today.AddDays(6));
        await CreateAnalyticsSnapshot(userA, songA.Id);
        await CreateAnalyticsSnapshot(userB, songB.Id);

        var calendarA = await userA.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar");
        var calendarB = await userB.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar");
        var dashboardA = await userA.GetFromJsonAsync<DashboardResponse>("/api/dashboard");
        var dashboardB = await userB.GetFromJsonAsync<DashboardResponse>("/api/dashboard");

        Assert.NotNull(calendarA);
        Assert.NotNull(calendarB);
        Assert.All(calendarA, entry => Assert.Equal(songA.Id, entry.SongId));
        Assert.All(calendarB, entry => Assert.Equal(songB.Id, entry.SongId));
        Assert.DoesNotContain(calendarA, entry => entry.SongId == songB.Id);
        Assert.DoesNotContain(calendarB, entry => entry.SongId == songA.Id);

        Assert.NotNull(dashboardA);
        Assert.NotNull(dashboardB);
        Assert.Equal(1, dashboardA.Summary.TotalSongs);
        Assert.Equal(1, dashboardB.Summary.TotalSongs);
        Assert.Equal(1, dashboardA.Summary.UpcomingReleases);
        Assert.Equal(1, dashboardB.Summary.UpcomingReleases);
        Assert.All(dashboardA.Upcoming, item => Assert.Equal(songA.Id, item.SongId));
        Assert.All(dashboardB.Upcoming, item => Assert.Equal(songB.Id, item.SongId));
        Assert.All(dashboardA.ReleaseReadiness, item => Assert.Equal(songA.Id, item.SongId));
        Assert.All(dashboardB.ReleaseReadiness, item => Assert.Equal(songB.Id, item.SongId));
        Assert.All(dashboardA.AnalyticsOverview, item => Assert.Equal(songA.Id, item.SongId));
        Assert.All(dashboardB.AnalyticsOverview, item => Assert.Equal(songB.Id, item.SongId));
        Assert.All(dashboardA.RecentActivity, item => Assert.Equal(songA.Id, item.SongId));
        Assert.All(dashboardB.RecentActivity, item => Assert.Equal(songB.Id, item.SongId));
    }

    [Fact]
    public async Task LegacyUnownedSong_IsInvisibleToAuthenticatedUsersAndAggregates()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync("legacy@example.com");
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var songId = await CreateLegacyUnownedGraph(factory, today.AddDays(1));

        var songs = await client.GetFromJsonAsync<List<SongResponse>>("/api/songs");
        var calendar = await client.GetFromJsonAsync<List<CalendarEntryResponse>>("/api/calendar");
        var dashboard = await client.GetFromJsonAsync<DashboardResponse>("/api/dashboard");

        Assert.NotNull(songs);
        Assert.Empty(songs);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/songs/{songId}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/songs/{songId}/audio-assets")).StatusCode);
        Assert.NotNull(calendar);
        Assert.Empty(calendar);
        Assert.NotNull(dashboard);
        Assert.Equal(0, dashboard.Summary.TotalSongs);
        Assert.Equal(0, dashboard.Summary.UpcomingReleases);
        Assert.Empty(dashboard.Upcoming);
        Assert.Empty(dashboard.ReleaseReadiness);
    }

    private static async Task AssertForbiddenNestedAccess(
        HttpClient otherUser,
        HttpClient owner,
        string collectionPath,
        string itemPath,
        string mismatchedItemPath,
        object createPayload,
        object updatePayload)
    {
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(collectionPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherUser.GetAsync(collectionPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherUser.GetAsync(itemPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherUser.PostAsJsonAsync(collectionPath, createPayload)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherUser.PutAsJsonAsync(itemPath, updatePayload)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await otherUser.DeleteAsync(itemPath)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(mismatchedItemPath)).StatusCode);
    }

    private static async Task<SongResponse> CreateSong(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/songs", SongPayload(title, "Demo"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<AudioAssetResponse> CreateAudioAsset(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", AudioPayload("demo.wav"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
    }

    private static async Task<VisualAssetResponse> CreateVisualAsset(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", VisualPayload("cover.png"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
    }

    private static async Task<ReleaseResponse> CreateRelease(
        HttpClient client,
        int songId,
        DateOnly? releaseDate = null)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/songs/{songId}/release",
            ReleasePayload(releaseDate));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ReleaseResponse>())!;
    }

    private static async Task<ContentItemResponse> CreateContentItem(
        HttpClient client,
        int songId,
        DateOnly? scheduledAt = null)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/songs/{songId}/content-items",
            ContentPayload("Content Plan", scheduledAt));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ContentItemResponse>())!;
    }

    private static async Task<CreditResponse> CreateCredit(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/songs/{songId}/credits",
            CreditPayload("Producer One"));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreditResponse>())!;
    }

    private static async Task<AnalyticsSnapshotResponse> CreateAnalyticsSnapshot(
        HttpClient client,
        int songId)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/songs/{songId}/analytics",
            AnalyticsPayload(DateOnly.FromDateTime(DateTime.UtcNow)));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>())!;
    }

    private static object SongPayload(string title, string status) => new { title, status };

    private static object AudioPayload(string fileName) => new
    {
        type = "Demo",
        fileName,
        version = 1,
        status = "Draft",
        durationSeconds = 180,
        fileSizeBytes = 123456,
        isCurrent = true
    };

    private static object VisualPayload(string fileName) => new
    {
        type = "CoverArt",
        fileName,
        version = 1,
        status = "Draft",
        width = 3000,
        height = 3000,
        fileSizeBytes = 222222,
        isCurrent = true
    };

    private static object ReleasePayload(DateOnly? releaseDate = null) => new
    {
        releaseDate,
        releaseType = "Single",
        distributor = "Distro",
        isrc = "USAAA2600001",
        upc = "123456789012",
        status = "Planning",
        platforms = new[] { "Spotify", "YouTube" }
    };

    private static object ContentPayload(string title, DateOnly? scheduledAt = null) => new
    {
        title,
        type = "Teaser",
        status = "Scheduled",
        platform = "Instagram",
        ownerName = "Artist",
        dueDate = scheduledAt,
        scheduledAt,
        publishedAt = (DateOnly?)null,
        notes = "Owned content"
    };

    private static object CreditPayload(string contributorName) => new
    {
        contributorName,
        role = "Producer",
        contact = "producer@example.com",
        status = "Pending",
        splitPercentage = 25,
        notes = "Owned credit"
    };

    private static object AnalyticsPayload(DateOnly snapshotDate) => new
    {
        platform = "YouTube",
        snapshotDate,
        views = 1000,
        likes = 100,
        comments = 10,
        watchTimeMinutes = 500,
        subscribersGained = 5
    };

    private static async Task<int> CreateUnownedSong(ArtistOsApiFactory factory, string title)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = title,
            Status = "Demo",
            CreatedAt = DateTime.UtcNow,
            OwnerUserId = null
        };
        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();
        return song.Id;
    }

    private static async Task<int> CreateLegacyUnownedGraph(
        ArtistOsApiFactory factory,
        DateOnly futureDate)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = "Legacy Aggregate Song",
            Status = "Demo",
            CreatedAt = DateTime.UtcNow,
            OwnerUserId = null
        };
        song.Release = new Release
        {
            Song = song,
            ReleaseDate = futureDate,
            ReleaseType = "Single",
            Status = "Planning",
            Platforms = "Spotify",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        song.ContentItems.Add(new ContentItem
        {
            Song = song,
            Title = "Legacy Content",
            Type = "Teaser",
            Status = "Scheduled",
            Platform = "Instagram",
            ScheduledAt = futureDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        song.AudioAssets.Add(new AudioAsset
        {
            Song = song,
            Type = "Demo",
            FileName = "legacy.wav",
            Version = 1,
            Status = "Draft",
            UploadedAt = DateTime.UtcNow,
            IsCurrent = true
        });

        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();
        return song.Id;
    }
}
