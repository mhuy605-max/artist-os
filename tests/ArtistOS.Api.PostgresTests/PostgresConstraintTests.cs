using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ArtistOS.Api.PostgresTests;

[Collection(PostgresCollection.Name)]
public sealed class PostgresConstraintTests(PostgresDatabaseFixture fixture)
{
    private const string UniqueViolation = PostgresErrorCodes.UniqueViolation;
    private const string CheckViolation = PostgresErrorCodes.CheckViolation;

    [Fact]
    public async Task PG003_AssetVersionConstraints_AreEnforcedForAudioAndVisualAssets()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();

        await AssertAssetVersionRulesAsync(
            database,
            "IX_AudioAssets_AssetFamilyId_Version",
            "IX_AudioAssets_AssetFamilyId_Current",
            (song, family, version, isCurrent) =>
                PostgresTestData.AudioAsset(song, family, version, isCurrent));

        await AssertAssetVersionRulesAsync(
            database,
            "IX_VisualAssets_AssetFamilyId_Version",
            "IX_VisualAssets_AssetFamilyId_Current",
            (song, family, version, isCurrent) =>
                PostgresTestData.VisualAsset(song, family, version, isCurrent));
    }

    [Fact]
    public async Task PG004_PendingInvitationUniqueness_IsEnforcedByPartialIndex()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var graph = await CreateCollaborationGraphAsync(database);

        await using (var context = database.CreateContext())
        {
            context.SongInvitations.AddRange(
                new SongInvitation
                {
                    SongId = graph.SongId,
                    InvitedUserId = graph.InvitedUserId,
                    InvitedByUserId = graph.OwnerUserId,
                    Role = SongMemberRole.EDITOR,
                    Status = SongInvitationStatus.DECLINED,
                    RespondedAt = DateTime.UtcNow
                },
                new SongInvitation
                {
                    SongId = graph.SongId,
                    InvitedUserId = graph.InvitedUserId,
                    InvitedByUserId = graph.OwnerUserId,
                    Role = SongMemberRole.EDITOR,
                    Status = SongInvitationStatus.PENDING
                });
            await context.SaveChangesAsync();
        }

        await using var duplicateContext = database.CreateContext();
        duplicateContext.SongInvitations.Add(new SongInvitation
        {
            SongId = graph.SongId,
            InvitedUserId = graph.InvitedUserId,
            InvitedByUserId = graph.OwnerUserId,
            Role = SongMemberRole.VIEWER,
            Status = SongInvitationStatus.PENDING
        });

        await PostgresAssert.ConstraintViolationAsync(
            () => duplicateContext.SaveChangesAsync(),
            UniqueViolation,
            "IX_SongInvitations_SongId_InvitedUserId_Pending");
    }

    [Fact]
    public async Task PG005_CollaborationCheckConstraints_RejectInvalidRawValues()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var graph = await CreateCollaborationGraphAsync(database);

        await using var context = database.CreateContext();

        await PostgresAssert.RawConstraintViolationAsync(
            () => context.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "SongMembers" ("SongId", "UserId", "Role", "JoinedAt", "UpdatedAt")
                VALUES ({0}, {1}, 'OWNER', {2}, {3})
                """,
                graph.SongId,
                graph.InvitedUserId,
                DateTime.UtcNow,
                DateTime.UtcNow),
            CheckViolation,
            "CK_SongMembers_Role");

        await PostgresAssert.RawConstraintViolationAsync(
            () => context.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "SongInvitations" ("SongId", "InvitedUserId", "InvitedByUserId", "Role", "Status", "CreatedAt")
                VALUES ({0}, {1}, {2}, 'OWNER', 'PENDING', {3})
                """,
                graph.SongId,
                graph.InvitedUserId,
                graph.OwnerUserId,
                DateTime.UtcNow),
            CheckViolation,
            "CK_SongInvitations_Role");

        await PostgresAssert.RawConstraintViolationAsync(
            () => context.Database.ExecuteSqlRawAsync(
                """
                INSERT INTO "SongInvitations" ("SongId", "InvitedUserId", "InvitedByUserId", "Role", "Status", "CreatedAt")
                VALUES ({0}, {1}, {2}, 'EDITOR', 'OPEN', {3})
                """,
                graph.SongId,
                graph.InvitedUserId,
                graph.OwnerUserId,
                DateTime.UtcNow),
            CheckViolation,
            "CK_SongInvitations_Status");
    }

    [Fact]
    public async Task PG006_ReleaseAndChecklistUniqueness_AreEnforced()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var songId = await CreateSongAsync(database, "Release uniqueness");

        await using (var context = database.CreateContext())
        {
            context.Releases.Add(new Release
            {
                SongId = songId,
                ReleaseType = "Single",
                Status = "Planning",
                Platforms = "Spotify",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        await using (var duplicateReleaseContext = database.CreateContext())
        {
            duplicateReleaseContext.Releases.Add(new Release
            {
                SongId = songId,
                ReleaseType = "EP",
                Status = "Planning",
                Platforms = "Apple Music",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await PostgresAssert.ConstraintViolationAsync(
                () => duplicateReleaseContext.SaveChangesAsync(),
                UniqueViolation,
                "IX_Releases_SongId");
        }

        int releaseId;
        await using (var context = database.CreateContext())
        {
            releaseId = await context.Releases
                .Where(release => release.SongId == songId)
                .Select(release => release.Id)
                .SingleAsync();

            context.ReleaseChecklistItems.Add(new ReleaseChecklistItem
            {
                ReleaseId = releaseId,
                Key = "Master",
                Label = "Master",
                IsCompleted = false,
                SortOrder = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        await using var duplicateChecklistContext = database.CreateContext();
        duplicateChecklistContext.ReleaseChecklistItems.Add(new ReleaseChecklistItem
        {
            ReleaseId = releaseId,
            Key = "Master",
            Label = "Duplicate Master",
            IsCompleted = false,
            SortOrder = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await PostgresAssert.ConstraintViolationAsync(
            () => duplicateChecklistContext.SaveChangesAsync(),
            UniqueViolation,
            "IX_ReleaseChecklistItems_ReleaseId_Key");
    }

    [Fact]
    public async Task PG007_AnalyticsSnapshotUniqueness_IsScopedBySongPlatformAndDate()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var songId = await CreateSongAsync(database, "Analytics uniqueness");
        var snapshotDate = new DateOnly(2027, 4, 12);

        await using (var context = database.CreateContext())
        {
            context.AnalyticsSnapshots.AddRange(
                Snapshot(songId, "YouTube", snapshotDate),
                Snapshot(songId, "TikTok", snapshotDate));
            await context.SaveChangesAsync();
        }

        await using var duplicateContext = database.CreateContext();
        duplicateContext.AnalyticsSnapshots.Add(Snapshot(songId, "YouTube", snapshotDate));

        await PostgresAssert.ConstraintViolationAsync(
            () => duplicateContext.SaveChangesAsync(),
            UniqueViolation,
            "IX_AnalyticsSnapshots_SongId_Platform_SnapshotDate");
    }

    [Fact]
    public async Task PG008_ExternalFileReferenceUniquenessAndDeleteBehavior_MatchSchema()
    {
        await using var database = await fixture.CreateMigratedDatabaseAsync();
        var (ownerId, songId, connectionId, referenceId) = await CreateExternalFileGraphAsync(database);

        await using (var duplicateContext = database.CreateContext())
        {
            duplicateContext.ExternalFileReferences.Add(new ExternalFileReference
            {
                OwnerUserId = ownerId,
                SongId = songId,
                GoogleDriveConnectionId = connectionId,
                Provider = ExternalFileProviders.GoogleDrive,
                ExternalId = "drive-file-1",
                ResourceType = ExternalResourceTypes.AudioAssetFile,
                IsFolder = false,
                DisplayName = "duplicate.wav",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });

            await PostgresAssert.ConstraintViolationAsync(
                () => duplicateContext.SaveChangesAsync(),
                UniqueViolation,
                "IX_ExternalFileReferences_OwnerUserId_Provider_ExternalId");
        }

        await using (var setNullContext = database.CreateContext())
        {
            var connection = await setNullContext.GoogleDriveConnections.SingleAsync(existing =>
                existing.Id == connectionId);
            setNullContext.GoogleDriveConnections.Remove(connection);
            await setNullContext.SaveChangesAsync();
        }

        await using (var assertionContext = database.CreateContext())
        {
            var reference = await assertionContext.ExternalFileReferences.SingleAsync(existing =>
                existing.Id == referenceId);
            Assert.Null(reference.GoogleDriveConnectionId);
        }

        await using (var cascadeContext = database.CreateContext())
        {
            var song = await cascadeContext.Songs.SingleAsync(existing => existing.Id == songId);
            cascadeContext.Songs.Remove(song);
            await cascadeContext.SaveChangesAsync();
        }

        await using (var assertionContext = database.CreateContext())
        {
            Assert.False(await assertionContext.ExternalFileReferences.AnyAsync(existing =>
                existing.Id == referenceId));
        }
    }

    private static async Task AssertAssetVersionRulesAsync<TAsset>(
        PostgresTestDatabase database,
        string duplicateVersionConstraint,
        string oneCurrentConstraint,
        Func<Song, Guid, int, bool, TAsset> createAsset)
        where TAsset : class
    {
        var historicalFamilyId = Guid.NewGuid();
        var duplicateVersionFamilyId = Guid.NewGuid();
        var currentFamilyId = Guid.NewGuid();

        var songId = await CreateSongAsync(database, $"{typeof(TAsset).Name} constraints");

        await using (var context = database.CreateContext())
        {
            var song = await context.Songs.SingleAsync(existing => existing.Id == songId);
            context.AddRange(
                createAsset(song, historicalFamilyId, 1, false),
                createAsset(song, historicalFamilyId, 2, false),
                createAsset(song, historicalFamilyId, 3, true));
            await context.SaveChangesAsync();
        }

        await using (var duplicateVersionContext = database.CreateContext())
        {
            var song = await duplicateVersionContext.Songs.SingleAsync(existing => existing.Id == songId);
            duplicateVersionContext.AddRange(
                createAsset(song, duplicateVersionFamilyId, 1, false),
                createAsset(song, duplicateVersionFamilyId, 1, false));

            await PostgresAssert.ConstraintViolationAsync(
                () => duplicateVersionContext.SaveChangesAsync(),
                UniqueViolation,
                duplicateVersionConstraint);
        }

        await using var currentContext = database.CreateContext();
        var currentSong = await currentContext.Songs.SingleAsync(existing => existing.Id == songId);
        currentContext.AddRange(
            createAsset(currentSong, currentFamilyId, 1, true),
            createAsset(currentSong, currentFamilyId, 2, true));

        await PostgresAssert.ConstraintViolationAsync(
            () => currentContext.SaveChangesAsync(),
            UniqueViolation,
            oneCurrentConstraint);
    }

    private static async Task<(int OwnerUserId, int InvitedUserId, int SongId)> CreateCollaborationGraphAsync(
        PostgresTestDatabase database)
    {
        await using var context = database.CreateContext();
        var owner = PostgresTestData.User($"owner-{Guid.NewGuid():N}@example.com");
        var invited = PostgresTestData.User($"invited-{Guid.NewGuid():N}@example.com");
        var song = PostgresTestData.Song(owner, "Collaboration constraints");
        context.AddRange(owner, invited, song);
        await context.SaveChangesAsync();

        return (owner.Id, invited.Id, song.Id);
    }

    private static async Task<int> CreateSongAsync(PostgresTestDatabase database, string title)
    {
        await using var context = database.CreateContext();
        var owner = PostgresTestData.User($"owner-{Guid.NewGuid():N}@example.com");
        var song = PostgresTestData.Song(owner, title);
        context.AddRange(owner, song);
        await context.SaveChangesAsync();
        return song.Id;
    }

    private static AnalyticsSnapshot Snapshot(int songId, string platform, DateOnly snapshotDate) => new()
    {
        SongId = songId,
        Platform = platform,
        SnapshotDate = snapshotDate,
        Views = 10,
        Likes = 1,
        Comments = 1,
        WatchTimeMinutes = 5,
        SubscribersGained = 0,
        CreatedAt = DateTime.UtcNow
    };

    private static async Task<(int OwnerId, int SongId, int ConnectionId, int ReferenceId)>
        CreateExternalFileGraphAsync(PostgresTestDatabase database)
    {
        await using var context = database.CreateContext();
        var owner = PostgresTestData.User($"drive-owner-{Guid.NewGuid():N}@example.com");
        var song = PostgresTestData.Song(owner, "External file references");
        var connection = new GoogleDriveConnection
        {
            User = owner,
            GoogleSubject = "google-subject",
            GoogleEmail = owner.Email,
            GoogleEmailVerified = true,
            GrantedScopes = "drive.file",
            Status = GoogleDriveConnectionStatuses.Connected,
            ConnectedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        var reference = new ExternalFileReference
        {
            OwnerUser = owner,
            Song = song,
            GoogleDriveConnection = connection,
            Provider = ExternalFileProviders.GoogleDrive,
            ExternalId = "drive-file-1",
            ResourceType = ExternalResourceTypes.AudioAssetFile,
            IsFolder = false,
            DisplayName = "audio.wav",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.AddRange(owner, song, connection, reference);
        await context.SaveChangesAsync();

        return (owner.Id, song.Id, connection.Id, reference.Id);
    }
}
