namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOAuthTokenResult
{
    public string AccessToken { get; set; } = string.Empty;

    public string? RefreshToken { get; set; }

    public string? Scope { get; set; }

    public string IdToken { get; set; } = string.Empty;
}
