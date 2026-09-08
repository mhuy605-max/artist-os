using ArtistOS.Api.Dtos;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtistOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/songs/{songId:int}/release/readiness")]
public class ReleaseReadinessController : ControllerBase
{
    private readonly ReleaseReadinessService _readinessService;

    public ReleaseReadinessController(ReleaseReadinessService readinessService)
    {
        _readinessService = readinessService;
    }

    [HttpGet]
    public async Task<ActionResult<ReleaseReadinessResponse>> GetReadiness(int songId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var readiness = await _readinessService.GetForSongAsync(songId, currentUserId.Value);

        return readiness is null ? NotFound() : readiness;
    }
}
