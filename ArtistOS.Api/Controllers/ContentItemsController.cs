using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/songs/{songId:int}/content-items")]
public class ContentItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ContentItemsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ContentItemResponse>>> GetContentItems(int songId)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        return await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem => contentItem.SongId == songId)
            .OrderBy(contentItem => contentItem.ScheduledAt == null)
            .ThenBy(contentItem => contentItem.ScheduledAt)
            .ThenBy(contentItem => contentItem.DueDate)
            .ThenBy(contentItem => contentItem.Id)
            .Select(contentItem => new ContentItemResponse
            {
                Id = contentItem.Id,
                SongId = contentItem.SongId,
                Title = contentItem.Title,
                Type = contentItem.Type,
                Status = contentItem.Status,
                Platform = contentItem.Platform,
                OwnerName = contentItem.OwnerName,
                DueDate = contentItem.DueDate,
                ScheduledAt = contentItem.ScheduledAt,
                PublishedAt = contentItem.PublishedAt,
                Notes = contentItem.Notes,
                CreatedAt = contentItem.CreatedAt,
                UpdatedAt = contentItem.UpdatedAt
            })
            .ToListAsync();
    }

    [HttpGet("{contentItemId:int}")]
    public async Task<ActionResult<ContentItemResponse>> GetContentItem(
        int songId,
        int contentItemId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var contentItem = await _context.ContentItems
            .AsNoTracking()
            .FirstOrDefaultAsync(contentItem =>
                contentItem.SongId == songId &&
                contentItem.Id == contentItemId &&
                contentItem.Song.OwnerUserId == currentUserId);

        if (contentItem is null)
        {
            return NotFound();
        }

        return ToResponse(contentItem);
    }

    [HttpPost]
    public async Task<ActionResult<ContentItemResponse>> CreateContentItem(
        int songId,
        CreateContentItemRequest request)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        var now = DateTime.UtcNow;
        var contentItem = new ContentItem
        {
            SongId = songId,
            Title = request.Title.Trim(),
            Type = NormalizeType(request.Type),
            Status = NormalizeStatus(request.Status),
            Platform = NormalizePlatform(request.Platform),
            OwnerName = TrimToNull(request.OwnerName),
            DueDate = request.DueDate,
            ScheduledAt = request.ScheduledAt,
            PublishedAt = request.PublishedAt,
            Notes = TrimToNull(request.Notes),
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.ContentItems.Add(contentItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetContentItem),
            new { songId, contentItemId = contentItem.Id },
            ToResponse(contentItem));
    }

    [HttpPut("{contentItemId:int}")]
    public async Task<IActionResult> UpdateContentItem(
        int songId,
        int contentItemId,
        UpdateContentItemRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var contentItem = await _context.ContentItems
            .FirstOrDefaultAsync(contentItem =>
                contentItem.SongId == songId &&
                contentItem.Id == contentItemId &&
                contentItem.Song.OwnerUserId == currentUserId);

        if (contentItem is null)
        {
            return NotFound();
        }

        contentItem.Title = request.Title.Trim();
        contentItem.Type = NormalizeType(request.Type);
        contentItem.Status = NormalizeStatus(request.Status);
        contentItem.Platform = NormalizePlatform(request.Platform);
        contentItem.OwnerName = TrimToNull(request.OwnerName);
        contentItem.DueDate = request.DueDate;
        contentItem.ScheduledAt = request.ScheduledAt;
        contentItem.PublishedAt = request.PublishedAt;
        contentItem.Notes = TrimToNull(request.Notes);
        contentItem.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{contentItemId:int}")]
    public async Task<IActionResult> DeleteContentItem(int songId, int contentItemId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var contentItem = await _context.ContentItems
            .FirstOrDefaultAsync(contentItem =>
                contentItem.SongId == songId &&
                contentItem.Id == contentItemId &&
                contentItem.Song.OwnerUserId == currentUserId);

        if (contentItem is null)
        {
            return NotFound();
        }

        _context.ContentItems.Remove(contentItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserOwnsSong(int songId, int? userId)
    {
        return userId is not null &&
            await _context.Songs.AnyAsync(song => song.Id == songId && song.OwnerUserId == userId);
    }

    private static ContentItemResponse ToResponse(ContentItem contentItem)
    {
        return new ContentItemResponse
        {
            Id = contentItem.Id,
            SongId = contentItem.SongId,
            Title = contentItem.Title,
            Type = contentItem.Type,
            Status = contentItem.Status,
            Platform = contentItem.Platform,
            OwnerName = contentItem.OwnerName,
            DueDate = contentItem.DueDate,
            ScheduledAt = contentItem.ScheduledAt,
            PublishedAt = contentItem.PublishedAt,
            Notes = contentItem.Notes,
            CreatedAt = contentItem.CreatedAt,
            UpdatedAt = contentItem.UpdatedAt
        };
    }

    private static string NormalizeType(string type)
    {
        var trimmedType = type.Trim();

        return CreateContentItemRequest.AllowedTypes.First(allowedType =>
            string.Equals(allowedType, trimmedType, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateContentItemRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }

    private static string? NormalizePlatform(string? platform)
    {
        var trimmedPlatform = platform?.Trim();
        if (string.IsNullOrEmpty(trimmedPlatform))
        {
            return null;
        }

        return CreateContentItemRequest.AllowedPlatforms.First(allowedPlatform =>
            string.Equals(allowedPlatform, trimmedPlatform, StringComparison.OrdinalIgnoreCase));
    }

    private static string? TrimToNull(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue;
    }
}
