namespace ArtistOS.Api.Models;

public class SongMember
{
    public int Id { get; set; }

    public int SongId { get; set; }

    public Song Song { get; set; } = null!;

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public SongMemberRole Role { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
