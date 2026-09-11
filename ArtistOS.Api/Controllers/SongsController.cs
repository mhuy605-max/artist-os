using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicyNames.NormalApi)]
[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SongAccessService _songAccessService;

    public SongsController(AppDbContext context, SongAccessService songAccessService)
    {
        _context = context;
        _songAccessService = songAccessService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SongResponse>>> GetSongs()
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var songRows = await _songAccessService
            .WhereAccessibleTo(_context.Songs.AsNoTracking(), currentUserId.Value)
            .OrderBy(song => song.Id)
            .Select(song => new SongResponse
            {
                Id = song.Id,
                Title = song.Title,
                Status = song.Status,
                CreatedAt = song.CreatedAt,
                OwnerUserId = song.OwnerUserId,
                CurrentUserRole = string.Empty
            })
            .ToListAsync();

        var songIds = songRows.Select(song => song.Id).ToList();
        var memberRolesBySongId = await _context.SongMembers
            .AsNoTracking()
            .Where(member =>
                member.UserId == currentUserId.Value &&
                songIds.Contains(member.SongId))
            .Select(member => new
            {
                member.SongId,
                member.Role
            })
            .ToDictionaryAsync(member => member.SongId, member => member.Role);

        foreach (var song in songRows)
        {
            var accessLevel = song.OwnerUserId == currentUserId.Value
                ? SongAccessLevel.OWNER
                : memberRolesBySongId.GetValueOrDefault(song.Id) switch
                {
                    SongMemberRole.EDITOR => SongAccessLevel.EDITOR,
                    SongMemberRole.VIEWER => SongAccessLevel.VIEWER,
                    _ => SongAccessLevel.NO_ACCESS
                };
            ApplyAccessMetadata(song, accessLevel);
        }

        return songRows;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SongResponse>> GetSong(int id)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var song = await _songAccessService
            .WhereAccessibleTo(_context.Songs.AsNoTracking(), currentUserId.Value)
            .Select(song => new
            {
                Song = song,
                MemberRole = song.SongMembers
                    .Where(member => member.UserId == currentUserId.Value)
                    .Select(member => (SongMemberRole?)member.Role)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(song => song.Song.Id == id);

        if (song is null)
        {
            return NotFound();
        }

        var accessLevel = _songAccessService.GetAccessLevel(song.Song, currentUserId.Value, song.MemberRole);
        return ToResponse(song.Song, accessLevel);
    }

    [HttpPost]
    public async Task<ActionResult<SongResponse>> CreateSong(CreateSongRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var song = new Song
        {
            Title = request.Title.Trim(),
            Status = NormalizeStatus(request.Status),
            CreatedAt = DateTime.UtcNow,
            OwnerUserId = currentUserId
        };

        _context.Songs.Add(song);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSong), new { id = song.Id }, ToResponse(song, SongAccessLevel.OWNER));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateSong(int id, UpdateSongRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var existingSong = await _context.Songs
            .FirstOrDefaultAsync(song => song.Id == id);

        if (existingSong is null)
        {
            return NotFound();
        }

        var memberRole = await _context.SongMembers
            .Where(member => member.SongId == id && member.UserId == currentUserId.Value)
            .Select(member => (SongMemberRole?)member.Role)
            .FirstOrDefaultAsync();
        var accessLevel = _songAccessService.GetAccessLevel(existingSong, currentUserId.Value, memberRole);
        var capabilities = SongAccessService.GetCapabilities(accessLevel);

        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        existingSong.Title = request.Title.Trim();
        existingSong.Status = NormalizeStatus(request.Status);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteSong(int id)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var song = await _context.Songs
            .FirstOrDefaultAsync(song => song.Id == id);

        if (song is null)
        {
            return NotFound();
        }

        var accessLevel = await _songAccessService.GetAccessLevelAsync(id, currentUserId.Value);
        if (accessLevel == SongAccessLevel.NO_ACCESS)
        {
            return NotFound();
        }

        if (accessLevel != SongAccessLevel.OWNER)
        {
            return Forbid();
        }

        _context.Songs.Remove(song);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static SongResponse ToResponse(Song song, SongAccessLevel accessLevel)
    {
        var response = new SongResponse
        {
            Id = song.Id,
            Title = song.Title,
            Status = song.Status,
            CreatedAt = song.CreatedAt,
            OwnerUserId = song.OwnerUserId
        };

        ApplyAccessMetadata(response, accessLevel);
        return response;
    }

    private static void ApplyAccessMetadata(SongResponse song, SongAccessLevel accessLevel)
    {
        var capabilities = SongAccessService.GetCapabilities(accessLevel);
        song.CurrentUserRole = accessLevel.ToString();
        song.CanEdit = capabilities.CanEdit;
        song.CanManageMembers = capabilities.CanManageMembers;
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateSongRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }
}
