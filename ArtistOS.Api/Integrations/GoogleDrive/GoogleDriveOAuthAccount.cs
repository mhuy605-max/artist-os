namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOAuthAccount
{
    public string Subject { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public bool EmailVerified { get; set; }
}
