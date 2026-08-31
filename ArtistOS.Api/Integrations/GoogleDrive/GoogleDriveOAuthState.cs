namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOAuthState
{
    public int UserId { get; set; }

    public string Nonce { get; set; } = string.Empty;

    public string CodeVerifier { get; set; } = string.Empty;

    public DateTime IssuedAt { get; set; }

    public DateTime ExpiresAt { get; set; }
}
