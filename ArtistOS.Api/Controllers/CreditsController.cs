using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/songs/{songId:int}/credits")]
public class CreditsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CreditsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CreditResponse>>> GetCredits(int songId)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        return await _context.Credits
            .AsNoTracking()
            .Where(credit => credit.SongId == songId)
            .OrderBy(credit => credit.Role)
            .ThenBy(credit => credit.ContributorName)
            .ThenBy(credit => credit.Id)
            .Select(credit => new CreditResponse
            {
                Id = credit.Id,
                SongId = credit.SongId,
                ContributorName = credit.ContributorName,
                Role = credit.Role,
                Contact = credit.Contact,
                Status = credit.Status,
                SplitPercentage = credit.SplitPercentage,
                Notes = credit.Notes,
                CreatedAt = credit.CreatedAt,
                UpdatedAt = credit.UpdatedAt
            })
            .ToListAsync();
    }

    [HttpGet("{creditId:int}")]
    public async Task<ActionResult<CreditResponse>> GetCredit(int songId, int creditId)
    {
        var credit = await _context.Credits
            .AsNoTracking()
            .FirstOrDefaultAsync(credit =>
                credit.SongId == songId && credit.Id == creditId);

        if (credit is null)
        {
            return NotFound();
        }

        return ToResponse(credit);
    }

    [HttpPost]
    public async Task<ActionResult<CreditResponse>> CreateCredit(
        int songId,
        CreateCreditRequest request)
    {
        if (!await SongExists(songId))
        {
            return NotFound();
        }

        var now = DateTime.UtcNow;
        var credit = new Credit
        {
            SongId = songId,
            ContributorName = request.ContributorName.Trim(),
            Role = NormalizeRole(request.Role),
            Contact = TrimToNull(request.Contact),
            Status = NormalizeStatus(request.Status),
            SplitPercentage = request.SplitPercentage,
            Notes = TrimToNull(request.Notes),
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Credits.Add(credit);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCredit),
            new { songId, creditId = credit.Id },
            ToResponse(credit));
    }

    [HttpPut("{creditId:int}")]
    public async Task<IActionResult> UpdateCredit(
        int songId,
        int creditId,
        UpdateCreditRequest request)
    {
        var credit = await _context.Credits
            .FirstOrDefaultAsync(credit =>
                credit.SongId == songId && credit.Id == creditId);

        if (credit is null)
        {
            return NotFound();
        }

        credit.ContributorName = request.ContributorName.Trim();
        credit.Role = NormalizeRole(request.Role);
        credit.Contact = TrimToNull(request.Contact);
        credit.Status = NormalizeStatus(request.Status);
        credit.SplitPercentage = request.SplitPercentage;
        credit.Notes = TrimToNull(request.Notes);
        credit.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{creditId:int}")]
    public async Task<IActionResult> DeleteCredit(int songId, int creditId)
    {
        var credit = await _context.Credits
            .FirstOrDefaultAsync(credit =>
                credit.SongId == songId && credit.Id == creditId);

        if (credit is null)
        {
            return NotFound();
        }

        _context.Credits.Remove(credit);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> SongExists(int songId)
    {
        return await _context.Songs.AnyAsync(song => song.Id == songId);
    }

    private static CreditResponse ToResponse(Credit credit)
    {
        return new CreditResponse
        {
            Id = credit.Id,
            SongId = credit.SongId,
            ContributorName = credit.ContributorName,
            Role = credit.Role,
            Contact = credit.Contact,
            Status = credit.Status,
            SplitPercentage = credit.SplitPercentage,
            Notes = credit.Notes,
            CreatedAt = credit.CreatedAt,
            UpdatedAt = credit.UpdatedAt
        };
    }

    private static string NormalizeRole(string role)
    {
        var trimmedRole = role.Trim();

        return CreateCreditRequest.AllowedRoles.First(allowedRole =>
            string.Equals(allowedRole, trimmedRole, StringComparison.OrdinalIgnoreCase));
    }

    private static string NormalizeStatus(string status)
    {
        var trimmedStatus = status.Trim();

        return CreateCreditRequest.AllowedStatuses.First(allowedStatus =>
            string.Equals(allowedStatus, trimmedStatus, StringComparison.OrdinalIgnoreCase));
    }

    private static string? TrimToNull(string? value)
    {
        var trimmedValue = value?.Trim();
        return string.IsNullOrEmpty(trimmedValue) ? null : trimmedValue;
    }
}
