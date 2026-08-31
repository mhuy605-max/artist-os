namespace ArtistOS.Api.Dtos;

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public string TokenType { get; set; } = "Bearer";

    public DateTime ExpiresAt { get; set; }

    public AuthUserResponse User { get; set; } = new();
}
