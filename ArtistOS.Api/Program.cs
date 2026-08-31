using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string LocalFrontendCorsPolicy = "LocalFrontend";

// Add PostgreSQL + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddScoped<PasswordHasher<User>>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "artist_os_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(LocalFrontendCorsPolicy, policy =>
        {
            policy
                .WithOrigins("http://localhost:8080")
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });
}

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseCors(LocalFrontendCorsPolicy);
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program
{
}
