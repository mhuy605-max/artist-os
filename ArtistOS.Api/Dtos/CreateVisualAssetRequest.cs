using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class CreateVisualAssetRequest : IValidatableObject
{
    public static readonly string[] AllowedTypes =
    [
        "CoverArt",
        "MusicVideo",
        "Visualizer",
        "SpotifyCanvas",
        "PromoAsset",
        "SocialContent"
    ];

    public static readonly string[] AllowedStatuses =
    [
        "Draft",
        "InProgress",
        "Review",
        "Approved",
        "Final"
    ];

    [Required]
    [StringLength(40)]
    public string Type { get; set; } = "CoverArt";

    [Required]
    [StringLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Version { get; set; } = 1;

    [Required]
    [StringLength(40)]
    public string Status { get; set; } = "Draft";

    [Range(1, int.MaxValue)]
    public int? Width { get; set; }

    [Range(1, int.MaxValue)]
    public int? Height { get; set; }

    [Range(0, long.MaxValue)]
    public long? FileSizeBytes { get; set; }

    public bool IsCurrent { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
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

        if (string.IsNullOrWhiteSpace(FileName))
        {
            yield return new ValidationResult("FileName is required.", [nameof(FileName)]);
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
    }
}
