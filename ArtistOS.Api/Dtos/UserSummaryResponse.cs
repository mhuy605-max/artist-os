namespace ArtistOS.Api.Dtos;

public class UserSummaryResponse
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? DisplayName { get; set; }
}
