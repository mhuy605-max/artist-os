namespace ArtistOS.Api.Integrations.GoogleDrive;

public static class MediaRangeParser
{
    public static bool TryParseSingleRange(string? rangeHeader, out MediaByteRange? range)
    {
        range = null;

        if (string.IsNullOrWhiteSpace(rangeHeader))
        {
            return true;
        }

        const string prefix = "bytes=";
        if (!rangeHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var rangeValue = rangeHeader[prefix.Length..].Trim();
        if (rangeValue.Contains(',', StringComparison.Ordinal))
        {
            return false;
        }

        var parts = rangeValue.Split('-', 2);
        if (parts.Length != 2)
        {
            return false;
        }

        var hasStart = long.TryParse(parts[0], out var start);
        var hasEnd = long.TryParse(parts[1], out var end);

        if (!hasStart && !hasEnd)
        {
            return false;
        }

        if (hasStart && start < 0)
        {
            return false;
        }

        if (hasEnd && end < 0)
        {
            return false;
        }

        if (hasStart && hasEnd && start > end)
        {
            return false;
        }

        range = MediaByteRange.FromStartEnd(
            hasStart ? start : null,
            hasEnd ? end : null);
        return true;
    }
}
