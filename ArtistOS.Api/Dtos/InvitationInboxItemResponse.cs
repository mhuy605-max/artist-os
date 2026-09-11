namespace ArtistOS.Api.Dtos;

public class InvitationInboxItemResponse
{
    public int InvitationId { get; set; }

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public UserSummaryResponse InvitedByUser { get; set; } = new();

    public string Role { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}
