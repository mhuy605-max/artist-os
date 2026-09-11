using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveMediaService
{
    private readonly AppDbContext _context;
    private readonly GoogleDriveConnectionService _connectionService;
    private readonly IGoogleDriveOAuthClient _googleOAuthClient;
    private readonly IGoogleDriveApiClient _driveClient;
    private readonly ILogger<GoogleDriveMediaService> _logger;

    public GoogleDriveMediaService(
        AppDbContext context,
        GoogleDriveConnectionService connectionService,
        IGoogleDriveOAuthClient googleOAuthClient,
        IGoogleDriveApiClient driveClient,
        ILogger<GoogleDriveMediaService> logger)
    {
        _context = context;
        _connectionService = connectionService;
        _googleOAuthClient = googleOAuthClient;
        _driveClient = driveClient;
        _logger = logger;
    }

    public async Task<MediaStreamResult> OpenReadAsync(
        AuthorizedMediaResource resource,
        MediaByteRange? range,
        CancellationToken cancellationToken)
    {
        var refreshToken = _connectionService.UnprotectRefreshTokenForInternalUse(resource.Connection);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            await MarkReauthRequiredAsync(resource.Connection.Id, cancellationToken);
            return MediaStreamResult.Failure(MediaStreamStatus.ReauthRequired);
        }

        string accessToken;
        try
        {
            accessToken = await _googleOAuthClient.RefreshAccessTokenAsync(
                resource.StorageOwnerUserId.ToString(),
                refreshToken,
                cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive access-token refresh failed before media stream for requesting user {UserId} using owner {StorageOwnerUserId}, song {SongId}, asset kind {AssetKind}, asset {AssetId}.",
                resource.UserId,
                resource.StorageOwnerUserId,
                resource.SongId,
                resource.AssetKind,
                resource.AssetId);
            await MarkReauthRequiredAsync(resource.Connection.Id, cancellationToken);
            return MediaStreamResult.Failure(MediaStreamStatus.ReauthRequired);
        }

        try
        {
            var providerContent = await _driveClient.OpenFileReadAsync(
                accessToken,
                resource.Reference.ExternalId,
                range,
                cancellationToken);

            return MediaStreamResult.FromProvider(resource, providerContent);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive media retrieval failed for user {UserId}, song {SongId}, asset kind {AssetKind}, asset {AssetId}.",
                resource.UserId,
                resource.SongId,
                resource.AssetKind,
                resource.AssetId);
            return MediaStreamResult.Failure(MediaStreamStatus.Unavailable);
        }
    }

    private async Task MarkReauthRequiredAsync(int connectionId, CancellationToken cancellationToken)
    {
        var connection = await _context.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.Id == connectionId, cancellationToken);

        if (connection is null)
        {
            return;
        }

        connection.Status = GoogleDriveConnectionStatuses.ReauthRequired;
        connection.UpdatedAt = DateTime.UtcNow;
        connection.LastSuccessfulRefreshAt = null;
        await _context.SaveChangesAsync(cancellationToken);
    }
}
