using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class DashboardApiTests
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    [Fact]
    public async Task GetDashboard_WithEmptyDatabase_ReturnsValidZeroResponse()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var dashboard = await GetDashboard(client);

        Assert.Equal(0, dashboard.Summary.TotalSongs);
        Assert.Equal(0, dashboard.Summary.ActiveSongs);
        Assert.Equal(0, dashboard.Summary.UpcomingReleases);
        Assert.Equal(0, dashboard.Summary.ScheduledContent);
        Assert.All(dashboard.Pipeline, item => Assert.Equal(0, item.Count));
        Assert.Empty(dashboard.Upcoming);
        Assert.Empty(dashboard.ReleaseReadiness);
        Assert.Empty(dashboard.AnalyticsOverview);
        Assert.Empty(dashboard.RecentActivity);
    }

    [Fact]
    public async Task GetDashboard_ReturnsSummaryCountsFromSourceDomains()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var activeSong = await CreateSong(client, "Active", "Recording");
        var releasedSong = await CreateSong(client, "Released", "Released");
        var upcomingReleaseSong = await CreateSong(client, "Upcoming Release", "ReleasePreparation");
        var scheduledContentSong = await CreateSong(client, "Scheduled Content", "ContentCampaign");
        await CreateRelease(client, upcomingReleaseSong.Id, Today.AddDays(10), status: "Scheduled");
        await CreateRelease(client, releasedSong.Id, Today.AddDays(20), status: "Released");
        await CreateContentItem(
            client,
            scheduledContentSong.Id,
            scheduledAt: Today.AddDays(3),
            status: "Scheduled");
        await CreateContentItem(
            client,
            activeSong.Id,
            scheduledAt: Today.AddDays(4),
            status: "Published");

        var dashboard = await GetDashboard(client);

        Assert.Equal(4, dashboard.Summary.TotalSongs);
        Assert.Equal(3, dashboard.Summary.ActiveSongs);
        Assert.Equal(1, dashboard.Summary.UpcomingReleases);
        Assert.Equal(1, dashboard.Summary.ScheduledContent);
    }

    [Fact]
    public async Task GetDashboard_ReturnsPipelineInCanonicalOrderWithZeroCounts()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        await CreateSong(client, "Idea Song", "Idea");
        await CreateSong(client, "Demo Song", "Demo");
        await CreateSong(client, "Second Demo Song", "Demo");
        await CreateSong(client, "Released Song", "Released");

        var dashboard = await GetDashboard(client);

        Assert.Equal(
            [
                "Idea",
                "Demo",
                "Recording",
                "Mixing",
                "Mastering",
                "ReleasePreparation",
                "ContentCampaign",
                "Released",
                "Analytics"
            ],
            dashboard.Pipeline.Select(item => item.Status));
        Assert.Equal(1, dashboard.Pipeline.Single(item => item.Status == "Idea").Count);
        Assert.Equal(2, dashboard.Pipeline.Single(item => item.Status == "Demo").Count);
        Assert.Equal(0, dashboard.Pipeline.Single(item => item.Status == "Recording").Count);
        Assert.Equal(1, dashboard.Pipeline.Single(item => item.Status == "Released").Count);
    }

    [Fact]
    public async Task GetDashboard_ReturnsBoundedUpcomingReleaseAndContentWork()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Upcoming Song", "ReleasePreparation");
        var pastSong = await CreateSong(client, "Past Song", "ContentCampaign");
        var release = await CreateRelease(client, song.Id, Today.AddDays(8));
        var dueContent = await CreateContentItem(
            client,
            song.Id,
            title: "Content Due",
            dueDate: Today.AddDays(2),
            status: "Planned");
        var scheduledContent = await CreateContentItem(
            client,
            song.Id,
            title: "Content Scheduled",
            scheduledAt: Today.AddDays(5),
            status: "Scheduled");
        await CreateRelease(client, pastSong.Id, Today.AddDays(-1));
        await CreateContentItem(
            client,
            pastSong.Id,
            title: "Past content",
            dueDate: Today.AddDays(-2),
            scheduledAt: Today.AddDays(-1),
            status: "Scheduled");

        var dashboard = await GetDashboard(client);

        Assert.Equal(3, dashboard.Upcoming.Count);
        Assert.Equal(
            ["ContentDue", "ContentScheduled", "ReleaseDate"],
            dashboard.Upcoming.Select(item => item.EventType));
        Assert.All(dashboard.Upcoming, item => Assert.True(item.Date >= Today));

        var due = dashboard.Upcoming.Single(item => item.EventType == "ContentDue");
        Assert.Equal(dueContent.Id, due.SourceId);
        Assert.Equal(song.Id, due.SongId);
        Assert.Equal("Upcoming Song", due.SongTitle);
        Assert.Equal("Content Due", due.Title);
        Assert.Equal("TikTok", due.Platform);
        Assert.Equal($"/songs/{song.Id}", due.NavigationTarget);

        var scheduled = dashboard.Upcoming.Single(item => item.EventType == "ContentScheduled");
        Assert.Equal(scheduledContent.Id, scheduled.SourceId);

        var releaseEntry = dashboard.Upcoming.Single(item => item.EventType == "ReleaseDate");
        Assert.Equal(release.Id, releaseEntry.SourceId);
    }

    [Fact]
    public async Task GetDashboard_BoundsUpcomingResults()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Bounded", "ContentCampaign");

        for (var i = 0; i < 10; i++)
        {
            await CreateContentItem(
                client,
                song.Id,
                title: $"Upcoming {i}",
                dueDate: Today.AddDays(i + 1),
                status: "Planned");
        }

        var dashboard = await GetDashboard(client);

        Assert.Equal(8, dashboard.Upcoming.Count);
        Assert.Equal(Today.AddDays(1), dashboard.Upcoming.First().Date);
        Assert.Equal(Today.AddDays(8), dashboard.Upcoming.Last().Date);
    }

    [Fact]
    public async Task GetDashboard_DerivesReleaseReadinessFromChecklistState()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var emptySong = await CreateSong(client, "Empty Checklist", "ReleasePreparation");
        var partialSong = await CreateSong(client, "Partial Checklist", "ReleasePreparation");
        var completeSong = await CreateSong(client, "Complete Checklist", "ReleasePreparation");
        await CreateRelease(client, emptySong.Id, Today.AddDays(4));
        await CreateRelease(client, partialSong.Id, Today.AddDays(5));
        await CreateRelease(client, completeSong.Id, Today.AddDays(6));
        await CompleteChecklistItems(client, partialSong.Id, count: 4);
        await CompleteChecklistItems(client, completeSong.Id, count: 7);

        var dashboard = await GetDashboard(client);

        var empty = dashboard.ReleaseReadiness.Single(item => item.SongId == emptySong.Id);
        var partial = dashboard.ReleaseReadiness.Single(item => item.SongId == partialSong.Id);
        var complete = dashboard.ReleaseReadiness.Single(item => item.SongId == completeSong.Id);

        Assert.Equal(0, empty.CompletedItems);
        Assert.Equal(7, empty.TotalItems);
        Assert.Equal(0, empty.ReadinessPercentage);
        Assert.Equal(4, partial.CompletedItems);
        Assert.Equal(7, partial.TotalItems);
        Assert.Equal(57, partial.ReadinessPercentage);
        Assert.Equal(7, complete.CompletedItems);
        Assert.Equal(7, complete.TotalItems);
        Assert.Equal(100, complete.ReadinessPercentage);
    }

    [Fact]
    public async Task GetDashboard_ReflectsChecklistChangesImmediately()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Checklist Changes", "ReleasePreparation");
        await CreateRelease(client, song.Id, Today.AddDays(3));
        var checklist = await GetChecklist(client, song.Id);

        await UpdateChecklistItem(client, song.Id, checklist[0].Id, isCompleted: true);
        var afterComplete = await GetDashboard(client);
        await UpdateChecklistItem(client, song.Id, checklist[0].Id, isCompleted: false);
        var afterUncomplete = await GetDashboard(client);

        Assert.Equal(1, afterComplete.ReleaseReadiness.Single().CompletedItems);
        Assert.Equal(0, afterUncomplete.ReleaseReadiness.Single().CompletedItems);
    }

    [Fact]
    public async Task GetDashboard_ReturnsLatestAnalyticsSnapshotPerSongAndPlatform()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Analytics Song", "Analytics");
        await CreateAnalyticsSnapshot(client, song.Id, "YouTube", Today.AddDays(-10), views: 1_000);
        await CreateAnalyticsSnapshot(client, song.Id, "YouTube", Today.AddDays(-2), views: 1_500);
        await CreateAnalyticsSnapshot(client, song.Id, "Spotify", Today.AddDays(-1), views: 700);

        var dashboard = await GetDashboard(client);

        Assert.Equal(2, dashboard.AnalyticsOverview.Count);
        var youtube = dashboard.AnalyticsOverview.Single(item => item.Platform == "YouTube");
        Assert.Equal(Today.AddDays(-2), youtube.SnapshotDate);
        Assert.Equal(1_500, youtube.Views);
        Assert.DoesNotContain(dashboard.AnalyticsOverview, item =>
            item.Platform == "YouTube" && item.Views == 1_000);
        Assert.All(dashboard.AnalyticsOverview, item =>
            Assert.Equal($"/songs/{song.Id}", item.NavigationTarget));
    }

    [Fact]
    public async Task GetDashboard_BoundsAnalyticsOverview()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        for (var i = 0; i < 7; i++)
        {
            var song = await CreateSong(client, $"Analytics {i}", "Analytics");
            await CreateAnalyticsSnapshot(client, song.Id, "YouTube", Today.AddDays(-i), views: 100 + i);
        }

        var dashboard = await GetDashboard(client);

        Assert.Equal(5, dashboard.AnalyticsOverview.Count);
    }

    [Fact]
    public async Task GetDashboard_ReturnsConservativeRecentActivity()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Activity Song", "Demo");
        await CreateRelease(client, song.Id, Today.AddDays(5));
        await CreateContentItem(client, song.Id, title: "Activity Content", scheduledAt: Today.AddDays(1));
        await CreateCredit(client, song.Id);
        await CreateAnalyticsSnapshot(client, song.Id, "YouTube", Today, views: 100);
        await CreateAudioAsset(client, song.Id);
        await CreateVisualAsset(client, song.Id);

        var dashboard = await GetDashboard(client);

        Assert.NotEmpty(dashboard.RecentActivity);
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Song created");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Release plan created");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Content item created");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Credit created");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Analytics snapshot recorded");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Audio metadata uploaded");
        Assert.Contains(dashboard.RecentActivity, item => item.Description == "Visual metadata uploaded");
        Assert.All(dashboard.RecentActivity, item =>
        {
            Assert.Equal(song.Id, item.SongId);
            Assert.Equal("Activity Song", item.SongTitle);
            Assert.Equal($"/songs/{song.Id}", item.NavigationTarget);
            Assert.DoesNotContain("by ", item.Description, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("sync", item.Description, StringComparison.OrdinalIgnoreCase);
        });
    }

    [Fact]
    public async Task GetDashboard_BoundsRecentActivityAndSortsDescending()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        for (var i = 0; i < 10; i++)
        {
            await CreateSong(client, $"Activity {i}", "Demo");
        }

        var dashboard = await GetDashboard(client);

        Assert.Equal(8, dashboard.RecentActivity.Count);
        Assert.Equal(
            dashboard.RecentActivity.OrderByDescending(item => item.OccurredAt),
            dashboard.RecentActivity);
    }

    [Fact]
    public async Task GetDashboard_ReflectsSourceRecordUpdatesAndDeletes()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Live Data", "ReleasePreparation");
        await CreateRelease(client, song.Id, Today.AddDays(5));
        var content = await CreateContentItem(
            client,
            song.Id,
            title: "Live Content",
            scheduledAt: Today.AddDays(2),
            status: "Scheduled");

        await client.PutAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseDate = Today.AddDays(12),
            releaseType = "Single",
            status = "Released",
            platforms = Array.Empty<string>()
        });
        await client.DeleteAsync($"/api/songs/{song.Id}/content-items/{content.Id}");

        var dashboard = await GetDashboard(client);

        Assert.Equal(0, dashboard.Summary.UpcomingReleases);
        Assert.Equal(0, dashboard.Summary.ScheduledContent);
        Assert.Empty(dashboard.Upcoming);
    }

    private static async Task<DashboardResponse> GetDashboard(HttpClient client)
    {
        var dashboard = await client.GetFromJsonAsync<DashboardResponse>("/api/dashboard");

        Assert.NotNull(dashboard);
        return dashboard;
    }

    private static async Task<SongResponse> CreateSong(
        HttpClient client,
        string title,
        string status)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status
        });
        response.EnsureSuccessStatusCode();

        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        return song;
    }

    private static async Task<ReleaseResponse> CreateRelease(
        HttpClient client,
        int songId,
        DateOnly? releaseDate,
        string status = "Scheduled")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", new
        {
            releaseDate,
            releaseType = "Single",
            distributor = "DISTROKID",
            status,
            platforms = new[] { "Spotify" }
        });
        response.EnsureSuccessStatusCode();

        var release = await response.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(release);
        return release;
    }

    private static async Task<ContentItemResponse> CreateContentItem(
        HttpClient client,
        int songId,
        string title = "Content Item",
        DateOnly? dueDate = null,
        DateOnly? scheduledAt = null,
        string status = "Scheduled")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/content-items", new
        {
            title,
            type = "TikTok",
            status,
            platform = "TikTok",
            ownerName = "AR",
            dueDate,
            scheduledAt,
            publishedAt = (DateOnly?)null,
            notes = "Dashboard test metadata."
        });
        response.EnsureSuccessStatusCode();

        var contentItem = await response.Content.ReadFromJsonAsync<ContentItemResponse>();
        Assert.NotNull(contentItem);
        return contentItem;
    }

    private static async Task<List<ReleaseChecklistItemResponse>> GetChecklist(
        HttpClient client,
        int songId)
    {
        var checklist = await client.GetFromJsonAsync<List<ReleaseChecklistItemResponse>>(
            $"/api/songs/{songId}/release/checklist");

        Assert.NotNull(checklist);
        return checklist;
    }

    private static async Task CompleteChecklistItems(HttpClient client, int songId, int count)
    {
        var checklist = await GetChecklist(client, songId);

        foreach (var item in checklist.Take(count))
        {
            await UpdateChecklistItem(client, songId, item.Id, isCompleted: true);
        }
    }

    private static async Task UpdateChecklistItem(
        HttpClient client,
        int songId,
        int checklistItemId,
        bool isCompleted)
    {
        var response = await client.PutAsJsonAsync(
            $"/api/songs/{songId}/release/checklist/{checklistItemId}",
            new { isCompleted, notes = "Dashboard readiness test." });

        response.EnsureSuccessStatusCode();
    }

    private static async Task<AnalyticsSnapshotResponse> CreateAnalyticsSnapshot(
        HttpClient client,
        int songId,
        string platform,
        DateOnly snapshotDate,
        long views)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/analytics", new
        {
            platform,
            snapshotDate,
            views,
            likes = 10,
            comments = 2,
            watchTimeMinutes = 50,
            subscribersGained = 1
        });
        response.EnsureSuccessStatusCode();

        var snapshot = await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>();
        Assert.NotNull(snapshot);
        return snapshot;
    }

    private static async Task<CreditResponse> CreateCredit(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/credits", new
        {
            contributorName = "Contributor",
            role = "Producer",
            contact = "producer@example.com",
            status = "Confirmed",
            splitPercentage = 20,
            notes = "Dashboard activity test."
        });
        response.EnsureSuccessStatusCode();

        var credit = await response.Content.ReadFromJsonAsync<CreditResponse>();
        Assert.NotNull(credit);
        return credit;
    }

    private static async Task<AudioAssetResponse> CreateAudioAsset(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", new
        {
            type = "Mix",
            fileName = "mix.wav",
            version = 1,
            status = "Review",
            durationSeconds = 180,
            fileSizeBytes = 1000,
            isCurrent = false
        });
        response.EnsureSuccessStatusCode();

        var audioAsset = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(audioAsset);
        return audioAsset;
    }

    private static async Task<VisualAssetResponse> CreateVisualAsset(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "cover.png",
            version = 1,
            status = "Review",
            width = 3000,
            height = 3000,
            fileSizeBytes = 1000,
            isCurrent = false
        });
        response.EnsureSuccessStatusCode();

        var visualAsset = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(visualAsset);
        return visualAsset;
    }
}
