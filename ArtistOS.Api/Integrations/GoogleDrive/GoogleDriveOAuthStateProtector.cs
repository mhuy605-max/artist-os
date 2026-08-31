using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveOAuthStateProtector
{
    private readonly IDataProtector _protector;
    private readonly GoogleDriveOptions _options;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<GoogleDriveOAuthStateProtector> _logger;

    public GoogleDriveOAuthStateProtector(
        IDataProtectionProvider dataProtectionProvider,
        IOptions<GoogleDriveOptions> options,
        IHostEnvironment environment,
        ILogger<GoogleDriveOAuthStateProtector> logger)
    {
        _protector = dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.OAuthState.v1");
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public string Protect(GoogleDriveOAuthState state)
    {
        return _protector.Protect(JsonSerializer.Serialize(state));
    }

    public GoogleDriveOAuthState CreateState(int userId, string codeVerifier)
    {
        var now = DateTime.UtcNow;
        return new GoogleDriveOAuthState
        {
            UserId = userId,
            CodeVerifier = codeVerifier,
            Nonce = Guid.NewGuid().ToString("N"),
            IssuedAt = now,
            ExpiresAt = now.AddMinutes(_options.StateLifetimeMinutes)
        };
    }

    public bool TryUnprotect(string protectedState, out GoogleDriveOAuthState state)
    {
        return TryUnprotect(protectedState, out state, out _);
    }

    public bool TryUnprotect(
        string protectedState,
        out GoogleDriveOAuthState state,
        out GoogleDriveOAuthStateValidationStatus status)
    {
        state = new GoogleDriveOAuthState();
        status = GoogleDriveOAuthStateValidationStatus.UnprotectFailed;

        if (string.IsNullOrWhiteSpace(protectedState))
        {
            status = GoogleDriveOAuthStateValidationStatus.Missing;
            LogDevelopment(
                "Google Drive OAuth state validation failed: state missing.");
            return false;
        }

        try
        {
            var json = _protector.Unprotect(protectedState);
            var unprotected = JsonSerializer.Deserialize<GoogleDriveOAuthState>(json);

            if (unprotected is null ||
                unprotected.UserId <= 0 ||
                string.IsNullOrWhiteSpace(unprotected.Nonce) ||
                string.IsNullOrWhiteSpace(unprotected.CodeVerifier))
            {
                status = GoogleDriveOAuthStateValidationStatus.InvalidPayload;
                LogDevelopment(
                    "Google Drive OAuth state validation failed: invalid payload.");
                return false;
            }

            if (unprotected.ExpiresAt <= DateTime.UtcNow)
            {
                status = GoogleDriveOAuthStateValidationStatus.Expired;
                LogDevelopment(
                    "Google Drive OAuth state expiration validation failed for user {UserId}.",
                    unprotected.UserId);
                return false;
            }

            state = unprotected;
            status = GoogleDriveOAuthStateValidationStatus.Valid;
            return true;
        }
        catch (Exception exception)
        {
            status = GoogleDriveOAuthStateValidationStatus.UnprotectFailed;
            LogDevelopment(
                exception,
                "Google Drive OAuth state validation failed: unprotect error.");
            return false;
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
