using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class LoginRequest
{
    public const int PasswordMaxLength = 200;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(PasswordMaxLength)]
    public string Password { get; set; } = string.Empty;
}
