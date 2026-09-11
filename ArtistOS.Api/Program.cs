using ArtistOS.Api.Data;
using ArtistOS.Api.Integrations.GoogleDrive;
using ArtistOS.Api.Models;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using ArtistOS.Api.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

const string LocalFrontendCorsPolicy = "LocalFrontend";
const string FrontendCorsPolicy = "FrontendCors";

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = GoogleDriveUploadLimits.RequestBodyMaxBytes;
});

// Add PostgreSQL + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddScoped<PasswordHasher<User>>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<JwtTokenService>();
builder.Services.Configure<PublicUrlOptions>(builder.Configuration.GetSection("PublicUrls"));
builder.Services.Configure<ArtistOsDataProtectionOptions>(
    builder.Configuration.GetSection("DataProtection"));
builder.Services.AddSingleton<PublicUrlService>();

var dataProtectionOptions = builder.Configuration
    .GetSection("DataProtection")
    .Get<ArtistOsDataProtectionOptions>() ?? new ArtistOsDataProtectionOptions();
var dataProtectionBuilder = builder.Services
    .AddDataProtection()
    .SetApplicationName(dataProtectionOptions.ApplicationName);
if (!string.IsNullOrWhiteSpace(dataProtectionOptions.KeyRingPath))
{
    dataProtectionBuilder.PersistKeysToFileSystem(new DirectoryInfo(dataProtectionOptions.KeyRingPath));
}
builder.Services.Configure<GoogleDriveOptions>(builder.Configuration.GetSection("GoogleDrive"));
builder.Services.AddHostedService<StartupSecurityValidationService>();
builder.Services.AddScoped<GoogleDriveOAuthStateProtector>();
builder.Services.AddScoped<GoogleDriveConnectionService>();
builder.Services.AddScoped<IGoogleDriveOAuthClient, GoogleDriveOAuthClient>();
builder.Services.AddScoped<IGoogleDriveApiClient, GoogleDriveApiClient>();
builder.Services.AddScoped<GoogleDriveWorkspaceService>();
builder.Services.AddScoped<GoogleDriveAssetUploadService>();
builder.Services.AddScoped<MediaTokenService>();
builder.Services.AddScoped<MediaAccessService>();
builder.Services.AddScoped<GoogleDriveMediaService>();
builder.Services.AddScoped<ReleaseReadinessService>();
builder.Services.AddScoped<SongAccessService>();
builder.Services.AddHttpClient();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = GoogleDriveUploadLimits.RequestBodyMaxBytes;
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration
            .GetSection("Jwt")
            .Get<JwtOptions>() ?? new JwtOptions();

        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            IssuerSigningKeyResolver = (_, _, _, _) =>
            {
                var signingKey = builder.Configuration["Jwt:SigningKey"];
                return string.IsNullOrWhiteSpace(signingKey)
                    ? []
                    : [new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey))];
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy(LocalFrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:8080")
            .WithMethods("GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS")
            .AllowAnyHeader();
    });

    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        var configuredOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [];
        var publicFrontendBaseUrl = builder.Configuration["PublicUrls:FrontendBaseUrl"];
        var origins = configuredOrigins
            .Append(publicFrontendBaseUrl)
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin!.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (origins.Length == 0 && !builder.Environment.IsDevelopment())
        {
            throw new InvalidOperationException(
                "Cors:AllowedOrigins or PublicUrls:FrontendBaseUrl must be configured outside Development.");
        }

        policy
            .WithOrigins(origins.Length == 0 ? ["http://localhost:8080"] : origins)
            .WithMethods("GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS")
            .AllowAnyHeader();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "30";
        return new ValueTask(context.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Too many requests. Try again shortly." },
            cancellationToken));
    };

    options.AddPolicy(RateLimitPolicyNames.AuthStrict, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetRemoteAddressPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:AuthStrict:PermitLimit", 20),
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(RateLimitPolicyNames.NormalApi, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetUserOrRemoteAddressPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:NormalApi:PermitLimit", 600),
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(RateLimitPolicyNames.Aggregates, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetUserOrRemoteAddressPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:Aggregates:PermitLimit", 120),
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(RateLimitPolicyNames.MediaAccess, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetUserOrRemoteAddressPartitionKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:MediaAccess:PermitLimit", 120),
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(RateLimitPolicyNames.MediaStream, httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            GetRemoteAddressPartitionKey(httpContext),
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:MediaStream:PermitLimit", 300),
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy(RateLimitPolicyNames.Uploads, httpContext =>
        RateLimitPartition.GetConcurrencyLimiter(
            GetUserOrRemoteAddressPartitionKey(httpContext),
            _ => new ConcurrencyLimiterOptions
            {
                PermitLimit = GetConfiguredLimit(builder.Configuration, "Security:RateLimits:Uploads:ConcurrencyLimit", 2),
                QueueLimit = 0
            }));
});

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseExceptionHandler(exceptionApp =>
    {
        exceptionApp.Run(async context =>
        {
            var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
            var logger = context.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("ArtistOS.Api.ExceptionHandler");

            if (exceptionFeature?.Error is not null)
            {
                logger.LogError(exceptionFeature.Error, "Unhandled request exception.");
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                title = "An unexpected server error occurred.",
                status = StatusCodes.Status500InternalServerError
            });
        });
    });
}

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseRouting();

if (app.Environment.IsDevelopment())
{
    app.UseCors(LocalFrontendCorsPolicy);
}
else
{
    app.UseCors(FrontendCorsPolicy);
}

app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();

app.Run();

static int GetConfiguredLimit(IConfiguration configuration, string key, int defaultValue)
{
    var configured = configuration.GetValue<int?>(key);
    return configured is > 0 ? configured.Value : defaultValue;
}

static string GetUserOrRemoteAddressPartitionKey(HttpContext httpContext)
{
    var userId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
        httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
    return string.IsNullOrWhiteSpace(userId)
        ? GetRemoteAddressPartitionKey(httpContext)
        : $"user:{userId}";
}

static string GetRemoteAddressPartitionKey(HttpContext httpContext)
{
    return $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";
}

public partial class Program
{
}
