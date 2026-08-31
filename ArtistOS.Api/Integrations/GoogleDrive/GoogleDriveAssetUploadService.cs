using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveAssetUploadService
{
    private static readonly Dictionary<string, string[]> AudioMimeTypesByExtension =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".wav"] = ["audio/wav", "audio/x-wav", "audio/wave", "audio/vnd.wave"],
            [".mp3"] = ["audio/mpeg", "audio/mp3"],
            [".flac"] = ["audio/flac", "audio/x-flac"],
            [".m4a"] = ["audio/mp4", "audio/x-m4a"]
        };

    private static readonly Dictionary<string, string[]> VisualMimeTypesByExtension =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".png"] = ["image/png"],
            [".jpg"] = ["image/jpeg"],
            [".jpeg"] = ["image/jpeg"],
            [".webp"] = ["image/webp"],
            [".mp4"] = ["video/mp4"],
            [".mov"] = ["video/quicktime"],
            [".webm"] = ["video/webm"]
        };

    private readonly AppDbContext _context;
    private readonly GoogleDriveWorkspaceService _workspaceService;
    private readonly GoogleDriveConnectionService _connectionService;
    private readonly IGoogleDriveOAuthClient _googleOAuthClient;
    private readonly IGoogleDriveApiClient _driveClient;
    private readonly ILogger<GoogleDriveAssetUploadService> _logger;

    public GoogleDriveAssetUploadService(
        AppDbContext context,
        GoogleDriveWorkspaceService workspaceService,
        GoogleDriveConnectionService connectionService,
        IGoogleDriveOAuthClient googleOAuthClient,
        IGoogleDriveApiClient driveClient,
        ILogger<GoogleDriveAssetUploadService> logger)
    {
        _context = context;
        _workspaceService = workspaceService;
        _connectionService = connectionService;
        _googleOAuthClient = googleOAuthClient;
        _driveClient = driveClient;
        _logger = logger;
    }

    public async Task<GoogleDriveAssetUploadResult> UploadAudioAssetAsync(
        int userId,
        int songId,
        int audioAssetId,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        var audioAsset = await _context.AudioAssets
            .Include(asset => asset.ExternalFileReference)
            .FirstOrDefaultAsync(asset =>
                asset.Id == audioAssetId &&
                asset.SongId == songId &&
                asset.Song.OwnerUserId == userId,
                cancellationToken);

        if (audioAsset is null)
        {
            return GoogleDriveAssetUploadResult.Failure(GoogleDriveAssetUploadStatus.AssetNotFound);
        }

        if (audioAsset.ExternalFileReferenceId is not null)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.AlreadyLinked,
                "This audio asset already has a linked Drive file. Replace/version workflow is planned for later.");
        }

        var validation = ValidateFile(file, GoogleDriveAssetKind.Audio);
        if (validation.Status != GoogleDriveAssetUploadStatus.Success)
        {
            return validation;
        }

        var uploadContext = await PrepareUploadAsync(
            userId,
            songId,
            GoogleDriveAssetKind.Audio,
            cancellationToken);

        if (uploadContext.Status != GoogleDriveAssetUploadStatus.Success)
        {
            return GoogleDriveAssetUploadResult.Failure(uploadContext.Status, uploadContext.Detail);
        }

        return await UploadAndAssociateAudioAsync(
            userId,
            songId,
            audioAsset,
            file!,
            uploadContext,
            cancellationToken);
    }

    public async Task<GoogleDriveAssetUploadResult> UploadVisualAssetAsync(
        int userId,
        int songId,
        int visualAssetId,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        var visualAsset = await _context.VisualAssets
            .Include(asset => asset.ExternalFileReference)
            .FirstOrDefaultAsync(asset =>
                asset.Id == visualAssetId &&
                asset.SongId == songId &&
                asset.Song.OwnerUserId == userId,
                cancellationToken);

        if (visualAsset is null)
        {
            return GoogleDriveAssetUploadResult.Failure(GoogleDriveAssetUploadStatus.AssetNotFound);
        }

        if (visualAsset.ExternalFileReferenceId is not null)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.AlreadyLinked,
                "This visual asset already has a linked Drive file. Replace/version workflow is planned for later.");
        }

        var validation = ValidateFile(file, GoogleDriveAssetKind.Visual);
        if (validation.Status != GoogleDriveAssetUploadStatus.Success)
        {
            return validation;
        }

        var uploadContext = await PrepareUploadAsync(
            userId,
            songId,
            GoogleDriveAssetKind.Visual,
            cancellationToken);

        if (uploadContext.Status != GoogleDriveAssetUploadStatus.Success)
        {
            return GoogleDriveAssetUploadResult.Failure(uploadContext.Status, uploadContext.Detail);
        }

        return await UploadAndAssociateVisualAsync(
            userId,
            songId,
            visualAsset,
            file!,
            uploadContext,
            cancellationToken);
    }

    private async Task<GoogleDriveAssetUploadResult> UploadAndAssociateAudioAsync(
        int userId,
        int songId,
        AudioAsset audioAsset,
        IFormFile file,
        PreparedUpload uploadContext,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var uploadedFile = await UploadToDriveAsync(file, uploadContext, stream, cancellationToken);

        if (uploadedFile is null)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.GoogleDriveUnavailable);
        }

        try
        {
            var now = DateTime.UtcNow;
            var reference = CreateFileReference(
                userId,
                songId,
                uploadContext.ConnectionId,
                uploadedFile,
                ExternalResourceTypes.AudioAssetFile,
                nameof(AudioAsset),
                audioAsset.Id,
                now);

            _context.ExternalFileReferences.Add(reference);
            audioAsset.ExternalFileReference = reference;
            audioAsset.FileName = uploadedFile.Name;
            audioAsset.FileSizeBytes = uploadedFile.SizeBytes ?? file.Length;
            audioAsset.UploadedAt = now;

            await _context.SaveChangesAsync(cancellationToken);
            return GoogleDriveAssetUploadResult.Success(
                AssetFileResponseMapper.ToAudioAssetResponse(audioAsset));
        }
        catch (Exception exception)
        {
            await TryCleanupUploadedFileAsync(
                uploadContext.AccessToken,
                uploadedFile.Id,
                cancellationToken);

            _logger.LogError(
                exception,
                "Persisting Google Drive audio upload failed for user {UserId}, song {SongId}, audio asset {AudioAssetId}.",
                userId,
                songId,
                audioAsset.Id);

            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.PersistenceFailed);
        }
    }

    private async Task<GoogleDriveAssetUploadResult> UploadAndAssociateVisualAsync(
        int userId,
        int songId,
        VisualAsset visualAsset,
        IFormFile file,
        PreparedUpload uploadContext,
        CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        var uploadedFile = await UploadToDriveAsync(file, uploadContext, stream, cancellationToken);

        if (uploadedFile is null)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.GoogleDriveUnavailable);
        }

        try
        {
            var now = DateTime.UtcNow;
            var reference = CreateFileReference(
                userId,
                songId,
                uploadContext.ConnectionId,
                uploadedFile,
                ExternalResourceTypes.VisualAssetFile,
                nameof(VisualAsset),
                visualAsset.Id,
                now);

            _context.ExternalFileReferences.Add(reference);
            visualAsset.ExternalFileReference = reference;
            visualAsset.FileName = uploadedFile.Name;
            visualAsset.FileSizeBytes = uploadedFile.SizeBytes ?? file.Length;
            visualAsset.UploadedAt = now;

            await _context.SaveChangesAsync(cancellationToken);
            return GoogleDriveAssetUploadResult.Success(
                AssetFileResponseMapper.ToVisualAssetResponse(visualAsset));
        }
        catch (Exception exception)
        {
            await TryCleanupUploadedFileAsync(
                uploadContext.AccessToken,
                uploadedFile.Id,
                cancellationToken);

            _logger.LogError(
                exception,
                "Persisting Google Drive visual upload failed for user {UserId}, song {SongId}, visual asset {VisualAssetId}.",
                userId,
                songId,
                visualAsset.Id);

            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.PersistenceFailed);
        }
    }

    private async Task<GoogleDriveUploadedFile?> UploadToDriveAsync(
        IFormFile file,
        PreparedUpload uploadContext,
        Stream stream,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _driveClient.UploadFileAsync(
                uploadContext.AccessToken,
                Path.GetFileName(file.FileName),
                uploadContext.TargetFolderId,
                file.ContentType,
                stream,
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive media upload failed for user {UserId}, song {SongId}, asset kind {AssetKind}.",
                uploadContext.UserId,
                uploadContext.SongId,
                uploadContext.AssetKind);
            return null;
        }
    }

    private async Task TryCleanupUploadedFileAsync(
        string accessToken,
        string fileId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _driveClient.DeleteFileAsync(accessToken, fileId, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Best-effort Google Drive cleanup failed for uploaded file {FileId}.",
                fileId);
        }
    }

    private async Task<PreparedUpload> PrepareUploadAsync(
        int userId,
        int songId,
        GoogleDriveAssetKind assetKind,
        CancellationToken cancellationToken)
    {
        var workspaceResult = await _workspaceService.ProvisionWorkspaceAsync(
            userId,
            songId,
            cancellationToken);

        if (workspaceResult.Status != GoogleDriveWorkspaceResultStatus.Success ||
            workspaceResult.Workspace is null)
        {
            return workspaceResult.Status switch
            {
                GoogleDriveWorkspaceResultStatus.SongNotFound => PreparedUpload.Failure(
                    GoogleDriveAssetUploadStatus.AssetNotFound),
                GoogleDriveWorkspaceResultStatus.GoogleDriveNotConnected => PreparedUpload.Failure(
                    GoogleDriveAssetUploadStatus.GoogleDriveNotConnected),
                GoogleDriveWorkspaceResultStatus.GoogleDriveReauthRequired => PreparedUpload.Failure(
                    GoogleDriveAssetUploadStatus.GoogleDriveReauthRequired),
                _ => PreparedUpload.Failure(GoogleDriveAssetUploadStatus.WorkspaceUnavailable)
            };
        }

        var targetFolderId = assetKind == GoogleDriveAssetKind.Audio
            ? workspaceResult.Workspace.Folders.Audio?.ExternalId
            : workspaceResult.Workspace.Folders.Visuals?.ExternalId;

        if (string.IsNullOrWhiteSpace(targetFolderId))
        {
            return PreparedUpload.Failure(GoogleDriveAssetUploadStatus.WorkspaceUnavailable);
        }

        var connection = await _context.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId, cancellationToken);

        if (connection is null)
        {
            return PreparedUpload.Failure(GoogleDriveAssetUploadStatus.GoogleDriveNotConnected);
        }

        if (connection.Status != GoogleDriveConnectionStatuses.Connected)
        {
            return PreparedUpload.Failure(GoogleDriveAssetUploadStatus.GoogleDriveReauthRequired);
        }

        var refreshToken = _connectionService.UnprotectRefreshTokenForInternalUse(connection);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            await MarkReauthRequiredAsync(connection, cancellationToken);
            return PreparedUpload.Failure(GoogleDriveAssetUploadStatus.GoogleDriveReauthRequired);
        }

        try
        {
            var accessToken = await _googleOAuthClient.RefreshAccessTokenAsync(
                userId.ToString(),
                refreshToken,
                cancellationToken);

            connection.LastSuccessfulRefreshAt = DateTime.UtcNow;
            connection.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return PreparedUpload.Success(
                userId,
                songId,
                assetKind,
                connection.Id,
                accessToken,
                targetFolderId);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive access-token refresh failed before media upload for user {UserId}.",
                userId);
            await MarkReauthRequiredAsync(connection, cancellationToken);
            return PreparedUpload.Failure(GoogleDriveAssetUploadStatus.GoogleDriveReauthRequired);
        }
    }

    private async Task MarkReauthRequiredAsync(
        GoogleDriveConnection connection,
        CancellationToken cancellationToken)
    {
        connection.Status = GoogleDriveConnectionStatuses.ReauthRequired;
        connection.UpdatedAt = DateTime.UtcNow;
        connection.LastSuccessfulRefreshAt = null;
        await _context.SaveChangesAsync(cancellationToken);
    }

    private static ExternalFileReference CreateFileReference(
        int userId,
        int songId,
        int connectionId,
        GoogleDriveUploadedFile uploadedFile,
        string resourceType,
        string linkedResourceType,
        int linkedResourceId,
        DateTime now)
    {
        return new ExternalFileReference
        {
            OwnerUserId = userId,
            SongId = songId,
            GoogleDriveConnectionId = connectionId,
            Provider = ExternalFileProviders.GoogleDrive,
            ExternalId = uploadedFile.Id,
            ResourceType = resourceType,
            IsFolder = false,
            DisplayName = uploadedFile.Name,
            MimeType = uploadedFile.MimeType,
            SizeBytes = uploadedFile.SizeBytes,
            WebViewLink = uploadedFile.WebViewLink,
            LinkedResourceType = linkedResourceType,
            LinkedResourceId = linkedResourceId,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static GoogleDriveAssetUploadResult ValidateFile(
        IFormFile? file,
        GoogleDriveAssetKind assetKind)
    {
        if (file is null)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.InvalidFile,
                "Upload a file before submitting.");
        }

        if (file.Length <= 0)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.InvalidFile,
                "The selected file is empty.");
        }

        var fileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.InvalidFile,
                "The selected file needs a filename.");
        }

        var extension = Path.GetExtension(fileName);
        var mimeType = file.ContentType;

        if (assetKind == GoogleDriveAssetKind.Audio)
        {
            if (file.Length > GoogleDriveUploadLimits.AudioMaxBytes)
            {
                return GoogleDriveAssetUploadResult.Failure(
                    GoogleDriveAssetUploadStatus.FileTooLarge,
                    "Audio uploads are limited to 500 MB in this MVP.");
            }

            return HasSupportedMimeType(AudioMimeTypesByExtension, extension, mimeType)
                ? GoogleDriveAssetUploadResult.Failure(GoogleDriveAssetUploadStatus.Success)
                : GoogleDriveAssetUploadResult.Failure(
                    GoogleDriveAssetUploadStatus.UnsupportedFileType,
                    "Supported audio files: WAV, MP3, FLAC, M4A.");
        }

        var isVideo = IsVideoExtension(extension);
        var maxBytes = isVideo
            ? GoogleDriveUploadLimits.VisualVideoMaxBytes
            : GoogleDriveUploadLimits.VisualImageMaxBytes;

        if (file.Length > maxBytes)
        {
            return GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.FileTooLarge,
                isVideo
                    ? "Visual video uploads are limited to 2 GB in this MVP."
                    : "Visual image uploads are limited to 100 MB in this MVP.");
        }

        return HasSupportedMimeType(VisualMimeTypesByExtension, extension, mimeType)
            ? GoogleDriveAssetUploadResult.Failure(GoogleDriveAssetUploadStatus.Success)
            : GoogleDriveAssetUploadResult.Failure(
                GoogleDriveAssetUploadStatus.UnsupportedFileType,
                "Supported visual files: PNG, JPG, WEBP, MP4, MOV, WEBM.");
    }

    private static bool HasSupportedMimeType(
        IReadOnlyDictionary<string, string[]> allowedMimeTypesByExtension,
        string extension,
        string mimeType)
    {
        return !string.IsNullOrWhiteSpace(extension) &&
            !string.IsNullOrWhiteSpace(mimeType) &&
            allowedMimeTypesByExtension.TryGetValue(extension, out var allowedMimeTypes) &&
            allowedMimeTypes.Contains(mimeType, StringComparer.OrdinalIgnoreCase);
    }

    private static bool IsVideoExtension(string extension)
    {
        return string.Equals(extension, ".mp4", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(extension, ".mov", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(extension, ".webm", StringComparison.OrdinalIgnoreCase);
    }

    private class PreparedUpload
    {
        public GoogleDriveAssetUploadStatus Status { get; set; }

        public string? Detail { get; set; }

        public int UserId { get; set; }

        public int SongId { get; set; }

        public GoogleDriveAssetKind AssetKind { get; set; }

        public int ConnectionId { get; set; }

        public string AccessToken { get; set; } = string.Empty;

        public string TargetFolderId { get; set; } = string.Empty;

        public static PreparedUpload Success(
            int userId,
            int songId,
            GoogleDriveAssetKind assetKind,
            int connectionId,
            string accessToken,
            string targetFolderId)
        {
            return new PreparedUpload
            {
                Status = GoogleDriveAssetUploadStatus.Success,
                UserId = userId,
                SongId = songId,
                AssetKind = assetKind,
                ConnectionId = connectionId,
                AccessToken = accessToken,
                TargetFolderId = targetFolderId
            };
        }

        public static PreparedUpload Failure(
            GoogleDriveAssetUploadStatus status,
            string? detail = null)
        {
            return new PreparedUpload
            {
                Status = status,
                Detail = detail
            };
        }
    }
}
