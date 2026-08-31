using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class Song
{
    public int Id { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "Demo";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? OwnerUserId { get; set; }

    public User? OwnerUser { get; set; }

    public ICollection<AudioAsset> AudioAssets { get; set; } = [];

    public ICollection<VisualAsset> VisualAssets { get; set; } = [];

    public Release? Release { get; set; }

    public ICollection<ContentItem> ContentItems { get; set; } = [];

    public ICollection<Credit> Credits { get; set; } = [];

    public ICollection<AnalyticsSnapshot> AnalyticsSnapshots { get; set; } = [];
}
