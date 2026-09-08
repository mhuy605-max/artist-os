namespace ArtistOS.Api.Security;

public class StartupSecurityValidationService : IHostedService
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;

    public StartupSecurityValidationService(
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        _configuration = configuration;
        _environment = environment;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (_environment.IsDevelopment())
        {
            return Task.CompletedTask;
        }

        if (string.IsNullOrWhiteSpace(_configuration["DataProtection:KeyRingPath"]))
        {
            throw new InvalidOperationException(
                "DataProtection:KeyRingPath must be configured outside Development.");
        }

        if (string.Equals(_configuration["AllowedHosts"], "*", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "AllowedHosts must be explicitly configured outside Development.");
        }

        if (string.IsNullOrWhiteSpace(_configuration["PublicUrls:ApiBaseUrl"]) ||
            string.IsNullOrWhiteSpace(_configuration["PublicUrls:FrontendBaseUrl"]))
        {
            throw new InvalidOperationException(
                "PublicUrls:ApiBaseUrl and PublicUrls:FrontendBaseUrl must be configured outside Development.");
        }

        var corsOrigins = _configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];
        if (corsOrigins.Length == 0)
        {
            throw new InvalidOperationException(
                "Cors:AllowedOrigins must be configured outside Development.");
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
