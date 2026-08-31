using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class GoogleDriveConnection
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [MaxLength(255)]
    public string GoogleSubject { get; set; } = string.Empty;

    [MaxLength(254)]
    public string GoogleEmail { get; set; } = string.Empty;

    public bool GoogleEmailVerified { get; set; }

    public string? ProtectedRefreshToken { get; set; }

    [MaxLength(500)]
    public string GrantedScopes { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = GoogleDriveConnectionStatuses.Connected;

    [MaxLength(255)]
    public string? RootFolderId { get; set; }

    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastSuccessfulRefreshAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public ICollection<ExternalFileReference> ExternalFileReferences { get; set; } = [];
}
