using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class CalendarApiTests
{
    [Fact]
    public async Task GetCalendar_WithNoDatedRecords_ReturnsEmptyList()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "No Dates");
        await CreateRelease(client, song.Id, releaseDate: null);
        await CreateContentItem(
            client,
            song.Id,
            title: "Undated teaser",
            dueDate: null,
            scheduledAt: null,
            publishedAt: null);

        var entries = await GetCalendar(client);

        Assert.Empty(entries);
    }

    [Fact]
    public async Task GetCalendar_IncludesReleaseDateAndSkipsUndatedRelease()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var datedSong = await CreateSong(client, "Night Drive");
        var undatedSong = await CreateSong(client, "No Release Date");
        var release = await CreateRelease(client, datedSong.Id, "2026-09-20");
        await CreateRelease(client, undatedSong.Id, releaseDate: null);

        var entries = await GetCalendar(client);

        var entry = Assert.Single(entries);
        Assert.Equal("Release", entry.SourceType);
        Assert.Equal(release.Id, entry.SourceId);
        Assert.Equal(datedSong.Id, entry.SongId);
        Assert.Equal("Night Drive", entry.SongTitle);
        Assert.Equal("ReleaseDate", entry.EventType);
        Assert.Equal("Night Drive release", entry.Title);
        Assert.Equal(new DateOnly(2026, 9, 20), entry.Date);
        Assert.Equal("Scheduled", entry.Status);
        Assert.Null(entry.Platform);
        Assert.False(entry.IsEditable);
        Assert.Equal($"/songs/{datedSong.Id}", entry.NavigationTarget);
    }

    [Fact]
    public async Task GetCalendar_IncludesContentDateEntryTypes()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Static Lover");
        var content = await CreateContentItem(
            client,
            song.Id,
            title: "Teaser 01",
            dueDate: "2026-09-10",
            scheduledAt: "2026-09-12",
            publishedAt: "2026-09-14");

        var entries = await GetCalendar(client);

        Assert.Equal(3, entries.Count);
        Assert.All(entries, entry =>
        {
            Assert.Equal("ContentItem", entry.SourceType);
            Assert.Equal(content.Id, entry.SourceId);
            Assert.Equal(song.Id, entry.SongId);
            Assert.Equal("Static Lover", entry.SongTitle);
            Assert.Equal("Teaser 01", entry.Title);
            Assert.Equal("Published", entry.Status);
            Assert.Equal("TikTok", entry.Platform);
            Assert.False(entry.IsEditable);
            Assert.Equal($"/songs/{song.Id}", entry.NavigationTarget);
        });
        Assert.Contains(entries, entry =>
            entry.EventType == "ContentDue" && entry.Date == new DateOnly(2026, 9, 10));
        Assert.Contains(entries, entry =>
            entry.EventType == "ContentScheduled" && entry.Date == new DateOnly(2026, 9, 12));
        Assert.Contains(entries, entry =>
            entry.EventType == "ContentPublished" && entry.Date == new DateOnly(2026, 9, 14));
    }

    [Fact]
    public async Task GetCalendar_AppliesInclusiveDateFilters()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Filter Song");
        await CreateRelease(client, song.Id, "2026-09-01");
        await CreateContentItem(
            client,
            song.Id,
            title: "Launch content",
            dueDate: "2026-09-15",
            scheduledAt: "2026-09-20",
            publishedAt: "2026-10-01");

        var entries = await GetCalendar(client, "2026-09-01", "2026-09-20");

        Assert.Equal(3, entries.Count);
        Assert.Contains(entries, entry => entry.Date == new DateOnly(2026, 9, 1));
        Assert.Contains(entries, entry => entry.Date == new DateOnly(2026, 9, 15));
        Assert.Contains(entries, entry => entry.Date == new DateOnly(2026, 9, 20));
        Assert.DoesNotContain(entries, entry => entry.Date == new DateOnly(2026, 10, 1));
    }

    [Fact]
    public async Task GetCalendar_WithOnlyFromOrTo_AppliesOneSidedFilter()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "One Sided Filter");
        await CreateContentItem(
            client,
            song.Id,
            dueDate: "2026-09-01",
            scheduledAt: "2026-09-15",
            publishedAt: "2026-10-01");

        var fromEntries = await GetCalendar(client, from: "2026-09-15");
        var toEntries = await GetCalendar(client, to: "2026-09-15");

        Assert.DoesNotContain(fromEntries, entry => entry.Date == new DateOnly(2026, 9, 1));
        Assert.Contains(fromEntries, entry => entry.Date == new DateOnly(2026, 9, 15));
        Assert.Contains(fromEntries, entry => entry.Date == new DateOnly(2026, 10, 1));
        Assert.Contains(toEntries, entry => entry.Date == new DateOnly(2026, 9, 1));
        Assert.Contains(toEntries, entry => entry.Date == new DateOnly(2026, 9, 15));
        Assert.DoesNotContain(toEntries, entry => entry.Date == new DateOnly(2026, 10, 1));
    }

    [Fact]
    public async Task GetCalendar_WithFromAfterTo_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/calendar?from=2026-09-30&to=2026-09-01");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetCalendar_ReturnsDeterministicChronologicalOrdering()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var beta = await CreateSong(client, "Beta Song");
        var alpha = await CreateSong(client, "Alpha Song");
        await CreateRelease(client, beta.Id, "2026-09-20");
        await CreateContentItem(client, alpha.Id, dueDate: "2026-09-20");
        await CreateContentItem(client, beta.Id, dueDate: "2026-09-10");

        var entries = await GetCalendar(client);

        Assert.Equal(
            [
                "2026-09-10|Beta Song|ContentDue",
                "2026-09-20|Alpha Song|ContentDue",
                "2026-09-20|Beta Song|ReleaseDate"
            ],
            entries.Select(entry => $"{entry.Date:yyyy-MM-dd}|{entry.SongTitle}|{entry.EventType}"));
    }

    [Fact]
    public async Task GetCalendar_ReflectsUpdatedReleaseDate()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Moving Release");
        await CreateRelease(client, song.Id, "2026-09-20");

        await client.PutAsJsonAsync($"/api/songs/{song.Id}/release", new
        {
            releaseDate = "2026-10-05",
            releaseType = "Single",
            status = "Scheduled",
            platforms = Array.Empty<string>()
        });

        var entries = await GetCalendar(client);

        var entry = Assert.Single(entries);
        Assert.Equal(new DateOnly(2026, 10, 5), entry.Date);
    }

    [Fact]
    public async Task GetCalendar_ReflectsUpdatedContentDates()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Moving Content");
        var content = await CreateContentItem(client, song.Id, scheduledAt: "2026-09-20");

        await client.PutAsJsonAsync($"/api/songs/{song.Id}/content-items/{content.Id}", new
        {
            title = content.Title,
            type = content.Type,
            status = content.Status,
            platform = content.Platform,
            dueDate = (string?)null,
            scheduledAt = "2026-10-02",
            publishedAt = (string?)null
        });

        var entries = await GetCalendar(client);

        var entry = Assert.Single(entries);
        Assert.Equal("ContentScheduled", entry.EventType);
        Assert.Equal(new DateOnly(2026, 10, 2), entry.Date);
    }

    [Fact]
    public async Task GetCalendar_ReflectsDeletesFromSourceDomains()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Delete Sources");
        await CreateRelease(client, song.Id, "2026-09-20");
        var content = await CreateContentItem(client, song.Id, dueDate: "2026-09-21");

        await client.DeleteAsync($"/api/songs/{song.Id}/release");
        var afterReleaseDelete = await GetCalendar(client);
        await client.DeleteAsync($"/api/songs/{song.Id}/content-items/{content.Id}");
        var afterContentDelete = await GetCalendar(client);

        Assert.DoesNotContain(afterReleaseDelete, entry => entry.SourceType == "Release");
        Assert.Contains(afterReleaseDelete, entry => entry.SourceType == "ContentItem");
        Assert.Empty(afterContentDelete);
    }

    [Fact]
    public async Task GetCalendar_ReflectsSongCascadeDelete()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client, "Cascade Calendar");
        await CreateRelease(client, song.Id, "2026-09-20");
        await CreateContentItem(client, song.Id, dueDate: "2026-09-21");

        await client.DeleteAsync($"/api/songs/{song.Id}");

        var entries = await GetCalendar(client);

        Assert.Empty(entries);
    }

    private static async Task<List<CalendarEntryResponse>> GetCalendar(
        HttpClient client,
        string? from = null,
        string? to = null)
    {
        var query = new List<string>();
        if (from is not null) query.Add($"from={from}");
        if (to is not null) query.Add($"to={to}");

        var path = query.Count > 0 ? $"/api/calendar?{string.Join("&", query)}" : "/api/calendar";
        var entries = await client.GetFromJsonAsync<List<CalendarEntryResponse>>(path);

        Assert.NotNull(entries);
        return entries;
    }

    private static async Task<SongResponse> CreateSong(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();

        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        return song;
    }

    private static async Task<ReleaseResponse> CreateRelease(
        HttpClient client,
        int songId,
        string? releaseDate)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/release", new
        {
            releaseDate,
            releaseType = "Single",
            distributor = "DISTROKID",
            status = "Scheduled",
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
        string title = "Teaser 01",
        string? dueDate = null,
        string? scheduledAt = null,
        string? publishedAt = null)
    {
        var response = await client.PostAsJsonAsync($"/api/songs/{songId}/content-items", new
        {
            title,
            type = "TikTok",
            status = publishedAt is null ? "Scheduled" : "Published",
            platform = "TikTok",
            ownerName = "AR",
            dueDate,
            scheduledAt,
            publishedAt,
            notes = "Calendar source metadata."
        });
        response.EnsureSuccessStatusCode();

        var contentItem = await response.Content.ReadFromJsonAsync<ContentItemResponse>();
        Assert.NotNull(contentItem);
        return contentItem;
    }
}
