using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArtistOS.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArtistOS.Api.Auth;

public class JwtTokenService
{
    private readonly JwtOptions _options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public JwtTokenResult CreateAccessToken(User user)
    {
        if (string.IsNullOrWhiteSpace(_options.SigningKey))
        {
            throw new InvalidOperationException("JWT signing key is not configured.");
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtTokenResult
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAt = expiresAt
        };
    }
}
