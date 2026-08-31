using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class RegisterRequest : IValidatableObject
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [StringLength(200)]
    public string Password { get; set; } = string.Empty;

    [StringLength(120)]
    public string? DisplayName { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            yield return new ValidationResult("Email is required.", [nameof(Email)]);
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            yield return new ValidationResult("Password is required.", [nameof(Password)]);
        }

        if (DisplayName is not null && string.IsNullOrWhiteSpace(DisplayName))
        {
            yield return new ValidationResult(
                "DisplayName must contain non-whitespace characters when provided.",
                [nameof(DisplayName)]);
        }
    }
}
