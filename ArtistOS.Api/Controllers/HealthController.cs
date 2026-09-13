using ArtistOS.Api.Data;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private static readonly TimeSpan ReadinessTimeout = TimeSpan.FromSeconds(3);

    private readonly AppDbContext _dbContext;
    private readonly IDataProtectionProvider _dataProtectionProvider;
    private readonly IOptions<ArtistOsDataProtectionOptions> _dataProtectionOptions;
    private readonly IWebHostEnvironment _environment;

    public HealthController(
        AppDbContext dbContext,
        IDataProtectionProvider dataProtectionProvider,
        IOptions<ArtistOsDataProtectionOptions> dataProtectionOptions,
        IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _dataProtectionProvider = dataProtectionProvider;
        _dataProtectionOptions = dataProtectionOptions;
        _environment = environment;
    }

    [HttpGet("live")]
    public ActionResult<HealthResponse> Live()
    {
        return Ok(HealthResponse.Healthy([]));
    }

    [HttpGet("ready")]
    public async Task<ActionResult<HealthResponse>> Ready(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(ReadinessTimeout);

        var checks = new List<HealthCheckResponse>
        {
            await CheckPostgreSqlAsync(timeout.Token),
            CheckDataProtection()
        };

        if (checks.Any(check => check.Status != HealthStatuses.Healthy))
        {
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                HealthResponse.Unhealthy(checks));
        }

        return Ok(HealthResponse.Healthy(checks));
    }

    private async Task<HealthCheckResponse> CheckPostgreSqlAsync(CancellationToken cancellationToken)
    {
        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResponse.Healthy("postgresql")
                : HealthCheckResponse.Unhealthy("postgresql");
        }
        catch
        {
            return HealthCheckResponse.Unhealthy("postgresql");
        }
    }

    private HealthCheckResponse CheckDataProtection()
    {
        try
        {
            if (!_environment.IsDevelopment() && !HasDurableDataProtectionConfiguration())
            {
                return HealthCheckResponse.Unhealthy("dataProtection");
            }

            var protector = _dataProtectionProvider.CreateProtector("ArtistOS.Health.Readiness.v1");
            var protectedValue = protector.Protect("ready");
            var unprotectedValue = protector.Unprotect(protectedValue);

            return unprotectedValue == "ready"
                ? HealthCheckResponse.Healthy("dataProtection")
                : HealthCheckResponse.Unhealthy("dataProtection");
        }
        catch
        {
            return HealthCheckResponse.Unhealthy("dataProtection");
        }
    }

    private bool HasDurableDataProtectionConfiguration()
    {
        var options = _dataProtectionOptions.Value;
        return !string.IsNullOrWhiteSpace(options.KeyRingPath) ||
            !string.IsNullOrWhiteSpace(options.BlobUri);
    }
}

public sealed record HealthResponse(string Status, IReadOnlyList<HealthCheckResponse> Checks)
{
    public static HealthResponse Healthy(IReadOnlyList<HealthCheckResponse> checks) =>
        new(HealthStatuses.Healthy, checks);

    public static HealthResponse Unhealthy(IReadOnlyList<HealthCheckResponse> checks) =>
        new(HealthStatuses.Unhealthy, checks);
}

public sealed record HealthCheckResponse(string Name, string Status)
{
    public static HealthCheckResponse Healthy(string name) => new(name, HealthStatuses.Healthy);

    public static HealthCheckResponse Unhealthy(string name) => new(name, HealthStatuses.Unhealthy);
}

public static class HealthStatuses
{
    public const string Healthy = "healthy";
    public const string Unhealthy = "unhealthy";
}
