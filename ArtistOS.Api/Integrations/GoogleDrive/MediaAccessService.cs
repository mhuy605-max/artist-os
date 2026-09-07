using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaAccessService
{
    private const string StreamPurpose = "stream";

    private readonly AppDbContext _context;
    private readonly MediaTokenService _tokenService;

    public MediaAccessService(AppDbContext context, MediaTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<MediaAccessResult> CreateAccessAsync(
        int userId,
        int songId,
        int assetId,
        string assetKind,
        Func<string, string> mediaUrlFactory,
        CancellationToken cancellationToken)
    {
        var resource = await ResolveResourceAsync(
            userId,
            songId,
            assetId,
            assetKind,
            externalFileReferenceId: null,
            cancellationToken);

        if (resource.Status != MediaAccessStatus.Success || resource.Resource is null)
        {
            return resource;
        }

        var protectedToken = _tokenService.Protect(new MediaAccessTokenPayload
        {
            UserId = userId,
            SongId = songId,
            AssetKind = assetKind,
            AssetId = assetId,
            ExternalFileReferenceId = resource.Resource.Reference.Id,
            Purpose = StreamPurpose
        });

        return MediaAccessResult.Success(new MediaAccessResponse
        {
            MediaUrl = mediaUrlFactory(protectedToken.Token),
            ExpiresAt = protectedToken.ExpiresAt,
            MimeType = SafeMimeType(resource.Resource.Reference.MimeType),
            FileName = resource.Resource.Reference.DisplayName,
            SizeBytes = resource.Resource.Reference.SizeBytes
        });
    }

    public async Task<MediaAccessResult> ValidateMediaRequestAsync(
        int routeSongId,
        int routeAssetId,
        string routeAssetKind,
        string? protectedToken,
        CancellationToken cancellationToken)
    {
        if (!_tokenService.TryUnprotect(protectedToken, out var token) ||
            token.Purpose != StreamPurpose ||
            token.SongId != routeSongId ||
            token.AssetId != routeAssetId ||
            !string.Equals(token.AssetKind, routeAssetKind, StringComparison.Ordinal))
        {
            return MediaAccessResult.Failure(MediaAccessStatus.InvalidToken);
        }

        return await ResolveResourceAsync(
            token.UserId,
            routeSongId,
            routeAssetId,
            routeAssetKind,
            token.ExternalFileReferenceId,
            cancellationToken);
    }

    private async Task<MediaAccessResult> ResolveResourceAsync(
        int userId,
        int songId,
        int assetId,
        string assetKind,
        int? externalFileReferenceId,
        CancellationToken cancellationToken)
    {
        ExternalFileReference? reference;

        if (assetKind == MediaAssetKinds.Audio)
        {
            var asset = await _context.AudioAssets
                .AsNoTracking()
                .Include(audioAsset => audioAsset.ExternalFileReference)
                .FirstOrDefaultAsync(audioAsset =>
                    audioAsset.Id == assetId &&
                    audioAsset.SongId == songId &&
                    audioAsset.Song.OwnerUserId == userId,
                    cancellationToken);

            if (asset is null)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
            }

            if (asset.ExternalFileReferenceId is null || asset.ExternalFileReference is null)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NoLinkedFile);
            }

            if (externalFileReferenceId is not null &&
                asset.ExternalFileReferenceId != externalFileReferenceId)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
            }

            reference = asset.ExternalFileReference;
        }
        else if (assetKind == MediaAssetKinds.Visual)
        {
            var asset = await _context.VisualAssets
                .AsNoTracking()
                .Include(visualAsset => visualAsset.ExternalFileReference)
                .FirstOrDefaultAsync(visualAsset =>
                    visualAsset.Id == assetId &&
                    visualAsset.SongId == songId &&
                    visualAsset.Song.OwnerUserId == userId,
                    cancellationToken);

            if (asset is null)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
            }

            if (asset.ExternalFileReferenceId is null || asset.ExternalFileReference is null)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NoLinkedFile);
            }

            if (externalFileReferenceId is not null &&
                asset.ExternalFileReferenceId != externalFileReferenceId)
            {
                return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
            }

            reference = asset.ExternalFileReference;
        }
        else
        {
            return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
        }

        if (reference.OwnerUserId != userId ||
            reference.SongId != songId ||
            reference.IsFolder ||
            (assetKind == MediaAssetKinds.Audio &&
                reference.ResourceType != ExternalResourceTypes.AudioAssetFile) ||
            (assetKind == MediaAssetKinds.Visual &&
                reference.ResourceType != ExternalResourceTypes.VisualAssetFile))
        {
            return MediaAccessResult.Failure(MediaAccessStatus.NotFound);
        }

        if (reference.GoogleDriveConnectionId is null)
        {
            return MediaAccessResult.Failure(MediaAccessStatus.GoogleDriveNotConnected);
        }

        var connection = await _context.GoogleDriveConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(connection =>
                connection.Id == reference.GoogleDriveConnectionId &&
                connection.UserId == userId,
                cancellationToken);

        if (connection is null)
        {
            return MediaAccessResult.Failure(MediaAccessStatus.GoogleDriveNotConnected);
        }

        if (connection.Status != GoogleDriveConnectionStatuses.Connected)
        {
            return MediaAccessResult.Failure(MediaAccessStatus.GoogleDriveReauthRequired);
        }

        return MediaAccessResult.Authorized(new AuthorizedMediaResource
        {
            UserId = userId,
            SongId = songId,
            AssetKind = assetKind,
            AssetId = assetId,
            Reference = reference,
            Connection = connection
        });
    }

    public static string SafeMimeType(string? mimeType)
    {
        return string.IsNullOrWhiteSpace(mimeType)
            ? "application/octet-stream"
            : mimeType;
    }
}
