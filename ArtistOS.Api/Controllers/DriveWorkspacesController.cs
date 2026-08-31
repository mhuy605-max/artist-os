using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtistOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/songs/{songId:int}/drive-workspace")]
public class DriveWorkspacesController : ControllerBase
{
    private readonly GoogleDriveWorkspaceService _workspaceService;

    public DriveWorkspacesController(GoogleDriveWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
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

        return ToActionResult(await _workspaceService.GetWorkspaceAsync(
            currentUserId.Value,
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
