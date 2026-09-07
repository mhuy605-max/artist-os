namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveMediaContent : IAsyncDisposable
{
    private readonly IAsyncDisposable? _asyncDisposable;
    private readonly IDisposable? _disposable;

    public GoogleDriveMediaStatus Status { get; set; }

    public Stream? Stream { get; set; }

    public string? ContentType { get; set; }

    public long? ContentLength { get; set; }

    public long? TotalSize { get; set; }

    public long? RangeStart { get; set; }

    public long? RangeEnd { get; set; }

    public GoogleDriveMediaContent()
    {
    }

    public GoogleDriveMediaContent(
        GoogleDriveMediaStatus status,
        Stream? stream,
        string? contentType,
        long? contentLength,
        long? totalSize,
        long? rangeStart,
        long? rangeEnd,
        IDisposable? disposable = null,
        IAsyncDisposable? asyncDisposable = null)
    {
        Status = status;
        Stream = stream;
        ContentType = contentType;
        ContentLength = contentLength;
        TotalSize = totalSize;
        RangeStart = rangeStart;
        RangeEnd = rangeEnd;
        _disposable = disposable;
        _asyncDisposable = asyncDisposable;
    }

    public async ValueTask DisposeAsync()
    {
        if (Stream is not null)
        {
            await Stream.DisposeAsync();
        }

        if (_asyncDisposable is not null)
        {
            await _asyncDisposable.DisposeAsync();
        }

        _disposable?.Dispose();
    }
}
