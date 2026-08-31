using ArtistOS.Api.Dtos;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArtistOS.Api.Controllers;

[ApiController]
[Route("api/integrations/google-drive")]
public class GoogleDriveIntegrationController : ControllerBase
{
    private readonly GoogleDriveConnectionService _connectionService;
    private readonly GoogleDriveOptions _options;
    private readonly ILogger<GoogleDriveIntegrationController> _logger;
    private readonly IHostEnvironment _environment;

    public GoogleDriveIntegrationController(
        GoogleDriveConnectionService connectionService,
        IOptions<GoogleDriveOptions> options,
        ILogger<GoogleDriveIntegrationController> logger,
        IHostEnvironment environment)
    {
        _connectionService = connectionService;
        _options = options.Value;
        _logger = logger;
        _environment = environment;
    }

    [Authorize]
    [HttpGet("status")]
    public async Task<ActionResult<GoogleDriveConnectionStatusResponse>> Status(
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        return await _connectionService.GetStatusAsync(currentUserId.Value, cancellationToken);
    }

    [Authorize]
    [HttpPost("connect")]
    public ActionResult<GoogleDriveConnectResponse> Connect()
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        try
        {
            return new GoogleDriveConnectResponse
            {
                AuthorizationUrl = _connectionService.CreateAuthorizationUrl(
                    currentUserId.Value,
                    BuildCallbackUrl())
            };
        }
        catch (InvalidOperationException exception)
        {
            return Problem(exception.Message, statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken cancellationToken)
    {
        LogDevelopment(
            "Google Drive OAuth callback received. Code present: {HasCode}. State present: {HasState}. Error present: {HasError}.",
            !string.IsNullOrWhiteSpace(code),
            !string.IsNullOrWhiteSpace(state),
            !string.IsNullOrWhiteSpace(error));

        if (!string.IsNullOrWhiteSpace(error))
        {
            LogDevelopment("Google Drive OAuth callback denied by Google/user.");
            LogDevelopment(
                "Google Drive OAuth callback final redirect outcome: {CallbackResult}.",
                "Denied");
            return RedirectToSettings("denied");
        }

        if (string.IsNullOrWhiteSpace(state))
        {
            LogDevelopment("Google Drive OAuth callback missing state.");
            LogDevelopment(
                "Google Drive OAuth callback final redirect outcome: {CallbackResult}.",
                "MissingState");
            return RedirectToSettings("failed");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            LogDevelopment("Google Drive OAuth callback missing authorization code.");
            LogDevelopment(
                "Google Drive OAuth callback final redirect outcome: {CallbackResult}.",
                "MissingCode");
            return RedirectToSettings("failed");
        }

        GoogleDriveCallbackResult result;
        try
        {
            result = await _connectionService.CompleteCallbackAsync(
                code,
                state,
                BuildCallbackUrl(),
                cancellationToken);
        }
        catch (Exception exception)
        {
            LogDevelopment(exception, "Google Drive OAuth callback failed before safe redirect.");
            result = GoogleDriveCallbackResult.Failed;
        }

        var redirectResult = result switch
        {
            GoogleDriveCallbackResult.Connected => RedirectToSettings("connected"),
            GoogleDriveCallbackResult.ReauthRequired => RedirectToSettings("reauth-required"),
            GoogleDriveCallbackResult.InvalidState => RedirectToSettings("invalid-state"),
            _ => RedirectToSettings("failed")
        };

        LogDevelopment(
            "Google Drive OAuth callback final redirect outcome: {CallbackResult}.",
            result);

        return redirectResult;
    }

    [Authorize]
    [HttpPost("disconnect")]
    public async Task<ActionResult<GoogleDriveDisconnectResponse>> Disconnect(
        CancellationToken cancellationToken)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        return await _connectionService.DisconnectAsync(currentUserId.Value, cancellationToken);
    }

    private string BuildCallbackUrl()
    {
        return Url.ActionLink(nameof(Callback), values: null) ??
            "http://localhost:5178/api/integrations/google-drive/callback";
    }

    private RedirectResult RedirectToSettings(string result)
    {
        var separator = _options.FrontendRedirectUrl.Contains('?') ? '&' : '?';
        return Redirect($"{_options.FrontendRedirectUrl}{separator}googleDrive={result}");
    }

    private void LogDevelopment(string message, params object?[] args)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogInformation(message, args);
        }
    }

    private void LogDevelopment(Exception exception, string message, params object?[] args)
    {
        if (_environment.IsDevelopment())
        {
            _logger.LogWarning(exception, message, args);
        }
    }
}
