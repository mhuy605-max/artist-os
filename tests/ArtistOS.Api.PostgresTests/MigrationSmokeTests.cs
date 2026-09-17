using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.PostgresTests;

[Collection(PostgresCollection.Name)]
public sealed class MigrationSmokeTests(PostgresDatabaseFixture fixture)
{
    [Fact]
    public async Task PG001_MigrationChain_AppliesFromEmptyPostgreSqlDatabase()
    {
        await using var database = await fixture.CreateEmptyDatabaseAsync();
        await using var context = database.CreateContext();

        await context.Database.MigrateAsync();

        var expectedLatestMigration = context.Database.GetMigrations().Last();
        var appliedMigrations = await context.Database.GetAppliedMigrationsAsync();

        Assert.Contains(expectedLatestMigration, appliedMigrations);
        Assert.Contains("__EFMigrationsHistory", await GetTableNamesAsync(context));
    }

    private static async Task<IReadOnlyList<string>> GetTableNamesAsync(DbContext context)
    {
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText =
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            """;

        var names = new List<string>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            names.Add(reader.GetString(0));
        }

        return names;
    }
}
