using ArtistOS.Api.Models;

namespace ArtistOS.Api.PostgresTests;

internal static class PostgresTestData
{
    public static User User(string email) => new()
    {
        Email = email,
        NormalizedEmail = email.Trim().ToUpperInvariant(),
        PasswordHash = $"hash-{Guid.NewGuid():N}",
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    public static Song Song(User owner, string title = "PostgreSQL Verification Song") => new()
    {
        Title = title,
        Status = "Demo",
        OwnerUser = owner,
        CreatedAt = DateTime.UtcNow
    };

    public static AudioAsset AudioAsset(
        Song song,
        Guid familyId,
        int version,
        bool isCurrent) => new()
    {
        Song = song,
        AssetFamilyId = familyId,
        Version = version,
        IsCurrent = isCurrent,
        Type = "Demo",
        FileName = $"audio-v{version}.wav",
        Status = "Draft",
        UploadedAt = DateTime.UtcNow
    };

    public static VisualAsset VisualAsset(
        Song song,
        Guid familyId,
        int version,
        bool isCurrent) => new()
    {
        Song = song,
        AssetFamilyId = familyId,
        Version = version,
        IsCurrent = isCurrent,
        Type = "CoverArt",
        FileName = $"visual-v{version}.png",
        Status = "Draft",
        UploadedAt = DateTime.UtcNow
    };
}
