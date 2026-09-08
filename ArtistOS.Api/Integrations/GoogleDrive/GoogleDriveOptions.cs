namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string FrontendRedirectUrl { get; set; } = string.Empty;

    public int StateLifetimeMinutes { get; set; } = 10;

    public bool ForceConsentForRefreshToken { get; set; } = true;
}
