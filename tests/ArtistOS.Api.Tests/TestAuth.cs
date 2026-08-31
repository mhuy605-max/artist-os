using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public static class TestAuth
{
    public static async Task<HttpClient> CreateAuthenticatedClientAsync(
        this ArtistOsApiFactory factory,
        string email = "artist@example.com",
        string password = "password123",
        string? displayName = null)
    {
        var client = factory.CreateClient();
        await RegisterAsync(client, email, password, displayName);
        return client;
    }

    public static async Task<AuthUserResponse> RegisterAsync(
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
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        UseBearerToken(client, auth.AccessToken);
        return auth.User;
    }

    public static async Task<AuthResponse> LoginForTokenAsync(
        HttpClient client,
        string email = "artist@example.com",
        string password = "password123")
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password
        });

        response.EnsureSuccessStatusCode();
        var auth = (await response.Content.ReadFromJsonAsync<AuthResponse>())!;
        UseBearerToken(client, auth.AccessToken);
        return auth;
    }

    public static void UseBearerToken(HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
    }
}
