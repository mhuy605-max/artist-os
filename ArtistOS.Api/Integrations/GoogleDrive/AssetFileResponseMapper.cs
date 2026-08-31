using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public static class AssetFileResponseMapper
{
    public static AudioAssetResponse ToAudioAssetResponse(AudioAsset audioAsset)
    {
        return new AudioAssetResponse
        {
            Id = audioAsset.Id,
            SongId = audioAsset.SongId,
            Type = audioAsset.Type,
            FileName = audioAsset.FileName,
            Version = audioAsset.Version,
            Status = audioAsset.Status,
            DurationSeconds = audioAsset.DurationSeconds,
            FileSizeBytes = audioAsset.FileSizeBytes,
            UploadedAt = audioAsset.UploadedAt,
            IsCurrent = audioAsset.IsCurrent,
            LinkedFile = ToExternalFileReferenceResponse(audioAsset.ExternalFileReference)
        };
    }

    public static VisualAssetResponse ToVisualAssetResponse(VisualAsset visualAsset)
    {
        return new VisualAssetResponse
        {
            Id = visualAsset.Id,
            SongId = visualAsset.SongId,
            Type = visualAsset.Type,
            FileName = visualAsset.FileName,
            Version = visualAsset.Version,
            Status = visualAsset.Status,
            Width = visualAsset.Width,
            Height = visualAsset.Height,
            FileSizeBytes = visualAsset.FileSizeBytes,
            UploadedAt = visualAsset.UploadedAt,
            IsCurrent = visualAsset.IsCurrent,
            LinkedFile = ToExternalFileReferenceResponse(visualAsset.ExternalFileReference)
        };
    }

    public static ExternalFileReferenceResponse? ToExternalFileReferenceResponse(
        ExternalFileReference? reference)
    {
        return reference is null
            ? null
            : new ExternalFileReferenceResponse
            {
                Id = reference.Id,
                Provider = reference.Provider,
                ResourceType = reference.ResourceType,
                IsFolder = reference.IsFolder,
                DisplayName = reference.DisplayName,
                MimeType = reference.MimeType,
                SizeBytes = reference.SizeBytes,
                WebViewLink = reference.WebViewLink,
                CreatedAt = reference.CreatedAt,
                UpdatedAt = reference.UpdatedAt
            };
    }
}
