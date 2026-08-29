namespace ArtistOS.Api.Dtos;

public class AudioAssetResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string Type { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public int Version { get; set; }

    public string Status { get; set; } = string.Empty;

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; }

    public bool IsCurrent { get; set; }
}
