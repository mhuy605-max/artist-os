using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/songs/{songId:int}/visual-assets")]
public class VisualAssetsController : ControllerBase
{
    private readonly AppDbContext _context;

    public VisualAssetsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VisualAssetResponse>>> GetVisualAssets(int songId)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        return await _context.VisualAssets
            .AsNoTracking()
            .Where(visualAsset => visualAsset.SongId == songId)
            .OrderBy(visualAsset => visualAsset.Type)
            .ThenByDescending(visualAsset => visualAsset.IsCurrent)
            .ThenByDescending(visualAsset => visualAsset.Version)
            .ThenByDescending(visualAsset => visualAsset.UploadedAt)
            .Select(visualAsset => new VisualAssetResponse
            {
                Id = visualAsset.Id,
                SongId = visualAsset.SongId,
                Type = visualAsset.Type,
                FileName = visualAsset.FileName,
                Version = visualAsset.Version,
                Status = visualAsset.Status,
                Width = visualAsset.Width,
                Height = visualAsset.Height,
                FileSizeBytes = visualAsset.FileSizeBytes,
                UploadedAt = visualAsset.UploadedAt,
                IsCurrent = visualAsset.IsCurrent
            })
            .ToListAsync();
    }

    [HttpGet("{visualAssetId:int}")]
    public async Task<ActionResult<VisualAssetResponse>> GetVisualAsset(
        int songId,
        int visualAssetId)
    {
        var visualAsset = await _context.VisualAssets
            .AsNoTracking()
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId && visualAsset.Id == visualAssetId);

        if (visualAsset is null)
        {
            return NotFound();
        }

        return ToResponse(visualAsset);
    }

    [HttpPost]
    public async Task<ActionResult<VisualAssetResponse>> CreateVisualAsset(
        int songId,
        CreateVisualAssetRequest request)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        var visualAsset = new VisualAsset
        {
            SongId = songId,
            Type = NormalizeType(request.Type),
            FileName = request.FileName.Trim(),
            Version = request.Version,
            Status = NormalizeStatus(request.Status),
            Width = request.Width,
            Height = request.Height,
            FileSizeBytes = request.FileSizeBytes,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = request.IsCurrent
        };

        _context.VisualAssets.Add(visualAsset);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetVisualAsset),
            new { songId, visualAssetId = visualAsset.Id },
            ToResponse(visualAsset));
    }

    [HttpPut("{visualAssetId:int}")]
    public async Task<IActionResult> UpdateVisualAsset(
        int songId,
        int visualAssetId,
        UpdateVisualAssetRequest request)
    {
        var existingVisualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId && visualAsset.Id == visualAssetId);

        if (existingVisualAsset is null)
        {
            return NotFound();
        }

        existingVisualAsset.Type = NormalizeType(request.Type);
        existingVisualAsset.FileName = request.FileName.Trim();
        existingVisualAsset.Version = request.Version;
        existingVisualAsset.Status = NormalizeStatus(request.Status);
        existingVisualAsset.Width = request.Width;
        existingVisualAsset.Height = request.Height;
        existingVisualAsset.FileSizeBytes = request.FileSizeBytes;
        existingVisualAsset.IsCurrent = request.IsCurrent;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{visualAssetId:int}")]
    public async Task<IActionResult> DeleteVisualAsset(int songId, int visualAssetId)
    {
        var visualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId && visualAsset.Id == visualAssetId);

        if (visualAsset is null)
        {
            return NotFound();
        }

        _context.VisualAssets.Remove(visualAsset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> SongExists(int songId)
    {
        return await _context.Songs.AnyAsync(song => song.Id == songId);
    }

    private static VisualAssetResponse ToResponse(VisualAsset visualAsset)
    {
        return new VisualAssetResponse
        {
            Id = visualAsset.Id,
            SongId = visualAsset.SongId,
            Type = visualAsset.Type,
            FileName = visualAsset.FileName,
            Version = visualAsset.Version,
            Status = visualAsset.Status,
            Width = visualAsset.Width,
            Height = visualAsset.Height,
            FileSizeBytes = visualAsset.FileSizeBytes,
            UploadedAt = visualAsset.UploadedAt,
            IsCurrent = visualAsset.IsCurrent
        };
    }

    private static string NormalizeType(string type)
    {
        var trimmedType = type.Trim();

        return CreateVisualAssetRequest.AllowedTypes.First(allowedType =>
            string.Equals(allowedType, trimmedType, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateVisualAssetRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }
}
