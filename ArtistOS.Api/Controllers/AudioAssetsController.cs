using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/songs/{songId:int}/audio-assets")]
public class AudioAssetsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AudioAssetsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AudioAssetResponse>>> GetAudioAssets(int songId)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        return await _context.AudioAssets
            .AsNoTracking()
            .Where(audioAsset => audioAsset.SongId == songId)
            .OrderBy(audioAsset => audioAsset.Type)
            .ThenByDescending(audioAsset => audioAsset.IsCurrent)
            .ThenByDescending(audioAsset => audioAsset.Version)
            .ThenByDescending(audioAsset => audioAsset.UploadedAt)
            .Select(audioAsset => new AudioAssetResponse
            {
                Id = audioAsset.Id,
                SongId = audioAsset.SongId,
                Type = audioAsset.Type,
                FileName = audioAsset.FileName,
                Version = audioAsset.Version,
                Status = audioAsset.Status,
                DurationSeconds = audioAsset.DurationSeconds,
                FileSizeBytes = audioAsset.FileSizeBytes,
                UploadedAt = audioAsset.UploadedAt,
                IsCurrent = audioAsset.IsCurrent
            })
            .ToListAsync();
    }

    [HttpGet("{audioAssetId:int}")]
    public async Task<ActionResult<AudioAssetResponse>> GetAudioAsset(int songId, int audioAssetId)
    {
        var audioAsset = await _context.AudioAssets
            .AsNoTracking()
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId && audioAsset.Id == audioAssetId);

        if (audioAsset is null)
        {
            return NotFound();
        }

        return ToResponse(audioAsset);
    }

    [HttpPost]
    public async Task<ActionResult<AudioAssetResponse>> CreateAudioAsset(
        int songId,
        CreateAudioAssetRequest request)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        var audioAsset = new AudioAsset
        {
            SongId = songId,
            Type = NormalizeType(request.Type),
            FileName = request.FileName.Trim(),
            Version = request.Version,
            Status = NormalizeStatus(request.Status),
            DurationSeconds = request.DurationSeconds,
            FileSizeBytes = request.FileSizeBytes,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = request.IsCurrent
        };

        _context.AudioAssets.Add(audioAsset);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetAudioAsset),
            new { songId, audioAssetId = audioAsset.Id },
            ToResponse(audioAsset));
    }

    [HttpPut("{audioAssetId:int}")]
    public async Task<IActionResult> UpdateAudioAsset(
        int songId,
        int audioAssetId,
        UpdateAudioAssetRequest request)
    {
        var existingAudioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId && audioAsset.Id == audioAssetId);

        if (existingAudioAsset is null)
        {
            return NotFound();
        }

        existingAudioAsset.Type = NormalizeType(request.Type);
        existingAudioAsset.FileName = request.FileName.Trim();
        existingAudioAsset.Version = request.Version;
        existingAudioAsset.Status = NormalizeStatus(request.Status);
        existingAudioAsset.DurationSeconds = request.DurationSeconds;
        existingAudioAsset.FileSizeBytes = request.FileSizeBytes;
        existingAudioAsset.IsCurrent = request.IsCurrent;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{audioAssetId:int}")]
    public async Task<IActionResult> DeleteAudioAsset(int songId, int audioAssetId)
    {
        var audioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId && audioAsset.Id == audioAssetId);

        if (audioAsset is null)
        {
            return NotFound();
        }

        _context.AudioAssets.Remove(audioAsset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> SongExists(int songId)
    {
        return await _context.Songs.AnyAsync(song => song.Id == songId);
    }

    private static AudioAssetResponse ToResponse(AudioAsset audioAsset)
    {
        return new AudioAssetResponse
        {
            Id = audioAsset.Id,
            SongId = audioAsset.SongId,
            Type = audioAsset.Type,
            FileName = audioAsset.FileName,
            Version = audioAsset.Version,
            Status = audioAsset.Status,
            DurationSeconds = audioAsset.DurationSeconds,
            FileSizeBytes = audioAsset.FileSizeBytes,
            UploadedAt = audioAsset.UploadedAt,
            IsCurrent = audioAsset.IsCurrent
        };
    }

    private static string NormalizeType(string type)
    {
        var trimmedType = type.Trim();

        return CreateAudioAssetRequest.AllowedTypes.First(allowedType =>
            string.Equals(allowedType, trimmedType, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateAudioAssetRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }
}
