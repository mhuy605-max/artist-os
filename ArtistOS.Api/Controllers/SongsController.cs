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
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SongsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SongResponse>>> GetSongs()
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        return await _context.Songs
            .AsNoTracking()
            .Where(song => song.OwnerUserId == currentUserId)
            .OrderBy(song => song.Id)
            .Select(song => new SongResponse
            {
                Id = song.Id,
                Title = song.Title,
                Status = song.Status,
                CreatedAt = song.CreatedAt,
                OwnerUserId = song.OwnerUserId
            })
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SongResponse>> GetSong(int id)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var song = await _context.Songs
            .AsNoTracking()
            .FirstOrDefaultAsync(song => song.Id == id && song.OwnerUserId == currentUserId);

        if (song is null)
        {
            return NotFound();
        }

        return ToResponse(song);
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

        return CreatedAtAction(nameof(GetSong), new { id = song.Id }, ToResponse(song));
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
            .FirstOrDefaultAsync(song => song.Id == id && song.OwnerUserId == currentUserId);

        if (existingSong is null)
        {
            return NotFound();
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
            .FirstOrDefaultAsync(song => song.Id == id && song.OwnerUserId == currentUserId);

        if (song is null)
        {
            return NotFound();
        }

        _context.Songs.Remove(song);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static SongResponse ToResponse(Song song)
    {
        return new SongResponse
        {
            Id = song.Id,
            Title = song.Title,
            Status = song.Status,
            CreatedAt = song.CreatedAt,
            OwnerUserId = song.OwnerUserId
        };
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateSongRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }
}
