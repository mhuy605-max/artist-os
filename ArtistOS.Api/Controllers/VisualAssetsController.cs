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
[Route("api/songs/{songId:int}/visual-assets")]
public class VisualAssetsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly GoogleDriveAssetUploadService _uploadService;
    private readonly MediaAccessService _mediaAccessService;
    private readonly GoogleDriveMediaService _mediaService;
    private readonly PublicUrlService _publicUrlService;
    private readonly SongAccessService _songAccessService;

    public VisualAssetsController(
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
    public async Task<ActionResult<IEnumerable<VisualAssetResponse>>> GetVisualAssets(int songId)
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

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        var visualAsset = await _context.VisualAssets
            .AsNoTracking()
            .Include(visualAsset => visualAsset.ExternalFileReference)
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId);

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

        var visualAsset = new VisualAsset
        {
            SongId = songId,
            AssetFamilyId = Guid.NewGuid(),
            Type = NormalizeType(request.Type),
            FileName = request.FileName.Trim(),
            Version = 1,
            Status = NormalizeStatus(request.Status),
            Width = request.Width,
            Height = request.Height,
            FileSizeBytes = request.FileSizeBytes,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = true
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

        var capabilities = await _songAccessService.GetCapabilitiesAsync(songId, currentUserId.Value);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (!capabilities.CanEdit)
        {
            return Forbid();
        }

        var existingVisualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId);

        if (existingVisualAsset is null)
        {
            return NotFound();
        }

        existingVisualAsset.Type = NormalizeType(request.Type);
        existingVisualAsset.FileName = request.FileName.Trim();
        existingVisualAsset.Status = NormalizeStatus(request.Status);
        existingVisualAsset.Width = request.Width;
        existingVisualAsset.Height = request.Height;
        existingVisualAsset.FileSizeBytes = request.FileSizeBytes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{visualAssetId:int}/versions")]
    public async Task<ActionResult<VisualAssetResponse>> CreateVisualAssetVersion(
        int songId,
        int visualAssetId,
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

        var sourceAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId,
                cancellationToken);

        if (sourceAsset is null)
        {
            return NotFound();
        }

        var familyAssets = await _context.VisualAssets
            .Where(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.AssetFamilyId == sourceAsset.AssetFamilyId)
            .ToListAsync(cancellationToken);

        var nextVersion = familyAssets.Max(visualAsset => visualAsset.Version) + 1;
        foreach (var familyAsset in familyAssets)
        {
            familyAsset.IsCurrent = false;
        }

        var nextAsset = new VisualAsset
        {
            SongId = songId,
            AssetFamilyId = sourceAsset.AssetFamilyId,
            Type = sourceAsset.Type,
            FileName = string.Empty,
            Version = nextVersion,
            Status = "Draft",
            Width = null,
            Height = null,
            FileSizeBytes = null,
            UploadedAt = DateTime.UtcNow,
            IsCurrent = true,
            ExternalFileReferenceId = null
        };

        _context.VisualAssets.Add(nextAsset);

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
            nameof(GetVisualAsset),
            new { songId, visualAssetId = nextAsset.Id },
            AssetFileResponseMapper.ToVisualAssetResponse(nextAsset));
    }

    [EnableRateLimiting(RateLimitPolicyNames.Uploads)]
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

    [EnableRateLimiting(RateLimitPolicyNames.Uploads)]
    [HttpPost("{visualAssetId:int}/replace-file")]
    [RequestSizeLimit(GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = GoogleDriveUploadLimits.RequestBodyMaxBytes)]
    public async Task<ActionResult<VisualAssetResponse>> ReplaceVisualAssetFile(
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

        var result = await _uploadService.ReplaceVisualAssetFileAsync(
            currentUserId.Value,
            songId,
            visualAssetId,
            file,
            cancellationToken);

        return ToVisualUploadActionResult(result);
    }

    [EnableRateLimiting(RateLimitPolicyNames.MediaAccess)]
    [HttpPost("{visualAssetId:int}/media-access")]
    public async Task<ActionResult<MediaAccessResponse>> CreateVisualMediaAccess(
        int songId,
        int visualAssetId,
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
            visualAssetId,
            MediaAssetKinds.Visual,
            token => _publicUrlService.BuildApiUrl(
                $"/api/songs/{songId}/visual-assets/{visualAssetId}/media?token={Uri.EscapeDataString(token)}"),
            cancellationToken);

        return ToMediaAccessActionResult(result);
    }

    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicyNames.MediaStream)]
    [HttpGet("{visualAssetId:int}/media")]
    [HttpHead("{visualAssetId:int}/media")]
    public async Task<IActionResult> GetVisualAssetMedia(
        int songId,
        int visualAssetId,
        [FromQuery] string? token,
        CancellationToken cancellationToken)
    {
        return await GetMediaAsync(
            songId,
            visualAssetId,
            MediaAssetKinds.Visual,
            token,
            cancellationToken);
    }

    [HttpDelete("{visualAssetId:int}")]
    public async Task<IActionResult> DeleteVisualAsset(int songId, int visualAssetId)
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

        var visualAsset = await _context.VisualAssets
            .FirstOrDefaultAsync(visualAsset =>
                visualAsset.SongId == songId &&
                visualAsset.Id == visualAssetId);

        if (visualAsset is null)
        {
            return NotFound();
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var familyId = visualAsset.AssetFamilyId;
        var wasCurrent = visualAsset.IsCurrent;

        if (wasCurrent)
        {
            visualAsset.IsCurrent = false;
            await _context.SaveChangesAsync();
        }

        _context.VisualAssets.Remove(visualAsset);
        await _context.SaveChangesAsync();

        if (wasCurrent)
        {
            var nextCurrent = await _context.VisualAssets
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

    private ActionResult<VisualAssetResponse> ToVisualUploadActionResult(
        GoogleDriveAssetUploadResult result)
    {
        return result.Status switch
        {
            GoogleDriveAssetUploadStatus.Success => result.VisualAsset!,
            GoogleDriveAssetUploadStatus.AssetNotFound => NotFound(),
            GoogleDriveAssetUploadStatus.Forbidden => Forbid(),
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
                title: "This visual asset does not have a linked media file.",
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
        int visualAssetId,
        string assetKind,
        string? token,
        CancellationToken cancellationToken)
    {
        var access = await _mediaAccessService.ValidateMediaRequestAsync(
            songId,
            visualAssetId,
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
                title: "This visual asset does not have a linked media file.",
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
