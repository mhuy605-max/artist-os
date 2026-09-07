namespace ArtistOS.Api.Integrations.GoogleDrive;

public enum MediaAccessStatus
{
    Success,
    NotFound,
    NoLinkedFile,
    GoogleDriveNotConnected,
    GoogleDriveReauthRequired,
    InvalidToken
}
