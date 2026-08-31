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
[Route("api/songs/{songId:int}/audio-assets")]
public class AudioAssetsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GoogleDriveAssetUploadService _uploadService;

    public AudioAssetsController(
        AppDbContext context,
        GoogleDriveAssetUploadService uploadService)
    {
        _context = context;
        _uploadService = uploadService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AudioAssetResponse>>> GetAudioAssets(int songId)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
        {
            return NotFound();
        }

        var audioAssets = await _context.AudioAssets
            .AsNoTracking()
            .Include(audioAsset => audioAsset.ExternalFileReference)
            .Where(audioAsset => audioAsset.SongId == songId)
            .OrderBy(audioAsset => audioAsset.Type)
            .ThenByDescending(audioAsset => audioAsset.IsCurrent)
            .ThenByDescending(audioAsset => audioAsset.Version)
            .ThenByDescending(audioAsset => audioAsset.UploadedAt)
            .ToListAsync();

        return audioAssets
            .Select(AssetFileResponseMapper.ToAudioAssetResponse)
            .ToList();
    }

    [HttpGet("{audioAssetId:int}")]
    public async Task<ActionResult<AudioAssetResponse>> GetAudioAsset(int songId, int audioAssetId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var audioAsset = await _context.AudioAssets
            .AsNoTracking()
            .Include(audioAsset => audioAsset.ExternalFileReference)
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId &&
                audioAsset.Song.OwnerUserId == currentUserId);

        if (audioAsset is null)
        {
            return NotFound();
        }

        return AssetFileResponseMapper.ToAudioAssetResponse(audioAsset);
    }

    [HttpPost]
    public async Task<ActionResult<AudioAssetResponse>> CreateAudioAsset(
        int songId,
        CreateAudioAssetRequest request)
    {
        var currentUserId = User.GetUserId();
        if (!await UserOwnsSong(songId, currentUserId))
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
            AssetFileResponseMapper.ToAudioAssetResponse(audioAsset));
    }

    [HttpPut("{audioAssetId:int}")]
    public async Task<IActionResult> UpdateAudioAsset(
        int songId,
        int audioAssetId,
        UpdateAudioAssetRequest request)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var existingAudioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId &&
                audioAsset.Song.OwnerUserId == currentUserId);

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
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var audioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId &&
                audioAsset.Song.OwnerUserId == currentUserId);

        if (audioAsset is null)
        {
            return NotFound();
        }

        _context.AudioAssets.Remove(audioAsset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{audioAssetId:int}/upload")]
    [RequestSizeLimit(GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    public async Task<ActionResult<AudioAssetResponse>> UploadAudioAssetFile(
        int songId,
        int audioAssetId,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _uploadService.UploadAudioAssetAsync(
            currentUserId.Value,
            songId,
            audioAssetId,
            file,
            cancellationToken);

        return ToAudioUploadActionResult(result);
    }

    private async Task<bool> UserOwnsSong(int songId, int? userId)
    {
        return userId is not null &&
            await _context.Songs.AnyAsync(song => song.Id == songId && song.OwnerUserId == userId);
    }

    private ActionResult<AudioAssetResponse> ToAudioUploadActionResult(
        GoogleDriveAssetUploadResult result)
    {
        return result.Status switch
        {
            GoogleDriveAssetUploadStatus.Success => result.AudioAsset!,
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
