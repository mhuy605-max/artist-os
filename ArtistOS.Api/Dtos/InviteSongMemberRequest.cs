using System.ComponentModel.DataAnnotations;
using ArtistOS.Api.Models;

namespace ArtistOS.Api.Dtos;

public class InviteSongMemberRequest : IValidatableObject
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Role { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            yield return new ValidationResult("Email is required.", [nameof(Email)]);
        }

        if (string.IsNullOrWhiteSpace(Role))
        {
            yield return new ValidationResult("Role is required.", [nameof(Role)]);
            yield break;
        }

        if (!Enum.TryParse<SongMemberRole>(Role.Trim(), ignoreCase: true, out _))
        {
            yield return new ValidationResult(
                "Role must be one of: EDITOR, VIEWER.",
                [nameof(Role)]);
        }
    }
}
