using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class AnalyticsSnapshot
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    [MaxLength(40)]
    public string Platform { get; set; } = "YouTube";

    public DateOnly SnapshotDate { get; set; }

    public long Views { get; set; }

    public long Likes { get; set; }

    public long Comments { get; set; }

    public long WatchTimeMinutes { get; set; }

    public long SubscribersGained { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
