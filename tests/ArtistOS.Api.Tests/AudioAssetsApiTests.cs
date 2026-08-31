using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class AudioAssetsApiTests
{
    [Fact]
    public async Task CreateAudioAsset_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type = "mix",
            fileName = "  mix_v1.wav  ",
            version = 1,
            status = "review",
            durationSeconds = 198,
            fileSizeBytes = 64700000,
            uploadedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            isCurrent = true
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var asset = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(asset);
        Assert.True(asset.Id > 0);
        Assert.Equal(song.Id, asset.SongId);
        Assert.Equal("Mix", asset.Type);
        Assert.Equal("mix_v1.wav", asset.FileName);
        Assert.Equal(1, asset.Version);
        Assert.Equal("Review", asset.Status);
        Assert.Equal(198, asset.DurationSeconds);
        Assert.Equal(64700000, asset.FileSizeBytes);
        Assert.True(asset.IsCurrent);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), asset.UploadedAt);
    }

    [Fact]
    public async Task CreateAudioAsset_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs/999999/audio-assets", ValidAudioAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Stem")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateAudioAsset_WithInvalidType_ReturnsBadRequest(string type)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type,
            fileName = "mix_v1.wav",
            version = 1,
            status = "Draft",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAudioAsset_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Current",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAudioAsset_WithInvalidVersion_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 0,
            status = "Draft",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAudioAsset_WithNegativeDuration_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Draft",
            durationSeconds = -1,
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateAudioAsset_WithNegativeFileSize_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/audio-assets", new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Draft",
            fileSizeBytes = -1,
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetAudioAssets_ReturnsCreatedMetadataForSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var assets = await client.GetFromJsonAsync<List<AudioAssetResponse>>(
            $"/api/songs/{song.Id}/audio-assets");

        Assert.NotNull(assets);
        Assert.Contains(assets, item => item.Id == asset.Id && item.SongId == song.Id);
    }

    [Fact]
    public async Task GetAudioAsset_WithExistingAsset_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(found);
        Assert.Equal(asset.Id, found.Id);
    }

    [Fact]
    public async Task GetAudioAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/audio-assets/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAudioAsset_WithValidPayload_ReturnsNoContentAndPreservesUploadedAt()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}", new
        {
            type = "master",
            fileName = "master_v2.wav",
            version = 2,
            status = "final",
            durationSeconds = 201,
            fileSizeBytes = 66000000,
            uploadedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<AudioAssetResponse>(
            $"/api/songs/{song.Id}/audio-assets/{asset.Id}");
        Assert.NotNull(updated);
        Assert.Equal("Master", updated.Type);
        Assert.Equal("master_v2.wav", updated.FileName);
        Assert.Equal(2, updated.Version);
        Assert.Equal("Final", updated.Status);
        Assert.Equal(201, updated.DurationSeconds);
        Assert.Equal(66000000, updated.FileSizeBytes);
        Assert.False(updated.IsCurrent);
        Assert.Equal(asset.UploadedAt, updated.UploadedAt);
    }

    [Fact]
    public async Task UpdateAudioAsset_WithInvalidType_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}", new
        {
            type = "Stem",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Draft",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAudioAsset_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}", new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Current",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAudioAsset_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/songs/999999/audio-assets/1", ValidAudioAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateAudioAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/audio-assets/999999",
            ValidAudioAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAudioAsset_WithExistingAsset_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateAudioAsset(client, song.Id);

        var deleteAsset = await client.DeleteAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}");
        var getDeletedAsset = await client.GetAsync($"/api/songs/{song.Id}/audio-assets/{asset.Id}");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteAsset.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedAsset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteAudioAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/audio-assets/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SongCanHaveManyAudioAssets()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var mix = await CreateAudioAsset(client, song.Id, "Mix", "mix_v1.wav");
        var master = await CreateAudioAsset(client, song.Id, "Master", "master_v1.wav");

        var assets = await client.GetFromJsonAsync<List<AudioAssetResponse>>(
            $"/api/songs/{song.Id}/audio-assets");

        Assert.NotNull(assets);
        Assert.Equal(2, assets.Count);
        Assert.All(assets, asset => Assert.Equal(song.Id, asset.SongId));
        Assert.Contains(assets, asset => asset.Id == mix.Id);
        Assert.Contains(assets, asset => asset.Id == master.Id);
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

    private static async Task<AudioAssetResponse> CreateAudioAsset(
        HttpClient client,
        int songId,
        string type = "Mix",
        string fileName = "mix_v1.wav")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", new
        {
            type,
            fileName,
            version = 1,
            status = "Review",
            durationSeconds = 198,
            fileSizeBytes = 64700000,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();

        var asset = await response.Content.ReadFromJsonAsync<AudioAssetResponse>();
        Assert.NotNull(asset);
        return asset;
    }

    private static object ValidAudioAsset()
    {
        return new
        {
            type = "Mix",
            fileName = "mix_v1.wav",
            version = 1,
            status = "Review",
            durationSeconds = 198,
            fileSizeBytes = 64700000,
            isCurrent = true
        };
    }
}
