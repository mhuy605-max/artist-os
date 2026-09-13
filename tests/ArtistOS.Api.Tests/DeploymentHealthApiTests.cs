using System.Net;
using System.Net.Http.Json;

namespace ArtistOS.Api.Tests;

public class DeploymentHealthApiTests
{
    [Fact]
    public async Task Live_health_returns_ok_without_external_dependency_checks()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health/live");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(body);
        Assert.Equal("healthy", body.Status);
        Assert.Empty(body.Checks);
    }

    [Fact]
    public async Task Ready_health_returns_ok_when_database_and_data_protection_are_available()
    {
        var keyRingPath = Path.Combine(Path.GetTempPath(), "artist-os-test-keys", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(keyRingPath);
        await using var factory = new ArtistOsApiFactory(new()
        {
            ["DataProtection:KeyRingPath"] = keyRingPath
        });
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health/ready");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(body);
        Assert.Equal("healthy", body.Status);
        Assert.Contains(body.Checks, check => check.Name == "postgresql" && check.Status == "healthy");
        Assert.Contains(body.Checks, check => check.Name == "dataProtection" && check.Status == "healthy");
    }

    [Fact]
    public void Production_accepts_blob_data_protection_configuration_as_durable_key_storage()
    {
        using var factory = new ArtistOsApiFactory(
            new()
            {
                ["AllowedHosts"] = "api.artistos.test",
                ["PublicUrls:ApiBaseUrl"] = "https://api.artistos.test",
                ["PublicUrls:FrontendBaseUrl"] = "https://app.artistos.test",
                ["Cors:AllowedOrigins:0"] = "https://app.artistos.test",
                ["DataProtection:BlobUri"] = "https://darkroomstgdp001.blob.core.windows.net/dataprotection-keys/key-ring.xml"
            },
            environmentName: "Production");

        using var client = factory.CreateClient();

        Assert.NotNull(client);
    }

    private sealed record HealthResponse(string Status, HealthCheckResponse[] Checks);

    private sealed record HealthCheckResponse(string Name, string Status);
}
