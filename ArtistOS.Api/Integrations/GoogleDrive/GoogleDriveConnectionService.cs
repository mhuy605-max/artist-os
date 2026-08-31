using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveConnectionService
{
    private readonly AppDbContext _context;
    private readonly IGoogleDriveOAuthClient _googleOAuthClient;
    private readonly GoogleDriveOAuthStateProtector _stateProtector;
    private readonly IDataProtector _refreshTokenProtector;
    private readonly ILogger<GoogleDriveConnectionService> _logger;
    private readonly IHostEnvironment _environment;

    public GoogleDriveConnectionService(
        AppDbContext context,
        IGoogleDriveOAuthClient googleOAuthClient,
        GoogleDriveOAuthStateProtector stateProtector,
        IDataProtectionProvider dataProtectionProvider,
        ILogger<GoogleDriveConnectionService> logger,
        IHostEnvironment environment)
    {
        _context = context;
        _googleOAuthClient = googleOAuthClient;
        _stateProtector = stateProtector;
        _logger = logger;
        _environment = environment;
        _refreshTokenProtector =
            dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");
    }

    public async Task<GoogleDriveConnectionStatusResponse> GetStatusAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var connection = await _context.GoogleDriveConnections
            .AsNoTracking()
            .FirstOrDefaultAsync(connection => connection.UserId == userId, cancellationToken);

        if (connection is null || connection.Status != GoogleDriveConnectionStatuses.Connected)
        {
            return new GoogleDriveConnectionStatusResponse
            {
                Connected = false,
                Email = connection?.GoogleEmail,
                Status = connection?.Status
            };
        }

        return new GoogleDriveConnectionStatusResponse
        {
            Connected = true,
            Email = connection.GoogleEmail,
            Status = connection.Status,
            ConnectedAt = connection.ConnectedAt
        };
    }

    public string CreateAuthorizationUrl(int userId, string redirectUri)
    {
        var authorizationRequest = _googleOAuthClient.CreateAuthorizationRequest(redirectUri);

        var protectedState = _stateProtector.Protect(
            _stateProtector.CreateState(userId, authorizationRequest.CodeVerifier));

        var authorizationUrl = authorizationRequest.BuildUrlWithState(protectedState);
        var query = ReadQuery(authorizationUrl);

        LogDevelopment(
            "Google Drive authorization URL created. State parameter present: {HasState}. PKCE challenge present: {HasPkceChallenge}. PKCE challenge method S256: {UsesS256CodeChallenge}.",
            query.ContainsKey("state"),
            query.ContainsKey("code_challenge"),
            query.TryGetValue("code_challenge_method", out var method) &&
                string.Equals(method, "S256", StringComparison.Ordinal));

        return authorizationUrl;
    }

    public async Task<GoogleDriveCallbackResult> CompleteCallbackAsync(
        string code,
        string protectedState,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        if (!_stateProtector.TryUnprotect(protectedState, out var state, out var stateStatus))
        {
            LogDevelopment(
                "Google Drive OAuth callback stopped at state validation with status {StateStatus}.",
                stateStatus);
            return GoogleDriveCallbackResult.InvalidState;
        }

        GoogleDriveOAuthTokenResult token;
        try
        {
            token = await _googleOAuthClient.ExchangeCodeAsync(
                state.UserId.ToString(),
                code,
                state.CodeVerifier,
                redirectUri,
                cancellationToken);
        }
        catch (Exception exception)
        {
            LogDevelopment(
                exception,
                "Google Drive OAuth token exchange failed for user {UserId}.",
                state.UserId);
            throw;
        }

        GoogleDriveOAuthAccount account;
        try
        {
            account = await _googleOAuthClient.ValidateIdentityAsync(
                token.IdToken,
                cancellationToken);
        }
        catch (Exception exception)
        {
            LogDevelopment(
                exception,
                "Google Drive identity validation failed for user {UserId}.",
                state.UserId);
            throw;
        }

        if (string.IsNullOrWhiteSpace(account.Subject))
        {
            LogDevelopment(
                "Google Drive callback failed because Google subject was missing for user {UserId}.",
                state.UserId);
            return GoogleDriveCallbackResult.Failed;
        }

        var now = DateTime.UtcNow;
        var connection = await _context.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.UserId == state.UserId, cancellationToken);

        var protectedRefreshToken = string.IsNullOrWhiteSpace(token.RefreshToken)
            ? connection?.ProtectedRefreshToken
            : _refreshTokenProtector.Protect(token.RefreshToken);

        if (connection is null)
        {
            connection = new GoogleDriveConnection
            {
                UserId = state.UserId,
                ConnectedAt = now
            };

            _context.GoogleDriveConnections.Add(connection);
        }

        connection.GoogleSubject = account.Subject;
        connection.GoogleEmail = account.Email;
        connection.GoogleEmailVerified = account.EmailVerified;
        connection.GrantedScopes = NormalizeScopes(token.Scope);
        connection.ProtectedRefreshToken = protectedRefreshToken;
        connection.Status = protectedRefreshToken is null
            ? GoogleDriveConnectionStatuses.ReauthRequired
            : GoogleDriveConnectionStatuses.Connected;
        connection.UpdatedAt = now;
        connection.LastSuccessfulRefreshAt = protectedRefreshToken is null ? null : now;
        connection.RevokedAt = null;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            LogDevelopment(
                exception,
                "Google Drive connection persistence failed for user {UserId}.",
                state.UserId);
            throw;
        }

        return connection.Status == GoogleDriveConnectionStatuses.Connected
            ? GoogleDriveCallbackResult.Connected
            : GoogleDriveCallbackResult.ReauthRequired;
    }

    public async Task<GoogleDriveDisconnectResponse> DisconnectAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var connection = await _context.GoogleDriveConnections
            .FirstOrDefaultAsync(connection => connection.UserId == userId, cancellationToken);

        if (connection is null)
        {
            return new GoogleDriveDisconnectResponse { Disconnected = true };
        }

        var token = TryUnprotectRefreshToken(connection.ProtectedRefreshToken);
        if (!string.IsNullOrWhiteSpace(token))
        {
            try
            {
                await _googleOAuthClient.RevokeTokenAsync(
                    userId.ToString(),
                    token,
                    cancellationToken);
            }
            catch
            {
                _logger.LogWarning(
                    "Google Drive token revocation failed for user {UserId}; removing the local connection.",
                    userId);
                // Disconnect remains local and deterministic if Google already revoked it.
            }
        }

        _context.GoogleDriveConnections.Remove(connection);
        await _context.SaveChangesAsync(cancellationToken);

        return new GoogleDriveDisconnectResponse { Disconnected = true };
    }

    public string? UnprotectRefreshTokenForInternalUse(GoogleDriveConnection connection)
    {
        return TryUnprotectRefreshToken(connection.ProtectedRefreshToken);
    }

    private static Dictionary<string, string> ReadQuery(string url)
    {
        var uri = new Uri(url);
        return uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .ToDictionary(
                pair => Uri.UnescapeDataString(pair[0]),
                pair => pair.Length > 1 ? Uri.UnescapeDataString(pair[1]) : string.Empty,
                StringComparer.Ordinal);
    }

    private static string NormalizeScopes(string? scope)
    {
        if (string.IsNullOrWhiteSpace(scope))
        {
            return string.Join(' ', GoogleDriveScopes.Mvp);
        }

        return string.Join(
            ' ',
            scope.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(StringComparer.Ordinal)
                .Order(StringComparer.Ordinal));
    }

    private string? TryUnprotectRefreshToken(string? protectedRefreshToken)
    {
        if (string.IsNullOrWhiteSpace(protectedRefreshToken))
        {
            return null;
        }

        try
        {
            return _refreshTokenProtector.Unprotect(protectedRefreshToken);
        }
        catch
        {
            return null;
        }
    }

    private void LogDevelopment(string message, params object?[] args)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogInformation(message, args);
        }
    }

    private void LogDevelopment(Exception exception, string message, params object?[] args)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogWarning(exception, message, args);
        }
    }
}
