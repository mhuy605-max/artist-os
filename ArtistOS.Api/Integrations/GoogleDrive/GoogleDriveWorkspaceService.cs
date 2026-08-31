using System.Text.RegularExpressions;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public partial class GoogleDriveWorkspaceService
{
    private const string RootFolderName = "DARKROOM SYSTEM";
    private const string SongsFolderName = "Songs";

    private static readonly (string ResourceType, string DisplayName)[] SongChildFolders =
    [
        (ExternalResourceTypes.AudioFolder, "Audio"),
        (ExternalResourceTypes.VisualsFolder, "Visuals"),
        (ExternalResourceTypes.ReleaseFolder, "Release"),
        (ExternalResourceTypes.ContentFolder, "Content")
    ];

    private readonly AppDbContext _context;
    private readonly GoogleDriveConnectionService _connectionService;
    private readonly IGoogleDriveOAuthClient _googleOAuthClient;
    private readonly IGoogleDriveApiClient _driveClient;
    private readonly ILogger<GoogleDriveWorkspaceService> _logger;

    public GoogleDriveWorkspaceService(
        AppDbContext context,
        GoogleDriveConnectionService connectionService,
        IGoogleDriveOAuthClient googleOAuthClient,
        IGoogleDriveApiClient driveClient,
        ILogger<GoogleDriveWorkspaceService> logger)
    {
        _context = context;
        _connectionService = connectionService;
        _googleOAuthClient = googleOAuthClient;
        _driveClient = driveClient;
        _logger = logger;
    }

    public async Task<GoogleDriveWorkspaceResult> GetWorkspaceAsync(
        int userId,
        int songId,
        CancellationToken cancellationToken)
    {
        var songExists = await _context.Songs
            .AsNoTracking()
            .AnyAsync(song => song.Id == songId && song.OwnerUserId == userId, cancellationToken);

        if (!songExists)
        {
            return GoogleDriveWorkspaceResult.Failure(GoogleDriveWorkspaceResultStatus.SongNotFound);
        }

        var connection = await _context.GoogleDriveConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(connection => connection.UserId == userId, cancellationToken);

        if (connection is null)
        {
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveNotConnected);
        }

        return GoogleDriveWorkspaceResult.Success(
            await BuildWorkspaceResponseAsync(userId, songId, connection, cancellationToken));
    }

    public async Task<GoogleDriveWorkspaceResult> ProvisionWorkspaceAsync(
        int userId,
        int songId,
        CancellationToken cancellationToken)
    {
        var song = await _context.Songs
            .FirstOrDefaultAsync(song => song.Id == songId && song.OwnerUserId == userId, cancellationToken);

        if (song is null)
        {
            return GoogleDriveWorkspaceResult.Failure(GoogleDriveWorkspaceResultStatus.SongNotFound);
        }

        var connection = await _context.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId, cancellationToken);

        if (connection is null)
        {
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveNotConnected);
        }

        if (connection.Status != GoogleDriveConnectionStatuses.Connected)
        {
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveReauthRequired);
        }

        var refreshToken = _connectionService.UnprotectRefreshTokenForInternalUse(connection);
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            await MarkReauthRequiredAsync(connection, cancellationToken);
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveReauthRequired);
        }

        string accessToken;
        try
        {
            accessToken = await _googleOAuthClient.RefreshAccessTokenAsync(
                userId.ToString(),
                refreshToken,
                cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive access-token refresh failed for user {UserId}.",
                userId);
            await MarkReauthRequiredAsync(connection, cancellationToken);
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveReauthRequired);
        }

        try
        {
            var rootFolder = await EnsureRootFolderAsync(connection, accessToken, cancellationToken);
            var songsFolder = await EnsureReferenceFolderAsync(
                userId,
                songId: null,
                connection,
                accessToken,
                ExternalResourceTypes.SongsFolder,
                SongsFolderName,
                rootFolder.Id,
                cancellationToken);
            var songFolder = await EnsureReferenceFolderAsync(
                userId,
                song.Id,
                connection,
                accessToken,
                ExternalResourceTypes.SongFolder,
                BuildSongFolderName(song),
                songsFolder.ExternalId,
                cancellationToken);

            foreach (var (resourceType, displayName) in SongChildFolders)
            {
                await EnsureReferenceFolderAsync(
                    userId,
                    song.Id,
                    connection,
                    accessToken,
                    resourceType,
                    displayName,
                    songFolder.ExternalId,
                    cancellationToken);
            }

            connection.UpdatedAt = DateTime.UtcNow;
            connection.LastSuccessfulRefreshAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            return GoogleDriveWorkspaceResult.Success(
                await BuildWorkspaceResponseAsync(userId, songId, connection, cancellationToken));
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Google Drive workspace provisioning failed for user {UserId}, song {SongId}.",
                userId,
                songId);
            return GoogleDriveWorkspaceResult.Failure(
                GoogleDriveWorkspaceResultStatus.GoogleDriveUnavailable);
        }
    }

    private async Task<GoogleDriveFolder> EnsureRootFolderAsync(
        GoogleDriveConnection connection,
        string accessToken,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(connection.RootFolderId))
        {
            var existingRoot = await _driveClient.GetFolderAsync(
                accessToken,
                connection.RootFolderId,
                cancellationToken);

            if (existingRoot is not null)
            {
                return existingRoot;
            }
        }

        var createdRoot = await _driveClient.CreateFolderAsync(
            accessToken,
            RootFolderName,
            parentFolderId: null,
            cancellationToken);

        connection.RootFolderId = createdRoot.Id;
        return createdRoot;
    }

    private async Task<ExternalFileReference> EnsureReferenceFolderAsync(
        int userId,
        int? songId,
        GoogleDriveConnection connection,
        string accessToken,
        string resourceType,
        string displayName,
        string parentFolderId,
        CancellationToken cancellationToken)
    {
        var reference = await _context.ExternalFileReferences
            .FirstOrDefaultAsync(reference =>
                reference.OwnerUserId == userId &&
                reference.Provider == ExternalFileProviders.GoogleDrive &&
                reference.ResourceType == resourceType &&
                reference.SongId == songId,
                cancellationToken);

        if (reference is not null)
        {
            var existingFolder = await _driveClient.GetFolderAsync(
                accessToken,
                reference.ExternalId,
                cancellationToken);

            if (existingFolder is not null)
            {
                reference.DisplayName = existingFolder.Name;
                reference.MimeType = existingFolder.MimeType;
                reference.UpdatedAt = DateTime.UtcNow;
                return reference;
            }
        }

        var createdFolder = await _driveClient.CreateFolderAsync(
            accessToken,
            displayName,
            parentFolderId,
            cancellationToken);

        if (reference is null)
        {
            reference = new ExternalFileReference
            {
                OwnerUserId = userId,
                SongId = songId,
                Provider = ExternalFileProviders.GoogleDrive,
                ResourceType = resourceType,
                IsFolder = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.ExternalFileReferences.Add(reference);
        }

        reference.GoogleDriveConnectionId = connection.Id;
        reference.ExternalId = createdFolder.Id;
        reference.DisplayName = createdFolder.Name;
        reference.MimeType = createdFolder.MimeType;
        reference.UpdatedAt = DateTime.UtcNow;

        return reference;
    }

    private async Task<DriveWorkspaceResponse> BuildWorkspaceResponseAsync(
        int userId,
        int songId,
        GoogleDriveConnection connection,
        CancellationToken cancellationToken)
    {
        var references = await _context.ExternalFileReferences
            .AsNoTracking()
            .Where(reference =>
                reference.OwnerUserId == userId &&
                reference.Provider == ExternalFileProviders.GoogleDrive &&
                (reference.SongId == songId ||
                    reference.ResourceType == ExternalResourceTypes.SongsFolder))
            .ToListAsync(cancellationToken);

        var songsFolder = references.FirstOrDefault(reference =>
            reference.ResourceType == ExternalResourceTypes.SongsFolder &&
            reference.SongId is null);
        var songFolder = references.FirstOrDefault(reference =>
            reference.ResourceType == ExternalResourceTypes.SongFolder &&
            reference.SongId == songId);
        var audioFolder = FindSongReference(references, songId, ExternalResourceTypes.AudioFolder);
        var visualsFolder = FindSongReference(references, songId, ExternalResourceTypes.VisualsFolder);
        var releaseFolder = FindSongReference(references, songId, ExternalResourceTypes.ReleaseFolder);
        var contentFolder = FindSongReference(references, songId, ExternalResourceTypes.ContentFolder);

        return new DriveWorkspaceResponse
        {
            IsProvisioned = !string.IsNullOrWhiteSpace(connection.RootFolderId) &&
                songsFolder is not null &&
                songFolder is not null &&
                audioFolder is not null &&
                visualsFolder is not null &&
                releaseFolder is not null &&
                contentFolder is not null,
            GoogleDriveStatus = connection.Status,
            RootFolder = string.IsNullOrWhiteSpace(connection.RootFolderId)
                ? null
                : new DriveWorkspaceFolderResponse
                {
                    Name = RootFolderName,
                    ExternalId = connection.RootFolderId,
                    ResourceType = "RootFolder"
                },
            SongsFolder = ToFolderResponse(songsFolder),
            SongFolder = ToFolderResponse(songFolder),
            Folders = new DriveWorkspaceFoldersResponse
            {
                Audio = ToFolderResponse(audioFolder),
                Visuals = ToFolderResponse(visualsFolder),
                Release = ToFolderResponse(releaseFolder),
                Content = ToFolderResponse(contentFolder)
            }
        };
    }

    private static ExternalFileReference? FindSongReference(
        List<ExternalFileReference> references,
        int songId,
        string resourceType)
    {
        return references.FirstOrDefault(reference =>
            reference.SongId == songId &&
            reference.ResourceType == resourceType);
    }

    private static DriveWorkspaceFolderResponse? ToFolderResponse(ExternalFileReference? reference)
    {
        return reference is null
            ? null
            : new DriveWorkspaceFolderResponse
            {
                Name = reference.DisplayName,
                ExternalId = reference.ExternalId,
                ResourceType = reference.ResourceType
            };
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

    private static string BuildSongFolderName(Song song)
    {
        return $"{song.Id} - {SanitizeFolderName(song.Title)}";
    }

    private static string SanitizeFolderName(string title)
    {
        var trimmed = InvalidDriveFolderCharacters().Replace(title.Trim(), " ");
        var collapsed = Whitespace().Replace(trimmed, " ").Trim();
        return string.IsNullOrWhiteSpace(collapsed) ? "UNTITLED SONG" : collapsed;
    }

    [GeneratedRegex(@"[\\/:*?""<>|]+")]
    private static partial Regex InvalidDriveFolderCharacters();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
