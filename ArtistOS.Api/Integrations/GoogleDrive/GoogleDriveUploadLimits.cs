namespace ArtistOS.Api.Integrations.GoogleDrive;

public static class GoogleDriveUploadLimits
{
    public const long AudioMaxBytes = 500L * 1024L * 1024L;
    public const long VisualImageMaxBytes = 100L * 1024L * 1024L;
    public const long VisualVideoMaxBytes = 2L * 1024L * 1024L * 1024L;
    public const long RequestBodyMaxBytes = VisualVideoMaxBytes + 10L * 1024L * 1024L;
}
