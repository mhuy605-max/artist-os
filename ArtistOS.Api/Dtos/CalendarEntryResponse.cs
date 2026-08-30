namespace ArtistOS.Api.Dtos;

public class CalendarEntryResponse
{
    public string SourceType { get; set; } = string.Empty;

    public int SourceId { get; set; }

    public int SongId { get; set; }

    public string SongTitle { get; set; } = string.Empty;

    public string EventType { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Platform { get; set; }

    public bool IsEditable { get; set; }

    public string NavigationTarget { get; set; } = string.Empty;
}
