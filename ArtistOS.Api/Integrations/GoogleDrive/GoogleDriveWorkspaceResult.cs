using ArtistOS.Api.Dtos;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveWorkspaceResult
{
    public GoogleDriveWorkspaceResultStatus Status { get; set; }

    public DriveWorkspaceResponse? Workspace { get; set; }

    public static GoogleDriveWorkspaceResult Success(DriveWorkspaceResponse workspace)
    {
        return new GoogleDriveWorkspaceResult
        {
            Status = GoogleDriveWorkspaceResultStatus.Success,
            Workspace = workspace
        };
    }

    public static GoogleDriveWorkspaceResult Failure(GoogleDriveWorkspaceResultStatus status)
    {
        return new GoogleDriveWorkspaceResult { Status = status };
    }
}
