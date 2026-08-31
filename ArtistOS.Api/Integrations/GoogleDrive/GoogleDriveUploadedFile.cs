namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveUploadedFile
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;

    public long? SizeBytes { get; set; }

    public string? WebViewLink { get; set; }
}
