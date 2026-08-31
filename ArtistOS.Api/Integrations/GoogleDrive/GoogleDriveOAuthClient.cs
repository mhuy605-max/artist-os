using Google.Apis.Auth;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Util.Store;
using Microsoft.Extensions.Options;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOAuthClient : IGoogleDriveOAuthClient
{
    private readonly GoogleDriveOptions _options;

    public GoogleDriveOAuthClient(IOptions<GoogleDriveOptions> options)
    {
        _options = options.Value;
    }

    public GoogleDriveAuthorizationRequest CreateAuthorizationRequest(string redirectUri)
    {
        var flow = CreateFlow();
        var request = flow.CreateAuthorizationCodeRequest(redirectUri, out var codeVerifier);
        return new GoogleDriveAuthorizationRequest(
            codeVerifier,
            protectedState =>
            {
                request.State = protectedState;
                return request.Build().ToString();
            });
    }

    public async Task<GoogleDriveOAuthTokenResult> ExchangeCodeAsync(
        string userId,
        string code,
        string codeVerifier,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        var token = await CreateFlow().ExchangeCodeForTokenAsync(
            userId,
            code,
            codeVerifier,
            redirectUri,
            cancellationToken);

        return new GoogleDriveOAuthTokenResult
        {
            AccessToken = token.AccessToken ?? string.Empty,
            RefreshToken = token.RefreshToken,
            Scope = token.Scope,
            IdToken = token.IdToken ?? string.Empty
        };
    }

    public async Task<GoogleDriveOAuthAccount> ValidateIdentityAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
        {
            throw new InvalidOperationException("Google did not return an ID token.");
        }

        var payload = await GoogleJsonWebSignature.ValidateAsync(
            idToken,
            new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_options.ClientId]
            });

        return new GoogleDriveOAuthAccount
        {
            Subject = payload.Subject,
            Email = payload.Email,
            EmailVerified = payload.EmailVerified
        };
    }

    public async Task<string> RefreshAccessTokenAsync(
        string userId,
        string refreshToken,
        CancellationToken cancellationToken)
    {
        var token = await CreateFlow().RefreshTokenAsync(userId, refreshToken, cancellationToken);

        if (string.IsNullOrWhiteSpace(token.AccessToken))
        {
            throw new InvalidOperationException("Google did not return an access token.");
        }

        return token.AccessToken;
    }

    public Task RevokeTokenAsync(
        string userId,
        string token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return Task.CompletedTask;
        }

        return CreateFlow().RevokeTokenAsync(userId, token, cancellationToken);
    }

    private PkceGoogleAuthorizationCodeFlow CreateFlow()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId) ||
            string.IsNullOrWhiteSpace(_options.ClientSecret))
        {
            throw new InvalidOperationException("Google Drive OAuth is not configured.");
        }

        return new PkceGoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = new ClientSecrets
            {
                ClientId = _options.ClientId,
                ClientSecret = _options.ClientSecret
            },
            Scopes = GoogleDriveScopes.Mvp,
            DataStore = new NullDataStore(),
            IncludeGrantedScopes = true,
            Prompt = _options.ForceConsentForRefreshToken ? "consent" : null
        });
    }
}
