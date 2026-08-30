namespace ArtistOS.Api.Models;

public static class ReleaseChecklistDefaults
{
    public static readonly ReleaseChecklistDefinition[] Items =
    [
        new("Master", "Master", 0),
        new("Cover", "Cover", 1),
        new("Metadata", "Metadata", 2),
        new("Credits", "Credits", 3),
        new("Canvas", "Canvas", 4),
        new("MusicVideo", "Music Video", 5),
        new("ContentPlan", "Content Plan", 6)
    ];
}

public sealed record ReleaseChecklistDefinition(string Key, string Label, int SortOrder);
