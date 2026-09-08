using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class VisualAssetsApiTests
{
    [Fact]
    public async Task CreateVisualAsset_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type = "coverart",
            fileName = "  cover_v3.png  ",
            version = 3,
            status = "final",
            width = 3000,
            height = 3000,
            fileSizeBytes = 8420000,
            uploadedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var asset = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(asset);
        Assert.True(asset.Id > 0);
        Assert.Equal(song.Id, asset.SongId);
        Assert.NotEqual(Guid.Empty, asset.AssetFamilyId);
        Assert.Equal("CoverArt", asset.Type);
        Assert.Equal("cover_v3.png", asset.FileName);
        Assert.Equal(1, asset.Version);
        Assert.Equal("Final", asset.Status);
        Assert.Equal(3000, asset.Width);
        Assert.Equal(3000, asset.Height);
        Assert.Equal(8420000, asset.FileSizeBytes);
        Assert.True(asset.IsCurrent);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), asset.UploadedAt);
    }

    [Fact]
    public async Task CreateVisualAsset_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/songs/999999/visual-assets", ValidVisualAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Poster")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateVisualAsset_WithInvalidType_ReturnsBadRequest(string type)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type,
            fileName = "cover_v1.png",
            version = 1,
            status = "Draft",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateVisualAsset_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "cover_v1.png",
            version = 1,
            status = "Current",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateVisualAsset_WithInvalidVersion_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "cover_v1.png",
            version = 0,
            status = "Draft",
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(0, 3000)]
    [InlineData(3000, 0)]
    [InlineData(-1, 3000)]
    [InlineData(3000, -1)]
    public async Task CreateVisualAsset_WithInvalidDimensions_ReturnsBadRequest(int width, int height)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "cover_v1.png",
            version = 1,
            status = "Draft",
            width,
            height,
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateVisualAsset_WithNegativeFileSize_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/visual-assets", new
        {
            type = "CoverArt",
            fileName = "cover_v1.png",
            version = 1,
            status = "Draft",
            fileSizeBytes = -1,
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetVisualAssets_ReturnsCreatedMetadataForSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id);

        var assets = await client.GetFromJsonAsync<List<VisualAssetResponse>>(
            $"/api/songs/{song.Id}/visual-assets");

        Assert.NotNull(assets);
        Assert.Contains(assets, item => item.Id == asset.Id && item.SongId == song.Id);
    }

    [Fact]
    public async Task GetVisualAsset_WithExistingAsset_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(found);
        Assert.Equal(asset.Id, found.Id);
    }

    [Fact]
    public async Task GetVisualAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/visual-assets/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateVisualAsset_WithValidPayload_ReturnsNoContentAndPreservesUploadedAt()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}", new
        {
            type = "musicvideo",
            fileName = "final_cut.mov",
            version = 7,
            status = "approved",
            width = 3840,
            height = 2160,
            fileSizeBytes = 980000000,
            uploadedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<VisualAssetResponse>(
            $"/api/songs/{song.Id}/visual-assets/{asset.Id}");
        Assert.NotNull(updated);
        Assert.Equal("MusicVideo", updated.Type);
        Assert.Equal("final_cut.mov", updated.FileName);
        Assert.Equal(asset.Version, updated.Version);
        Assert.Equal("Approved", updated.Status);
        Assert.Equal(3840, updated.Width);
        Assert.Equal(2160, updated.Height);
        Assert.Equal(980000000, updated.FileSizeBytes);
        Assert.Equal(asset.IsCurrent, updated.IsCurrent);
        Assert.Equal(asset.UploadedAt, updated.UploadedAt);
    }

    [Fact]
    public async Task UpdateVisualAsset_WithInvalidInput_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}", new
        {
            type = "Poster",
            fileName = "",
            version = 0,
            status = "Current",
            width = 0,
            height = -1,
            fileSizeBytes = -1,
            isCurrent = false
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateVisualAsset_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/api/songs/999999/visual-assets/1", ValidVisualAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateVisualAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PutAsJsonAsync(
            $"/api/songs/{song.Id}/visual-assets/999999",
            ValidVisualAsset());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteVisualAsset_WithExistingAsset_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id);

        var deleteAsset = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}");
        var getDeletedAsset = await client.GetAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteAsset.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedAsset.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteVisualAsset_WithMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SongCanHaveManyVisualAssets()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var cover = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");
        var video = await CreateVisualAsset(client, song.Id, "MusicVideo", "final_cut.mov");

        var assets = await client.GetFromJsonAsync<List<VisualAssetResponse>>(
            $"/api/songs/{song.Id}/visual-assets");

        Assert.NotNull(assets);
        Assert.Equal(2, assets.Count);
        Assert.All(assets, asset => Assert.Equal(song.Id, asset.SongId));
        Assert.Contains(assets, asset => asset.Id == cover.Id);
        Assert.Contains(assets, asset => asset.Id == video.Id);
    }

    [Fact]
    public async Task CreateVisualAssetVersion_CreatesDraftCurrentMetadataOnlyVersionInSameFamily()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var v1 = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v1.Id}/versions",
            null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var v2 = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(v2);
        Assert.NotEqual(v1.Id, v2.Id);
        Assert.Equal(v1.AssetFamilyId, v2.AssetFamilyId);
        Assert.Equal("CoverArt", v2.Type);
        Assert.Equal("", v2.FileName);
        Assert.Equal(2, v2.Version);
        Assert.Equal("Draft", v2.Status);
        Assert.True(v2.IsCurrent);
        Assert.Null(v2.Width);
        Assert.Null(v2.Height);
        Assert.Null(v2.FileSizeBytes);
        Assert.Null(v2.LinkedFile);

        var assets = await client.GetFromJsonAsync<List<VisualAssetResponse>>(
            $"/api/songs/{song.Id}/visual-assets");
        Assert.NotNull(assets);
        Assert.False(assets.Single(asset => asset.Id == v1.Id).IsCurrent);
    }

    [Fact]
    public async Task AddVisualAssetsWithSameType_CreateIndependentFamilies()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var releasePoster = await CreateVisualAsset(client, song.Id, "PromoAsset", "release-poster.png");
        var tourPoster = await CreateVisualAsset(client, song.Id, "PromoAsset", "tour-poster.png");

        Assert.NotEqual(releasePoster.AssetFamilyId, tourPoster.AssetFamilyId);
        Assert.Equal(1, releasePoster.Version);
        Assert.Equal(1, tourPoster.Version);
        Assert.True(releasePoster.IsCurrent);
        Assert.True(tourPoster.IsCurrent);
    }

    [Fact]
    public async Task CreateVisualAssetVersion_UsesMaxHistoricalVersionAndDoesNotReuseDeletedVersion()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var v1 = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");
        var v2 = (await (await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v1.Id}/versions",
            null)).Content.ReadFromJsonAsync<VisualAssetResponse>())!;
        var v3 = (await (await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v2.Id}/versions",
            null)).Content.ReadFromJsonAsync<VisualAssetResponse>())!;

        var deleteV2 = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/{v2.Id}");
        var createAfterDelete = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v3.Id}/versions",
            null);

        deleteV2.EnsureSuccessStatusCode();
        var v4 = await createAfterDelete.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(v4);
        Assert.Equal(4, v4.Version);
    }

    [Fact]
    public async Task CreateVisualAssetVersion_ForMissingAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/999999/versions",
            null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateVisualAssetVersion_ForCrossUserAsset_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("b@example.com");
        var song = await CreateSong(userA);
        var asset = await CreateVisualAsset(userA, song.Id);

        var response = await userB.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{asset.Id}/versions",
            null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCurrentVisualAsset_PromotesHighestRemainingVersion()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var v1 = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");
        var v2 = (await (await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v1.Id}/versions",
            null)).Content.ReadFromJsonAsync<VisualAssetResponse>())!;
        var v3 = (await (await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v2.Id}/versions",
            null)).Content.ReadFromJsonAsync<VisualAssetResponse>())!;

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/{v3.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var assets = await client.GetFromJsonAsync<List<VisualAssetResponse>>(
            $"/api/songs/{song.Id}/visual-assets");
        Assert.NotNull(assets);
        Assert.True(assets.Single(asset => asset.Id == v2.Id).IsCurrent);
        Assert.False(assets.Single(asset => asset.Id == v1.Id).IsCurrent);
    }

    [Fact]
    public async Task DeleteHistoricalVisualAsset_DoesNotAlterCurrentVersion()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var v1 = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");
        var v2 = (await (await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{v1.Id}/versions",
            null)).Content.ReadFromJsonAsync<VisualAssetResponse>())!;

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/{v1.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var current = await client.GetFromJsonAsync<VisualAssetResponse>(
            $"/api/songs/{song.Id}/visual-assets/{v2.Id}");
        Assert.NotNull(current);
        Assert.True(current.IsCurrent);
    }

    [Fact]
    public async Task DeleteOnlyVisualAssetVersion_RemovesFamilyRows()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        var asset = await CreateVisualAsset(client, song.Id, "CoverArt", "cover_v1.png");

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/visual-assets/{asset.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var assets = await client.GetFromJsonAsync<List<VisualAssetResponse>>(
            $"/api/songs/{song.Id}/visual-assets");
        Assert.NotNull(assets);
        Assert.Empty(assets);
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

    private static async Task<VisualAssetResponse> CreateVisualAsset(
        HttpClient client,
        int songId,
        string type = "CoverArt",
        string fileName = "cover_v1.png")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type,
            fileName,
            version = 1,
            status = "Review",
            width = 3000,
            height = 3000,
            fileSizeBytes = 8420000,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();

        var asset = await response.Content.ReadFromJsonAsync<VisualAssetResponse>();
        Assert.NotNull(asset);
        return asset;
    }

    private static object ValidVisualAsset()
    {
        return new
        {
            type = "CoverArt",
            fileName = "cover_v1.png",
            version = 1,
            status = "Review",
            width = 3000,
            height = 3000,
            fileSizeBytes = 8420000,
            isCurrent = true
        };
    }
}
