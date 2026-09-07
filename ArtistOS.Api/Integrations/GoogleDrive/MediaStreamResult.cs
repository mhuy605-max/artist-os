namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaStreamResult : IAsyncDisposable
{
    private GoogleDriveMediaContent? _providerContent;

    public MediaStreamStatus Status { get; set; }

    public Stream? Stream { get; set; }

    public string ContentType { get; set; } = "application/octet-stream";

    public string FileName { get; set; } = string.Empty;

    public long? ContentLength { get; set; }

    public long? TotalSize { get; set; }

    public long? RangeStart { get; set; }

    public long? RangeEnd { get; set; }

    public static MediaStreamResult FromProvider(
        AuthorizedMediaResource resource,
        GoogleDriveMediaContent content)
    {
        var status = content.Status switch
        {
            GoogleDriveMediaStatus.Success => MediaStreamStatus.Success,
            GoogleDriveMediaStatus.PartialContent => MediaStreamStatus.PartialContent,
            GoogleDriveMediaStatus.NotFound => MediaStreamStatus.NotFound,
            GoogleDriveMediaStatus.Forbidden => MediaStreamStatus.Forbidden,
            GoogleDriveMediaStatus.RangeNotSatisfiable => MediaStreamStatus.RangeNotSatisfiable,
            _ => MediaStreamStatus.Unavailable
        };

        return new MediaStreamResult
        {
            Status = status,
            Stream = content.Stream,
            ContentType = MediaAccessService.SafeMimeType(content.ContentType ?? resource.Reference.MimeType),
            FileName = resource.Reference.DisplayName,
            ContentLength = content.ContentLength,
            TotalSize = content.TotalSize ?? resource.Reference.SizeBytes,
            RangeStart = content.RangeStart,
            RangeEnd = content.RangeEnd,
            _providerContent = content
        };
    }

    public static MediaStreamResult Failure(MediaStreamStatus status)
    {
        return new MediaStreamResult
        {
            Status = status
        };
    }

    public async ValueTask DisposeAsync()
    {
        if (_providerContent is not null)
        {
            await _providerContent.DisposeAsync();
        }
        else if (Stream is not null)
        {
            await Stream.DisposeAsync();
        }
    }
}
