using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Services;

public class ReleaseReadinessService
{
    public static readonly HashSet<string> DerivedChecklistKeys =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "Master",
            "Cover",
            "Canvas"
        };

    private readonly AppDbContext _context;
    private readonly SongAccessService _songAccessService;

    public ReleaseReadinessService(AppDbContext context, SongAccessService songAccessService)
    {
        _context = context;
        _songAccessService = songAccessService;
    }

    public async Task<ReleaseReadinessResponse?> GetForSongAsync(int songId, int userId)
    {
        if (!await _songAccessService.CanReadAsync(songId, userId))
        {
            return null;
        }

        var release = await _context.Releases
            .AsNoTracking()
            .FirstOrDefaultAsync(release => release.SongId == songId);

        return release is null ? null : await BuildReadiness(release);
    }

    public async Task<ReleaseReadinessResponse?> GetForReleaseAsync(int releaseId, int userId)
    {
        var release = await _context.Releases
            .AsNoTracking()
            .FirstOrDefaultAsync(release => release.Id == releaseId);

        if (release is null || !await _songAccessService.CanReadAsync(release.SongId, userId))
        {
            return null;
        }

        return await BuildReadiness(release);
    }

    public async Task<ReleaseReadinessResponse?> GetForAccessibleReleaseAsync(int releaseId, int userId)
    {
        return await GetForReleaseAsync(releaseId, userId);
    }

    private async Task<ReleaseReadinessResponse> BuildReadiness(Release release)
    {
        var checklist = await _context.ReleaseChecklistItems
            .AsNoTracking()
            .Where(item => item.ReleaseId == release.Id)
            .ToDictionaryAsync(item => item.Key, StringComparer.OrdinalIgnoreCase);

        var audioAssets = await _context.AudioAssets
            .AsNoTracking()
            .Where(asset => asset.SongId == release.SongId)
            .ToListAsync();

        var visualAssets = await _context.VisualAssets
            .AsNoTracking()
            .Where(asset => asset.SongId == release.SongId)
            .ToListAsync();

        var credits = await _context.Credits
            .AsNoTracking()
            .Where(credit => credit.SongId == release.SongId)
            .ToListAsync();

        var contentItems = await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem => contentItem.SongId == release.SongId)
            .ToListAsync();

        var items = ReleaseChecklistDefaults.Items
            .OrderBy(item => item.SortOrder)
            .Select(definition => EvaluateItem(
                definition,
                release,
                checklist.GetValueOrDefault(definition.Key),
                audioAssets,
                visualAssets,
                credits,
                contentItems))
            .ToList();

        var requiredCount = items.Count(item => item.IsRequired);
        var readyCount = items.Count(item => item.IsRequired && item.State == "Ready");

        return new ReleaseReadinessResponse
        {
            SongId = release.SongId,
            ReleaseId = release.Id,
            ReadyCount = readyCount,
            RequiredCount = requiredCount,
            TotalCount = items.Count,
            Percentage = requiredCount == 0
                ? 100
                : (int)Math.Round((double)readyCount / requiredCount * 100),
            Items = items
        };
    }

    private static ReleaseReadinessItemResponse EvaluateItem(
        ReleaseChecklistDefinition definition,
        Release release,
        ReleaseChecklistItem? checklistItem,
        IReadOnlyCollection<AudioAsset> audioAssets,
        IReadOnlyCollection<VisualAsset> visualAssets,
        IReadOnlyCollection<Credit> credits,
        IReadOnlyCollection<ContentItem> contentItems)
    {
        return definition.Key switch
        {
            "Master" => EvaluateMaster(definition, audioAssets),
            "Cover" => EvaluateCover(definition, visualAssets),
            "Canvas" => EvaluateCanvas(definition, release, visualAssets),
            "Credits" => EvaluateCredits(definition, checklistItem, credits),
            "ContentPlan" => EvaluateContentPlan(definition, checklistItem, contentItems),
            "Metadata" => EvaluateMetadata(definition, checklistItem, release),
            "MusicVideo" => EvaluateMusicVideo(definition, checklistItem),
            _ => Manual(definition, checklistItem)
        };
    }

    private static ReleaseReadinessItemResponse EvaluateMaster(
        ReleaseChecklistDefinition definition,
        IReadOnlyCollection<AudioAsset> audioAssets)
    {
        var asset = audioAssets
            .Where(asset =>
                asset.Type == "Master" &&
                asset.IsCurrent &&
                asset.Status == "Final" &&
                asset.ExternalFileReferenceId is not null)
            .OrderByDescending(asset => asset.UploadedAt)
            .ThenByDescending(asset => asset.Version)
            .FirstOrDefault();

        return asset is null
            ? Incomplete(definition, "Derived", "Upload and finalize a current Master.")
            : Ready(definition, "Derived", "Current Final Master linked.", asset.Id, "AudioAsset");
    }

    private static ReleaseReadinessItemResponse EvaluateCover(
        ReleaseChecklistDefinition definition,
        IReadOnlyCollection<VisualAsset> visualAssets)
    {
        var asset = visualAssets
            .Where(asset =>
                asset.Type == "CoverArt" &&
                asset.IsCurrent &&
                asset.Status == "Final" &&
                asset.ExternalFileReferenceId is not null)
            .OrderByDescending(asset => asset.UploadedAt)
            .ThenByDescending(asset => asset.Version)
            .FirstOrDefault();

        return asset is null
            ? Incomplete(definition, "Derived", "Finalize a linked Cover Art version.")
            : Ready(definition, "Derived", "Current Final Cover Art linked.", asset.Id, "VisualAsset");
    }

    private static ReleaseReadinessItemResponse EvaluateCanvas(
        ReleaseChecklistDefinition definition,
        Release release,
        IReadOnlyCollection<VisualAsset> visualAssets)
    {
        if (!DeserializePlatforms(release.Platforms).Contains("Spotify", StringComparer.OrdinalIgnoreCase))
        {
            return NotRequired(definition, "Derived", "Spotify is not selected for this release.");
        }

        var asset = visualAssets
            .Where(asset =>
                asset.Type == "SpotifyCanvas" &&
                asset.IsCurrent &&
                asset.Status == "Final" &&
                asset.ExternalFileReferenceId is not null)
            .OrderByDescending(asset => asset.UploadedAt)
            .ThenByDescending(asset => asset.Version)
            .FirstOrDefault();

        return asset is null
            ? Incomplete(definition, "Derived", "Add and finalize a Spotify Canvas.")
            : Ready(definition, "Derived", "Current Final Spotify Canvas linked.", asset.Id, "VisualAsset");
    }

    private static ReleaseReadinessItemResponse EvaluateCredits(
        ReleaseChecklistDefinition definition,
        ReleaseChecklistItem? checklistItem,
        IReadOnlyCollection<Credit> credits)
    {
        if (credits.Count > 0 && credits.All(credit => credit.Status == "Confirmed"))
        {
            return Ready(definition, "Hybrid", "All release credits are confirmed.");
        }

        if (checklistItem?.IsCompleted == true)
        {
            return Ready(definition, "Manual", "Manually confirmed.");
        }

        var pendingCount = credits.Count(credit => credit.Status == "Pending");
        return Incomplete(
            definition,
            "Hybrid",
            pendingCount > 0
                ? $"Confirm {pendingCount} pending {Pluralize(pendingCount, "contributor", "contributors")}."
                : "Add and confirm release credits.");
    }

    private static ReleaseReadinessItemResponse EvaluateContentPlan(
        ReleaseChecklistDefinition definition,
        ReleaseChecklistItem? checklistItem,
        IReadOnlyCollection<ContentItem> contentItems)
    {
        if (contentItems.Any(contentItem => contentItem.Status != "Idea"))
        {
            return Ready(definition, "Hybrid", "At least one content item is planned.");
        }

        if (checklistItem?.IsCompleted == true)
        {
            return Ready(definition, "Manual", "Manually confirmed.");
        }

        return Incomplete(definition, "Hybrid", "Add at least one planned content item.");
    }

    private static ReleaseReadinessItemResponse EvaluateMetadata(
        ReleaseChecklistDefinition definition,
        ReleaseChecklistItem? checklistItem,
        Release release)
    {
        var hasMinimumMetadata = release.ReleaseDate is not null &&
            CreateReleaseRequest.AllowedReleaseTypes.Contains(
                release.ReleaseType,
                StringComparer.OrdinalIgnoreCase) &&
            DeserializePlatforms(release.Platforms).Count > 0;

        if (hasMinimumMetadata)
        {
            return Ready(definition, "Hybrid", "Release date, release type, and platforms are set.");
        }

        if (checklistItem?.IsCompleted == true)
        {
            return Ready(definition, "Manual", "Manually confirmed.");
        }

        return Incomplete(definition, "Hybrid", "Set release date, release type, and at least one platform.");
    }

    private static ReleaseReadinessItemResponse EvaluateMusicVideo(
        ReleaseChecklistDefinition definition,
        ReleaseChecklistItem? checklistItem)
    {
        return checklistItem?.IsCompleted == true
            ? Ready(definition, "Manual", "Manually confirmed.")
            : NotRequired(definition, "Manual", "Music video is optional for this release.");
    }

    private static ReleaseReadinessItemResponse Manual(
        ReleaseChecklistDefinition definition,
        ReleaseChecklistItem? checklistItem)
    {
        return checklistItem?.IsCompleted == true
            ? Ready(definition, "Manual", "Manually confirmed.")
            : Incomplete(definition, "Manual", $"Complete {definition.Label}.");
    }

    private static ReleaseReadinessItemResponse Ready(
        ReleaseChecklistDefinition definition,
        string source,
        string reason,
        int? relatedResourceId = null,
        string? relatedResourceType = null)
    {
        return Item(definition, "Ready", source, reason, isRequired: true, relatedResourceId, relatedResourceType);
    }

    private static ReleaseReadinessItemResponse Incomplete(
        ReleaseChecklistDefinition definition,
        string source,
        string reason)
    {
        return Item(definition, "Incomplete", source, reason, isRequired: true);
    }

    private static ReleaseReadinessItemResponse NotRequired(
        ReleaseChecklistDefinition definition,
        string source,
        string reason)
    {
        return Item(definition, "NotRequired", source, reason, isRequired: false);
    }

    private static ReleaseReadinessItemResponse Item(
        ReleaseChecklistDefinition definition,
        string state,
        string source,
        string reason,
        bool isRequired,
        int? relatedResourceId = null,
        string? relatedResourceType = null)
    {
        return new ReleaseReadinessItemResponse
        {
            Key = definition.Key,
            Label = definition.Label,
            State = state,
            Source = source,
            Reason = reason,
            IsRequired = isRequired,
            RelatedResourceId = relatedResourceId,
            RelatedResourceType = relatedResourceType
        };
    }

    private static List<string> DeserializePlatforms(string platforms)
    {
        return platforms
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
    }

    private static string Pluralize(int count, string singular, string plural)
    {
        return count == 1 ? singular : plural;
    }
}
