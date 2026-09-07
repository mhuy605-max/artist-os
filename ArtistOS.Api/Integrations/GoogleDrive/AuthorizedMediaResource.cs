using ArtistOS.Api.Models;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class AuthorizedMediaResource
{
    public int UserId { get; set; }

    public int SongId { get; set; }

    public string AssetKind { get; set; } = string.Empty;

    public int AssetId { get; set; }

    public ExternalFileReference Reference { get; set; } = null!;

    public GoogleDriveConnection Connection { get; set; } = null!;
}
