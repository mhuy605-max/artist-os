namespace ArtistOS.Api.Dtos;

public class MediaAccessResponse
{
    public string MediaUrl { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public string MimeType { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public long? SizeBytes { get; set; }
}
