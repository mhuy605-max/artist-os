namespace ArtistOS.Api.Dtos;

public class SongMemberResponse
{
    public int? MemberId { get; set; }

    public int UserId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public string Role { get; set; } = string.Empty;

    public DateTime? JoinedAt { get; set; }
}
