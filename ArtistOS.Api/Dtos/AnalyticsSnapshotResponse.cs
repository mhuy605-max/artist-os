namespace ArtistOS.Api.Dtos;

public class AnalyticsSnapshotResponse
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
