using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class ReleasesApiTests
{
    [Fact]
    public async Task CreateRelease_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseDate = "2026-10-31",
            releaseType = "single",
            distributor = "  DISTROKID  ",
            isrc = "  QZK4S260001  ",
            upc = "  191227000000  ",
            status = "scheduled",
            platforms = new[] { "spotify", "AppleMusic", "YouTubeMusic" },
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var release = await response.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(release);
        Assert.True(release.Id > 0);
        Assert.Equal(song.Id, release.SongId);
        Assert.Equal(new DateOnly(2026, 10, 31), release.ReleaseDate);
        Assert.Equal("Single", release.ReleaseType);
        Assert.Equal("DISTROKID", release.Distributor);
        Assert.Equal("QZK4S260001", release.Isrc);
        Assert.Equal("191227000000", release.Upc);
        Assert.Equal("Scheduled", release.Status);
        Assert.Equal(["Spotify", "AppleMusic", "YouTubeMusic"], release.Platforms);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), release.CreatedAt);
        Assert.Equal(release.CreatedAt, release.UpdatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task CreateRelease_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs/999999/release", ValidRelease());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateRelease_WithDuplicateForSong_ReturnsConflict()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", ValidRelease());

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task CreateRelease_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseType = "Single",
            status = "Live",
            platforms = Array.Empty<string>()
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRelease_WithInvalidReleaseType_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseType = "Album",
            status = "Planning",
            platforms = Array.Empty<string>()
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateRelease_WithInvalidPlatform_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseType = "Single",
            status = "Planning",
            platforms = new[] { "Napster" }
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetRelease_WithExistingRelease_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var release = await CreateRelease(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/release");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(found);
        Assert.Equal(release.Id, found.Id);
    }

    [Fact]
    public async Task GetRelease_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/songs/999999/release");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetRelease_WithSongWithoutRelease_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/release");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateRelease_WithValidPayload_ReturnsNoContentAndUpdatesTimestamp()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var release = await CreateRelease(client, song.Id);

        await Task.Delay(10);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseDate = "2026-12-01",
            releaseType = "single",
            distributor = "TuneCore",
            isrc = "QZK4S260099",
            upc = "191227000099",
            status = "released",
            platforms = new[] { "TikTok", "Other" },
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<ReleaseResponse>($"/api/songs/{song.Id}/release");
        Assert.NotNull(updated);
        Assert.Equal(release.Id, updated.Id);
        Assert.Equal("Single", updated.ReleaseType);
        Assert.Equal("TuneCore", updated.Distributor);
        Assert.Equal("QZK4S260099", updated.Isrc);
        Assert.Equal("191227000099", updated.Upc);
        Assert.Equal("Released", updated.Status);
        Assert.Equal(["TikTok", "Other"], updated.Platforms);
        Assert.Equal(release.CreatedAt, updated.CreatedAt);
        Assert.True(updated.UpdatedAt > release.UpdatedAt);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), updated.UpdatedAt);
    }

    [Fact]
    public async Task UpdateRelease_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseType = "Single",
            status = "Live",
            platforms = Array.Empty<string>()
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateRelease_WithMissingRelease_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/release", ValidRelease());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateRelease_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/songs/999999/release", ValidRelease());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteRelease_WithExistingRelease_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var deleteRelease = await client.DeleteAsync($"/api/songs/{song.Id}/release");
        var getDeletedRelease = await client.GetAsync($"/api/songs/{song.Id}/release");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteRelease.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedRelease.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteRelease_WithMissingRelease_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/release");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task OneSongCannotHaveMultipleReleaseRows()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        var duplicate = await client.PostAsJsonAsync($"/api/songs/{song.Id}/release", ValidRelease());
        var currentRelease = await client.GetAsync($"/api/songs/{song.Id}/release");

        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Equal(HttpStatusCode.OK, currentRelease.StatusCode);
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
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", ValidRelease());
        response.EnsureSuccessStatusCode();

        var release = await response.Content.ReadFromJsonAsync<ReleaseResponse>();
        Assert.NotNull(release);
        return release;
    }

    private static object ValidRelease()
    {
        return new
        {
            releaseDate = "2026-10-31",
            releaseType = "Single",
            distributor = "DISTROKID",
            isrc = "QZK4S260001",
            upc = "191227000000",
            status = "Preparing",
            platforms = new[] { "Spotify", "AppleMusic", "YouTubeMusic" }
        };
    }
}
