namespace ArtistOS.Api.Auth;

public class JwtOptions
{
    public string Issuer { get; set; } = "ArtistOS.Api";

    public string Audience { get; set; } = "ArtistOS.DarkroomWeb";

    public string SigningKey { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 20;
}
