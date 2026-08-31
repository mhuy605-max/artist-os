using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class GoogleDriveIntegrationApiTests
{
    [Fact]
    public async Task Status_requires_authentication()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/integrations/google-drive/status");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Status_without_connection_returns_disconnected()
    {
        using var factory = CreateFactory();
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetFromJsonAsync<GoogleDriveConnectionStatusResponse>(
            "/api/integrations/google-drive/status");

        Assert.NotNull(response);
        Assert.False(response.Connected);
        Assert.Null(response.Email);
    }

    [Fact]
    public async Task Connect_requires_authentication()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/integrations/google-drive/connect",
            new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Connect_returns_authorization_url_with_protected_state()
    {
        using var factory = CreateFactory();
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync(
            "/api/integrations/google-drive/connect",
            new { });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<GoogleDriveConnectResponse>();

        Assert.NotNull(body);
        var state = ReadQueryValue(body.AuthorizationUrl, "state");

        Assert.StartsWith("https://accounts.google.com/", body.AuthorizationUrl);
        Assert.Contains("scope=openid%20email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file", body.AuthorizationUrl);
        Assert.Contains("state=", body.AuthorizationUrl);
        Assert.False(string.IsNullOrWhiteSpace(state));
        Assert.Contains("code_challenge_method=S256", body.AuthorizationUrl);
        Assert.Contains("code_challenge=", body.AuthorizationUrl);
        Assert.DoesNotContain("UserId", body.AuthorizationUrl, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("fake-code-verifier", body.AuthorizationUrl);
        Assert.DoesNotContain("refresh-token-secret-123", body.AuthorizationUrl);
    }

    [Fact]
    public async Task Connect_authorization_url_uses_pkce_s256()
    {
        using var factory = CreateFactory();
        var client = await factory.CreateAuthenticatedClientAsync();

        var authorizationUrl = await ConnectAndGetAuthorizationUrlAsync(client);

        Assert.False(string.IsNullOrWhiteSpace(ReadQueryValue(authorizationUrl, "code_challenge")));
        Assert.Equal("S256", ReadQueryValue(authorizationUrl, "code_challenge_method"));
    }

    [Fact]
    public async Task Callback_rejects_missing_state()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var callback = await client.GetAsync(
            "/api/integrations/google-drive/callback?code=fake-code");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Contains("googleDrive=failed", callback.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Callback_with_valid_state_stores_protected_refresh_token_and_safe_status()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        using var factory = CreateFactory(fakeGoogle);
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        await TestAuth.RegisterAsync(client);

        var authorizationUrl = await ConnectAndGetAuthorizationUrlAsync(client);
        var state = ReadQueryValue(authorizationUrl, "state");

        var callback = await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(state)}");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Contains("googleDrive=connected", callback.Headers.Location?.ToString());
        Assert.Equal(fakeGoogle.LastCodeVerifier, fakeGoogle.LastExchangedCodeVerifier);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();

        Assert.Equal("google-subject-123", connection.GoogleSubject);
        Assert.Equal("artist.google@example.com", connection.GoogleEmail);
        Assert.Equal(GoogleDriveConnectionStatuses.Connected, connection.Status);
        Assert.NotEqual("refresh-token-secret-123", connection.ProtectedRefreshToken);
        Assert.DoesNotContain("refresh-token-secret-123", connection.ProtectedRefreshToken);

        var service = scope.ServiceProvider.GetRequiredService<GoogleDriveConnectionService>();
        Assert.Equal("refresh-token-secret-123", service.UnprotectRefreshTokenForInternalUse(connection));

        var status = await client.GetFromJsonAsync<GoogleDriveConnectionStatusResponse>(
            "/api/integrations/google-drive/status");

        Assert.NotNull(status);
        Assert.True(status.Connected);
        Assert.Equal("artist.google@example.com", status.Email);
        Assert.Equal(GoogleDriveConnectionStatuses.Connected, status.Status);
    }

    [Fact]
    public async Task Status_does_not_expose_token_material()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        await TestAuth.RegisterAsync(client);

        var authorizationUrl = await ConnectAndGetAuthorizationUrlAsync(client);
        var state = ReadQueryValue(authorizationUrl, "state");
        await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(state)}");

        var rawStatus = await client.GetStringAsync("/api/integrations/google-drive/status");

        Assert.DoesNotContain("refresh-token-secret-123", rawStatus);
        Assert.DoesNotContain("access-token-secret-456", rawStatus);
        Assert.DoesNotContain("ProtectedRefreshToken", rawStatus);
    }

    [Fact]
    public async Task User_cannot_see_another_users_connection()
    {
        using var factory = CreateFactory();
        var userA = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        var userB = factory.CreateClient();
        await TestAuth.RegisterAsync(userA, "a@example.com");
        await TestAuth.RegisterAsync(userB, "b@example.com");

        var authorizationUrl = await ConnectAndGetAuthorizationUrlAsync(userA);
        var state = ReadQueryValue(authorizationUrl, "state");
        await userA.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(state)}");

        var userBStatus = await userB.GetFromJsonAsync<GoogleDriveConnectionStatusResponse>(
            "/api/integrations/google-drive/status");

        Assert.NotNull(userBStatus);
        Assert.False(userBStatus.Connected);
    }

    [Fact]
    public async Task Callback_rejects_invalid_state()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var callback = await client.GetAsync(
            "/api/integrations/google-drive/callback?code=fake-code&state=not-valid");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Contains("googleDrive=invalid-state", callback.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Callback_rejects_expired_state()
    {
        using var factory = CreateFactory();
        using var scope = factory.Services.CreateScope();
        var protector = scope.ServiceProvider.GetRequiredService<GoogleDriveOAuthStateProtector>();
        var expiredState = protector.Protect(new GoogleDriveOAuthState
        {
            UserId = 1,
            Nonce = Guid.NewGuid().ToString("N"),
            CodeVerifier = "fake-code-verifier",
            IssuedAt = DateTime.UtcNow.AddMinutes(-20),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-10)
        });
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var callback = await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(expiredState)}");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Contains("googleDrive=invalid-state", callback.Headers.Location?.ToString());
    }

    [Fact]
    public async Task Callback_denied_oauth_redirects_without_connection()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        var callback = await client.GetAsync("/api/integrations/google-drive/callback?error=access_denied");

        Assert.Equal(HttpStatusCode.Redirect, callback.StatusCode);
        Assert.Contains("googleDrive=denied", callback.Headers.Location?.ToString());

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(await dbContext.GoogleDriveConnections.ToListAsync());
    }

    [Fact]
    public async Task Reconnect_without_refresh_token_preserves_existing_protected_refresh_token()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        using var factory = CreateFactory(fakeGoogle);
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        await TestAuth.RegisterAsync(client);

        var firstAuthorizationUrl = await ConnectAndGetAuthorizationUrlAsync(client);
        var firstState = ReadQueryValue(firstAuthorizationUrl, "state");
        await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(firstState)}");

        fakeGoogle.TokenResult = new GoogleDriveOAuthTokenResult
        {
            AccessToken = "new-access-token",
            RefreshToken = null,
            Scope = "openid email https://www.googleapis.com/auth/drive.file",
            IdToken = "fake-id-token"
        };

        var secondAuthorizationUrl = await ConnectAndGetAuthorizationUrlAsync(client);
        var secondState = ReadQueryValue(secondAuthorizationUrl, "state");
        await client.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(secondState)}");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();
        var service = scope.ServiceProvider.GetRequiredService<GoogleDriveConnectionService>();

        Assert.Equal("refresh-token-secret-123", service.UnprotectRefreshTokenForInternalUse(connection));
        Assert.Equal(GoogleDriveConnectionStatuses.Connected, connection.Status);
    }

    [Fact]
    public async Task Disconnect_requires_authentication()
    {
        using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/integrations/google-drive/disconnect",
            new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Disconnect_removes_current_users_connection_and_revokes_token()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient();
        using var factory = CreateFactory(fakeGoogle);
        var userA = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        var userB = factory.CreateClient();
        await TestAuth.RegisterAsync(userA, "a@example.com");
        await TestAuth.RegisterAsync(userB, "b@example.com");

        var authorizationUrl = await ConnectAndGetAuthorizationUrlAsync(userA);
        var state = ReadQueryValue(authorizationUrl, "state");
        await userA.GetAsync(
            $"/api/integrations/google-drive/callback?code=fake-code&state={Uri.EscapeDataString(state)}");

        var userBDisconnect = await userB.PostAsJsonAsync(
            "/api/integrations/google-drive/disconnect",
            new { });
        userBDisconnect.EnsureSuccessStatusCode();

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Assert.Single(await dbContext.GoogleDriveConnections.ToListAsync());
        }

        var response = await userA.PostAsJsonAsync(
            "/api/integrations/google-drive/disconnect",
            new { });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<GoogleDriveDisconnectResponse>();
        Assert.NotNull(body);
        Assert.True(body.Disconnected);
        Assert.Contains("refresh-token-secret-123", fakeGoogle.RevokedTokens);

        using var finalScope = factory.Services.CreateScope();
        var finalDbContext = finalScope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(await finalDbContext.GoogleDriveConnections.ToListAsync());
    }

    private static ArtistOsApiFactory CreateFactory(
        FakeGoogleDriveOAuthClient? fakeGoogle = null,
        Dictionary<string, string?>? configurationOverrides = null)
    {
        fakeGoogle ??= new FakeGoogleDriveOAuthClient();

        return new ArtistOsApiFactory(configurationOverrides, services =>
        {
            services.RemoveAll<IGoogleDriveOAuthClient>();
            services.AddSingleton<IGoogleDriveOAuthClient>(fakeGoogle);
        });
    }

    private static async Task<string> ConnectAndGetAuthorizationUrlAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync(
            "/api/integrations/google-drive/connect",
            new { });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<GoogleDriveConnectResponse>();
        Assert.NotNull(body);
        return body.AuthorizationUrl;
    }

    private static string ReadQueryValue(string url, string key)
    {
        var uri = new Uri(url);
        var query = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .ToDictionary(
                pair => Uri.UnescapeDataString(pair[0]),
                pair => pair.Length > 1 ? Uri.UnescapeDataString(pair[1]) : string.Empty);

        return query[key];
    }
}
