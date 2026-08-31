using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class AuthApiTests
{
    [Fact]
    public async Task Register_WithValidPayload_CreatesUserAndSignsIn()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = " Artist@Example.com ",
            password = "password123",
            displayName = "  Artist One  "
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, cookie => cookie.Contains("artist_os_session"));

        var user = await response.Content.ReadFromJsonAsync<AuthUserResponse>();
        Assert.NotNull(user);
        Assert.True(user.Id > 0);
        Assert.Equal("Artist@Example.com", user.Email);
        Assert.Equal("Artist One", user.DisplayName);

        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("password", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("passwordHash", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsConflict()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        await Register(client, "artist@example.com");

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "ARTIST@example.com",
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest(string email)
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithShortPassword_ReturnsBadRequest()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "artist@example.com",
            password = "short"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_SignsIn()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        await Register(client, "artist@example.com", "password123");

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "artist@example.com",
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, cookie => cookie.Contains("artist_os_session"));

        var user = await response.Content.ReadFromJsonAsync<AuthUserResponse>();
        Assert.NotNull(user);
        Assert.Equal("artist@example.com", user.Email);
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        await Register(client, "artist@example.com", "password123");

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "artist@example.com",
            password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownAccount_ReturnsUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "missing@example.com",
            password = "password123"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WhenAuthenticated_ReturnsSafeUserInfo()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var registered = await Register(client, "artist@example.com", "password123", "Artist");

        var user = await client.GetFromJsonAsync<AuthUserResponse>("/api/auth/me");

        Assert.NotNull(user);
        Assert.Equal(registered.Id, user.Id);
        Assert.Equal("artist@example.com", user.Email);
        Assert.Equal("Artist", user.DisplayName);
    }

    [Fact]
    public async Task Me_WhenUnauthenticated_ReturnsUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_WhenAuthenticated_ClearsSession()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        await Register(client);

        var response = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, cookie => cookie.Contains("artist_os_session") && cookie.Contains("expires=", StringComparison.OrdinalIgnoreCase));

        var meResponse = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedSongCreate_AssignsCurrentUserAsOwner()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        var user = await Register(client);

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Owned Song",
            status = "Demo",
            ownerUserId = 999999
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var song = await response.Content.ReadFromJsonAsync<SongResponse>();
        Assert.NotNull(song);
        Assert.Equal(user.Id, song.OwnerUserId);
    }

    [Fact]
    public async Task AnonymousSongCreate_ReturnsUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Legacy Song",
            status = "Demo",
            ownerUserId = 999999
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RegisteredPassword_IsHashedInDatabase()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();
        await Register(client, password: "password123");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await dbContext.Users.SingleAsync();

        Assert.NotEqual("password123", user.PasswordHash);
        Assert.NotEmpty(user.PasswordHash);
    }

    private static async Task<AuthUserResponse> Register(
        HttpClient client,
        string email = "artist@example.com",
        string password = "password123",
        string? displayName = null)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            displayName
        });

        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<AuthUserResponse>())!;
    }
}
