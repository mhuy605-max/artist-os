using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class UpdateVisualAssetRequest : IValidatableObject
{
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
        else if (!CreateVisualAssetRequest.AllowedTypes.Contains(Type.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Type must be one of: {string.Join(", ", CreateVisualAssetRequest.AllowedTypes)}.",
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
        else if (!CreateVisualAssetRequest.AllowedStatuses.Contains(Status.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Status must be one of: {string.Join(", ", CreateVisualAssetRequest.AllowedStatuses)}.",
                [nameof(Status)]);
        }
    }
}
