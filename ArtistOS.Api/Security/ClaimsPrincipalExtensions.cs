using System.Security.Claims;

namespace ArtistOS.Api.Security;

public static class ClaimsPrincipalExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }
}
