namespace ArtistOS.Api.Dtos;

public class VisualAssetResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string Type { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public int Version { get; set; }

    public string Status { get; set; } = string.Empty;

    public int? Width { get; set; }

    public int? Height { get; set; }

    public long? FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; }

    public bool IsCurrent { get; set; }
}
