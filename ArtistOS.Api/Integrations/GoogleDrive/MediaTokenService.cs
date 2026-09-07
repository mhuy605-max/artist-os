using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaTokenService
{
    public static readonly TimeSpan TokenLifetime = TimeSpan.FromMinutes(5);

    private readonly ITimeLimitedDataProtector _protector;

    public MediaTokenService(IDataProtectionProvider dataProtectionProvider)
    {
        _protector = dataProtectionProvider
            .CreateProtector("ArtistOS.MediaAccessToken.v1")
            .ToTimeLimitedDataProtector();
    }

    public MediaAccessTokenResult Protect(MediaAccessTokenPayload payload)
    {
        var expiresAt = DateTime.UtcNow.Add(TokenLifetime);
        var serialized = JsonSerializer.Serialize(payload);

        return new MediaAccessTokenResult
        {
            Token = _protector.Protect(serialized, TokenLifetime),
            ExpiresAt = expiresAt
        };
    }

    public bool TryUnprotect(string? protectedToken, out MediaAccessTokenPayload payload)
    {
        payload = new MediaAccessTokenPayload();

        if (string.IsNullOrWhiteSpace(protectedToken))
        {
            return false;
        }

        try
        {
            var serialized = _protector.Unprotect(protectedToken);
            var parsed = JsonSerializer.Deserialize<MediaAccessTokenPayload>(serialized);
            if (parsed is null)
            {
                return false;
            }

            payload = parsed;
            return true;
        }
        catch
        {
            return false;
        }
    }
}
