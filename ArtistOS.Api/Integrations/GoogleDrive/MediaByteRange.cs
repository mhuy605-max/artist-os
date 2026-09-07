namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaByteRange
{
    public long? Start { get; set; }

    public long? End { get; set; }

    public bool IsSuffixRange => Start is null && End is not null;

    public static MediaByteRange FromStartEnd(long? start, long? end)
    {
        return new MediaByteRange
        {
            Start = start,
            End = end
        };
    }
}
