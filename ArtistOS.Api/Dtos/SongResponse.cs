namespace ArtistOS.Api.Dtos;

public class SongResponse
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int? OwnerUserId { get; set; }

    public string CurrentUserRole { get; set; } = string.Empty;

    public bool CanEdit { get; set; }

    public bool CanManageMembers { get; set; }
}
