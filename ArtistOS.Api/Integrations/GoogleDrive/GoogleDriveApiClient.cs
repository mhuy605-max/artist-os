using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Google.Apis.Upload;
using System.Net;
using System.Net.Http.Headers;
using DriveFile = Google.Apis.Drive.v3.Data.File;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveApiClient : IGoogleDriveApiClient
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GoogleDriveApiClient(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

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

    public async Task<GoogleDriveMediaContent> OpenFileReadAsync(
        string accessToken,
        string fileId,
        MediaByteRange? range,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(fileId))
        {
            return new GoogleDriveMediaContent { Status = GoogleDriveMediaStatus.NotFound };
        }

        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://www.googleapis.com/drive/v3/files/{Uri.EscapeDataString(fileId)}?alt=media");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        if (range is not null)
        {
            request.Headers.Range = new RangeHeaderValue(range.Start, range.End);
        }

        var httpClient = _httpClientFactory.CreateClient(nameof(GoogleDriveApiClient));
        var response = await httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        var status = response.StatusCode switch
        {
            HttpStatusCode.OK => GoogleDriveMediaStatus.Success,
            HttpStatusCode.PartialContent => GoogleDriveMediaStatus.PartialContent,
            HttpStatusCode.NotFound => GoogleDriveMediaStatus.NotFound,
            HttpStatusCode.Forbidden => GoogleDriveMediaStatus.Forbidden,
            HttpStatusCode.RequestedRangeNotSatisfiable => GoogleDriveMediaStatus.RangeNotSatisfiable,
            _ => GoogleDriveMediaStatus.Unavailable
        };

        var contentRange = response.Content.Headers.ContentRange;

        if (status is not GoogleDriveMediaStatus.Success and not GoogleDriveMediaStatus.PartialContent)
        {
            response.Dispose();
            return new GoogleDriveMediaContent
            {
                Status = status,
                TotalSize = contentRange?.Length
            };
        }

        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var contentLength = response.Content.Headers.ContentLength;
        var totalSize = contentRange?.Length ?? contentLength;

        return new GoogleDriveMediaContent(
            status,
            stream,
            response.Content.Headers.ContentType?.MediaType,
            contentLength,
            totalSize,
            contentRange?.From,
            contentRange?.To,
            disposable: response);
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
