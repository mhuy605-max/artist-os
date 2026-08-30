using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class ReleaseChecklistApiTests
{
    private static readonly string[] ExpectedKeys =
    [
        "Master",
        "Cover",
        "Metadata",
        "Credits",
        "Canvas",
        "MusicVideo",
        "ContentPlan"
    ];

    [Fact]
    public async Task CreateRelease_InitializesDefaultChecklistItems()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var release = await CreateRelease(client, song.Id);

        var checklist = await GetChecklist(client, song.Id);

        Assert.Equal(7, checklist.Count);
        Assert.All(checklist, item => Assert.Equal(release.Id, item.ReleaseId));
        Assert.Equal(ExpectedKeys, checklist.Select(item => item.Key));
        Assert.Equal([0, 1, 2, 3, 4, 5, 6], checklist.Select(item => item.SortOrder));
        Assert.All(checklist, item => Assert.False(item.IsCompleted));
        Assert.All(checklist, item => Assert.Null(item.CompletedAt));
    }

    [Fact]
    public async Task GetChecklist_WithStableOrdering_ReturnsItemsBySortOrder()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/release/checklist");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var checklist = await response.Content.ReadFromJsonAsync<List<ReleaseChecklistItemResponse>>();
        Assert.NotNull(checklist);
        Assert.Equal(ExpectedKeys, checklist.Select(item => item.Key));
    }

    [Fact]
    public async Task GetChecklist_WithMissingSongOrRelease_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var missingSong = await client.GetAsync("/api/songs/999999/release/checklist");
        var missingRelease = await client.GetAsync($"/api/songs/{song.Id}/release/checklist");

        Assert.Equal(HttpStatusCode.NotFound, missingSong.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingRelease.StatusCode);
    }

    [Fact]
    public async Task GetChecklistItem_WithExistingItem_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var item = (await GetChecklist(client, song.Id)).First();

        var response = await client.GetAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<ReleaseChecklistItemResponse>();
        Assert.NotNull(found);
        Assert.Equal(item.Id, found.Id);
        Assert.Equal("Master", found.Key);
    }

    [Fact]
    public async Task GetChecklistItem_WithMissingItem_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/release/checklist/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateChecklistItem_MarksCompleteAndSetsCompletedAtServerSide()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var item = (await GetChecklist(client, song.Id)).First();

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}",
            new
            {
                isCompleted = true,
                notes = "  Master approved.  ",
                completedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await GetChecklistItem(client, song.Id, item.Id);
        Assert.True(updated.IsCompleted);
        Assert.NotNull(updated.CompletedAt);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), updated.CompletedAt);
        Assert.Equal("Master approved.", updated.Notes);
        Assert.Equal(item.CreatedAt, updated.CreatedAt);
        Assert.True(updated.UpdatedAt > item.UpdatedAt);
    }

    [Fact]
    public async Task UpdateChecklistItem_MarksIncompleteAndClearsCompletedAt()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var item = (await GetChecklist(client, song.Id)).First();

        await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}",
            new { isCompleted = true, notes = "Done" });

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}",
            new { isCompleted = false, notes = "Needs revision" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await GetChecklistItem(client, song.Id, item.Id);
        Assert.False(updated.IsCompleted);
        Assert.Null(updated.CompletedAt);
        Assert.Equal("Needs revision", updated.Notes);
    }

    [Fact]
    public async Task UpdateChecklistItem_WithLongNotes_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var item = (await GetChecklist(client, song.Id)).First();

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}",
            new { isCompleted = true, notes = new string('x', 1001) });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateChecklistItem_WithMissingItem_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/999999",
            new { isCompleted = true, notes = "Done" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdatingChecklistItem_DoesNotDeleteReleaseOrSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var release = await CreateRelease(client, song.Id);
        var item = (await GetChecklist(client, song.Id)).First();

        var update = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/release/checklist/{item.Id}",
            new { isCompleted = true, notes = "Ready" });
        var getRelease = await client.GetAsync($"/api/songs/{song.Id}/release");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getRelease.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);

        var currentRelease = await getRelease.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(currentRelease);
        Assert.Equal(release.Id, currentRelease.Id);
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

    private static async Task<ReleaseResponse> CreateRelease(HttpClient client, int songId)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", new
        {
            releaseDate = "2026-10-31",
            releaseType = "Single",
            distributor = "DISTROKID",
            isrc = "QZK4S260001",
            upc = "191227000000",
            status = "Preparing",
            platforms = new[] { "Spotify", "AppleMusic", "YouTubeMusic" }
        });
        response.EnsureSuccessStatusCode();

        var release = await response.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(release);
        return release;
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

    private static async Task<ReleaseChecklistItemResponse> GetChecklistItem(
        HttpClient client,
        int songId,
        int checklistItemId)
    {
        var item = await client.GetFromJsonAsync<ReleaseChecklistItemResponse>(
            $"/api/songs/{songId}/release/checklist/{checklistItemId}");

        Assert.NotNull(item);
        return item;
    }
}
