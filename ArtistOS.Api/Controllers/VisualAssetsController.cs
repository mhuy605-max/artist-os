using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/songs/{songId:int}/visual-assets")]
public class VisualAssetsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GoogleDriveAssetUploadService _uploadService;

    public VisualAssetsController(
        AppDbContext context,
        GoogleDriveAssetUploadService uploadService)
    {
        _context = context;
        _uploadService = uploadService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<VisualAssetResponse>>> GetVisualAssets(int songId)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        var visualAssets = await _context.VisualAssets
            .AsNoTracking()
            .Include(visualAsset => visualAsset.ExternalFileReference)
            .Where(visualAsset => visualAsset.SongId == songId)
            .OrderBy(visualAsset => visualAsset.Type)
            .ThenByDescending(visualAsset => visualAsset.IsCurrent)
            .ThenByDescending(visualAsset => visualAsset.Version)
            .ThenByDescending(visualAsset => visualAsset.UploadedAt)
            .ToListAsync();

        return visualAssets
            .Select(AssetFileResponseMapper.ToVisualAssetResponse)
            .ToList();
    }

    [HttpGet("{visualAssetId:int}")]
    public async Task<ActionResult<VisualAssetResponse>> GetVisualAsset(
        int songId,
        int visualAssetId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var visualAsset = await _context.VisualAssets
            .AsNoTracking()
            .Include(visualAsset => visualAsset.ExternalFileReference)
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId &&
                visualAsset.Song.OwnerUserId == currentUserId);

        if (visualAsset is null)
        {
            return NotFound();
        }

        return AssetFileResponseMapper.ToVisualAssetResponse(visualAsset);
    }

    [HttpPost]
    public async Task<ActionResult<VisualAssetResponse>> CreateVisualAsset(
        int songId,
        CreateVisualAssetRequest request)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
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
            AssetFileResponseMapper.ToVisualAssetResponse(visualAsset));
    }

    [HttpPut("{visualAssetId:int}")]
    public async Task<IActionResult> UpdateVisualAsset(
        int songId,
        int visualAssetId,
        UpdateVisualAssetRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var existingVisualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId &&
                visualAsset.Song.OwnerUserId == currentUserId);

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

    [HttpPost("{visualAssetId:int}/upload")]
    [RequestSizeLimit(GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    public async Task<ActionResult<VisualAssetResponse>> UploadVisualAssetFile(
        int songId,
        int visualAssetId,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _uploadService.UploadVisualAssetAsync(
            currentUserId.Value,
            songId,
            visualAssetId,
            file,
            cancellationToken);

        return ToVisualUploadActionResult(result);
    }

    [HttpDelete("{visualAssetId:int}")]
    public async Task<IActionResult> DeleteVisualAsset(int songId, int visualAssetId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var visualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId &&
                visualAsset.Song.OwnerUserId == currentUserId);

        if (visualAsset is null)
        {
            return NotFound();
        }

        _context.VisualAssets.Remove(visualAsset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserOwnsSong(int songId, int? userId)
    {
        return userId is not null &&
            await _context.Songs.AnyAsync(song => song.Id == songId && song.OwnerUserId == userId);
    }

    private ActionResult<VisualAssetResponse> ToVisualUploadActionResult(
        GoogleDriveAssetUploadResult result)
    {
        return result.Status switch
        {
            GoogleDriveAssetUploadStatus.Success => result.VisualAsset!,
            GoogleDriveAssetUploadStatus.AssetNotFound => NotFound(),
            GoogleDriveAssetUploadStatus.InvalidFile => BadRequest(new { error = result.Detail }),
            GoogleDriveAssetUploadStatus.UnsupportedFileType => BadRequest(new { error = result.Detail }),
            GoogleDriveAssetUploadStatus.FileTooLarge => BadRequest(new { error = result.Detail }),
            GoogleDriveAssetUploadStatus.AlreadyLinked => Conflict(new { error = result.Detail }),
            GoogleDriveAssetUploadStatus.GoogleDriveNotConnected => Problem(
                title: "Google Drive is not connected.",
                statusCode: StatusCodes.Status409Conflict),
            GoogleDriveAssetUploadStatus.GoogleDriveReauthRequired => Problem(
                title: "Google Drive authorization needs to be refreshed.",
                statusCode: StatusCodes.Status409Conflict),
            GoogleDriveAssetUploadStatus.WorkspaceUnavailable => Problem(
                title: "Google Drive workspace is unavailable.",
                statusCode: StatusCodes.Status502BadGateway),
            GoogleDriveAssetUploadStatus.GoogleDriveUnavailable => Problem(
                title: "Google Drive upload failed.",
                statusCode: StatusCodes.Status502BadGateway),
            _ => Problem(
                title: "Uploaded file could not be saved in Artist OS.",
                statusCode: StatusCodes.Status500InternalServerError)
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
