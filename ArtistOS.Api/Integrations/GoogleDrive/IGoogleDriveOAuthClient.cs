namespace ArtistOS.Api.Integrations.GoogleDrive;

public interface IGoogleDriveOAuthClient
{
    GoogleDriveAuthorizationRequest CreateAuthorizationRequest(string redirectUri);

    Task<GoogleDriveOAuthTokenResult> ExchangeCodeAsync(
        string userId,
        string code,
        string codeVerifier,
        string redirectUri,
        CancellationToken cancellationToken);

    Task<GoogleDriveOAuthAccount> ValidateIdentityAsync(
        string idToken,
        CancellationToken cancellationToken);

    Task<string> RefreshAccessTokenAsync(
        string userId,
        string refreshToken,
        CancellationToken cancellationToken);

    Task RevokeTokenAsync(
        string userId,
        string token,
        CancellationToken cancellationToken);
}
