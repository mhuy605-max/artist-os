namespace ArtistOS.Api.Dtos;

public class SongInvitationResponse
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public UserSummaryResponse InvitedUser { get; set; } = new();

    public UserSummaryResponse InvitedByUser { get; set; } = new();

    public string Role { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }
}
