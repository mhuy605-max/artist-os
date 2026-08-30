using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/songs/{songId:int}/release/checklist")]
public class ReleaseChecklistController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReleaseChecklistController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReleaseChecklistItemResponse>>> GetChecklist(
        int songId)
    {
        var release = await GetReleaseForSong(songId, asNoTracking: true);

        if (release is null)
        {
            return NotFound();
        }

        return await _context.ReleaseChecklistItems
            .AsNoTracking()
            .Where(item => item.ReleaseId == release.Id)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Id)
            .Select(item => new ReleaseChecklistItemResponse
            {
                Id = item.Id,
                ReleaseId = item.ReleaseId,
                Key = item.Key,
                Label = item.Label,
                IsCompleted = item.IsCompleted,
                CompletedAt = item.CompletedAt,
                Notes = item.Notes,
                SortOrder = item.SortOrder,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            })
            .ToListAsync();
    }

    [HttpGet("{checklistItemId:int}")]
    public async Task<ActionResult<ReleaseChecklistItemResponse>> GetChecklistItem(
        int songId,
        int checklistItemId)
    {
        var item = await _context.ReleaseChecklistItems
            .AsNoTracking()
            .Include(item => item.Release)
            .FirstOrDefaultAsync(item =>
                item.Id == checklistItemId && item.Release.SongId == songId);

        if (item is null)
        {
            return NotFound();
        }

        return ToResponse(item);
    }

    [HttpPut("{checklistItemId:int}")]
    public async Task<IActionResult> UpdateChecklistItem(
        int songId,
        int checklistItemId,
        UpdateReleaseChecklistItemRequest request)
    {
        var item = await _context.ReleaseChecklistItems
            .Include(item => item.Release)
            .FirstOrDefaultAsync(item =>
                item.Id == checklistItemId && item.Release.SongId == songId);

        if (item is null)
        {
            return NotFound();
        }

        var now = DateTime.UtcNow;
        var wasCompleted = item.IsCompleted;

        item.IsCompleted = request.IsCompleted;
        item.CompletedAt = request.IsCompleted
            ? (wasCompleted ? item.CompletedAt : now)
            : null;
        item.Notes = TrimToNull(request.Notes);
        item.UpdatedAt = now;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<Release?> GetReleaseForSong(int songId, bool asNoTracking)
    {
        var query = asNoTracking
            ? _context.Releases.AsNoTracking()
            : _context.Releases;

        return await query.FirstOrDefaultAsync(release => release.SongId == songId);
    }

    private static ReleaseChecklistItemResponse ToResponse(ReleaseChecklistItem item)
    {
        return new ReleaseChecklistItemResponse
        {
            Id = item.Id,
            ReleaseId = item.ReleaseId,
            Key = item.Key,
            Label = item.Label,
            IsCompleted = item.IsCompleted,
            CompletedAt = item.CompletedAt,
            Notes = item.Notes,
            SortOrder = item.SortOrder,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static string? TrimToNull(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue;
    }
}
