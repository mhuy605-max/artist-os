using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class SongsApiTests
{
    [Fact]
    public async Task CreateSong_WithValidPayload_ReturnsCreatedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "  Night Protocol  ",
            status = "demo",
            id = 999,
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        Assert.True(song.Id > 0);
        Assert.Equal("Night Protocol", song.Title);
        Assert.Equal("Demo", song.Status);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), song.CreatedAt);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateSong_WithEmptyTitle_ReturnsBadRequest(string title)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status = "Demo"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSong_WithTitleOverMaxLength_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = new string('A', 201),
            status = "Demo"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSong_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Night Protocol",
            status = "Archived"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetSongs_ReturnsCreatedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var songs = await client.GetFromJsonAsync<List<SongResponse>>("/api/songs");

        Assert.NotNull(songs);
        Assert.Contains(songs, song => song.Id == created.Id);
    }

    [Fact]
    public async Task GetSong_WithExistingSong_ReturnsSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{created.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        Assert.Equal(created.Id, song.Id);
    }

    [Fact]
    public async Task GetSong_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/songs/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSong_WithValidPayload_ReturnsNoContentAndPreservesCreatedAt()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var response = await client.PutAsJsonAsync($"/api/songs/{created.Id}", new
        {
            title = "Updated Song",
            status = "mixing",
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<SongResponse>($"/api/songs/{created.Id}");
        Assert.NotNull(updated);
        Assert.Equal("Updated Song", updated.Title);
        Assert.Equal("Mixing", updated.Status);
        Assert.Equal(created.CreatedAt, updated.CreatedAt);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateSong_WithInvalidTitle_ReturnsBadRequest(string title)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var response = await client.PutAsJsonAsync($"/api/songs/{created.Id}", new
        {
            title,
            status = "Demo"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSong_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var response = await client.PutAsJsonAsync($"/api/songs/{created.Id}", new
        {
            title = "Updated Song",
            status = "Archived"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateSong_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/songs/999999", new
        {
            title = "Updated Song",
            status = "Demo"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteSong_WithExistingSong_ReturnsNoContentAndRemovesSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var created = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{created.Id}");
        var getDeleted = await client.GetAsync($"/api/songs/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeleted.StatusCode);
    }

    [Fact]
    public async Task DeleteSong_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.DeleteAsync("/api/songs/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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
}
