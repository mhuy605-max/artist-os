using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class CreateReleaseRequest : IValidatableObject
{
    public static readonly string[] AllowedReleaseTypes =
    [
        "Single"
    ];

    public static readonly string[] AllowedStatuses =
    [
        "Planning",
        "Preparing",
        "Ready",
        "Scheduled",
        "Released"
    ];

    public static readonly string[] AllowedPlatforms =
    [
        "Spotify",
        "AppleMusic",
        "YouTube",
        "YouTubeMusic",
        "SoundCloud",
        "TikTok",
        "Other"
    ];

    public DateOnly? ReleaseDate { get; set; }

    [Required]
    [StringLength(40)]
    public string ReleaseType { get; set; } = "Single";

    [StringLength(120)]
    public string? Distributor { get; set; }

    [StringLength(20)]
    public string? Isrc { get; set; }

    [StringLength(20)]
    public string? Upc { get; set; }

    [Required]
    [StringLength(40)]
    public string Status { get; set; } = "Planning";

    public List<string> Platforms { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(ReleaseType))
        {
            yield return new ValidationResult("ReleaseType is required.", [nameof(ReleaseType)]);
        }
        else if (!AllowedReleaseTypes.Contains(ReleaseType.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"ReleaseType must be one of: {string.Join(", ", AllowedReleaseTypes)}.",
                [nameof(ReleaseType)]);
        }

        if (string.IsNullOrWhiteSpace(Status))
        {
            yield return new ValidationResult("Status is required.", [nameof(Status)]);
        }
        else if (!AllowedStatuses.Contains(Status.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Status must be one of: {string.Join(", ", AllowedStatuses)}.",
                [nameof(Status)]);
        }

        foreach (var platform in Platforms)
        {
            if (string.IsNullOrWhiteSpace(platform))
            {
                yield return new ValidationResult("Platforms cannot contain empty values.", [nameof(Platforms)]);
                continue;
            }

            if (!AllowedPlatforms.Contains(platform.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                yield return new ValidationResult(
                    $"Platforms must contain only: {string.Join(", ", AllowedPlatforms)}.",
                    [nameof(Platforms)]);
            }
        }
    }
}
