using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using DriveFile = Google.Apis.Drive.v3.Data.File;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveApiClient : IGoogleDriveApiClient
{
    public async Task<GoogleDriveFolder?> GetFolderAsync(
        string accessToken,
        string folderId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(folderId))
        {
            return null;
        }

        try
        {
            using var driveService = CreateDriveService(accessToken);
            var request = driveService.Files.Get(folderId);
            request.Fields = "id,name,mimeType,trashed";

            var file = await request.ExecuteAsync(cancellationToken);

            return IsUsableFolder(file) ? ToFolder(file) : null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<GoogleDriveFolder> CreateFolderAsync(
        string accessToken,
        string name,
        string? parentFolderId,
        CancellationToken cancellationToken)
    {
        using var driveService = CreateDriveService(accessToken);

        var metadata = new DriveFile
        {
            Name = name,
            MimeType = GoogleDriveMimeTypes.Folder
        };

        if (!string.IsNullOrWhiteSpace(parentFolderId))
        {
            metadata.Parents = [parentFolderId];
        }

        var request = driveService.Files.Create(metadata);
        request.Fields = "id,name,mimeType,trashed";

        var folder = await request.ExecuteAsync(cancellationToken);
        return ToFolder(folder);
    }

    public async Task<GoogleDriveUploadedFile> UploadFileAsync(
        string accessToken,
        string name,
        string parentFolderId,
        string contentType,
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var driveService = CreateDriveService(accessToken);

        var metadata = new DriveFile
        {
            Name = name,
            Parents = [parentFolderId]
        };

        var request = driveService.Files.Create(metadata, stream, contentType);
        request.Fields = "id,name,mimeType,size,webViewLink,trashed";

        var progress = await request.UploadAsync(cancellationToken);
        if (progress.Status != UploadStatus.Completed)
        {
            throw progress.Exception ?? new InvalidOperationException("Google Drive upload did not complete.");
        }

        return ToUploadedFile(request.ResponseBody);
    }

    public async Task DeleteFileAsync(
        string accessToken,
        string fileId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fileId))
        {
            return;
        }

        using var driveService = CreateDriveService(accessToken);
        await driveService.Files.Delete(fileId).ExecuteAsync(cancellationToken);
    }

    private static DriveService CreateDriveService(string accessToken)
    {
        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = GoogleCredential.FromAccessToken(accessToken),
            ApplicationName = "Artist OS DARKROOM SYSTEM"
        });
    }

    private static bool IsUsableFolder(DriveFile file)
    {
        return string.Equals(file.MimeType, GoogleDriveMimeTypes.Folder, StringComparison.Ordinal) &&
            file.Trashed != true;
    }

    private static GoogleDriveFolder ToFolder(DriveFile file)
    {
        return new GoogleDriveFolder
        {
            Id = file.Id ?? string.Empty,
            Name = file.Name ?? string.Empty,
            MimeType = file.MimeType ?? GoogleDriveMimeTypes.Folder,
            Trashed = file.Trashed == true
        };
    }

    private static GoogleDriveUploadedFile ToUploadedFile(DriveFile file)
    {
        return new GoogleDriveUploadedFile
        {
            Id = file.Id ?? string.Empty,
            Name = file.Name ?? string.Empty,
            MimeType = file.MimeType ?? string.Empty,
            SizeBytes = file.Size,
            WebViewLink = file.WebViewLink
        };
    }
}
