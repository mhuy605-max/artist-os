using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using ArtistOS.Api.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class SongCollaborationFoundationTests
{
    [Fact]
    public async Task SongMember_PersistsEditorAndViewerMemberships()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, viewer, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongMembers.AddRange(
            new SongMember
            {
                SongId = song.Id,
                UserId = editor.Id,
                Role = SongMemberRole.EDITOR
            },
            new SongMember
            {
                SongId = song.Id,
                UserId = viewer.Id,
                Role = SongMemberRole.VIEWER
            });
        await dbContext.SaveChangesAsync();

        var members = await dbContext.SongMembers
            .Where(member => member.SongId == song.Id)
            .OrderBy(member => member.UserId)
            .ToListAsync();

        Assert.Equal(owner.Id, song.OwnerUserId);
        Assert.Equal([SongMemberRole.EDITOR, SongMemberRole.VIEWER], members.Select(member => member.Role));
    }

    [Fact]
    public async Task SongMember_DuplicateSongUserMembershipIsConstrained()
    {
        await using var factory = new ArtistOsApiFactory();
        var (_, editor, _, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongMembers.AddRange(
            new SongMember
            {
                SongId = song.Id,
                UserId = editor.Id,
                Role = SongMemberRole.EDITOR
            },
            new SongMember
            {
                SongId = song.Id,
                UserId = editor.Id,
                Role = SongMemberRole.VIEWER
            });

        await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task SongMember_OwnerRoleCannotBeStored()
    {
        await using var factory = new ArtistOsApiFactory();
        var (_, editor, _, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var failure = await Assert.ThrowsAsync<SqliteException>(() => dbContext.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO "SongMembers" ("SongId", "UserId", "Role", "JoinedAt", "UpdatedAt")
            VALUES ({0}, {1}, 'OWNER', {2}, {3})
            """,
            song.Id,
            editor.Id,
            DateTime.UtcNow,
            DateTime.UtcNow));

        Assert.Contains("CK_SongMembers_Role", failure.Message);
    }

    [Fact]
    public async Task SongInvitation_PersistsRolesAndCanonicalStatuses()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, viewer, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongInvitations.AddRange(
            new SongInvitation
            {
                SongId = song.Id,
                InvitedUserId = editor.Id,
                InvitedByUserId = owner.Id,
                Role = SongMemberRole.EDITOR,
                Status = SongInvitationStatus.PENDING
            },
            new SongInvitation
            {
                SongId = song.Id,
                InvitedUserId = viewer.Id,
                InvitedByUserId = owner.Id,
                Role = SongMemberRole.VIEWER,
                Status = SongInvitationStatus.ACCEPTED,
                RespondedAt = DateTime.UtcNow
            },
            new SongInvitation
            {
                SongId = song.Id,
                InvitedUserId = owner.Id,
                InvitedByUserId = owner.Id,
                Role = SongMemberRole.VIEWER,
                Status = SongInvitationStatus.DECLINED,
                RespondedAt = DateTime.UtcNow
            },
            new SongInvitation
            {
                SongId = song.Id,
                InvitedUserId = owner.Id,
                InvitedByUserId = owner.Id,
                Role = SongMemberRole.EDITOR,
                Status = SongInvitationStatus.REVOKED,
                RespondedAt = DateTime.UtcNow
            });
        await dbContext.SaveChangesAsync();

        var invitations = await dbContext.SongInvitations
            .Where(invitation => invitation.SongId == song.Id)
            .ToListAsync();

        Assert.Contains(invitations, invitation => invitation.Role == SongMemberRole.EDITOR);
        Assert.Contains(invitations, invitation => invitation.Role == SongMemberRole.VIEWER);
        Assert.Equal(
            [
                SongInvitationStatus.PENDING,
                SongInvitationStatus.ACCEPTED,
                SongInvitationStatus.DECLINED,
                SongInvitationStatus.REVOKED
            ],
            invitations.Select(invitation => invitation.Status).Distinct().OrderBy(status => status));
    }

    [Fact]
    public async Task SongInvitation_DuplicatePendingInvitationIsConstrained()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, _, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongInvitations.AddRange(
            PendingInvitation(song.Id, editor.Id, owner.Id),
            PendingInvitation(song.Id, editor.Id, owner.Id));

        await Assert.ThrowsAsync<DbUpdateException>(() => dbContext.SaveChangesAsync());
    }

    [Fact]
    public async Task SongInvitation_HistoricalInvitationCanCoexistWithLaterPendingInvitation()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, _, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongInvitations.AddRange(
            new SongInvitation
            {
                SongId = song.Id,
                InvitedUserId = editor.Id,
                InvitedByUserId = owner.Id,
                Role = SongMemberRole.EDITOR,
                Status = SongInvitationStatus.DECLINED,
                RespondedAt = DateTime.UtcNow
            },
            PendingInvitation(song.Id, editor.Id, owner.Id));
        await dbContext.SaveChangesAsync();

        Assert.Equal(2, await dbContext.SongInvitations.CountAsync());
    }

    [Fact]
    public async Task DeletingSong_RemovesCollaborationRows()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, _, song) = await CreateCollaborationGraphAsync(factory);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        dbContext.SongMembers.Add(new SongMember
        {
            SongId = song.Id,
            UserId = editor.Id,
            Role = SongMemberRole.EDITOR
        });
        dbContext.SongInvitations.Add(PendingInvitation(song.Id, editor.Id, owner.Id));
        await dbContext.SaveChangesAsync();

        dbContext.Songs.Remove(await dbContext.Songs.SingleAsync(existingSong => existingSong.Id == song.Id));
        await dbContext.SaveChangesAsync();

        Assert.Empty(await dbContext.SongMembers.ToListAsync());
        Assert.Empty(await dbContext.SongInvitations.ToListAsync());
    }

    [Theory]
    [InlineData(SongAccessLevel.OWNER, true, true, true)]
    [InlineData(SongAccessLevel.EDITOR, true, true, false)]
    [InlineData(SongAccessLevel.VIEWER, true, false, false)]
    [InlineData(SongAccessLevel.NO_ACCESS, false, false, false)]
    public void SongAccessCapabilities_MatchCanonicalMatrix(
        SongAccessLevel accessLevel,
        bool canRead,
        bool canEdit,
        bool canManageMembers)
    {
        var capabilities = SongAccessService.GetCapabilities(accessLevel);

        Assert.Equal(accessLevel, capabilities.AccessLevel);
        Assert.Equal(canRead, capabilities.CanRead);
        Assert.Equal(canEdit, capabilities.CanEdit);
        Assert.Equal(canManageMembers, capabilities.CanManageMembers);
    }

    [Fact]
    public async Task SongAccessService_ResolvesOwnerEditorViewerAndNoAccess()
    {
        await using var factory = new ArtistOsApiFactory();
        var (owner, editor, viewer, song) = await CreateCollaborationGraphAsync(factory);
        var unrelated = await CreateUserAsync(factory, "unrelated@example.com");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.SongMembers.AddRange(
            new SongMember
            {
                SongId = song.Id,
                UserId = editor.Id,
                Role = SongMemberRole.EDITOR
            },
            new SongMember
            {
                SongId = song.Id,
                UserId = viewer.Id,
                Role = SongMemberRole.VIEWER
            });
        await dbContext.SaveChangesAsync();

        var accessService = scope.ServiceProvider.GetRequiredService<SongAccessService>();

        Assert.Equal(SongAccessLevel.OWNER, await accessService.GetAccessLevelAsync(song.Id, owner.Id));
        Assert.Equal(SongAccessLevel.EDITOR, await accessService.GetAccessLevelAsync(song.Id, editor.Id));
        Assert.Equal(SongAccessLevel.VIEWER, await accessService.GetAccessLevelAsync(song.Id, viewer.Id));
        Assert.Equal(SongAccessLevel.NO_ACCESS, await accessService.GetAccessLevelAsync(song.Id, unrelated.Id));
        Assert.True(await accessService.CanReadAsync(song.Id, viewer.Id));
        Assert.True(await accessService.CanEditAsync(song.Id, editor.Id));
        Assert.False(await accessService.CanEditAsync(song.Id, viewer.Id));
        Assert.True(await accessService.CanManageMembersAsync(song.Id, owner.Id));
        Assert.False(await accessService.CanManageMembersAsync(song.Id, editor.Id));
    }

    [Fact]
    public async Task SongAccessService_LegacyUnownedSongWithoutMembershipHasNoAccess()
    {
        await using var factory = new ArtistOsApiFactory();
        var user = await CreateUserAsync(factory, "legacy-access@example.com");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = "Legacy",
            Status = "Demo",
            OwnerUserId = null
        };
        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();

        var accessService = scope.ServiceProvider.GetRequiredService<SongAccessService>();

        Assert.Equal(SongAccessLevel.NO_ACCESS, await accessService.GetAccessLevelAsync(song.Id, user.Id));
    }

    [Fact]
    public async Task SongAccessService_OwnerTakesPrecedenceOverInconsistentMembership()
    {
        await using var factory = new ArtistOsApiFactory();
        var owner = await CreateUserAsync(factory, "owner-precedence@example.com");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = "Owner Wins",
            Status = "Demo",
            OwnerUserId = owner.Id
        };
        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();
        dbContext.SongMembers.Add(new SongMember
        {
            SongId = song.Id,
            UserId = owner.Id,
            Role = SongMemberRole.VIEWER
        });
        await dbContext.SaveChangesAsync();

        var accessService = scope.ServiceProvider.GetRequiredService<SongAccessService>();

        Assert.Equal(SongAccessLevel.OWNER, await accessService.GetAccessLevelAsync(song.Id, owner.Id));
    }

    [Fact]
    public async Task ExistingEndpointsRemainOwnerOnlyForEditorAndViewerMemberships()
    {
        await using var factory = new ArtistOsApiFactory();
        using var ownerClient = await factory.CreateAuthenticatedClientAsync("owner-route@example.com");
        using var editorClient = await factory.CreateAuthenticatedClientAsync("editor-route@example.com");
        using var viewerClient = await factory.CreateAuthenticatedClientAsync("viewer-route@example.com");

        var owner = await GetUserByEmailAsync(factory, "owner-route@example.com");
        var editor = await GetUserByEmailAsync(factory, "editor-route@example.com");
        var viewer = await GetUserByEmailAsync(factory, "viewer-route@example.com");
        var songResponse = await CreateSongAsync(ownerClient, "Owner-only during C1");

        using (var scope = factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            dbContext.SongMembers.AddRange(
                new SongMember
                {
                    SongId = songResponse.Id,
                    UserId = editor.Id,
                    Role = SongMemberRole.EDITOR
                },
                new SongMember
                {
                    SongId = songResponse.Id,
                    UserId = viewer.Id,
                    Role = SongMemberRole.VIEWER
                });
            await dbContext.SaveChangesAsync();
        }

        Assert.Equal(HttpStatusCode.OK, (await ownerClient.GetAsync($"/api/songs/{songResponse.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await editorClient.GetAsync($"/api/songs/{songResponse.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await viewerClient.GetAsync($"/api/songs/{songResponse.Id}")).StatusCode);
    }

    private static SongInvitation PendingInvitation(int songId, int invitedUserId, int invitedByUserId) =>
        new()
        {
            SongId = songId,
            InvitedUserId = invitedUserId,
            InvitedByUserId = invitedByUserId,
            Role = SongMemberRole.EDITOR,
            Status = SongInvitationStatus.PENDING
        };

    private static async Task<(User Owner, User Editor, User Viewer, Song Song)> CreateCollaborationGraphAsync(
        ArtistOsApiFactory factory)
    {
        var owner = await CreateUserAsync(factory, $"owner-{Guid.NewGuid():N}@example.com");
        var editor = await CreateUserAsync(factory, $"editor-{Guid.NewGuid():N}@example.com");
        var viewer = await CreateUserAsync(factory, $"viewer-{Guid.NewGuid():N}@example.com");

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var song = new Song
        {
            Title = "Collaboration Foundation",
            Status = "Demo",
            OwnerUserId = owner.Id
        };
        dbContext.Songs.Add(song);
        await dbContext.SaveChangesAsync();

        return (owner, editor, viewer, song);
    }

    private static async Task<User> CreateUserAsync(ArtistOsApiFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var normalizedEmail = email.Trim().ToUpperInvariant();
        var user = new User
        {
            Email = email,
            NormalizedEmail = normalizedEmail,
            PasswordHash = $"hash-{Guid.NewGuid():N}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static async Task<User> GetUserByEmailAsync(ArtistOsApiFactory factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var normalizedEmail = email.Trim().ToUpperInvariant();
        return await dbContext.Users.SingleAsync(user => user.NormalizedEmail == normalizedEmail);
    }

    private static async Task<SongResponse> CreateSongAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/songs", new
        {
            title,
            status = "Demo"
        });
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<SongResponse>())!;
    }
}
