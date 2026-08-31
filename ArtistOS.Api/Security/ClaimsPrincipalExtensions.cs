using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ArtistOS.Api.Security;

public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
            user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }
}
