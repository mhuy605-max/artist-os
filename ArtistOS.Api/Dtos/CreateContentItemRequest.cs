using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class CreateContentItemRequest : IValidatableObject
{
    public static readonly string[] AllowedTypes =
    [
        "Teaser",
        "Snippet",
        "MusicVideo",
        "Visualizer",
        "BehindTheScenes",
        "TikTok",
        "InstagramReel",
        "YouTubeShort",
        "ArtworkPost"
    ];

    public static readonly string[] AllowedStatuses =
    [
        "Idea",
        "Planned",
        "InProduction",
        "Editing",
        "Ready",
        "Scheduled",
        "Published"
    ];

    public static readonly string[] AllowedPlatforms =
    [
        "Instagram",
        "TikTok",
        "YouTube",
        "YouTubeShorts",
        "Spotify",
        "CrossPlatform",
        "Other"
    ];

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string Type { get; set; } = "Teaser";

    [Required]
    [StringLength(40)]
    public string Status { get; set; } = "Idea";

    [StringLength(40)]
    public string? Platform { get; set; }

    [StringLength(120)]
    public string? OwnerName { get; set; }

    public DateOnly? DueDate { get; set; }

    public DateOnly? ScheduledAt { get; set; }

    public DateOnly? PublishedAt { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", [nameof(Title)]);
        }

        if (string.IsNullOrWhiteSpace(Type))
        {
            yield return new ValidationResult("Type is required.", [nameof(Type)]);
        }
        else if (!AllowedTypes.Contains(Type.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Type must be one of: {string.Join(", ", AllowedTypes)}.",
                [nameof(Type)]);
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

        if (!string.IsNullOrWhiteSpace(Platform)
            && !AllowedPlatforms.Contains(Platform.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Platform must be one of: {string.Join(", ", AllowedPlatforms)}.",
                [nameof(Platform)]);
        }
    }
}
