using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.PostgresTests;

[Collection(PostgresCollection.Name)]
public sealed class SchemaUsabilityTests(PostgresDatabaseFixture fixture)
{
    [Fact]
    public async Task PG002_CurrentModel_CanInsertAndReadRepresentativePostgreSqlTypes()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var familyId = Guid.NewGuid();
        var releaseDate = new DateOnly(2027, 2, 14);
        var snapshotDate = new DateOnly(2027, 2, 15);
        var uploadedAt = DateTime.UtcNow;

        await using (var context = database.CreateContext())
        {
            var owner = PostgresTestData.User("pg-usability-owner@example.com");
            var song = PostgresTestData.Song(owner);
            context.AddRange(
                owner,
                song,
                new Release
                {
                    Song = song,
                    ReleaseDate = releaseDate,
                    ReleaseType = "Single",
                    Status = "Planning",
                    Platforms = "Spotify",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new AnalyticsSnapshot
                {
                    Song = song,
                    Platform = "YouTube",
                    SnapshotDate = snapshotDate,
                    Views = 100,
                    Likes = 12,
                    Comments = 3,
                    WatchTimeMinutes = 400,
                    SubscribersGained = 2,
                    CreatedAt = DateTime.UtcNow
                },
                new AudioAsset
                {
                    Song = song,
                    AssetFamilyId = familyId,
                    Version = 1,
                    IsCurrent = true,
                    Type = "Demo",
                    FileName = "demo.wav",
                    Status = "Draft",
                    UploadedAt = uploadedAt
                });

            await context.SaveChangesAsync();
        }

        await using (var context = database.CreateContext())
        {
            var asset = await context.AudioAssets.SingleAsync();
            var release = await context.Releases.SingleAsync();
            var snapshot = await context.AnalyticsSnapshots.SingleAsync();

            Assert.True(asset.Id > 0);
            Assert.Equal(familyId, asset.AssetFamilyId);
            Assert.Equal(DateTimeKind.Utc, asset.UploadedAt.Kind);
            Assert.Equal(releaseDate, release.ReleaseDate);
            Assert.Equal(snapshotDate, snapshot.SnapshotDate);
        }
    }
}
