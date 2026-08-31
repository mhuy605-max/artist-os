namespace ArtistOS.Api.Integrations.GoogleDrive;

public interface IGoogleDriveApiClient
{
    Task<GoogleDriveFolder?> GetFolderAsync(
        string accessToken,
        string folderId,
        CancellationToken cancellationToken);

    Task<GoogleDriveFolder> CreateFolderAsync(
        string accessToken,
        string name,
        string? parentFolderId,
        CancellationToken cancellationToken);

    Task<GoogleDriveUploadedFile> UploadFileAsync(
        string accessToken,
        string name,
        string parentFolderId,
        string contentType,
        Stream stream,
        CancellationToken cancellationToken);

    Task DeleteFileAsync(
        string accessToken,
        string fileId,
        CancellationToken cancellationToken);
}
