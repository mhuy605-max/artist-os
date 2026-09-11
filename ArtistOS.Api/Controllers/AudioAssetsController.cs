using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
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
[Route("api/songs/{songId:int}/audio-assets")]
public class AudioAssetsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GoogleDriveAssetUploadService _uploadService;
    private readonly MediaAccessService _mediaAccessService;
    private readonly GoogleDriveMediaService _mediaService;
    private readonly PublicUrlService _publicUrlService;
    private readonly SongAccessService _songAccessService;

    public AudioAssetsController(
        AppDbContext context,
        GoogleDriveAssetUploadService uploadService,
        MediaAccessService mediaAccessService,
        GoogleDriveMediaService mediaService,
        PublicUrlService publicUrlService,
        SongAccessService songAccessService)
    {
        _context = context;
        _uploadService = uploadService;
        _mediaAccessService = mediaAccessService;
        _mediaService = mediaService;
        _publicUrlService = publicUrlService;
        _songAccessService = songAccessService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AudioAssetResponse>>> GetAudioAssets(int songId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
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

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        var audioAsset = await _context.AudioAssets
            .AsNoTracking()
            .Include(audioAsset => audioAsset.ExternalFileReference)
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId);

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
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        var audioAsset = new AudioAsset
        {
            SongId = songId,
            AssetFamilyId = Guid.NewGuid(),
            Type = NormalizeType(request.Type),
            FileName = request.FileName.Trim(),
            Version = 1,
            Status = NormalizeStatus(request.Status),
            DurationSeconds = request.DurationSeconds,
            FileSizeBytes = request.FileSizeBytes,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = true
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

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        var existingAudioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId);

        if (existingAudioAsset is null)
        {
            return NotFound();
        }

        existingAudioAsset.Type = NormalizeType(request.Type);
        existingAudioAsset.FileName = request.FileName.Trim();
        existingAudioAsset.Status = NormalizeStatus(request.Status);
        existingAudioAsset.DurationSeconds = request.DurationSeconds;
        existingAudioAsset.FileSizeBytes = request.FileSizeBytes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{audioAssetId:int}/versions")]
    public async Task<ActionResult<AudioAssetResponse>> CreateAudioAssetVersion(
        int songId,
        int audioAssetId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value, cancellationToken);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        var sourceAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId,
                cancellationToken);

        if (sourceAsset is null)
        {
            return NotFound();
        }

        var familyAssets = await _context.AudioAssets
            .Where(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.AssetFamilyId == sourceAsset.AssetFamilyId)
            .ToListAsync(cancellationToken);

        var nextVersion = familyAssets.Max(audioAsset => audioAsset.Version) + 1;
        foreach (var familyAsset in familyAssets)
        {
            familyAsset.IsCurrent = false;
        }

        var nextAsset = new AudioAsset
        {
            SongId = songId,
            AssetFamilyId = sourceAsset.AssetFamilyId,
            Type = sourceAsset.Type,
            FileName = string.Empty,
            Version = nextVersion,
            Status = "Draft",
            DurationSeconds = null,
            FileSizeBytes = null,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = true,
            ExternalFileReferenceId = null
        };

        _context.AudioAssets.Add(nextAsset);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict(new { error = "A new version was created at the same time. Refresh and try again." });
        }

        return CreatedAtAction(
            nameof(GetAudioAsset),
            new { songId, audioAssetId = nextAsset.Id },
            AssetFileResponseMapper.ToAudioAssetResponse(nextAsset));
    }

    [HttpDelete("{audioAssetId:int}")]
    public async Task<IActionResult> DeleteAudioAsset(int songId, int audioAssetId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        var audioAsset = await _context.AudioAssets
            .FirstOrDefaultAsync(audioAsset =>
                audioAsset.SongId == songId &&
                audioAsset.Id == audioAssetId);

        if (audioAsset is null)
        {
            return NotFound();
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var familyId = audioAsset.AssetFamilyId;
        var wasCurrent = audioAsset.IsCurrent;

        if (wasCurrent)
        {
            audioAsset.IsCurrent = false;
            await _context.SaveChangesAsync();
        }

        _context.AudioAssets.Remove(audioAsset);
        await _context.SaveChangesAsync();

        if (wasCurrent)
        {
            var nextCurrent = await _context.AudioAssets
                .Where(asset => asset.SongId == songId && asset.AssetFamilyId == familyId)
                .OrderByDescending(asset => asset.Version)
                .FirstOrDefaultAsync();

            if (nextCurrent is not null)
            {
                nextCurrent.IsCurrent = true;
                await _context.SaveChangesAsync();
            }
        }

        await transaction.CommitAsync();

        return NoContent();
    }

    [EnableRateLimiting(RateLimitPolicyNames.Uploads)]
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

    [EnableRateLimiting(RateLimitPolicyNames.Uploads)]
    [HttpPost("{audioAssetId:int}/replace-file")]
    [RequestSizeLimit(GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    public async Task<ActionResult<AudioAssetResponse>> ReplaceAudioAssetFile(
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

        var result = await _uploadService.ReplaceAudioAssetFileAsync(
            currentUserId.Value,
            songId,
            audioAssetId,
            file,
            cancellationToken);

        return ToAudioUploadActionResult(result);
    }

    [EnableRateLimiting(RateLimitPolicyNames.MediaAccess)]
    [HttpPost("{audioAssetId:int}/media-access")]
    public async Task<ActionResult<MediaAccessResponse>> CreateAudioMediaAccess(
        int songId,
        int audioAssetId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _mediaAccessService.CreateAccessAsync(
            currentUserId.Value,
            songId,
            audioAssetId,
            MediaAssetKinds.Audio,
            token => _publicUrlService.BuildApiUrl(
                $"/api/songs/{songId}/audio-assets/{audioAssetId}/media?token={Uri.EscapeDataString(token)}"),
            cancellationToken);

        return ToMediaAccessActionResult(result);
    }

    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicyNames.MediaStream)]
    [HttpGet("{audioAssetId:int}/media")]
    [HttpHead("{audioAssetId:int}/media")]
    public async Task<IActionResult> GetAudioAssetMedia(
        int songId,
        int audioAssetId,
        [FromQuery] string? token,
        CancellationToken cancellationToken)
    {
        return await GetMediaAsync(
            songId,
            audioAssetId,
            MediaAssetKinds.Audio,
            token,
            cancellationToken);
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
            GoogleDriveAssetUploadStatus.NotLinked => Conflict(new { error = result.Detail }),
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

    private ActionResult<MediaAccessResponse> ToMediaAccessActionResult(MediaAccessResult result)
    {
        return result.Status switch
        {
            MediaAccessStatus.Success => result.Response!,
            MediaAccessStatus.NotFound => NotFound(),
            MediaAccessStatus.NoLinkedFile => Problem(
                title: "This audio asset does not have a linked media file.",
                statusCode: StatusCodes.Status409Conflict),
            MediaAccessStatus.GoogleDriveNotConnected => Problem(
                title: "Google Drive is not connected.",
                statusCode: StatusCodes.Status409Conflict),
            MediaAccessStatus.GoogleDriveReauthRequired => Problem(
                title: "Google Drive authorization needs to be refreshed.",
                statusCode: StatusCodes.Status409Conflict),
            _ => Unauthorized()
        };
    }

    private async Task<IActionResult> GetMediaAsync(
        int songId,
        int audioAssetId,
        string assetKind,
        string? token,
        CancellationToken cancellationToken)
    {
        var access = await _mediaAccessService.ValidateMediaRequestAsync(
            songId,
            audioAssetId,
            assetKind,
            token,
            cancellationToken);

        if (access.Status == MediaAccessStatus.InvalidToken)
        {
            return Unauthorized();
        }

        if (access.Status == MediaAccessStatus.NotFound)
        {
            return NotFound();
        }

        if (access.Status == MediaAccessStatus.NoLinkedFile)
        {
            return Problem(
                title: "This audio asset does not have a linked media file.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (access.Status == MediaAccessStatus.GoogleDriveNotConnected)
        {
            return Problem(
                title: "Google Drive is not connected.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (access.Status == MediaAccessStatus.GoogleDriveReauthRequired)
        {
            return Problem(
                title: "Google Drive authorization needs to be refreshed.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var resource = access.Resource!;
        AddPrivacyHeaders();

        if (!MediaRangeParser.TryParseSingleRange(Request.Headers.Range.ToString(), out var range))
        {
            return RangeNotSatisfiable(resource.Reference.SizeBytes);
        }

        if (HttpMethods.IsHead(Request.Method))
        {
            AddMediaMetadataHeaders(
                MediaAccessService.SafeMimeType(resource.Reference.MimeType),
                resource.Reference.SizeBytes,
                includeContentLength: true);
            return new EmptyResult();
        }

        await using var media = await _mediaService.OpenReadAsync(
            resource,
            range,
            cancellationToken);

        return await WriteMediaResponseAsync(media, cancellationToken);
    }

    private async Task<IActionResult> WriteMediaResponseAsync(
        MediaStreamResult media,
        CancellationToken cancellationToken)
    {
        if (media.Status == MediaStreamStatus.NotFound)
        {
            return NotFound();
        }

        if (media.Status == MediaStreamStatus.Forbidden)
        {
            return Problem(
                title: "Google Drive file is not available.",
                statusCode: StatusCodes.Status502BadGateway);
        }

        if (media.Status == MediaStreamStatus.ReauthRequired)
        {
            return Problem(
                title: "Google Drive authorization needs to be refreshed.",
                statusCode: StatusCodes.Status409Conflict);
        }

        if (media.Status == MediaStreamStatus.RangeNotSatisfiable)
        {
            return RangeNotSatisfiable(media.TotalSize);
        }

        if (media.Status == MediaStreamStatus.Unavailable || media.Stream is null)
        {
            return Problem(
                title: "Google Drive media is unavailable.",
                statusCode: StatusCodes.Status502BadGateway);
        }

        Response.StatusCode = media.Status == MediaStreamStatus.PartialContent
            ? StatusCodes.Status206PartialContent
            : StatusCodes.Status200OK;
        Response.ContentType = media.ContentType;
        if (media.ContentLength is not null)
        {
            Response.ContentLength = media.ContentLength;
        }

        if (media.Status == MediaStreamStatus.PartialContent &&
            media.RangeStart is not null &&
            media.RangeEnd is not null &&
            media.TotalSize is not null)
        {
            Response.Headers.ContentRange =
                $"bytes {media.RangeStart}-{media.RangeEnd}/{media.TotalSize}";
        }

        AddMediaMetadataHeaders(media.ContentType, media.TotalSize, includeContentLength: false);
        await media.Stream.CopyToAsync(Response.Body, cancellationToken);
        return new EmptyResult();
    }

    private IActionResult RangeNotSatisfiable(long? totalSize)
    {
        Response.StatusCode = StatusCodes.Status416RangeNotSatisfiable;
        Response.Headers.AcceptRanges = "bytes";
        Response.Headers.ContentRange = totalSize is null
            ? "bytes */*"
            : $"bytes */{totalSize}";
        AddPrivacyHeaders();
        return new EmptyResult();
    }

    private void AddMediaMetadataHeaders(
        string contentType,
        long? sizeBytes,
        bool includeContentLength)
    {
        Response.Headers.AcceptRanges = "bytes";
        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        Response.ContentType = contentType;
        if (includeContentLength && sizeBytes is not null)
        {
            Response.ContentLength = sizeBytes.Value;
        }
    }

    private void AddPrivacyHeaders()
    {
        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers["Referrer-Policy"] = "no-referrer";
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
