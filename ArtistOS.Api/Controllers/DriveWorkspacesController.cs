using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArtistOS.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicyNames.NormalApi)]
[ApiController]
[Route("api/songs/{songId:int}/drive-workspace")]
public class DriveWorkspacesController : ControllerBase
{
    private readonly GoogleDriveWorkspaceService _workspaceService;
    private readonly SongAccessService _songAccessService;

    public DriveWorkspacesController(
        GoogleDriveWorkspaceService workspaceService,
        SongAccessService songAccessService)
    {
        _workspaceService = workspaceService;
        _songAccessService = songAccessService;
    }

    [HttpGet]
    public async Task<ActionResult<DriveWorkspaceResponse>> GetWorkspace(
        int songId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(
            songId,
            currentUserId.Value,
            cancellationToken);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        var storageOwnerUserId = await _songAccessService.GetStorageOwnerUserIdAsync(
            songId,
            cancellationToken);
        if (storageOwnerUserId is null)
        {
            return NotFound();
        }

        return ToActionResult(await _workspaceService.GetWorkspaceAsync(
            storageOwnerUserId.Value,
            songId,
            cancellationToken));
    }

    [HttpPost("provision")]
    public async Task<ActionResult<DriveWorkspaceResponse>> ProvisionWorkspace(
        int songId,
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var capabilities = await _songAccessService.GetCapabilitiesAsync(
            songId,
            currentUserId.Value,
            cancellationToken);
        if (!capabilities.CanRead)
        {
            return NotFound();
        }

        if (capabilities.AccessLevel != SongAccessLevel.OWNER)
        {
            return Forbid();
        }

        return ToActionResult(await _workspaceService.ProvisionWorkspaceAsync(
            currentUserId.Value,
            songId,
            cancellationToken));
    }

    private ActionResult<DriveWorkspaceResponse> ToActionResult(GoogleDriveWorkspaceResult result)
    {
        return result.Status switch
        {
            GoogleDriveWorkspaceResultStatus.Success => result.Workspace!,
            GoogleDriveWorkspaceResultStatus.SongNotFound => NotFound(),
            GoogleDriveWorkspaceResultStatus.GoogleDriveNotConnected => Problem(
                title: "Google Drive is not connected.",
                statusCode: StatusCodes.Status409Conflict),
            GoogleDriveWorkspaceResultStatus.GoogleDriveReauthRequired => Problem(
                title: "Google Drive authorization needs to be refreshed.",
                statusCode: StatusCodes.Status409Conflict),
            _ => Problem(
                title: "Google Drive workspace could not be provisioned.",
                statusCode: StatusCodes.Status502BadGateway)
        };
    }
}
