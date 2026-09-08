using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class ReleaseReadinessApiTests
{
    [Fact]
    public async Task GetReadiness_WithNoRelease_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/release/readiness");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetReadiness_WithoutAuthentication_ReturnsUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/songs/1/release/readiness");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetReadiness_WithCrossUserSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("b@example.com");
        var song = await CreateSong(userA);
        await CreateRelease(userA, song.Id);

        var response = await userB.GetAsync($"/api/songs/{song.Id}/release/readiness");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(null, null, true)]
    [InlineData("Draft", null, true)]
    [InlineData("Final", null, true)]
    [InlineData("Final", "linked", false)]
    public async Task Master_Readiness_DerivesFromCurrentLinkedFinalMaster(
        string? status,
        string? linkMode,
        bool expectedIncomplete)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        if (status is not null)
        {
            var asset = await CreateAudioAsset(client, song.Id, "Master", status);
            if (linkMode == "linked")
            {
                await LinkAudioAsset(factory, song, asset.Id);
            }
        }

        var readiness = await GetReadiness(client, song.Id);
        var master = Item(readiness, "Master");

        Assert.Equal(expectedIncomplete ? "Incomplete" : "Ready", master.State);
        Assert.Equal("Derived", master.Source);
        Assert.True(master.IsRequired);
        Assert.Equal(
            expectedIncomplete ? "Upload and finalize a current Master." : "Current Final Master linked.",
            master.Reason);
    }

    [Fact]
    public async Task Master_HistoricalFinalDoesNotCount_WhenCurrentDraftExists()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var v1 = await CreateAudioAsset(client, song.Id, "Master", "Final");
        await LinkAudioAsset(factory, song, v1.Id);

        var createVersion = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{v1.Id}/versions",
            null);
        createVersion.EnsureSuccessStatusCode();

        var readiness = await GetReadiness(client, song.Id);

        Assert.Equal("Incomplete", Item(readiness, "Master").State);
    }

    [Fact]
    public async Task Master_MultipleFamilies_AnyCurrentLinkedFinalMasterQualifies()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        await CreateAudioAsset(client, song.Id, "Master", "Draft");
        var finalMaster = await CreateAudioAsset(client, song.Id, "Master", "Final", "master-b.wav");
        await LinkAudioAsset(factory, song, finalMaster.Id);

        var readiness = await GetReadiness(client, song.Id);
        var master = Item(readiness, "Master");

        Assert.Equal("Ready", master.State);
        Assert.Equal(finalMaster.Id, master.RelatedResourceId);
        Assert.Equal("AudioAsset", master.RelatedResourceType);
    }

    [Fact]
    public async Task Master_DeleteCurrent_PromotesPreviousAndRecalculates()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var v1 = await CreateAudioAsset(client, song.Id, "Master", "Final");
        await LinkAudioAsset(factory, song, v1.Id);
        var versionResponse = await client.PostAsync(
            $"/api/songs/{song.Id}/audio-assets/{v1.Id}/versions",
            null);
        versionResponse.EnsureSuccessStatusCode();
        var v2 = (await versionResponse.Content.ReadFromJsonAsync<AudioAssetResponse>())!;

        var delete = await client.DeleteAsync($"/api/songs/{song.Id}/audio-assets/{v2.Id}");
        delete.EnsureSuccessStatusCode();
        var readiness = await GetReadiness(client, song.Id);

        Assert.Equal("Ready", Item(readiness, "Master").State);
    }

    [Fact]
    public async Task Cover_Readiness_RequiresCurrentLinkedFinalCover()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        var historicalCover = await CreateVisualAsset(client, song.Id, "CoverArt", "Final");
        await LinkVisualAsset(factory, song, historicalCover.Id);
        var versionResponse = await client.PostAsync(
            $"/api/songs/{song.Id}/visual-assets/{historicalCover.Id}/versions",
            null);
        versionResponse.EnsureSuccessStatusCode();

        Assert.Equal("Incomplete", Item(await GetReadiness(client, song.Id), "Cover").State);

        var independentCover = await CreateVisualAsset(client, song.Id, "CoverArt", "Final", "cover-b.png");
        await LinkVisualAsset(factory, song, independentCover.Id);

        var cover = Item(await GetReadiness(client, song.Id), "Cover");
        Assert.Equal("Ready", cover.State);
        Assert.Equal(independentCover.Id, cover.RelatedResourceId);
    }

    [Fact]
    public async Task Canvas_IsNotRequiredUnlessSpotifyIsSelected()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id, platforms: ["AppleMusic"]);

        var readiness = await GetReadiness(client, song.Id);
        var canvas = Item(readiness, "Canvas");

        Assert.Equal("NotRequired", canvas.State);
        Assert.False(canvas.IsRequired);
        Assert.Equal(5, readiness.RequiredCount);
    }

    [Fact]
    public async Task Canvas_WithSpotify_RequiresCurrentLinkedFinalCanvas()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id, platforms: ["Spotify", "AppleMusic"]);

        Assert.Equal("Incomplete", Item(await GetReadiness(client, song.Id), "Canvas").State);

        var canvasAsset = await CreateVisualAsset(client, song.Id, "SpotifyCanvas", "Final", "canvas.mp4");
        await LinkVisualAsset(factory, song, canvasAsset.Id);

        var canvas = Item(await GetReadiness(client, song.Id), "Canvas");
        Assert.Equal("Ready", canvas.State);
        Assert.Equal(canvasAsset.Id, canvas.RelatedResourceId);
    }

    [Fact]
    public async Task Credits_AreHybridAndIgnoreSplitTotals()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        Assert.Equal("Incomplete", Item(await GetReadiness(client, song.Id), "Credits").State);

        await CreateCredit(client, song.Id, "Pending", splitPercentage: null);
        var pending = Item(await GetReadiness(client, song.Id), "Credits");
        Assert.Equal("Incomplete", pending.State);
        Assert.Equal("Confirm 1 pending contributor.", pending.Reason);

        await UpdateChecklist(client, song.Id, "Credits", true);
        var manual = Item(await GetReadiness(client, song.Id), "Credits");
        Assert.Equal("Ready", manual.State);
        Assert.Equal("Manual", manual.Source);

        await UpdateCredit(client, song.Id, status: "Confirmed", splitPercentage: 20);
        var derived = Item(await GetReadiness(client, song.Id), "Credits");
        Assert.Equal("Ready", derived.State);
        Assert.Equal("Hybrid", derived.Source);
    }

    [Fact]
    public async Task ContentPlan_IsHybridAndRequiresPlannedOrLaterContent()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);
        await CreateContentItem(client, song.Id, "Idea");

        Assert.Equal("Incomplete", Item(await GetReadiness(client, song.Id), "ContentPlan").State);

        await UpdateChecklist(client, song.Id, "ContentPlan", true);
        Assert.Equal("Manual", Item(await GetReadiness(client, song.Id), "ContentPlan").Source);

        await CreateContentItem(client, song.Id, "Planned", "Launch teaser");
        var derived = Item(await GetReadiness(client, song.Id), "ContentPlan");
        Assert.Equal("Ready", derived.State);
        Assert.Equal("Hybrid", derived.Source);
    }

    [Fact]
    public async Task Metadata_IsHybridAndDoesNotRequireDistributorIsrcOrUpc()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var missing = await CreateSong(client, "Missing metadata");
        await CreateRelease(client, missing.Id, releaseDate: null, platforms: [], useDefaultReleaseDate: false);

        Assert.Equal("Incomplete", Item(await GetReadiness(client, missing.Id), "Metadata").State);

        await UpdateChecklist(client, missing.Id, "Metadata", true);
        Assert.Equal("Manual", Item(await GetReadiness(client, missing.Id), "Metadata").Source);

        var derivedSong = await CreateSong(client, "Derived metadata");
        await CreateRelease(client, derivedSong.Id, releaseDate: new DateOnly(2026, 10, 31), platforms: ["Spotify"]);
        var metadata = Item(await GetReadiness(client, derivedSong.Id), "Metadata");

        Assert.Equal("Ready", metadata.State);
        Assert.Equal("Hybrid", metadata.Source);
    }

    [Fact]
    public async Task MusicVideo_IsOptionalUnlessManuallyCompleted()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id, platforms: ["YouTube", "YouTubeMusic"]);

        var optional = Item(await GetReadiness(client, song.Id), "MusicVideo");
        Assert.Equal("NotRequired", optional.State);
        Assert.False(optional.IsRequired);

        await UpdateChecklist(client, song.Id, "MusicVideo", true);
        var manual = Item(await GetReadiness(client, song.Id), "MusicVideo");
        Assert.Equal("Ready", manual.State);
        Assert.True(manual.IsRequired);
        Assert.Equal("Manual", manual.Source);
    }

    [Fact]
    public async Task NotRequiredItems_AreExcludedFromReadinessPercentage()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id, platforms: ["AppleMusic"]);
        await UpdateChecklist(client, song.Id, "Metadata", true);

        var readiness = await GetReadiness(client, song.Id);

        Assert.Equal(5, readiness.RequiredCount);
        Assert.Equal(1, readiness.ReadyCount);
        Assert.Equal(20, readiness.Percentage);
        Assert.Equal(7, readiness.TotalCount);
    }

    [Fact]
    public async Task AutomaticChecklistMutation_CannotOverrideDerivedReadiness()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id);

        await UpdateChecklist(client, song.Id, "Master", true, notes: "I promise it is ready.");

        var checklist = await GetChecklist(client, song.Id);
        var masterChecklist = checklist.Single(item => item.Key == "Master");
        var masterReadiness = Item(await GetReadiness(client, song.Id), "Master");

        Assert.False(masterChecklist.IsCompleted);
        Assert.Null(masterChecklist.CompletedAt);
        Assert.Equal("I promise it is ready.", masterChecklist.Notes);
        Assert.Equal("Incomplete", masterReadiness.State);
    }

    [Fact]
    public async Task Dashboard_UsesCanonicalReadinessCounts()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateRelease(client, song.Id, platforms: ["AppleMusic"]);
        await UpdateChecklist(client, song.Id, "Metadata", true);

        var dashboard = await client.GetFromJsonAsync<DashboardResponse>("/api/dashboard");

        Assert.NotNull(dashboard);
        var releaseReadiness = Assert.Single(dashboard.ReleaseReadiness);
        Assert.Equal(1, releaseReadiness.CompletedItems);
        Assert.Equal(5, releaseReadiness.TotalItems);
        Assert.Equal(20, releaseReadiness.ReadinessPercentage);
    }

    private static ReleaseReadinessItemResponse Item(
        ReleaseReadinessResponse readiness,
        string key)
    {
        return readiness.Items.Single(item => item.Key == key);
    }

    private static async Task<ReleaseReadinessResponse> GetReadiness(HttpClient client, int songId)
    {
        var readiness = await client.GetFromJsonAsync<ReleaseReadinessResponse>(
            $"/api/songs/{songId}/release/readiness");

        Assert.NotNull(readiness);
        return readiness;
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

    private static async Task UpdateChecklist(
        HttpClient client,
        int songId,
        string key,
        bool isCompleted,
        string? notes = null)
    {
        var checklist = await GetChecklist(client, songId);
        var item = checklist.Single(item => item.Key == key);
        var response = await client.PutAsJsonAsync(
            $"/api/songs/{songId}/release/checklist/{item.Id}",
            new { isCompleted, notes });
        response.EnsureSuccessStatusCode();
    }

    private static async Task<SongResponse> CreateSong(HttpClient client, string title = "Night Protocol")
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status = "ReleasePreparation"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task<ReleaseResponse> CreateRelease(
        HttpClient client,
        int songId,
        DateOnly? releaseDate = null,
        string[]? platforms = null,
        bool useDefaultReleaseDate = true)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", new
        {
            releaseDate = releaseDate ?? (useDefaultReleaseDate ? new DateOnly(2026, 10, 31) : null),
            releaseType = "Single",
            distributor = (string?)null,
            isrc = (string?)null,
            upc = (string?)null,
            status = "Preparing",
            platforms = platforms ?? ["Spotify"]
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ReleaseResponse>())!;
    }

    private static async Task<AudioAssetResponse> CreateAudioAsset(
        HttpClient client,
        int songId,
        string type,
        string status,
        string fileName = "asset.wav")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/audio-assets", new
        {
            type,
            fileName,
            version = 1,
            status,
            durationSeconds = 180,
            fileSizeBytes = 1000,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AudioAssetResponse>())!;
    }

    private static async Task<VisualAssetResponse> CreateVisualAsset(
        HttpClient client,
        int songId,
        string type,
        string status,
        string fileName = "asset.png")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/visual-assets", new
        {
            type,
            fileName,
            version = 1,
            status,
            width = 1200,
            height = 1200,
            fileSizeBytes = 1000,
            isCurrent = true
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<VisualAssetResponse>())!;
    }

    private static async Task<CreditResponse> CreateCredit(
        HttpClient client,
        int songId,
        string status,
        decimal? splitPercentage)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/credits", new
        {
            contributorName = "Contributor",
            role = "Producer",
            contact = (string?)null,
            status,
            splitPercentage,
            notes = (string?)null
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<CreditResponse>())!;
    }

    private static async Task UpdateCredit(
        HttpClient client,
        int songId,
        string status,
        decimal? splitPercentage)
    {
        var credit = (await client.GetFromJsonAsync<List<CreditResponse>>(
            $"/api/songs/{songId}/credits"))!.Single();
        var response = await client.PutAsJsonAsync($"/api/songs/{songId}/credits/{credit.Id}", new
        {
            contributorName = credit.ContributorName,
            role = credit.Role,
            contact = credit.Contact,
            status,
            splitPercentage,
            notes = credit.Notes
        });
        response.EnsureSuccessStatusCode();
    }

    private static async Task<ContentItemResponse> CreateContentItem(
        HttpClient client,
        int songId,
        string status,
        string title = "Content Item")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/content-items", new
        {
            title,
            type = "Teaser",
            status,
            platform = "TikTok",
            ownerName = (string?)null,
            dueDate = (DateOnly?)null,
            scheduledAt = (DateOnly?)null,
            publishedAt = (DateOnly?)null,
            notes = (string?)null
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<ContentItemResponse>())!;
    }

    private static async Task LinkAudioAsset(ArtistOsApiFactory factory, SongResponse song, int audioAssetId)
    {
        await LinkAsset(
            factory,
            song,
            audioAssetId,
            "AudioAsset",
            "AudioFile",
            "audio/wav",
            async (dbContext, reference) =>
            {
                var asset = await dbContext.AudioAssets.SingleAsync(asset => asset.Id == audioAssetId);
                asset.ExternalFileReferenceId = reference.Id;
            });
    }

    private static async Task LinkVisualAsset(ArtistOsApiFactory factory, SongResponse song, int visualAssetId)
    {
        await LinkAsset(
            factory,
            song,
            visualAssetId,
            "VisualAsset",
            "VisualFile",
            "image/png",
            async (dbContext, reference) =>
            {
                var asset = await dbContext.VisualAssets.SingleAsync(asset => asset.Id == visualAssetId);
                asset.ExternalFileReferenceId = reference.Id;
            });
    }

    private static async Task LinkAsset(
        ArtistOsApiFactory factory,
        SongResponse song,
        int assetId,
        string linkedResourceType,
        string resourceType,
        string mimeType,
        Func<AppDbContext, ExternalFileReference, Task> attach)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var reference = new ExternalFileReference
        {
            OwnerUserId = song.OwnerUserId!.Value,
            SongId = song.Id,
            Provider = ExternalFileProviders.GoogleDrive,
            ExternalId = $"{linkedResourceType}-{assetId}-{Guid.NewGuid():N}",
            ResourceType = resourceType,
            IsFolder = false,
            DisplayName = $"{linkedResourceType}-{assetId}",
            MimeType = mimeType,
            SizeBytes = 1000,
            WebViewLink = "https://drive.google.com/file/d/test/view",
            LinkedResourceType = linkedResourceType,
            LinkedResourceId = assetId,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.ExternalFileReferences.Add(reference);
        await dbContext.SaveChangesAsync();
        await attach(dbContext, reference);
        await dbContext.SaveChangesAsync();
    }
}
