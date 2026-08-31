namespace ArtistOS.Api.Dtos;

public class GoogleDriveConnectionStatusResponse
{
    public bool Connected { get; set; }

    public string? Email { get; set; }

    public string? Status { get; set; }

    public DateTime? ConnectedAt { get; set; }
}
