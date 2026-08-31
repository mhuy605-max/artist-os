namespace ArtistOS.Api.Tests;

public sealed class SongResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int? OwnerUserId { get; set; }
}

public sealed class AuthUserResponse
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? DisplayName { get; set; }
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

public sealed class ReleaseChecklistItemResponse
{
    public int Id { get; set; }

    public int ReleaseId { get; set; }

    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    public int SortOrder { get; set; }

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

public sealed class AnalyticsSnapshotResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string Platform { get; set; } = string.Empty;

    public DateOnly SnapshotDate { get; set; }

    public long Views { get; set; }

    public long Likes { get; set; }

    public long Comments { get; set; }

    public long WatchTimeMinutes { get; set; }

    public long SubscribersGained { get; set; }

    public DateTime CreatedAt { get; set; }
}

public sealed class CalendarEntryResponse
{
    public string SourceType { get; set; } = string.Empty;

    public int SourceId { get; set; }

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Platform { get; set; }

    public bool IsEditable { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}

public sealed class DashboardResponse
{
    public DashboardSummaryResponse Summary { get; set; } = new();

    public List<DashboardPipelineItemResponse> Pipeline { get; set; } = [];

    public List<DashboardUpcomingItemResponse> Upcoming { get; set; } = [];

    public List<DashboardReleaseReadinessResponse> ReleaseReadiness { get; set; } = [];

    public List<DashboardAnalyticsItemResponse> AnalyticsOverview { get; set; } = [];

    public List<DashboardActivityItemResponse> RecentActivity { get; set; } = [];
}

public sealed class DashboardSummaryResponse
{
    public int TotalSongs { get; set; }

    public int ActiveSongs { get; set; }

    public int UpcomingReleases { get; set; }

    public int ScheduledContent { get; set; }
}

public sealed class DashboardPipelineItemResponse
{
    public string Status { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public sealed class DashboardUpcomingItemResponse
{
    public string SourceType { get; set; } = string.Empty;

    public int SourceId { get; set; }

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Platform { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}

public sealed class DashboardReleaseReadinessResponse
{
    public int ReleaseId { get; set; }

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public DateOnly? ReleaseDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public int CompletedItems { get; set; }

    public int TotalItems { get; set; }

    public int ReadinessPercentage { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}

public sealed class DashboardAnalyticsItemResponse
{
    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;

    public DateOnly SnapshotDate { get; set; }

    public long Views { get; set; }

    public long Likes { get; set; }

    public long Comments { get; set; }

    public long WatchTimeMinutes { get; set; }

    public long SubscribersGained { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}

public sealed class DashboardActivityItemResponse
{
    public string Type { get; set; } = string.Empty;

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime OccurredAt { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}
