using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class UpdateSongRequest : IValidatableObject
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(40)]
    public string Status { get; set; } = "Demo";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult(
                "Title is required.",
                [nameof(Title)]);
        }

        if (string.IsNullOrWhiteSpace(Status))
        {
            yield return new ValidationResult(
                "Status is required.",
                [nameof(Status)]);
        }
        else if (!CreateSongRequest.AllowedStatuses.Contains(Status.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"Status must be one of: {string.Join(", ", CreateSongRequest.AllowedStatuses)}.",
                [nameof(Status)]);
        }
    }
}
