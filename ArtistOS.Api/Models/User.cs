using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class User
{
    public int Id { get; set; }

    [MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(254)]
    public string NormalizedEmail { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? DisplayName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Song> Songs { get; set; } = [];
}
