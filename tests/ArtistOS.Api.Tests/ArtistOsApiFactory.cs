using ArtistOS.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArtistOS.Api.Tests;

public sealed class ArtistOsApiFactory : WebApplicationFactory<Program>
{
    public const string TestJwtSigningKey = "artist-os-test-signing-key-for-jwt-bearer-authentication-2026";

    private readonly SqliteConnection _connection = new("Data Source=:memory:");
    private readonly Dictionary<string, string?> _configurationOverrides;
    private readonly Action<IServiceCollection>? _configureTestServices;

    public ArtistOsApiFactory(
        Dictionary<string, string?>? configurationOverrides = null,
        Action<IServiceCollection>? configureTestServices = null)
    {
        _configurationOverrides = configurationOverrides ?? [];
        _configureTestServices = configureTestServices;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            var values = new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = "ArtistOS.Api.Tests",
                ["Jwt:Audience"] = "ArtistOS.Tests",
                ["Jwt:SigningKey"] = TestJwtSigningKey,
                ["Jwt:AccessTokenMinutes"] = "20"
            };

            foreach (var (key, value) in _configurationOverrides)
            {
                values[key] = value;
            }

            configuration.AddInMemoryCollection(values);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_connection));

            _configureTestServices?.Invoke(services);

            using var scope = services.BuildServiceProvider().CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            dbContext.Database.EnsureCreated();
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
