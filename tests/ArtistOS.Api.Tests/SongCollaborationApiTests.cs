using System.Net;
using System.Net.Http.Json;
using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using ArtistOS.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ArtistOS.Api.Tests;

public class SongCollaborationApiTests
{
    [Fact]
    public async Task CollaborationEndpoints_WhenUnauthenticated_ReturnUnauthorized()
    {
        await using var factory = new ArtistOsApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/songs/1/members")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/songs/1/invitations", InvitePayload())).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/invitations")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/invitations/1/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/invitations/1/decline", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsync("/api/songs/1/invitations/1/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await PatchJsonAsync(client, "/api/songs/1/members/1", RolePayload("VIEWER"))).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.DeleteAsync("/api/songs/1/members/1")).StatusCode);
    }

    [Fact]
    public async Task GetMembers_ReturnsOwnerAndCollaboratorsForAuthorizedParticipants()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);

        var ownerMembers = await scenario.OwnerClient.GetFromJsonAsync<List<SongMemberResponse>>($"/api/songs/{scenario.Song.Id}/members");
        var editorMembers = await scenario.EditorClient.GetFromJsonAsync<List<SongMemberResponse>>($"/api/songs/{scenario.Song.Id}/members");
        var viewerMembers = await scenario.ViewerClient.GetFromJsonAsync<List<SongMemberResponse>>($"/api/songs/{scenario.Song.Id}/members");

        AssertMembersResponse(ownerMembers, scenario);
        AssertMembersResponse(editorMembers, scenario);
        AssertMembersResponse(viewerMembers, scenario);
        Assert.DoesNotContain(ownerMembers!, member => member.UserId == scenario.Unrelated.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.UnrelatedClient.GetAsync($"/api/songs/{scenario.Song.Id}/members")).StatusCode);
    }

    [Fact]
    public async Task Invite_AllowsOwnerToInviteExistingUserAsEditorAndViewer()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);

        var editorInvite = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.Song.Id}/invitations",
            InvitePayload(scenario.Editor.Email, "editor", status: "ACCEPTED", invitedUserId: scenario.Unrelated.Id));
        var viewerInvite = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.Song.Id}/invitations",
            InvitePayload(scenario.Viewer.Email, "VIEWER"));

        Assert.Equal(HttpStatusCode.Created, editorInvite.StatusCode);
        Assert.Equal(HttpStatusCode.Created, viewerInvite.StatusCode);

        var editorResponse = (await editorInvite.Content.ReadFromJsonAsync<SongInvitationResponse>())!;
        var viewerResponse = (await viewerInvite.Content.ReadFromJsonAsync<SongInvitationResponse>())!;

        Assert.Equal(SongMemberRole.EDITOR.ToString(), editorResponse.Role);
        Assert.Equal(SongInvitationStatus.PENDING.ToString(), editorResponse.Status);
        Assert.Equal(scenario.Editor.Id, editorResponse.InvitedUser.Id);
        Assert.Equal(scenario.Owner.Id, editorResponse.InvitedByUser.Id);
        Assert.Equal(SongMemberRole.VIEWER.ToString(), viewerResponse.Role);
        Assert.Equal(SongInvitationStatus.PENDING.ToString(), viewerResponse.Status);
    }

    [Fact]
    public async Task Invite_EnforcesRoleAndValidationRules()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var editorMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);

        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Unrelated.Email))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Unrelated.Email))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.UnrelatedClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Unrelated.Email))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await scenario.OwnerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Unrelated.Email, "OWNER"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await scenario.OwnerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload("missing@example.com"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await scenario.OwnerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Owner.Email))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await scenario.OwnerClient.PostAsJsonAsync($"/api/songs/{scenario.Song.Id}/invitations", InvitePayload(scenario.Editor.Email))).StatusCode);
        Assert.True(editorMember.Id > 0);
    }

    [Fact]
    public async Task Invite_DuplicatePendingInviteIsRejected()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);

        var first = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.Song.Id}/invitations",
            InvitePayload(scenario.Editor.Email));
        var second = await scenario.OwnerClient.PostAsJsonAsync(
            $"/api/songs/{scenario.Song.Id}/invitations",
            InvitePayload(scenario.Editor.Email));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task InvitationInbox_ReturnsOnlyCurrentUsersPendingInvitations()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var pending = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);
        await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Viewer.Id, scenario.Owner.Id, SongInvitationStatus.ACCEPTED);

        var editorInbox = await scenario.EditorClient.GetFromJsonAsync<List<InvitationInboxItemResponse>>("/api/invitations");
        var viewerInbox = await scenario.ViewerClient.GetFromJsonAsync<List<InvitationInboxItemResponse>>("/api/invitations");
        var ownerInbox = await scenario.OwnerClient.GetFromJsonAsync<List<InvitationInboxItemResponse>>("/api/invitations");

        Assert.Single(editorInbox!);
        Assert.Equal(pending.Id, editorInbox![0].InvitationId);
        Assert.Equal(scenario.Song.Id, editorInbox[0].SongId);
        Assert.Equal(scenario.Song.Title, editorInbox[0].SongTitle);
        Assert.Equal(SongMemberRole.EDITOR.ToString(), editorInbox[0].Role);
        Assert.Empty(viewerInbox!);
        Assert.Empty(ownerInbox!);
    }

    [Fact]
    public async Task SongInvitations_ReturnsOnlyPendingInvitationsForOwnerManagedSong()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var pending = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Unrelated.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);
        await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.ACCEPTED);
        var otherSong = await CreateSongAsync(scenario.OwnerClient, "Other Invite Song");
        await CreateInvitationAsync(factory, otherSong.Id, scenario.Viewer.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);

        var ownerInvitations = await scenario.OwnerClient.GetFromJsonAsync<List<SongInvitationResponse>>(
            $"/api/songs/{scenario.Song.Id}/invitations");

        Assert.Single(ownerInvitations!);
        Assert.Equal(pending.Id, ownerInvitations![0].Id);
        Assert.Equal(scenario.Unrelated.Id, ownerInvitations[0].InvitedUser.Id);
        Assert.Equal(SongInvitationStatus.PENDING.ToString(), ownerInvitations[0].Status);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/invitations")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/invitations")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.UnrelatedClient.GetAsync($"/api/songs/{scenario.Song.Id}/invitations")).StatusCode);
    }

    [Fact]
    public async Task AcceptInvitation_CreatesMemberAndAcceptsAtomically()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var invitation = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);

        var accept = await scenario.EditorClient.PostAsync($"/api/invitations/{invitation.Id}/accept", null);

        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);
        var response = (await accept.Content.ReadFromJsonAsync<SongInvitationResponse>())!;
        Assert.Equal(SongInvitationStatus.ACCEPTED.ToString(), response.Status);
        Assert.NotNull(response.RespondedAt);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var member = await dbContext.SongMembers.SingleAsync(member => member.SongId == scenario.Song.Id && member.UserId == scenario.Editor.Id);
        var storedInvitation = await dbContext.SongInvitations.SingleAsync(existingInvitation => existingInvitation.Id == invitation.Id);
        Assert.Equal(SongMemberRole.EDITOR, member.Role);
        Assert.Equal(SongInvitationStatus.ACCEPTED, storedInvitation.Status);
        Assert.NotNull(storedInvitation.RespondedAt);
    }

    [Fact]
    public async Task AcceptInvitation_BlocksIdorAndResolvedOrExistingMemberStates()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var pending = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);
        var accepted = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Viewer.Id, scenario.Owner.Id, SongInvitationStatus.ACCEPTED);
        var declined = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Viewer.Id, scenario.Owner.Id, SongInvitationStatus.DECLINED);
        var revoked = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Unrelated.Id, scenario.Owner.Id, SongInvitationStatus.REVOKED);

        Assert.Equal(HttpStatusCode.NotFound, (await scenario.ViewerClient.PostAsync($"/api/invitations/{pending.Id}/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.OwnerClient.PostAsync($"/api/invitations/{pending.Id}/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.ViewerClient.PostAsync($"/api/invitations/{accepted.Id}/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.ViewerClient.PostAsync($"/api/invitations/{declined.Id}/accept", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.UnrelatedClient.PostAsync($"/api/invitations/{revoked.Id}/accept", null)).StatusCode);

        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.EditorClient.PostAsync($"/api/invitations/{pending.Id}/accept", null)).StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, await dbContext.SongMembers.CountAsync(member => member.SongId == scenario.Song.Id && member.UserId == scenario.Editor.Id));
        Assert.Equal(SongInvitationStatus.PENDING, (await dbContext.SongInvitations.SingleAsync(invitation => invitation.Id == pending.Id)).Status);
    }

    [Fact]
    public async Task DeclineInvitation_MarksPendingInvitationDeclined()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var invitation = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);

        var decline = await scenario.EditorClient.PostAsync($"/api/invitations/{invitation.Id}/decline", null);
        var repeatedDecline = await scenario.EditorClient.PostAsync($"/api/invitations/{invitation.Id}/decline", null);
        var otherUserDecline = await scenario.ViewerClient.PostAsync($"/api/invitations/{invitation.Id}/decline", null);

        Assert.Equal(HttpStatusCode.OK, decline.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, repeatedDecline.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherUserDecline.StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedInvitation = await dbContext.SongInvitations.SingleAsync(existingInvitation => existingInvitation.Id == invitation.Id);
        Assert.Equal(SongInvitationStatus.DECLINED, storedInvitation.Status);
        Assert.NotNull(storedInvitation.RespondedAt);
        Assert.False(await dbContext.SongMembers.AnyAsync(member => member.SongId == scenario.Song.Id && member.UserId == scenario.Editor.Id));
    }

    [Fact]
    public async Task RevokeInvitation_RequiresOwnerAndRouteSongMatch()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var pending = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Unrelated.Id, scenario.Owner.Id, SongInvitationStatus.PENDING);
        var accepted = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Editor.Id, scenario.Owner.Id, SongInvitationStatus.ACCEPTED);
        var declined = await CreateInvitationAsync(factory, scenario.Song.Id, scenario.Viewer.Id, scenario.Owner.Id, SongInvitationStatus.DECLINED);
        var otherSong = await CreateSongAsync(scenario.OwnerClient, "Other Owner Song");

        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{pending.Id}/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{pending.Id}/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.UnrelatedClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{pending.Id}/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.OwnerClient.PostAsync($"/api/songs/{otherSong.Id}/invitations/{pending.Id}/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.OwnerClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{accepted.Id}/revoke", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, (await scenario.OwnerClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{declined.Id}/revoke", null)).StatusCode);

        var revoke = await scenario.OwnerClient.PostAsync($"/api/songs/{scenario.Song.Id}/invitations/{pending.Id}/revoke", null);
        Assert.Equal(HttpStatusCode.OK, revoke.StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedInvitation = await dbContext.SongInvitations.SingleAsync(existingInvitation => existingInvitation.Id == pending.Id);
        Assert.Equal(SongInvitationStatus.REVOKED, storedInvitation.Status);
        Assert.NotNull(storedInvitation.RespondedAt);
    }

    [Fact]
    public async Task UpdateMemberRole_RequiresOwnerAndRouteMemberMatch()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var editorMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var otherSong = await CreateSongAsync(scenario.OwnerClient, "Other Role Song");

        var update = await PatchJsonAsync(scenario.OwnerClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("VIEWER", songId: otherSong.Id, userId: scenario.Unrelated.Id));

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var response = (await update.Content.ReadFromJsonAsync<SongMemberResponse>())!;
        Assert.Equal(SongMemberRole.VIEWER.ToString(), response.Role);
        Assert.Equal(HttpStatusCode.OK, (await PatchJsonAsync(scenario.OwnerClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("EDITOR"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await PatchJsonAsync(scenario.EditorClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("VIEWER"))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await PatchJsonAsync(scenario.ViewerClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("VIEWER"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await PatchJsonAsync(scenario.UnrelatedClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("VIEWER"))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await PatchJsonAsync(scenario.OwnerClient, $"/api/songs/{otherSong.Id}/members/{editorMember.Id}", RolePayload("VIEWER"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await PatchJsonAsync(scenario.OwnerClient, $"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}", RolePayload("OWNER"))).StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var storedMember = await dbContext.SongMembers.SingleAsync(member => member.Id == editorMember.Id);
        Assert.Equal(SongMemberRole.EDITOR, storedMember.Role);
        Assert.True(storedMember.UpdatedAt >= editorMember.UpdatedAt);
    }

    [Fact]
    public async Task RemoveMember_RequiresOwnerAndDeletesOnlyMembership()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        var editorMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        var viewerMember = await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);
        var otherSong = await CreateSongAsync(scenario.OwnerClient, "Other Removal Song");

        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.EditorClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{viewerMember.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await scenario.ViewerClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.UnrelatedClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await scenario.OwnerClient.DeleteAsync($"/api/songs/{otherSong.Id}/members/{editorMember.Id}")).StatusCode);

        var remove = await scenario.OwnerClient.DeleteAsync($"/api/songs/{scenario.Song.Id}/members/{editorMember.Id}");

        Assert.Equal(HttpStatusCode.NoContent, remove.StatusCode);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await dbContext.SongMembers.AnyAsync(member => member.Id == editorMember.Id));
        Assert.True(await dbContext.Users.AnyAsync(user => user.Id == scenario.Editor.Id));
        Assert.True(await dbContext.Songs.AnyAsync(song => song.Id == scenario.Song.Id));
    }

    [Fact]
    public async Task ExistingNestedWorkspaceEndpointsAllowMemberReadsAfterC4()
    {
        await using var factory = new ArtistOsApiFactory();
        var scenario = await CreateScenarioAsync(factory);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Editor.Id, SongMemberRole.EDITOR);
        await AddMemberAsync(factory, scenario.Song.Id, scenario.Viewer.Id, SongMemberRole.VIEWER);

        Assert.Equal(HttpStatusCode.OK, (await scenario.OwnerClient.GetAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.EditorClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await scenario.ViewerClient.GetAsync($"/api/songs/{scenario.Song.Id}/audio-assets")).StatusCode);
    }

    private static void AssertMembersResponse(List<SongMemberResponse>? members, Scenario scenario)
    {
        Assert.NotNull(members);
        Assert.Equal(3, members.Count);
        Assert.Contains(members, member =>
            member.MemberId is null &&
            member.UserId == scenario.Owner.Id &&
            member.Role == SongAccessLevel.OWNER.ToString());
        Assert.Contains(members, member =>
            member.MemberId is not null &&
            member.UserId == scenario.Editor.Id &&
            member.Role == SongMemberRole.EDITOR.ToString());
        Assert.Contains(members, member =>
            member.MemberId is not null &&
            member.UserId == scenario.Viewer.Id &&
            member.Role == SongMemberRole.VIEWER.ToString());
    }

    private static object InvitePayload(
        string email = "artist@example.com",
        string role = "EDITOR",
        string? status = null,
        int? invitedUserId = null)
    {
        return new
        {
            email,
            role,
            status,
            invitedUserId,
            invitedByUserId = 999,
            songId = 999,
            respondedAt = DateTime.UtcNow
        };
    }

    private static object RolePayload(string role, int? songId = null, int? userId = null)
    {
        return new
        {
            role,
            songId,
            userId,
            joinedAt = DateTime.UtcNow,
            updatedAt = DateTime.UtcNow
        };
    }

    private static async Task<HttpResponseMessage> PatchJsonAsync(HttpClient client, string path, object payload)
    {
        return await client.PatchAsJsonAsync(path, payload);
    }

    private static async Task<Scenario> CreateScenarioAsync(ArtistOsApiFactory factory)
    {
        var id = Guid.NewGuid().ToString("N");
        var ownerEmail = $"owner-{id}@example.com";
        var editorEmail = $"editor-{id}@example.com";
        var viewerEmail = $"viewer-{id}@example.com";
        var unrelatedEmail = $"unrelated-{id}@example.com";

        var ownerClient = await factory.CreateAuthenticatedClientAsync(ownerEmail, displayName: "Owner");
        var editorClient = await factory.CreateAuthenticatedClientAsync(editorEmail, displayName: "Editor");
        var viewerClient = await factory.CreateAuthenticatedClientAsync(viewerEmail, displayName: "Viewer");
        var unrelatedClient = await factory.CreateAuthenticatedClientAsync(unrelatedEmail, displayName: "Unrelated");

        var owner = await GetUserByEmailAsync(factory, ownerEmail);
        var editor = await GetUserByEmailAsync(factory, editorEmail);
        var viewer = await GetUserByEmailAsync(factory, viewerEmail);
        var unrelated = await GetUserByEmailAsync(factory, unrelatedEmail);
        var song = await CreateSongAsync(ownerClient, "Collaboration API Song");

        return new Scenario(
            ownerClient,
            editorClient,
            viewerClient,
            unrelatedClient,
            owner,
            editor,
            viewer,
            unrelated,
            song);
    }

    private static async Task<SongMember> AddMemberAsync(
        ArtistOsApiFactory factory,
        int songId,
        int userId,
        SongMemberRole role)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        var member = new SongMember
        {
            SongId = songId,
            UserId = userId,
            Role = role,
            JoinedAt = now,
            UpdatedAt = now
        };
        dbContext.SongMembers.Add(member);
        await dbContext.SaveChangesAsync();
        return member;
    }

    private static async Task<SongInvitation> CreateInvitationAsync(
        ArtistOsApiFactory factory,
        int songId,
        int invitedUserId,
        int invitedByUserId,
        SongInvitationStatus status)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var invitation = new SongInvitation
        {
            SongId = songId,
            InvitedUserId = invitedUserId,
            InvitedByUserId = invitedByUserId,
            Role = SongMemberRole.EDITOR,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            RespondedAt = status == SongInvitationStatus.PENDING ? null : DateTime.UtcNow
        };
        dbContext.SongInvitations.Add(invitation);
        await dbContext.SaveChangesAsync();
        return invitation;
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

    private sealed record Scenario(
        HttpClient OwnerClient,
        HttpClient EditorClient,
        HttpClient ViewerClient,
        HttpClient UnrelatedClient,
        User Owner,
        User Editor,
        User Viewer,
        User Unrelated,
        SongResponse Song);
}
