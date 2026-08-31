namespace ArtistOS.Api.Integrations.GoogleDrive;

public enum GoogleDriveOAuthStateValidationStatus
{
    Valid,
    Missing,
    UnprotectFailed,
    InvalidPayload,
    Expired
}
