namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveFolder
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string MimeType { get; set; } = GoogleDriveMimeTypes.Folder;

    public bool Trashed { get; set; }
}
