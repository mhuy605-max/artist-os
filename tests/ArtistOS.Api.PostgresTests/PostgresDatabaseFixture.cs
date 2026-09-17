using ArtistOS.Api.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Testcontainers.PostgreSql;

namespace ArtistOS.Api.PostgresTests;

public sealed class PostgresDatabaseFixture : IAsyncLifetime
{
    private const string TemplateDatabase = "darkroom_template";

    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase(TemplateDatabase)
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public string TemplateConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var templateConnectionString = new NpgsqlConnectionStringBuilder(TemplateConnectionString)
        {
            Pooling = false
        }.ConnectionString;

        await using var context = CreateContext(templateConnectionString);
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    public AppDbContext CreateContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }

    public async Task<PostgresTestDatabase> CreateMigratedDatabaseAsync()
    {
        var databaseName = $"darkroom_test_{Guid.NewGuid():N}";
        await using var connection = new NpgsqlConnection(GetMaintenanceConnectionString());
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText =
            $"""
            CREATE DATABASE {QuoteIdentifier(databaseName)}
            WITH TEMPLATE {QuoteIdentifier(TemplateDatabase)}
            """;
        await command.ExecuteNonQueryAsync();

        return new PostgresTestDatabase(this, databaseName, GetConnectionString(databaseName));
    }

    public async Task<PostgresTestDatabase> CreateEmptyDatabaseAsync()
    {
        var databaseName = $"darkroom_empty_{Guid.NewGuid():N}";
        await using var connection = new NpgsqlConnection(GetMaintenanceConnectionString());
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"CREATE DATABASE {QuoteIdentifier(databaseName)}";
        await command.ExecuteNonQueryAsync();

        return new PostgresTestDatabase(this, databaseName, GetConnectionString(databaseName));
    }

    internal async Task DropDatabaseAsync(string databaseName)
    {
        await using var connection = new NpgsqlConnection(GetMaintenanceConnectionString());
        await connection.OpenAsync();

        await using (var terminate = connection.CreateCommand())
        {
            terminate.CommandText =
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = @databaseName
                    AND pid <> pg_backend_pid()
                """;
            terminate.Parameters.AddWithValue("databaseName", databaseName);
            await terminate.ExecuteNonQueryAsync();
        }

        await using var drop = connection.CreateCommand();
        drop.CommandText = $"DROP DATABASE IF EXISTS {QuoteIdentifier(databaseName)}";
        await drop.ExecuteNonQueryAsync();
    }

    private string GetConnectionString(string databaseName)
    {
        var builder = new NpgsqlConnectionStringBuilder(TemplateConnectionString)
        {
            Database = databaseName
        };
        return builder.ConnectionString;
    }

    private string GetMaintenanceConnectionString()
    {
        var builder = new NpgsqlConnectionStringBuilder(TemplateConnectionString)
        {
            Database = "postgres"
        };
        return builder.ConnectionString;
    }

    private static string QuoteIdentifier(string identifier) => $"\"{identifier.Replace("\"", "\"\"")}\"";
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresDatabaseFixture>
{
    public const string Name = "PostgreSQL";
}

public sealed class PostgresTestDatabase : IAsyncDisposable
{
    private readonly PostgresDatabaseFixture _fixture;

    internal PostgresTestDatabase(
        PostgresDatabaseFixture fixture,
        string databaseName,
        string connectionString)
    {
        _fixture = fixture;
        DatabaseName = databaseName;
        ConnectionString = connectionString;
    }

    public string DatabaseName { get; }

    public string ConnectionString { get; }

    public AppDbContext CreateContext() => _fixture.CreateContext(ConnectionString);

    public async ValueTask DisposeAsync()
    {
        await _fixture.DropDatabaseAsync(DatabaseName);
    }
}
