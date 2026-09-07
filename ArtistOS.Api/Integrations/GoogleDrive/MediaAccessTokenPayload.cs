namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaAccessTokenPayload
{
    public int UserId { get; set; }

    public int SongId { get; set; }

    public string AssetKind { get; set; } = string.Empty;

    public int AssetId { get; set; }

    public int ExternalFileReferenceId { get; set; }

    public string Purpose { get; set; } = "stream";
}
