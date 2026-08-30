using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/calendar")]
public class CalendarController : ControllerBase
{
    private readonly AppDbContext _context;

    public CalendarController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CalendarEntryResponse>>> GetCalendar(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        if (from.HasValue && to.HasValue && from > to)
        {
            return BadRequest("The from date must be on or before the to date.");
        }

        var releases = await _context.Releases
            .AsNoTracking()
            .Include(release => release.Song)
            .Where(release => release.ReleaseDate != null)
            .Where(release =>
                (!from.HasValue || release.ReleaseDate >= from) &&
                (!to.HasValue || release.ReleaseDate <= to))
            .ToListAsync();

        var contentItems = await _context.ContentItems
            .AsNoTracking()
            .Include(contentItem => contentItem.Song)
            .Where(contentItem =>
                (contentItem.DueDate != null &&
                    (!from.HasValue || contentItem.DueDate >= from) &&
                    (!to.HasValue || contentItem.DueDate <= to)) ||
                (contentItem.ScheduledAt != null &&
                    (!from.HasValue || contentItem.ScheduledAt >= from) &&
                    (!to.HasValue || contentItem.ScheduledAt <= to)) ||
                (contentItem.PublishedAt != null &&
                    (!from.HasValue || contentItem.PublishedAt >= from) &&
                    (!to.HasValue || contentItem.PublishedAt <= to)))
            .ToListAsync();

        var entries = releases
            .Select(ToReleaseEntry)
            .Concat(contentItems.SelectMany(contentItem => ToContentEntries(contentItem, from, to)))
            .OrderBy(entry => entry.Date)
            .ThenBy(entry => entry.SongTitle)
            .ThenBy(entry => entry.EventType)
            .ThenBy(entry => entry.SourceId)
            .ToList();

        return entries;
    }

    private static CalendarEntryResponse ToReleaseEntry(Release release)
    {
        return new CalendarEntryResponse
        {
            SourceType = "Release",
            SourceId = release.Id,
            SongId = release.SongId,
            SongTitle = release.Song.Title,
            EventType = "ReleaseDate",
            Title = $"{release.Song.Title} release",
            Date = release.ReleaseDate!.Value,
            Status = release.Status,
            Platform = null,
            IsEditable = false,
            NavigationTarget = $"/songs/{release.SongId}"
        };
    }

    private static IEnumerable<CalendarEntryResponse> ToContentEntries(
        ContentItem contentItem,
        DateOnly? from,
        DateOnly? to)
    {
        if (IsInRange(contentItem.DueDate, from, to))
        {
            yield return ToContentEntry(contentItem, "ContentDue", contentItem.DueDate!.Value);
        }

        if (IsInRange(contentItem.ScheduledAt, from, to))
        {
            yield return ToContentEntry(
                contentItem,
                "ContentScheduled",
                contentItem.ScheduledAt!.Value);
        }

        if (IsInRange(contentItem.PublishedAt, from, to))
        {
            yield return ToContentEntry(
                contentItem,
                "ContentPublished",
                contentItem.PublishedAt!.Value);
        }
    }

    private static bool IsInRange(DateOnly? date, DateOnly? from, DateOnly? to)
    {
        return date.HasValue &&
            (!from.HasValue || date >= from) &&
            (!to.HasValue || date <= to);
    }

    private static CalendarEntryResponse ToContentEntry(
        ContentItem contentItem,
        string eventType,
        DateOnly date)
    {
        return new CalendarEntryResponse
        {
            SourceType = "ContentItem",
            SourceId = contentItem.Id,
            SongId = contentItem.SongId,
            SongTitle = contentItem.Song.Title,
            EventType = eventType,
            Title = contentItem.Title,
            Date = date,
            Status = contentItem.Status,
            Platform = contentItem.Platform,
            IsEditable = false,
            NavigationTarget = $"/songs/{contentItem.SongId}"
        };
    }
}
