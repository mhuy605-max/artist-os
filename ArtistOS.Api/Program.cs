using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using ArtistOS.Api.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

const string LocalFrontendCorsPolicy = "LocalFrontend";

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

// Add PostgreSQL + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddScoped<PasswordHasher<User>>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<JwtTokenService>();

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

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(LocalFrontendCorsPolicy, policy =>
        {
            policy
                .WithOrigins("http://localhost:8080")
                .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .AllowAnyHeader();
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
