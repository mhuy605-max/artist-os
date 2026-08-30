namespace ArtistOS.Api.Dtos;

public class CreditResponse
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
