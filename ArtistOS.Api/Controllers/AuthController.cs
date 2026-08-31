using System.Security.Claims;
using ArtistOS.Api.Auth;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using ArtistOS.Api.Security;
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
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(
        AppDbContext context,
        PasswordHasher<User> passwordHasher,
        JwtTokenService jwtTokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
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

        return CreatedAtAction(nameof(Me), ToAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
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

        return ToAuthResponse(user);
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserResponse>> Me()
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId.Value);

        return user is null ? Unauthorized() : ToResponse(user);
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

    private AuthResponse ToAuthResponse(User user)
    {
        var token = _jwtTokenService.CreateAccessToken(user);

        return new AuthResponse
        {
            AccessToken = token.AccessToken,
            TokenType = "Bearer",
            ExpiresAt = token.ExpiresAt,
            User = ToResponse(user)
        };
    }
}
