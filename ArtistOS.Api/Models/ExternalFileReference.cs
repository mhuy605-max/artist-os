using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Models;

public class ExternalFileReference
{
    public int Id { get; set; }

    public int OwnerUserId { get; set; }

    public User OwnerUser { get; set; } = null!;

    public int? SongId { get; set; }

    public Song? Song { get; set; }

    public int? GoogleDriveConnectionId { get; set; }

    public GoogleDriveConnection? GoogleDriveConnection { get; set; }

    [MaxLength(40)]
    public string Provider { get; set; } = ExternalFileProviders.GoogleDrive;

    [MaxLength(255)]
    public string ExternalId { get; set; } = string.Empty;

    [MaxLength(80)]
    public string ResourceType { get; set; } = string.Empty;

    public bool IsFolder { get; set; }

    [MaxLength(255)]
    public string DisplayName { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MimeType { get; set; }

    public long? SizeBytes { get; set; }

    [MaxLength(2048)]
    public string? WebViewLink { get; set; }

    [MaxLength(80)]
    public string? LinkedResourceType { get; set; }

    public int? LinkedResourceId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
