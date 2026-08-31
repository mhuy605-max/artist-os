namespace ArtistOS.Api.Dtos;

public class DashboardResponse
{
    public DashboardSummaryResponse Summary { get; set; } = new();

    public List<DashboardPipelineItemResponse> Pipeline { get; set; } = [];

    public List<DashboardUpcomingItemResponse> Upcoming { get; set; } = [];

    public List<DashboardReleaseReadinessResponse> ReleaseReadiness { get; set; } = [];

    public List<DashboardAnalyticsItemResponse> AnalyticsOverview { get; set; } = [];

    public List<DashboardActivityItemResponse> RecentActivity { get; set; } = [];
}

public class DashboardSummaryResponse
{
    public int TotalSongs { get; set; }

    public int ActiveSongs { get; set; }

    public int UpcomingReleases { get; set; }

    public int ScheduledContent { get; set; }
}

public class DashboardPipelineItemResponse
{
    public string Status { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class DashboardUpcomingItemResponse
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

public class DashboardReleaseReadinessResponse
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

public class DashboardAnalyticsItemResponse
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

public class DashboardActivityItemResponse
{
    public string Type { get; set; } = string.Empty;

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DateTime OccurredAt { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}
