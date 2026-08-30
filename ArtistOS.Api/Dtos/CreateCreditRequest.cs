using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class CreateCreditRequest : IValidatableObject
{
    public static readonly string[] AllowedRoles =
    [
        "Artist",
        "FeaturedArtist",
        "Producer",
        "Songwriter",
        "RecordingEngineer",
        "MixEngineer",
        "MasteringEngineer",
        "Director",
        "Designer"
    ];

    public static readonly string[] AllowedStatuses =
    [
        "Pending",
        "Confirmed"
    ];

    [Required]
    [StringLength(160)]
    public string ContributorName { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string Role { get; set; } = "Artist";

    [StringLength(160)]
    public string? Contact { get; set; }

    [Required]
    [StringLength(40)]
    public string Status { get; set; } = "Pending";

    [Range(0, 100)]
    public decimal? SplitPercentage { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(ContributorName))
        {
            yield return new ValidationResult(
                "ContributorName is required.",
                [nameof(ContributorName)]);
        }

        if (string.IsNullOrWhiteSpace(Role))
        {
            yield return new ValidationResult("Role is required.", [nameof(Role)]);
        }
        else if (!AllowedRoles.Contains(Role.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Role must be one of: {string.Join(", ", AllowedRoles)}.",
                [nameof(Role)]);
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
