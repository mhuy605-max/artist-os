using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public class DriveWorkspacesApiTests
{
    [Fact]
    public async Task GetWorkspace_requires_authentication()
    {
        await using var factory = CreateFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/songs/1/drive-workspace");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProvisionWorkspace_for_owned_song_succeeds()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        response.EnsureSuccessStatusCode();
        var workspace = await response.Content.ReadFromJsonAsync<DriveWorkspaceResponse>();
        Assert.NotNull(workspace);
        Assert.True(workspace.IsProvisioned);
        Assert.Equal("DARKROOM SYSTEM", workspace.RootFolder?.Name);
        Assert.Equal("Songs", workspace.SongsFolder?.Name);
        Assert.Equal($"{song.Id} - Night Protocol", workspace.SongFolder?.Name);
        Assert.Equal("Audio", workspace.Folders.Audio?.Name);
        Assert.Equal("Visuals", workspace.Folders.Visuals?.Name);
        Assert.Equal("Release", workspace.Folders.Release?.Name);
        Assert.Equal("Content", workspace.Folders.Content?.Name);
    }

    [Fact]
    public async Task ProvisionWorkspace_for_cross_user_song_returns_not_found()
    {
        await using var factory = CreateFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("b@example.com");
        var song = await CreateSong(userA);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await userB.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ProvisionWorkspace_without_google_connection_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);

        var response = await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task ProvisionWorkspace_with_reauth_required_connection_returns_conflict()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(
            factory,
            song.OwnerUserId!.Value,
            GoogleDriveConnectionStatuses.ReauthRequired);

        var response = await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task ProvisionWorkspace_creates_root_and_song_folders()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "DARKROOM SYSTEM");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "Songs");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == $"{song.Id} - Night Protocol");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "Audio");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "Visuals");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "Release");
        Assert.Contains(fakeDrive.CreatedFolders, folder => folder.Name == "Content");
    }

    [Fact]
    public async Task Repeated_provisioning_is_idempotent()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);
        var firstCreateCount = fakeDrive.CreatedFolders.Count;
        await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Equal(7, firstCreateCount);
        Assert.Equal(firstCreateCount, fakeDrive.CreatedFolders.Count);
    }

    [Fact]
    public async Task Persisted_external_references_are_reused()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);
        await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(6, await dbContext.ExternalFileReferences.CountAsync());
    }

    [Fact]
    public async Task Deleted_root_reference_is_recovered()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var first = await ProvisionAndReadAsync(client, song.Id);
        fakeDrive.DeleteFolder(first.RootFolder!.ExternalId);

        var second = await ProvisionAndReadAsync(client, song.Id);

        Assert.True(second.IsProvisioned);
        Assert.NotEqual(first.RootFolder.ExternalId, second.RootFolder!.ExternalId);
    }

    [Fact]
    public async Task Deleted_song_folder_reference_is_recovered()
    {
        var fakeDrive = new FakeGoogleDriveApiClient();
        await using var factory = CreateFactory(fakeDrive: fakeDrive);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);
        var first = await ProvisionAndReadAsync(client, song.Id);
        fakeDrive.DeleteFolder(first.SongFolder!.ExternalId);

        var second = await ProvisionAndReadAsync(client, song.Id);

        Assert.True(second.IsProvisioned);
        Assert.NotEqual(first.SongFolder.ExternalId, second.SongFolder!.ExternalId);
    }

    [Fact]
    public async Task Connection_ownership_is_isolated()
    {
        await using var factory = CreateFactory();
        using var userA = await factory.CreateAuthenticatedClientAsync("a@example.com");
        using var userB = await factory.CreateAuthenticatedClientAsync("b@example.com");
        var songA = await CreateSong(userA);
        var songB = await CreateSong(userB);
        await CreateGoogleConnectionAsync(factory, songA.OwnerUserId!.Value);

        var userAResponse = await userA.PostAsync($"/api/songs/{songA.Id}/drive-workspace/provision", null);
        var userBResponse = await userB.PostAsync($"/api/songs/{songB.Id}/drive-workspace/provision", null);

        userAResponse.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Conflict, userBResponse.StatusCode);
    }

    [Fact]
    public async Task Workspace_response_does_not_return_token_material()
    {
        await using var factory = CreateFactory();
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);
        var raw = await response.Content.ReadAsStringAsync();

        Assert.DoesNotContain("refresh-token-secret-123", raw);
        Assert.DoesNotContain("fake-access-token", raw);
        Assert.DoesNotContain("ProtectedRefreshToken", raw);
    }

    [Fact]
    public async Task Refresh_failure_marks_connection_reauth_required()
    {
        var fakeGoogle = new FakeGoogleDriveOAuthClient { FailRefresh = true };
        await using var factory = CreateFactory(fakeGoogle);
        using var client = await factory.CreateAuthenticatedClientAsync();
        var song = await CreateSong(client);
        await CreateGoogleConnectionAsync(factory, song.OwnerUserId!.Value);

        var response = await client.PostAsync($"/api/songs/{song.Id}/drive-workspace/provision", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var connection = await dbContext.GoogleDriveConnections.SingleAsync();
        Assert.Equal(GoogleDriveConnectionStatuses.ReauthRequired, connection.Status);
    }

    private static ArtistOsApiFactory CreateFactory(
        FakeGoogleDriveOAuthClient? fakeGoogle = null,
        FakeGoogleDriveApiClient? fakeDrive = null)
    {
        fakeGoogle ??= new FakeGoogleDriveOAuthClient();
        fakeDrive ??= new FakeGoogleDriveApiClient();

        return new ArtistOsApiFactory(configureTestServices: services =>
        {
            services.RemoveAll<IGoogleDriveOAuthClient>();
            services.RemoveAll<IGoogleDriveApiClient>();
            services.AddSingleton<IGoogleDriveOAuthClient>(fakeGoogle);
            services.AddSingleton<IGoogleDriveApiClient>(fakeDrive);
        });
    }

    private static async Task<SongResponse> CreateSong(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title = "Night Protocol",
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }

    private static async Task CreateGoogleConnectionAsync(
        ArtistOsApiFactory factory,
        int userId,
        string status = GoogleDriveConnectionStatuses.Connected)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dataProtectionProvider = scope.ServiceProvider.GetRequiredService<IDataProtectionProvider>();
        var protector = dataProtectionProvider.CreateProtector("ArtistOS.GoogleDrive.RefreshToken.v1");

        dbContext.GoogleDriveConnections.Add(new GoogleDriveConnection
        {
            UserId = userId,
            GoogleSubject = $"google-subject-{userId}",
            GoogleEmail = $"artist-{userId}@example.com",
            GoogleEmailVerified = true,
            GrantedScopes = "openid email https://www.googleapis.com/auth/drive.file",
            ProtectedRefreshToken = protector.Protect("refresh-token-secret-123"),
            Status = status,
            ConnectedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            LastSuccessfulRefreshAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();
    }

    private static async Task<DriveWorkspaceResponse> ProvisionAndReadAsync(HttpClient client, int songId)
    {
        var response = await client.PostAsync($"/api/songs/{songId}/drive-workspace/provision", null);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<DriveWorkspaceResponse>())!;
    }
}
