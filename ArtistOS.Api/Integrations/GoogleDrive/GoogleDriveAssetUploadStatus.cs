namespace ArtistOS.Api.Integrations.GoogleDrive;

public enum GoogleDriveAssetUploadStatus
{
    Success,
    AssetNotFound,
    Forbidden,
    GoogleDriveNotConnected,
    GoogleDriveReauthRequired,
    WorkspaceUnavailable,
    InvalidFile,
    UnsupportedFileType,
    FileTooLarge,
    AlreadyLinked,
    NotLinked,
    GoogleDriveUnavailable,
    PersistenceFailed
}
