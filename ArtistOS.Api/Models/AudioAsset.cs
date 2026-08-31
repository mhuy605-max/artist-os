using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class AudioAsset
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    [MaxLength(40)]
    public string Type { get; set; } = "Demo";

    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    public int Version { get; set; } = 1;

    [MaxLength(40)]
    public string Status { get; set; } = "Draft";

    public int? DurationSeconds { get; set; }

    public long? FileSizeBytes { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public bool IsCurrent { get; set; }

    public int? ExternalFileReferenceId { get; set; }

    public ExternalFileReference? ExternalFileReference { get; set; }
}
