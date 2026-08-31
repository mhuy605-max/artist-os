namespace ArtistOS.Api.Dtos;

public class SongResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int? OwnerUserId { get; set; }
}
