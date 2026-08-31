namespace ArtistOS.Api.Dtos;

public class DriveWorkspaceResponse
{
    public bool IsProvisioned { get; set; }

    public string? GoogleDriveStatus { get; set; }

    public DriveWorkspaceFolderResponse? RootFolder { get; set; }

    public DriveWorkspaceFolderResponse? SongsFolder { get; set; }

    public DriveWorkspaceFolderResponse? SongFolder { get; set; }

    public DriveWorkspaceFoldersResponse Folders { get; set; } = new();
}
