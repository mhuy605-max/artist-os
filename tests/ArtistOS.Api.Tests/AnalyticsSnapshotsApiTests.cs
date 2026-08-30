using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class AnalyticsSnapshotsApiTests
{
    [Fact]
    public async Task CreateAnalyticsSnapshot_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/analytics", new
        {
            platform = "  youtube  ",
            snapshotDate = "2026-08-30",
            views = 1200,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30,
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var snapshot = await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>();
        Assert.NotNull(snapshot);
        Assert.True(snapshot.Id > 0);
        Assert.Equal(song.Id, snapshot.SongId);
        Assert.Equal("YouTube", snapshot.Platform);
        Assert.Equal(new DateOnly(2026, 8, 30), snapshot.SnapshotDate);
        Assert.Equal(1200, snapshot.Views);
        Assert.Equal(120, snapshot.Likes);
        Assert.Equal(12, snapshot.Comments);
        Assert.Equal(3600, snapshot.WatchTimeMinutes);
        Assert.Equal(30, snapshot.SubscribersGained);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), snapshot.CreatedAt);
    }

    [Fact]
    public async Task CreateAnalyticsSnapshot_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/songs/999999/analytics", ValidSnapshot());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("SoundCloud")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAnalyticsSnapshot_WithInvalidPlatform_ReturnsBadRequest(string platform)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/analytics", new
        {
            platform,
            snapshotDate = "2026-08-30",
            views = 1200,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAnalyticsSnapshot_WithMissingSnapshotDate_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/analytics", new
        {
            platform = "YouTube",
            views = 1200,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("views")]
    [InlineData("likes")]
    [InlineData("comments")]
    [InlineData("watchTimeMinutes")]
    [InlineData("subscribersGained")]
    public async Task CreateAnalyticsSnapshot_WithNegativeMetric_ReturnsBadRequest(string metric)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var payload = new Dictionary<string, object?>
        {
            ["platform"] = "YouTube",
            ["snapshotDate"] = "2026-08-30",
            ["views"] = 1200,
            ["likes"] = 120,
            ["comments"] = 12,
            ["watchTimeMinutes"] = 3600,
            ["subscribersGained"] = 30
        };
        payload[metric] = -1;

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/analytics", payload);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAnalyticsSnapshot_WithDuplicatePlatformAndDate_ReturnsConflict()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateAnalyticsSnapshot(client, song.Id);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/analytics", ValidSnapshot());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task GetAnalyticsSnapshots_ReturnsSnapshotsOrderedByDate()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var later = await CreateAnalyticsSnapshot(client, song.Id, "YouTube", "2026-08-30");
        var earlier = await CreateAnalyticsSnapshot(client, song.Id, "YouTube", "2026-08-29");

        var snapshots = await client.GetFromJsonAsync<List<AnalyticsSnapshotResponse>>(
            $"/api/songs/{song.Id}/analytics");

        Assert.NotNull(snapshots);
        Assert.Equal(2, snapshots.Count);
        Assert.Equal(earlier.Id, snapshots[0].Id);
        Assert.Equal(later.Id, snapshots[1].Id);
    }

    [Fact]
    public async Task GetAnalyticsSnapshot_WithExistingSnapshot_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>();
        Assert.NotNull(found);
        Assert.Equal(snapshot.Id, found.Id);
    }

    [Fact]
    public async Task GetAnalyticsSnapshot_WithMissingSnapshot_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/analytics/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAnalyticsSnapshot_WithValidPayload_ReturnsNoContentAndPreservesCreatedAt()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}", new
        {
            platform = "spotify",
            snapshotDate = "2026-09-01",
            views = 2500,
            likes = 250,
            comments = 25,
            watchTimeMinutes = 7200,
            subscribersGained = 45,
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<AnalyticsSnapshotResponse>(
            $"/api/songs/{song.Id}/analytics/{snapshot.Id}");
        Assert.NotNull(updated);
        Assert.Equal("Spotify", updated.Platform);
        Assert.Equal(new DateOnly(2026, 9, 1), updated.SnapshotDate);
        Assert.Equal(2500, updated.Views);
        Assert.Equal(250, updated.Likes);
        Assert.Equal(25, updated.Comments);
        Assert.Equal(7200, updated.WatchTimeMinutes);
        Assert.Equal(45, updated.SubscribersGained);
        Assert.Equal(snapshot.CreatedAt, updated.CreatedAt);
    }

    [Fact]
    public async Task UpdateAnalyticsSnapshot_WithInvalidPlatform_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}", new
        {
            platform = "SoundCloud",
            snapshotDate = "2026-08-30",
            views = 1200,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAnalyticsSnapshot_WithNegativeMetric_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}", new
        {
            platform = "YouTube",
            snapshotDate = "2026-08-30",
            views = -1,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAnalyticsSnapshot_WithDuplicatePlatformAndDate_ReturnsConflict()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateAnalyticsSnapshot(client, song.Id, "YouTube", "2026-08-30");
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id, "TikTok", "2026-08-31");

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}", new
        {
            platform = "YouTube",
            snapshotDate = "2026-08-30",
            views = 1500,
            likes = 150,
            comments = 15,
            watchTimeMinutes = 4000,
            subscribersGained = 35
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAnalyticsSnapshot_WithMissingSongOrSnapshot_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var missingSong = await client.PutAsJsonAsync("/api/songs/999999/analytics/1", ValidSnapshot());
        var missingSnapshot = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/analytics/999999",
            ValidSnapshot());

        Assert.Equal(HttpStatusCode.NotFound, missingSong.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingSnapshot.StatusCode);
    }

    [Fact]
    public async Task DeleteAnalyticsSnapshot_WithExistingSnapshot_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var snapshot = await CreateAnalyticsSnapshot(client, song.Id);

        var deleteSnapshot = await client.DeleteAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}");
        var getDeletedSnapshot = await client.GetAsync($"/api/songs/{song.Id}/analytics/{snapshot.Id}");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteSnapshot.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedSnapshot.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteAnalyticsSnapshot_WithMissingSnapshot_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/analytics/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SongCanHaveManyAnalyticsSnapshotsAcrossDates()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var first = await CreateAnalyticsSnapshot(client, song.Id, "YouTube", "2026-08-29");
        var second = await CreateAnalyticsSnapshot(client, song.Id, "YouTube", "2026-08-30");
        var third = await CreateAnalyticsSnapshot(client, song.Id, "TikTok", "2026-08-30");

        var snapshots = await client.GetFromJsonAsync<List<AnalyticsSnapshotResponse>>(
            $"/api/songs/{song.Id}/analytics");

        Assert.NotNull(snapshots);
        Assert.Equal(3, snapshots.Count);
        Assert.All(snapshots, snapshot => Assert.Equal(song.Id, snapshot.SongId));
        Assert.Contains(snapshots, snapshot => snapshot.Id == first.Id);
        Assert.Contains(snapshots, snapshot => snapshot.Id == second.Id);
        Assert.Contains(snapshots, snapshot => snapshot.Id == third.Id);
    }

    private static async Task<SongResponse> CreateSong(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Night Protocol",
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();

        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        return song;
    }

    private static async Task<AnalyticsSnapshotResponse> CreateAnalyticsSnapshot(
        HttpClient client,
        int songId,
        string platform = "YouTube",
        string snapshotDate = "2026-08-30")
    {
        var response = await client.PostAsJsonAsync(
            $"/api/songs/{songId}/analytics",
            ValidSnapshot(platform, snapshotDate));
        response.EnsureSuccessStatusCode();

        var snapshot = await response.Content.ReadFromJsonAsync<AnalyticsSnapshotResponse>();
        Assert.NotNull(snapshot);
        return snapshot;
    }

    private static object ValidSnapshot(
        string platform = "YouTube",
        string snapshotDate = "2026-08-30")
    {
        return new
        {
            platform,
            snapshotDate,
            views = 1200,
            likes = 120,
            comments = 12,
            watchTimeMinutes = 3600,
            subscribersGained = 30
        };
    }
}
