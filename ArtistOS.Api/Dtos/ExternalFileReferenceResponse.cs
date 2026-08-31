namespace ArtistOS.Api.Dtos;

public class ExternalFileReferenceResponse
{
    public int Id { get; set; }

    public string Provider { get; set; } = string.Empty;

    public string ResourceType { get; set; } = string.Empty;

    public bool IsFolder { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public string? MimeType { get; set; }

    public long? SizeBytes { get; set; }

    public string? WebViewLink { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
