using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class ReleaseChecklistItem
{
    public int Id { get; set; }

    public int ReleaseId { get; set; }

    public Release Release { get; set; } = null!;

    [MaxLength(40)]
    public string Key { get; set; } = string.Empty;

    [MaxLength(80)]
    public string Label { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
