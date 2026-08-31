using ArtistOS.Api.Integrations.GoogleDrive;

namespace ArtistOS.Api.Tests;

public class FakeGoogleDriveApiClient : IGoogleDriveApiClient
{
    private int _nextId = 1;

    public Dictionary<string, GoogleDriveFolder> Folders { get; } = [];

    public List<(string Name, string? ParentFolderId)> CreatedFolders { get; } = [];

    public Dictionary<string, GoogleDriveUploadedFile> Files { get; } = [];

    public List<(string Name, string ParentFolderId, string ContentType, long Bytes)> UploadedFiles { get; } = [];

    public List<string> DeletedFileIds { get; } = [];

    public bool FailUpload { get; set; }

    public bool FailDelete { get; set; }

    public string? FixedUploadFileId { get; set; }

    public Task<GoogleDriveFolder?> GetFolderAsync(
        string accessToken,
        string folderId,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(
            Folders.TryGetValue(folderId, out var folder) && !folder.Trashed
                ? folder
                : null);
    }

    public Task<GoogleDriveFolder> CreateFolderAsync(
        string accessToken,
        string name,
        string? parentFolderId,
        CancellationToken cancellationToken)
    {
        var folder = new GoogleDriveFolder
        {
            Id = $"drive-folder-{_nextId++}",
            Name = name,
            MimeType = GoogleDriveMimeTypes.Folder
        };

        Folders[folder.Id] = folder;
        CreatedFolders.Add((name, parentFolderId));

        return Task.FromResult(folder);
    }

    public Task<GoogleDriveUploadedFile> UploadFileAsync(
        string accessToken,
        string name,
        string parentFolderId,
        string contentType,
        Stream stream,
        CancellationToken cancellationToken)
    {
        if (FailUpload)
        {
            throw new InvalidOperationException("Fake Drive upload failed.");
        }

        using var countingStream = new MemoryStream();
        stream.CopyTo(countingStream);

        var file = new GoogleDriveUploadedFile
        {
            Id = FixedUploadFileId ?? $"drive-file-{_nextId++}",
            Name = name,
            MimeType = contentType,
            SizeBytes = countingStream.Length,
            WebViewLink = $"https://drive.google.test/file/{_nextId}"
        };

        Files[file.Id] = file;
        UploadedFiles.Add((name, parentFolderId, contentType, countingStream.Length));

        return Task.FromResult(file);
    }

    public Task DeleteFileAsync(
        string accessToken,
        string fileId,
        CancellationToken cancellationToken)
    {
        if (FailDelete)
        {
            throw new InvalidOperationException("Fake Drive delete failed.");
        }

        DeletedFileIds.Add(fileId);
        Files.Remove(fileId);
        return Task.CompletedTask;
    }

    public void DeleteFolder(string folderId)
    {
        if (Folders.TryGetValue(folderId, out var folder))
        {
            folder.Trashed = true;
        }
    }
}
