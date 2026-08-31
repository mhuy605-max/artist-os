using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class ContentItemsApiTests
{
    [Fact]
    public async Task CreateContentItem_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/content-items", new
        {
            title = "  Teaser 01  ",
            type = "instagramreel",
            status = "inproduction",
            platform = "instagram",
            ownerName = "  AR  ",
            dueDate = "2026-09-01",
            scheduledAt = "2026-09-03",
            publishedAt = "2026-09-04",
            notes = "  Metadata only.  ",
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var item = await response.Content.ReadFromJsonAsync<ContentItemResponse>();
        Assert.NotNull(item);
        Assert.True(item.Id > 0);
        Assert.Equal(song.Id, item.SongId);
        Assert.Equal("Teaser 01", item.Title);
        Assert.Equal("InstagramReel", item.Type);
        Assert.Equal("InProduction", item.Status);
        Assert.Equal("Instagram", item.Platform);
        Assert.Equal("AR", item.OwnerName);
        Assert.Equal(new DateOnly(2026, 9, 1), item.DueDate);
        Assert.Equal(new DateOnly(2026, 9, 3), item.ScheduledAt);
        Assert.Equal(new DateOnly(2026, 9, 4), item.PublishedAt);
        Assert.Equal("Metadata only.", item.Notes);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), item.CreatedAt);
        Assert.Equal(item.CreatedAt, item.UpdatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task CreateContentItem_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs/999999/content-items", ValidContentItem());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Podcast")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateContentItem_WithInvalidType_ReturnsBadRequest(string type)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/content-items", new
        {
            title = "Teaser 01",
            type,
            status = "Idea"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateContentItem_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/content-items", new
        {
            title = "Teaser 01",
            type = "Teaser",
            status = "Posted"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateContentItem_WithInvalidPlatform_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/content-items", new
        {
            title = "Teaser 01",
            type = "Teaser",
            status = "Idea",
            platform = "Vimeo"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateContentItem_WithEmptyTitle_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/content-items", new
        {
            title = "   ",
            type = "Teaser",
            status = "Idea"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetContentItems_ReturnsCreatedMetadataForSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        var items = await client.GetFromJsonAsync<List<ContentItemResponse>>(
            $"/api/songs/{song.Id}/content-items");

        Assert.NotNull(items);
        Assert.Contains(items, contentItem => contentItem.Id == item.Id && contentItem.SongId == song.Id);
    }

    [Fact]
    public async Task GetContentItem_WithExistingItem_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/content-items/{item.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<ContentItemResponse>();
        Assert.NotNull(found);
        Assert.Equal(item.Id, found.Id);
    }

    [Fact]
    public async Task GetContentItem_WithMissingItem_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/content-items/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateContentItem_WithValidPayload_ReturnsNoContentAndUpdatesTimestamp()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        await Task.Delay(10);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/content-items/{item.Id}", new
        {
            title = "Final launch short",
            type = "youtubeshort",
            status = "published",
            platform = "youtubeshorts",
            ownerName = "JD",
            dueDate = "2026-09-10",
            scheduledAt = "2026-09-11",
            publishedAt = "2026-09-12",
            notes = "Status is metadata only.",
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<ContentItemResponse>(
            $"/api/songs/{song.Id}/content-items/{item.Id}");
        Assert.NotNull(updated);
        Assert.Equal("Final launch short", updated.Title);
        Assert.Equal("YouTubeShort", updated.Type);
        Assert.Equal("Published", updated.Status);
        Assert.Equal("YouTubeShorts", updated.Platform);
        Assert.Equal("JD", updated.OwnerName);
        Assert.Equal(new DateOnly(2026, 9, 10), updated.DueDate);
        Assert.Equal(new DateOnly(2026, 9, 11), updated.ScheduledAt);
        Assert.Equal(new DateOnly(2026, 9, 12), updated.PublishedAt);
        Assert.Equal("Status is metadata only.", updated.Notes);
        Assert.Equal(item.CreatedAt, updated.CreatedAt);
        Assert.True(updated.UpdatedAt > item.UpdatedAt);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), updated.UpdatedAt);
    }

    [Fact]
    public async Task UpdateContentItem_WithInvalidType_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/content-items/{item.Id}", new
        {
            title = "Teaser 01",
            type = "Podcast",
            status = "Idea"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateContentItem_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/content-items/{item.Id}", new
        {
            title = "Teaser 01",
            type = "Teaser",
            status = "Posted"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateContentItem_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/songs/999999/content-items/1", ValidContentItem());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateContentItem_WithMissingItem_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/content-items/999999",
            ValidContentItem());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteContentItem_WithExistingItem_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var item = await CreateContentItem(client, song.Id);

        var deleteItem = await client.DeleteAsync($"/api/songs/{song.Id}/content-items/{item.Id}");
        var getDeletedItem = await client.GetAsync($"/api/songs/{song.Id}/content-items/{item.Id}");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteItem.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedItem.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteContentItem_WithMissingItem_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/content-items/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SongCanHaveManyContentItems()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var teaser = await CreateContentItem(client, song.Id, "Teaser 01", "Teaser");
        var shortItem = await CreateContentItem(client, song.Id, "Short 01", "YouTubeShort");

        var items = await client.GetFromJsonAsync<List<ContentItemResponse>>(
            $"/api/songs/{song.Id}/content-items");

        Assert.NotNull(items);
        Assert.Equal(2, items.Count);
        Assert.All(items, contentItem => Assert.Equal(song.Id, contentItem.SongId));
        Assert.Contains(items, contentItem => contentItem.Id == teaser.Id);
        Assert.Contains(items, contentItem => contentItem.Id == shortItem.Id);
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

    private static async Task<ContentItemResponse> CreateContentItem(
        HttpClient client,
        int songId,
        string title = "Teaser 01",
        string type = "InstagramReel")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/content-items", new
        {
            title,
            type,
            status = "Planned",
            platform = "Instagram",
            ownerName = "AR",
            dueDate = "2026-09-01",
            scheduledAt = "2026-09-03",
            notes = "Planning metadata only."
        });
        response.EnsureSuccessStatusCode();

        var item = await response.Content.ReadFromJsonAsync<ContentItemResponse>();
        Assert.NotNull(item);
        return item;
    }

    private static object ValidContentItem()
    {
        return new
        {
            title = "Teaser 01",
            type = "InstagramReel",
            status = "Planned",
            platform = "Instagram",
            ownerName = "AR",
            dueDate = "2026-09-01",
            scheduledAt = "2026-09-03",
            notes = "Planning metadata only."
        };
    }
}
