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
[Route("api/songs/{songId:int}/release")]
public class ReleasesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReleasesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ReleaseResponse>> GetRelease(int songId)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        var release = await _context.Releases
            .AsNoTracking()
            .FirstOrDefaultAsync(release => release.SongId == songId);

        if (release is null)
        {
            return NotFound();
        }

        return ToResponse(release);
    }

    [HttpPost]
    public async Task<ActionResult<ReleaseResponse>> CreateRelease(
        int songId,
        CreateReleaseRequest request)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        if (await _context.Releases.AnyAsync(release => release.SongId == songId))
        {
            return Conflict("A release plan already exists for this song.");
        }

        var now = DateTime.UtcNow;
        var release = new Release
        {
            SongId = songId,
            ReleaseDate = request.ReleaseDate,
            ReleaseType = NormalizeReleaseType(request.ReleaseType),
            Distributor = TrimToNull(request.Distributor),
            Isrc = TrimToNull(request.Isrc),
            Upc = TrimToNull(request.Upc),
            Status = NormalizeStatus(request.Status),
            Platforms = SerializePlatforms(request.Platforms),
            CreatedAt = now,
            UpdatedAt = now
        };

        foreach (var item in CreateDefaultChecklistItems(now))
        {
            release.ChecklistItems.Add(item);
        }

        _context.Releases.Add(release);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetRelease),
            new { songId },
            ToResponse(release));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateRelease(
        int songId,
        UpdateReleaseRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var release = await _context.Releases
            .FirstOrDefaultAsync(release =>
                release.SongId == songId && release.Song.OwnerUserId == currentUserId);

        if (release is null)
        {
            return NotFound();
        }

        release.ReleaseDate = request.ReleaseDate;
        release.ReleaseType = NormalizeReleaseType(request.ReleaseType);
        release.Distributor = TrimToNull(request.Distributor);
        release.Isrc = TrimToNull(request.Isrc);
        release.Upc = TrimToNull(request.Upc);
        release.Status = NormalizeStatus(request.Status);
        release.Platforms = SerializePlatforms(request.Platforms);
        release.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteRelease(int songId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var release = await _context.Releases
            .FirstOrDefaultAsync(release =>
                release.SongId == songId && release.Song.OwnerUserId == currentUserId);

        if (release is null)
        {
            return NotFound();
        }

        _context.Releases.Remove(release);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserOwnsSong(int songId, int? userId)
    {
        return userId is not null &&
            await _context.Songs.AnyAsync(song => song.Id == songId && song.OwnerUserId == userId);
    }

    private static ReleaseResponse ToResponse(Release release)
    {
        return new ReleaseResponse
        {
            Id = release.Id,
            SongId = release.SongId,
            ReleaseDate = release.ReleaseDate,
            ReleaseType = release.ReleaseType,
            Distributor = release.Distributor,
            Isrc = release.Isrc,
            Upc = release.Upc,
            Status = release.Status,
            Platforms = DeserializePlatforms(release.Platforms),
            CreatedAt = release.CreatedAt,
            UpdatedAt = release.UpdatedAt
        };
    }

    private static string NormalizeReleaseType(string releaseType)
    {
        var trimmedReleaseType = releaseType.Trim();

        return CreateReleaseRequest.AllowedReleaseTypes.First(allowedReleaseType =>
            string.Equals(allowedReleaseType, trimmedReleaseType, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateReleaseRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }

    private static string SerializePlatforms(IEnumerable<string> platforms)
    {
        var normalizedPlatforms = platforms
            .Select(platform => platform.Trim())
            .Where(platform => platform.Length > 0)
            .Select(platform => CreateReleaseRequest.AllowedPlatforms.First(allowedPlatform =>
                string.Equals(allowedPlatform, platform, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase);

        return string.Join(",", normalizedPlatforms);
    }

    private static List<string> DeserializePlatforms(string platforms)
    {
        return platforms
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
    }

    private static IEnumerable<ReleaseChecklistItem> CreateDefaultChecklistItems(DateTime now)
    {
        return ReleaseChecklistDefaults.Items.Select(item => new ReleaseChecklistItem
        {
            Key = item.Key,
            Label = item.Label,
            SortOrder = item.SortOrder,
            IsCompleted = false,
            CreatedAt = now,
            UpdatedAt = now
        });
    }

    private static string? TrimToNull(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue;
    }
}
