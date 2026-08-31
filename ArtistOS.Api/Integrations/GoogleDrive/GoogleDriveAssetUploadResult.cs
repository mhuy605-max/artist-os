using ArtistOS.Api.Dtos;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveAssetUploadResult
{
    public GoogleDriveAssetUploadStatus Status { get; set; }

    public string? Detail { get; set; }

    public AudioAssetResponse? AudioAsset { get; set; }

    public VisualAssetResponse? VisualAsset { get; set; }

    public static GoogleDriveAssetUploadResult Success(AudioAssetResponse audioAsset)
    {
        return new GoogleDriveAssetUploadResult
        {
            Status = GoogleDriveAssetUploadStatus.Success,
            AudioAsset = audioAsset
        };
    }

    public static GoogleDriveAssetUploadResult Success(VisualAssetResponse visualAsset)
    {
        return new GoogleDriveAssetUploadResult
        {
            Status = GoogleDriveAssetUploadStatus.Success,
            VisualAsset = visualAsset
        };
    }

    public static GoogleDriveAssetUploadResult Failure(
        GoogleDriveAssetUploadStatus status,
        string? detail = null)
    {
        return new GoogleDriveAssetUploadResult
        {
            Status = status,
            Detail = detail
        };
    }
}
