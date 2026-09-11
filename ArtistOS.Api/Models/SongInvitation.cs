namespace ArtistOS.Api.Models;

public class SongInvitation
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    public int InvitedUserId { get; set; }

    public User InvitedUser { get; set; } = null!;

    public int InvitedByUserId { get; set; }

    public User InvitedByUser { get; set; } = null!;

    public SongMemberRole Role { get; set; }

    public SongInvitationStatus Status { get; set; } = SongInvitationStatus.PENDING;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? RespondedAt { get; set; }
}
