namespace ArtistOS.Api.Dtos;

public class ReleaseResponse
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
