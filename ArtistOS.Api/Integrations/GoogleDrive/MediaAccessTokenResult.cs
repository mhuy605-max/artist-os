namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaAccessTokenResult
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }
}
