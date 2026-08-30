namespace ArtistOS.Api.Dtos;

public class ContentItemResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? Platform { get; set; }

    public string? OwnerName { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? ScheduledAt { get; set; }

    public DateOnly? PublishedAt { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
