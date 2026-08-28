using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

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
        return await _context.Songs
            .AsNoTracking()
            .OrderBy(song => song.Id)
            .Select(song => new SongResponse
            {
                Id = song.Id,
                Title = song.Title,
                Status = song.Status,
                CreatedAt = song.CreatedAt
            })
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SongResponse>> GetSong(int id)
    {
        var song = await _context.Songs
            .AsNoTracking()
            .FirstOrDefaultAsync(song => song.Id == id);

        if (song is null)
        {
            return NotFound();
        }

        return ToResponse(song);
    }

    [HttpPost]
    public async Task<ActionResult<SongResponse>> CreateSong(CreateSongRequest request)
    {
        var song = new Song
        {
            Title = request.Title.Trim(),
            Status = NormalizeStatus(request.Status),
            CreatedAt = DateTime.UtcNow
        };

        _context.Songs.Add(song);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSong), new { id = song.Id }, ToResponse(song));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateSong(int id, UpdateSongRequest request)
    {
        var existingSong = await _context.Songs.FindAsync(id);

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
        var song = await _context.Songs.FindAsync(id);

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
            CreatedAt = song.CreatedAt
        };
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateSongRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }
}
