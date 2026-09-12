using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Services;

public enum SongCollaborationResultStatus
{
    Success,
    NoAccess,
    InsufficientRole,
    NotFound,
    InvalidOperation,
    Conflict
}

public sealed record SongCollaborationResult<T>(
    SongCollaborationResultStatus Status,
    T? Value = default,
    string? Error = null);

public class SongCollaborationService
{
    private readonly AppDbContext _context;
    private readonly SongAccessService _songAccessService;

    public SongCollaborationService(AppDbContext context, SongAccessService songAccessService)
    {
        _context = context;
        _songAccessService = songAccessService;
    }

    public async Task<SongCollaborationResult<List<SongMemberResponse>>> GetMembersAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await _songAccessService.GetAccessLevelAsync(songId, userId, cancellationToken);
        if (!SongAccessService.GetCapabilities(accessLevel).CanRead)
        {
            return new SongCollaborationResult<List<SongMemberResponse>>(SongCollaborationResultStatus.NoAccess);
        }

        var song = await _context.Songs
            .AsNoTracking()
            .Where(song => song.Id == songId)
            .Select(song => new
            {
                song.Id,
                song.OwnerUserId,
                OwnerEmail = song.OwnerUser == null ? null : song.OwnerUser.Email,
                OwnerDisplayName = song.OwnerUser == null ? null : song.OwnerUser.DisplayName
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (song?.OwnerUserId is null || song.OwnerEmail is null)
        {
            return new SongCollaborationResult<List<SongMemberResponse>>(SongCollaborationResultStatus.NoAccess);
        }

        var members = await _context.SongMembers
            .AsNoTracking()
            .Where(member => member.SongId == songId)
            .OrderBy(member => member.User.DisplayName ?? member.User.Email)
            .ThenBy(member => member.UserId)
            .Select(member => new SongMemberResponse
            {
                MemberId = member.Id,
                UserId = member.UserId,
                Email = member.User.Email,
                DisplayName = member.User.DisplayName,
                Role = member.Role.ToString(),
                JoinedAt = member.JoinedAt
            })
            .ToListAsync(cancellationToken);

        members.Insert(0, new SongMemberResponse
        {
            MemberId = null,
            UserId = song.OwnerUserId.Value,
            Email = song.OwnerEmail,
            DisplayName = song.OwnerDisplayName,
            Role = SongAccessLevel.OWNER.ToString(),
            JoinedAt = null
        });

        return new SongCollaborationResult<List<SongMemberResponse>>(
            SongCollaborationResultStatus.Success,
            members);
    }

    public async Task<SongCollaborationResult<SongInvitationResponse>> InviteAsync(
        int songId,
        int userId,
        InviteSongMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await _songAccessService.GetAccessLevelAsync(songId, userId, cancellationToken);
        if (accessLevel == SongAccessLevel.NO_ACCESS)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.NoAccess);
        }

        if (!SongAccessService.GetCapabilities(accessLevel).CanManageMembers)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.InsufficientRole);
        }

        var role = ParseRole(request.Role);
        if (role is null)
        {
            return InvalidInvitation("Role must be one of: EDITOR, VIEWER.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var targetUser = await _context.Users
            .FirstOrDefaultAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);
        if (targetUser is null)
        {
            return InvalidInvitation("Invite an existing DARKROOM account email.");
        }

        var song = await _context.Songs
            .AsNoTracking()
            .FirstOrDefaultAsync(song => song.Id == songId, cancellationToken);
        if (song?.OwnerUserId is null)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.NoAccess);
        }

        if (targetUser.Id == userId || targetUser.Id == song.OwnerUserId)
        {
            return InvalidInvitation("Owner cannot be invited as a collaborator.");
        }

        var existingMember = await _context.SongMembers
            .AnyAsync(member => member.SongId == songId && member.UserId == targetUser.Id, cancellationToken);
        if (existingMember)
        {
            return InvalidInvitation("User is already a workspace member.");
        }

        var existingPendingInvitation = await _context.SongInvitations.AnyAsync(
            invitation =>
                invitation.SongId == songId &&
                invitation.InvitedUserId == targetUser.Id &&
                invitation.Status == SongInvitationStatus.PENDING,
            cancellationToken);
        if (existingPendingInvitation)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "A pending invitation already exists for this user.");
        }

        var now = DateTime.UtcNow;
        var invitation = new SongInvitation
        {
            SongId = songId,
            InvitedUserId = targetUser.Id,
            InvitedByUserId = userId,
            Role = role.Value,
            Status = SongInvitationStatus.PENDING,
            CreatedAt = now
        };

        _context.SongInvitations.Add(invitation);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "A pending invitation already exists for this user.");
        }

        return new SongCollaborationResult<SongInvitationResponse>(
            SongCollaborationResultStatus.Success,
            await LoadInvitationResponseAsync(invitation.Id, cancellationToken));
    }

    public async Task<List<InvitationInboxItemResponse>> GetPendingInvitationsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.SongInvitations
            .AsNoTracking()
            .Where(invitation =>
                invitation.InvitedUserId == userId &&
                invitation.Status == SongInvitationStatus.PENDING)
            .OrderByDescending(invitation => invitation.CreatedAt)
            .ThenBy(invitation => invitation.Id)
            .Select(invitation => new InvitationInboxItemResponse
            {
                InvitationId = invitation.Id,
                SongId = invitation.SongId,
                SongTitle = invitation.Song.Title,
                InvitedByUser = ToUserSummary(invitation.InvitedByUser),
                Role = invitation.Role.ToString(),
                Status = invitation.Status.ToString(),
                CreatedAt = invitation.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<SongCollaborationResult<List<SongInvitationResponse>>> GetPendingSongInvitationsAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var manageResult = await CanManageSongAsync(songId, userId, cancellationToken);
        if (manageResult != SongCollaborationResultStatus.Success)
        {
            return new SongCollaborationResult<List<SongInvitationResponse>>(manageResult);
        }

        var invitations = await _context.SongInvitations
            .AsNoTracking()
            .Where(invitation =>
                invitation.SongId == songId &&
                invitation.Status == SongInvitationStatus.PENDING)
            .OrderBy(invitation => invitation.InvitedUser.DisplayName ?? invitation.InvitedUser.Email)
            .ThenBy(invitation => invitation.Id)
            .Select(invitation => new SongInvitationResponse
            {
                Id = invitation.Id,
                SongId = invitation.SongId,
                InvitedUser = ToUserSummary(invitation.InvitedUser),
                InvitedByUser = ToUserSummary(invitation.InvitedByUser),
                Role = invitation.Role.ToString(),
                Status = invitation.Status.ToString(),
                CreatedAt = invitation.CreatedAt,
                RespondedAt = invitation.RespondedAt
            })
            .ToListAsync(cancellationToken);

        return new SongCollaborationResult<List<SongInvitationResponse>>(
            SongCollaborationResultStatus.Success,
            invitations);
    }

    public async Task<SongCollaborationResult<SongInvitationResponse>> AcceptInvitationAsync(
        int invitationId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var invitation = await _context.SongInvitations
            .Include(invitation => invitation.Song)
            .FirstOrDefaultAsync(invitation => invitation.Id == invitationId, cancellationToken);

        if (invitation is null || invitation.InvitedUserId != userId)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.NotFound);
        }

        if (invitation.Status != SongInvitationStatus.PENDING)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "Invitation is no longer pending.");
        }

        if (invitation.Song.OwnerUserId == userId)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "Song owner cannot accept a collaborator invitation.");
        }

        var existingMember = await _context.SongMembers.AnyAsync(
            member => member.SongId == invitation.SongId && member.UserId == userId,
            cancellationToken);
        if (existingMember)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "User is already a workspace member.");
        }

        var now = DateTime.UtcNow;
        _context.SongMembers.Add(new SongMember
        {
            SongId = invitation.SongId,
            UserId = userId,
            Role = invitation.Role,
            JoinedAt = now,
            UpdatedAt = now
        });
        invitation.Status = SongInvitationStatus.ACCEPTED;
        invitation.RespondedAt = now;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "Invitation could not be accepted because membership already exists.");
        }

        return new SongCollaborationResult<SongInvitationResponse>(
            SongCollaborationResultStatus.Success,
            await LoadInvitationResponseAsync(invitation.Id, cancellationToken));
    }

    public async Task<SongCollaborationResult<SongInvitationResponse>> DeclineInvitationAsync(
        int invitationId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var invitation = await _context.SongInvitations
            .FirstOrDefaultAsync(invitation => invitation.Id == invitationId, cancellationToken);

        if (invitation is null || invitation.InvitedUserId != userId)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.NotFound);
        }

        if (invitation.Status != SongInvitationStatus.PENDING)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "Invitation is no longer pending.");
        }

        invitation.Status = SongInvitationStatus.DECLINED;
        invitation.RespondedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new SongCollaborationResult<SongInvitationResponse>(
            SongCollaborationResultStatus.Success,
            await LoadInvitationResponseAsync(invitation.Id, cancellationToken));
    }

    public async Task<SongCollaborationResult<SongInvitationResponse>> RevokeInvitationAsync(
        int songId,
        int invitationId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var manageResult = await CanManageSongAsync(songId, userId, cancellationToken);
        if (manageResult != SongCollaborationResultStatus.Success)
        {
            return new SongCollaborationResult<SongInvitationResponse>(manageResult);
        }

        var invitation = await _context.SongInvitations
            .FirstOrDefaultAsync(
                invitation => invitation.Id == invitationId && invitation.SongId == songId,
                cancellationToken);

        if (invitation is null)
        {
            return new SongCollaborationResult<SongInvitationResponse>(SongCollaborationResultStatus.NotFound);
        }

        if (invitation.Status != SongInvitationStatus.PENDING)
        {
            return new SongCollaborationResult<SongInvitationResponse>(
                SongCollaborationResultStatus.Conflict,
                Error: "Invitation is no longer pending.");
        }

        invitation.Status = SongInvitationStatus.REVOKED;
        invitation.RespondedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new SongCollaborationResult<SongInvitationResponse>(
            SongCollaborationResultStatus.Success,
            await LoadInvitationResponseAsync(invitation.Id, cancellationToken));
    }

    public async Task<SongCollaborationResult<SongMemberResponse>> UpdateMemberRoleAsync(
        int songId,
        int memberId,
        int userId,
        UpdateSongMemberRoleRequest request,
        CancellationToken cancellationToken = default)
    {
        var manageResult = await CanManageSongAsync(songId, userId, cancellationToken);
        if (manageResult != SongCollaborationResultStatus.Success)
        {
            return new SongCollaborationResult<SongMemberResponse>(manageResult);
        }

        var role = ParseRole(request.Role);
        if (role is null)
        {
            return new SongCollaborationResult<SongMemberResponse>(
                SongCollaborationResultStatus.InvalidOperation,
                Error: "Role must be one of: EDITOR, VIEWER.");
        }

        var member = await _context.SongMembers
            .Include(member => member.User)
            .FirstOrDefaultAsync(
                member => member.Id == memberId && member.SongId == songId,
                cancellationToken);

        if (member is null)
        {
            return new SongCollaborationResult<SongMemberResponse>(SongCollaborationResultStatus.NotFound);
        }

        member.Role = role.Value;
        member.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new SongCollaborationResult<SongMemberResponse>(
            SongCollaborationResultStatus.Success,
            ToMemberResponse(member));
    }

    public async Task<SongCollaborationResult<object>> RemoveMemberAsync(
        int songId,
        int memberId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var manageResult = await CanManageSongAsync(songId, userId, cancellationToken);
        if (manageResult != SongCollaborationResultStatus.Success)
        {
            return new SongCollaborationResult<object>(manageResult);
        }

        var member = await _context.SongMembers
            .FirstOrDefaultAsync(
                member => member.Id == memberId && member.SongId == songId,
                cancellationToken);

        if (member is null)
        {
            return new SongCollaborationResult<object>(SongCollaborationResultStatus.NotFound);
        }

        _context.SongMembers.Remove(member);
        await _context.SaveChangesAsync(cancellationToken);

        return new SongCollaborationResult<object>(SongCollaborationResultStatus.Success);
    }

    private async Task<SongCollaborationResultStatus> CanManageSongAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken)
    {
        var accessLevel = await _songAccessService.GetAccessLevelAsync(songId, userId, cancellationToken);
        if (accessLevel == SongAccessLevel.NO_ACCESS)
        {
            return SongCollaborationResultStatus.NoAccess;
        }

        return SongAccessService.GetCapabilities(accessLevel).CanManageMembers
            ? SongCollaborationResultStatus.Success
            : SongCollaborationResultStatus.InsufficientRole;
    }

    private static SongMemberRole? ParseRole(string role)
    {
        return Enum.TryParse<SongMemberRole>(role.Trim(), ignoreCase: true, out var parsedRole)
            ? parsedRole
            : null;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToUpperInvariant();
    }

    private static SongCollaborationResult<SongInvitationResponse> InvalidInvitation(string error) =>
        new(SongCollaborationResultStatus.InvalidOperation, Error: error);

    private async Task<SongInvitationResponse> LoadInvitationResponseAsync(
        int invitationId,
        CancellationToken cancellationToken)
    {
        return await _context.SongInvitations
            .AsNoTracking()
            .Where(invitation => invitation.Id == invitationId)
            .Select(invitation => new SongInvitationResponse
            {
                Id = invitation.Id,
                SongId = invitation.SongId,
                InvitedUser = ToUserSummary(invitation.InvitedUser),
                InvitedByUser = ToUserSummary(invitation.InvitedByUser),
                Role = invitation.Role.ToString(),
                Status = invitation.Status.ToString(),
                CreatedAt = invitation.CreatedAt,
                RespondedAt = invitation.RespondedAt
            })
            .SingleAsync(cancellationToken);
    }

    private static UserSummaryResponse ToUserSummary(User user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName
        };

    private static SongMemberResponse ToMemberResponse(SongMember member) =>
        new()
        {
            MemberId = member.Id,
            UserId = member.UserId,
            Email = member.User.Email,
            DisplayName = member.User.DisplayName,
            Role = member.Role.ToString(),
            JoinedAt = member.JoinedAt
        };
}
