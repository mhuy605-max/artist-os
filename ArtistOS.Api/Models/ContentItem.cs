using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class ContentItem
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Type { get; set; } = "Teaser";

    [MaxLength(40)]
    public string Status { get; set; } = "Idea";

    [MaxLength(40)]
    public string? Platform { get; set; }

    [MaxLength(120)]
    public string? OwnerName { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? ScheduledAt { get; set; }

    public DateOnly? PublishedAt { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
