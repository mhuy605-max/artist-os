using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class Release
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    public DateOnly? ReleaseDate { get; set; }

    [MaxLength(40)]
    public string ReleaseType { get; set; } = "Single";

    [MaxLength(120)]
    public string? Distributor { get; set; }

    [MaxLength(20)]
    public string? Isrc { get; set; }

    [MaxLength(20)]
    public string? Upc { get; set; }

    [MaxLength(40)]
    public string Status { get; set; } = "Planning";

    [MaxLength(255)]
    public string Platforms { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
