using ArtistOS.Api.Integrations.GoogleDrive;

namespace ArtistOS.Api.Tests;

public class FakeGoogleDriveOAuthClient : IGoogleDriveOAuthClient
{
    public GoogleDriveOAuthTokenResult TokenResult { get; set; } = new()
    {
        AccessToken = "access-token-secret-456",
        RefreshToken = "refresh-token-secret-123",
        Scope = "openid email https://www.googleapis.com/auth/drive.file",
        IdToken = "fake-id-token"
    };

    public GoogleDriveOAuthAccount Account { get; set; } = new()
    {
        Subject = "google-subject-123",
        Email = "artist.google@example.com",
        EmailVerified = true
    };

    public List<string> RevokedTokens { get; } = [];

    public string LastCodeVerifier { get; private set; } = string.Empty;

    public string LastExchangedCodeVerifier { get; private set; } = string.Empty;

    public bool FailRefresh { get; set; }

    public GoogleDriveAuthorizationRequest CreateAuthorizationRequest(string redirectUri)
    {
        LastCodeVerifier = "fake-code-verifier";

        return new GoogleDriveAuthorizationRequest(
            LastCodeVerifier,
            protectedState =>
                "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=fake-client-id" +
                $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
                "&response_type=code" +
                "&scope=openid%20email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file" +
                "&access_type=offline" +
                "&prompt=consent" +
                "&code_challenge=fake-code-challenge" +
                "&code_challenge_method=S256" +
                $"&state={Uri.EscapeDataString(protectedState)}");
    }

    public Task<GoogleDriveOAuthTokenResult> ExchangeCodeAsync(
        string userId,
        string code,
        string codeVerifier,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        LastExchangedCodeVerifier = codeVerifier;
        return Task.FromResult(TokenResult);
    }

    public Task<GoogleDriveOAuthAccount> ValidateIdentityAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(Account);
    }

    public Task<string> RefreshAccessTokenAsync(
        string userId,
        string refreshToken,
        CancellationToken cancellationToken)
    {
        if (FailRefresh)
        {
            throw new InvalidOperationException("Fake Google refresh failed.");
        }

        return Task.FromResult("fake-access-token");
    }

    public Task RevokeTokenAsync(
        string userId,
        string token,
        CancellationToken cancellationToken)
    {
        RevokedTokens.Add(token);
        return Task.CompletedTask;
    }
}
