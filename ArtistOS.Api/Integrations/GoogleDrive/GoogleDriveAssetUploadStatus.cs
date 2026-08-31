namespace ArtistOS.Api.Integrations.GoogleDrive;

public enum GoogleDriveAssetUploadStatus
{
    Success,
    AssetNotFound,
    GoogleDriveNotConnected,
    GoogleDriveReauthRequired,
    WorkspaceUnavailable,
    InvalidFile,
    UnsupportedFileType,
    FileTooLarge,
    AlreadyLinked,
    GoogleDriveUnavailable,
    PersistenceFailed
}
