namespace ArtistOS.Api.Dtos;

public class DriveWorkspaceFoldersResponse
{
    public DriveWorkspaceFolderResponse? Audio { get; set; }

    public DriveWorkspaceFolderResponse? Visuals { get; set; }

    public DriveWorkspaceFolderResponse? Release { get; set; }

    public DriveWorkspaceFolderResponse? Content { get; set; }
}
