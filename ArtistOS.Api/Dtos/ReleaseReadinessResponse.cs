namespace ArtistOS.Api.Dtos;

public class ReleaseReadinessResponse
{
    public int SongId { get; set; }

    public int ReleaseId { get; set; }

    public int ReadyCount { get; set; }

    public int RequiredCount { get; set; }

    public int TotalCount { get; set; }

    public int Percentage { get; set; }

    public List<ReleaseReadinessItemResponse> Items { get; set; } = [];
}

public class ReleaseReadinessItemResponse
{
    public string Key { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string Source { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;

    public bool IsRequired { get; set; }

    public int? RelatedResourceId { get; set; }

    public string? RelatedResourceType { get; set; }
}
