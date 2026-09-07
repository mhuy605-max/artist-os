using ArtistOS.Api.Integrations.GoogleDrive;

namespace ArtistOS.Api.Tests;

public class FakeGoogleDriveApiClient : IGoogleDriveApiClient
{
    private int _nextId = 1;

    public Dictionary<string, GoogleDriveFolder> Folders { get; } = [];

    public List<(string Name, string? ParentFolderId)> CreatedFolders { get; } = [];

    public Dictionary<string, GoogleDriveUploadedFile> Files { get; } = [];

    public Dictionary<string, byte[]> FileBytes { get; } = [];

    public List<(string Name, string ParentFolderId, string ContentType, long Bytes)> UploadedFiles { get; } = [];

    public List<(string FileId, MediaByteRange? Range)> MediaRequests { get; } = [];

    public List<string> DeletedFileIds { get; } = [];

    public bool FailUpload { get; set; }

    public GoogleDriveMediaStatus? MediaFailureStatus { get; set; }

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
        FileBytes[file.Id] = countingStream.ToArray();
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
        FileBytes.Remove(fileId);
        return Task.CompletedTask;
    }

    public Task<GoogleDriveMediaContent> OpenFileReadAsync(
        string accessToken,
        string fileId,
        MediaByteRange? range,
        CancellationToken cancellationToken)
    {
        MediaRequests.Add((fileId, range));

        if (MediaFailureStatus is not null)
        {
            return Task.FromResult(new GoogleDriveMediaContent { Status = MediaFailureStatus.Value });
        }

        if (!Files.TryGetValue(fileId, out var file) || !FileBytes.TryGetValue(fileId, out var bytes))
        {
            return Task.FromResult(new GoogleDriveMediaContent { Status = GoogleDriveMediaStatus.NotFound });
        }

        if (range is null)
        {
            return Task.FromResult(new GoogleDriveMediaContent(
                GoogleDriveMediaStatus.Success,
                new MemoryStream(bytes, writable: false),
                file.MimeType,
                bytes.Length,
                bytes.Length,
                null,
                null));
        }

        if (!TryResolveRange(range, bytes.Length, out var start, out var end))
        {
            return Task.FromResult(new GoogleDriveMediaContent
            {
                Status = GoogleDriveMediaStatus.RangeNotSatisfiable,
                TotalSize = bytes.Length
            });
        }

        var length = (int)(end - start + 1);
        var partialBytes = new byte[length];
        Array.Copy(bytes, start, partialBytes, 0, length);

        return Task.FromResult(new GoogleDriveMediaContent(
            GoogleDriveMediaStatus.PartialContent,
            new MemoryStream(partialBytes, writable: false),
            file.MimeType,
            length,
            bytes.Length,
            start,
            end));
    }

    public void DeleteFolder(string folderId)
    {
        if (Folders.TryGetValue(folderId, out var folder))
        {
            folder.Trashed = true;
        }
    }

    private static bool TryResolveRange(
        MediaByteRange range,
        long totalLength,
        out long start,
        out long end)
    {
        start = 0;
        end = totalLength - 1;

        if (totalLength <= 0)
        {
            return false;
        }

        if (range.IsSuffixRange)
        {
            var suffixLength = range.End!.Value;
            if (suffixLength <= 0)
            {
                return false;
            }

            start = Math.Max(totalLength - suffixLength, 0);
            return true;
        }

        start = range.Start!.Value;
        end = Math.Min(range.End ?? totalLength - 1, totalLength - 1);

        return start < totalLength && end >= start;
    }
}
