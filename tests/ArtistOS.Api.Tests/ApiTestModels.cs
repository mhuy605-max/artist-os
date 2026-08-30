namespace ArtistOS.Api.Tests;

public sealed class SongResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}

public sealed class AudioAssetResponse
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

public sealed class VisualAssetResponse
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

public sealed class ReleaseResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public DateOnly? ReleaseDate { get; set; }

    public string ReleaseType { get; set; } = string.Empty;

    public string? Distributor { get; set; }

    public string? Isrc { get; set; }

    public string? Upc { get; set; }

    public string Status { get; set; } = string.Empty;

    public List<string> Platforms { get; set; } = [];

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public sealed class ContentItemResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? Platform { get; set; }

    public string? OwnerName { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? ScheduledAt { get; set; }

    public DateOnly? PublishedAt { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

public sealed class CreditResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string ContributorName { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? Contact { get; set; }

    public string Status { get; set; } = string.Empty;

    public decimal? SplitPercentage { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
