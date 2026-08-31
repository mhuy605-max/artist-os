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
[Route("api/songs/{songId:int}/analytics")]
public class AnalyticsSnapshotsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsSnapshotsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AnalyticsSnapshotResponse>>> GetAnalyticsSnapshots(
        int songId)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        return await _context.AnalyticsSnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.SongId == songId)
            .OrderBy(snapshot => snapshot.SnapshotDate)
            .ThenBy(snapshot => snapshot.Platform)
            .ThenBy(snapshot => snapshot.Id)
            .Select(snapshot => new AnalyticsSnapshotResponse
            {
                Id = snapshot.Id,
                SongId = snapshot.SongId,
                Platform = snapshot.Platform,
                SnapshotDate = snapshot.SnapshotDate,
                Views = snapshot.Views,
                Likes = snapshot.Likes,
                Comments = snapshot.Comments,
                WatchTimeMinutes = snapshot.WatchTimeMinutes,
                SubscribersGained = snapshot.SubscribersGained,
                CreatedAt = snapshot.CreatedAt
            })
            .ToListAsync();
    }

    [HttpGet("{analyticsSnapshotId:int}")]
    public async Task<ActionResult<AnalyticsSnapshotResponse>> GetAnalyticsSnapshot(
        int songId,
        int analyticsSnapshotId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var snapshot = await _context.AnalyticsSnapshots
            .AsNoTracking()
            .FirstOrDefaultAsync(snapshot =>
                snapshot.SongId == songId &&
                snapshot.Id == analyticsSnapshotId &&
                snapshot.Song.OwnerUserId == currentUserId);

        if (snapshot is null)
        {
            return NotFound();
        }

        return ToResponse(snapshot);
    }

    [HttpPost]
    public async Task<ActionResult<AnalyticsSnapshotResponse>> CreateAnalyticsSnapshot(
        int songId,
        CreateAnalyticsSnapshotRequest request)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        var platform = NormalizePlatform(request.Platform);
        var snapshotDate = request.SnapshotDate!.Value;

        if (await SnapshotExists(songId, platform, snapshotDate))
        {
            return Conflict("An analytics snapshot already exists for this song, platform, and date.");
        }

        var snapshot = new AnalyticsSnapshot
        {
            SongId = songId,
            Platform = platform,
            SnapshotDate = snapshotDate,
            Views = request.Views,
            Likes = request.Likes,
            Comments = request.Comments,
            WatchTimeMinutes = request.WatchTimeMinutes,
            SubscribersGained = request.SubscribersGained,
            CreatedAt = DateTime.UtcNow
        };

        _context.AnalyticsSnapshots.Add(snapshot);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAnalyticsSnapshot),
            new { songId, analyticsSnapshotId = snapshot.Id },
            ToResponse(snapshot));
    }

    [HttpPut("{analyticsSnapshotId:int}")]
    public async Task<IActionResult> UpdateAnalyticsSnapshot(
        int songId,
        int analyticsSnapshotId,
        UpdateAnalyticsSnapshotRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var snapshot = await _context.AnalyticsSnapshots
            .FirstOrDefaultAsync(snapshot =>
                snapshot.SongId == songId &&
                snapshot.Id == analyticsSnapshotId &&
                snapshot.Song.OwnerUserId == currentUserId);

        if (snapshot is null)
        {
            return NotFound();
        }

        var platform = NormalizePlatform(request.Platform);
        var snapshotDate = request.SnapshotDate!.Value;

        var duplicateExists = await _context.AnalyticsSnapshots.AnyAsync(existing =>
            existing.SongId == songId &&
            existing.Id != analyticsSnapshotId &&
            existing.Song.OwnerUserId == currentUserId &&
            existing.Platform == platform &&
            existing.SnapshotDate == snapshotDate);

        if (duplicateExists)
        {
            return Conflict("An analytics snapshot already exists for this song, platform, and date.");
        }

        snapshot.Platform = platform;
        snapshot.SnapshotDate = snapshotDate;
        snapshot.Views = request.Views;
        snapshot.Likes = request.Likes;
        snapshot.Comments = request.Comments;
        snapshot.WatchTimeMinutes = request.WatchTimeMinutes;
        snapshot.SubscribersGained = request.SubscribersGained;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{analyticsSnapshotId:int}")]
    public async Task<IActionResult> DeleteAnalyticsSnapshot(
        int songId,
        int analyticsSnapshotId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var snapshot = await _context.AnalyticsSnapshots
            .FirstOrDefaultAsync(snapshot =>
                snapshot.SongId == songId &&
                snapshot.Id == analyticsSnapshotId &&
                snapshot.Song.OwnerUserId == currentUserId);

        if (snapshot is null)
        {
            return NotFound();
        }

        _context.AnalyticsSnapshots.Remove(snapshot);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserOwnsSong(int songId, int? userId)
    {
        return userId is not null &&
            await _context.Songs.AnyAsync(song => song.Id == songId && song.OwnerUserId == userId);
    }

    private async Task<bool> SnapshotExists(int songId, string platform, DateOnly snapshotDate)
    {
        return await _context.AnalyticsSnapshots.AnyAsync(snapshot =>
            snapshot.SongId == songId &&
            snapshot.Platform == platform &&
            snapshot.SnapshotDate == snapshotDate);
    }

    private static AnalyticsSnapshotResponse ToResponse(AnalyticsSnapshot snapshot)
    {
        return new AnalyticsSnapshotResponse
        {
            Id = snapshot.Id,
            SongId = snapshot.SongId,
            Platform = snapshot.Platform,
            SnapshotDate = snapshot.SnapshotDate,
            Views = snapshot.Views,
            Likes = snapshot.Likes,
            Comments = snapshot.Comments,
            WatchTimeMinutes = snapshot.WatchTimeMinutes,
            SubscribersGained = snapshot.SubscribersGained,
            CreatedAt = snapshot.CreatedAt
        };
    }

    private static string NormalizePlatform(string platform)
    {
        var trimmedPlatform = platform.Trim();

        return CreateAnalyticsSnapshotRequest.AllowedPlatforms.First(allowedPlatform =>
            string.Equals(allowedPlatform, trimmedPlatform, StringComparison.OrdinalIgnoreCase));
    }
}
