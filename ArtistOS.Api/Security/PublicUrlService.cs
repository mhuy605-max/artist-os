using Microsoft.Extensions.Options;

namespace ArtistOS.Api.Security;

public class PublicUrlService
{
    private readonly PublicUrlOptions _options;
    private readonly IWebHostEnvironment _environment;

    public PublicUrlService(IOptions<PublicUrlOptions> options, IWebHostEnvironment environment)
    {
        _options = options.Value;
        _environment = environment;
    }

    public string BuildApiUrl(string pathAndQuery)
    {
        return Combine(GetApiBaseUrl(), pathAndQuery);
    }

    public string BuildFrontendUrl(string pathAndQuery)
    {
        return Combine(GetFrontendBaseUrl(), pathAndQuery);
    }

    private string GetApiBaseUrl()
    {
        if (!string.IsNullOrWhiteSpace(_options.ApiBaseUrl))
        {
            return NormalizeBaseUrl(_options.ApiBaseUrl);
        }

        if (_environment.IsDevelopment())
        {
            return "http://localhost:5178";
        }

        throw new InvalidOperationException("PublicUrls:ApiBaseUrl must be configured outside Development.");
    }

    private string GetFrontendBaseUrl()
    {
        if (!string.IsNullOrWhiteSpace(_options.FrontendBaseUrl))
        {
            return NormalizeBaseUrl(_options.FrontendBaseUrl);
        }

        if (_environment.IsDevelopment())
        {
            return "http://localhost:8080";
        }

        throw new InvalidOperationException("PublicUrls:FrontendBaseUrl must be configured outside Development.");
    }

    private static string NormalizeBaseUrl(string value)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("http" or "https") ||
            string.IsNullOrWhiteSpace(uri.Host))
        {
            throw new InvalidOperationException("Configured public URL values must be absolute HTTP(S) URLs.");
        }

        return uri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
    }

    private static string Combine(string baseUrl, string pathAndQuery)
    {
        var normalizedPath = pathAndQuery.StartsWith("/", StringComparison.Ordinal)
            ? pathAndQuery
            : $"/{pathAndQuery}";

        return $"{baseUrl}{normalizedPath}";
    }
}
