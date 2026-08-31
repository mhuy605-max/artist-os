using System.Security.Claims;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher;

    public AuthController(AppDbContext context, PasswordHasher<User> passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthUserResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var normalizedEmail = NormalizeEmail(email);

        if (await _context.Users.AnyAsync(user => user.NormalizedEmail == normalizedEmail))
        {
            return Conflict("An account with this email already exists.");
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Email = email,
            NormalizedEmail = normalizedEmail,
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? null
                : request.DisplayName.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await SignInUser(user);

        return CreatedAtAction(nameof(Me), ToResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthUserResponse>> Login(LoginRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        var user = await _context.Users.FirstOrDefaultAsync(user =>
            user.NormalizedEmail == normalizedEmail);

        if (user is null)
        {
            return Unauthorized("Invalid email or password.");
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Invalid email or password.");
        }

        await SignInUser(user);

        return ToResponse(user);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserResponse>> Me()
    {
        var userId = CurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId.Value);

        return user is null ? Unauthorized() : ToResponse(user);
    }

    private async Task SignInUser(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email)
        };

        if (!string.IsNullOrWhiteSpace(user.DisplayName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.DisplayName));
        }

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
    }

    private int? CurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(id, out var userId) ? userId : null;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }

    private static AuthUserResponse ToResponse(User user)
    {
        return new AuthUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName
        };
    }
}
