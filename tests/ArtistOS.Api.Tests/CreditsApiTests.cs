using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class CreditsApiTests
{
    [Fact]
    public async Task CreateCredit_WithValidPayload_ReturnsCreatedMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/credits", new
        {
            contributorName = "  Kira Mott  ",
            role = "producer",
            contact = "  kira@darkroom.system  ",
            status = "confirmed",
            splitPercentage = 25.5m,
            notes = "  Planned split only.  ",
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var credit = await response.Content.ReadFromJsonAsync<CreditResponse>();
        Assert.NotNull(credit);
        Assert.True(credit.Id > 0);
        Assert.Equal(song.Id, credit.SongId);
        Assert.Equal("Kira Mott", credit.ContributorName);
        Assert.Equal("Producer", credit.Role);
        Assert.Equal("kira@darkroom.system", credit.Contact);
        Assert.Equal("Confirmed", credit.Status);
        Assert.Equal(25.5m, credit.SplitPercentage);
        Assert.Equal("Planned split only.", credit.Notes);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), credit.CreatedAt);
        Assert.Equal(credit.CreatedAt, credit.UpdatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task CreateCredit_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/songs/999999/credits", ValidCredit());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Manager")]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateCredit_WithInvalidRole_ReturnsBadRequest(string role)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/credits", new
        {
            contributorName = "Kira Mott",
            role,
            status = "Pending"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCredit_WithInvalidStatus_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/credits", new
        {
            contributorName = "Kira Mott",
            role = "Producer",
            status = "Invited"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public async Task CreateCredit_WithInvalidSplitPercentage_ReturnsBadRequest(decimal splitPercentage)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/credits", new
        {
            contributorName = "Kira Mott",
            role = "Producer",
            status = "Pending",
            splitPercentage
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateCredit_WithEmptyContributorName_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PostAsJsonAsync($"/api/songs/{song.Id}/credits", new
        {
            contributorName = "   ",
            role = "Producer",
            status = "Pending"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetCredits_ReturnsCreatedMetadataForSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        var credits = await client.GetFromJsonAsync<List<CreditResponse>>(
            $"/api/songs/{song.Id}/credits");

        Assert.NotNull(credits);
        Assert.Contains(credits, found => found.Id == credit.Id && found.SongId == song.Id);
    }

    [Fact]
    public async Task GetCredit_WithExistingCredit_ReturnsMetadata()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        var response = await client.GetAsync($"/api/songs/{song.Id}/credits/{credit.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var found = await response.Content.ReadFromJsonAsync<CreditResponse>();
        Assert.NotNull(found);
        Assert.Equal(credit.Id, found.Id);
    }

    [Fact]
    public async Task GetCredit_WithMissingCredit_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.GetAsync($"/api/songs/{song.Id}/credits/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCredit_WithValidPayload_ReturnsNoContentAndUpdatesTimestamp()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        await Task.Delay(10);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/credits/{credit.Id}", new
        {
            contributorName = "Aden Ruiz",
            role = "songwriter",
            contact = "aden@darkroom.system",
            status = "confirmed",
            splitPercentage = 12.5m,
            notes = "Updated planned split metadata.",
            createdAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            updatedAt = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var updated = await client.GetFromJsonAsync<CreditResponse>(
            $"/api/songs/{song.Id}/credits/{credit.Id}");
        Assert.NotNull(updated);
        Assert.Equal("Aden Ruiz", updated.ContributorName);
        Assert.Equal("Songwriter", updated.Role);
        Assert.Equal("aden@darkroom.system", updated.Contact);
        Assert.Equal("Confirmed", updated.Status);
        Assert.Equal(12.5m, updated.SplitPercentage);
        Assert.Equal("Updated planned split metadata.", updated.Notes);
        Assert.Equal(credit.CreatedAt, updated.CreatedAt);
        Assert.True(updated.UpdatedAt > credit.UpdatedAt);
        Assert.NotEqual(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), updated.UpdatedAt);
    }

    [Fact]
    public async Task UpdateCredit_WithInvalidRole_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/credits/{credit.Id}", new
        {
            contributorName = "Kira Mott",
            role = "Manager",
            status = "Pending"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCredit_WithInvalidSplitPercentage_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/credits/{credit.Id}", new
        {
            contributorName = "Kira Mott",
            role = "Producer",
            status = "Pending",
            splitPercentage = 101
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCredit_WithMissingSong_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync("/api/songs/999999/credits/1", ValidCredit());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCredit_WithMissingCredit_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.PutAsJsonAsync($"/api/songs/{song.Id}/credits/999999", ValidCredit());

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCredit_WithExistingCredit_ReturnsNoContentAndDoesNotDeleteSong()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var credit = await CreateCredit(client, song.Id);

        var deleteCredit = await client.DeleteAsync($"/api/songs/{song.Id}/credits/{credit.Id}");
        var getDeletedCredit = await client.GetAsync($"/api/songs/{song.Id}/credits/{credit.Id}");
        var getSong = await client.GetAsync($"/api/songs/{song.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteCredit.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getDeletedCredit.StatusCode);
        Assert.Equal(HttpStatusCode.OK, getSong.StatusCode);
    }

    [Fact]
    public async Task DeleteCredit_WithMissingCredit_ReturnsNotFound()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);

        var response = await client.DeleteAsync($"/api/songs/{song.Id}/credits/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SongCanHaveManyCredits()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var producer = await CreateCredit(client, song.Id, "Kira Mott", "Producer");
        var songwriter = await CreateCredit(client, song.Id, "Aden Ruiz", "Songwriter");

        var credits = await client.GetFromJsonAsync<List<CreditResponse>>(
            $"/api/songs/{song.Id}/credits");

        Assert.NotNull(credits);
        Assert.Equal(2, credits.Count);
        Assert.All(credits, credit => Assert.Equal(song.Id, credit.SongId));
        Assert.Contains(credits, credit => credit.Id == producer.Id);
        Assert.Contains(credits, credit => credit.Id == songwriter.Id);
    }

    [Fact]
    public async Task SameContributorCanHaveMultipleRoles()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var song = await CreateSong(client);
        var artist = await CreateCredit(client, song.Id, "Vera Sol", "Artist");
        var songwriter = await CreateCredit(client, song.Id, "Vera Sol", "Songwriter");

        var credits = await client.GetFromJsonAsync<List<CreditResponse>>(
            $"/api/songs/{song.Id}/credits");

        Assert.NotNull(credits);
        Assert.Contains(credits, credit => credit.Id == artist.Id);
        Assert.Contains(credits, credit => credit.Id == songwriter.Id);
        Assert.Equal(2, credits.Count(credit => credit.ContributorName == "Vera Sol"));
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

    private static async Task<CreditResponse> CreateCredit(
        HttpClient client,
        int songId,
        string contributorName = "Kira Mott",
        string role = "Producer")
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/credits", new
        {
            contributorName,
            role,
            contact = "kira@darkroom.system",
            status = "Pending",
            splitPercentage = 25,
            notes = "Planned split metadata only."
        });
        response.EnsureSuccessStatusCode();

        var credit = await response.Content.ReadFromJsonAsync<CreditResponse>();
        Assert.NotNull(credit);
        return credit;
    }

    private static object ValidCredit()
    {
        return new
        {
            contributorName = "Kira Mott",
            role = "Producer",
            contact = "kira@darkroom.system",
            status = "Pending",
            splitPercentage = 25,
            notes = "Planned split metadata only."
        };
    }
}
