using ArtistOS.Api.Dtos;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArtistOS.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicyNames.NormalApi)]
[ApiController]
[Route("api")]
public class SongCollaborationController : ControllerBase
{
    private readonly SongCollaborationService _collaborationService;

    public SongCollaborationController(SongCollaborationService collaborationService)
    {
        _collaborationService = collaborationService;
    }

    [HttpGet("songs/{songId:int}/members")]
    public async Task<ActionResult<List<SongMemberResponse>>> GetMembers(
        int songId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.GetMembersAsync(
            songId,
            currentUserId.Value,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpPost("songs/{songId:int}/invitations")]
    public async Task<ActionResult<SongInvitationResponse>> Invite(
        int songId,
        InviteSongMemberRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.InviteAsync(
            songId,
            currentUserId.Value,
            request,
            cancellationToken);

        return result.Status == SongCollaborationResultStatus.Success
            ? CreatedAtAction(nameof(GetInvitations), new { }, result.Value)
            : ToActionResult(result);
    }

    [HttpGet("songs/{songId:int}/invitations")]
    public async Task<ActionResult<List<SongInvitationResponse>>> GetSongInvitations(
        int songId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.GetPendingSongInvitationsAsync(
            songId,
            currentUserId.Value,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpGet("invitations")]
    public async Task<ActionResult<List<InvitationInboxItemResponse>>> GetInvitations(
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        return await _collaborationService.GetPendingInvitationsAsync(
            currentUserId.Value,
            cancellationToken);
    }

    [HttpPost("invitations/{invitationId:int}/accept")]
    public async Task<ActionResult<SongInvitationResponse>> AcceptInvitation(
        int invitationId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.AcceptInvitationAsync(
            invitationId,
            currentUserId.Value,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpPost("invitations/{invitationId:int}/decline")]
    public async Task<ActionResult<SongInvitationResponse>> DeclineInvitation(
        int invitationId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.DeclineInvitationAsync(
            invitationId,
            currentUserId.Value,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpPost("songs/{songId:int}/invitations/{invitationId:int}/revoke")]
    public async Task<ActionResult<SongInvitationResponse>> RevokeInvitation(
        int songId,
        int invitationId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.RevokeInvitationAsync(
            songId,
            invitationId,
            currentUserId.Value,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpPatch("songs/{songId:int}/members/{memberId:int}")]
    public async Task<ActionResult<SongMemberResponse>> UpdateMemberRole(
        int songId,
        int memberId,
        UpdateSongMemberRoleRequest request,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.UpdateMemberRoleAsync(
            songId,
            memberId,
            currentUserId.Value,
            request,
            cancellationToken);

        return ToActionResult(result);
    }

    [HttpDelete("songs/{songId:int}/members/{memberId:int}")]
    public async Task<IActionResult> RemoveMember(
        int songId,
        int memberId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var result = await _collaborationService.RemoveMemberAsync(
            songId,
            memberId,
            currentUserId.Value,
            cancellationToken);

        return result.Status == SongCollaborationResultStatus.Success
            ? NoContent()
            : ToActionResult(result);
    }

    private ActionResult<T> ToActionResult<T>(SongCollaborationResult<T> result)
    {
        return result.Status switch
        {
            SongCollaborationResultStatus.Success => result.Value!,
            SongCollaborationResultStatus.NoAccess => NotFound(),
            SongCollaborationResultStatus.InsufficientRole => Forbid(),
            SongCollaborationResultStatus.NotFound => NotFound(),
            SongCollaborationResultStatus.InvalidOperation => BadRequest(result.Error),
            SongCollaborationResultStatus.Conflict => Conflict(result.Error),
            _ => Problem("Unexpected collaboration result.")
        };
    }

    private IActionResult ToActionResult(SongCollaborationResult<object> result)
    {
        return result.Status switch
        {
            SongCollaborationResultStatus.NoAccess => NotFound(),
            SongCollaborationResultStatus.InsufficientRole => Forbid(),
            SongCollaborationResultStatus.NotFound => NotFound(),
            SongCollaborationResultStatus.InvalidOperation => BadRequest(result.Error),
            SongCollaborationResultStatus.Conflict => Conflict(result.Error),
            _ => Problem("Unexpected collaboration result.")
        };
    }
}
