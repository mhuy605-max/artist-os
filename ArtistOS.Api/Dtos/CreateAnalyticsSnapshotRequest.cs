using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class CreateAnalyticsSnapshotRequest : IValidatableObject
{
    public static readonly string[] AllowedPlatforms =
    [
        "YouTube",
        "Spotify",
        "TikTok",
        "Instagram",
        "Other"
    ];

    [Required]
    [StringLength(40)]
    public string Platform { get; set; } = "YouTube";

    public DateOnly? SnapshotDate { get; set; }

    [Range(0, long.MaxValue)]
    public long Views { get; set; }

    [Range(0, long.MaxValue)]
    public long Likes { get; set; }

    [Range(0, long.MaxValue)]
    public long Comments { get; set; }

    [Range(0, long.MaxValue)]
    public long WatchTimeMinutes { get; set; }

    [Range(0, long.MaxValue)]
    public long SubscribersGained { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Platform))
        {
            yield return new ValidationResult("Platform is required.", [nameof(Platform)]);
        }
        else if (!AllowedPlatforms.Contains(Platform.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Platform must be one of: {string.Join(", ", AllowedPlatforms)}.",
                [nameof(Platform)]);
        }

        if (!SnapshotDate.HasValue)
        {
            yield return new ValidationResult(
                "SnapshotDate is required.",
                [nameof(SnapshotDate)]);
        }
    }
}
