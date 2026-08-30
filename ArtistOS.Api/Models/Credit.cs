using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class Credit
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    [MaxLength(160)]
    public string ContributorName { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Role { get; set; } = "Artist";

    [MaxLength(160)]
    public string? Contact { get; set; }

    [MaxLength(40)]
    public string Status { get; set; } = "Pending";

    public decimal? SplitPercentage { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
