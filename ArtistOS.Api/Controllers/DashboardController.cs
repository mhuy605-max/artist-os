using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Security;
using ArtistOS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[Authorize]
[EnableRateLimiting(RateLimitPolicyNames.Aggregates)]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private const int UpcomingLimit = 8;
    private const int ReleaseReadinessLimit = 5;
    private const int AnalyticsOverviewLimit = 5;
    private const int RecentActivityLimit = 8;

    private static readonly string[] SongStatusOrder = CreateSongRequest.AllowedStatuses;

    private static readonly Dictionary<string, string> SongStatusLabels = new()
    {
        ["Idea"] = "Idea",
        ["Demo"] = "Demo",
        ["Recording"] = "Recording",
        ["Mixing"] = "Mixing",
        ["Mastering"] = "Mastering",
        ["ReleasePreparation"] = "Release Preparation",
        ["ContentCampaign"] = "Content Campaign",
        ["Released"] = "Released",
        ["Analytics"] = "Analytics"
    };

    private readonly AppDbContext _context;
    private readonly ReleaseReadinessService _releaseReadinessService;
    private readonly SongAccessService _songAccessService;

    public DashboardController(
        AppDbContext context,
        ReleaseReadinessService releaseReadinessService,
        SongAccessService songAccessService)
    {
        _context = context;
        _releaseReadinessService = releaseReadinessService;
        _songAccessService = songAccessService;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> GetDashboard()
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null)
        {
            return Unauthorized();
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var accessibleSongIds = await GetAccessibleSongIds(currentUserId.Value);

        var response = new DashboardResponse
        {
            Summary = await GetSummary(today, accessibleSongIds),
            Pipeline = await GetPipeline(accessibleSongIds),
            Upcoming = await GetUpcoming(today, accessibleSongIds),
            ReleaseReadiness = await GetReleaseReadiness(today, currentUserId.Value, accessibleSongIds),
            AnalyticsOverview = await GetAnalyticsOverview(accessibleSongIds),
            RecentActivity = await GetRecentActivity(accessibleSongIds)
        };

        return response;
    }

    private async Task<List<int>> GetAccessibleSongIds(int userId)
    {
        return await _songAccessService
            .WhereAccessibleTo(_context.Songs.AsNoTracking(), userId)
            .Select(song => song.Id)
            .ToListAsync();
    }

    private async Task<DashboardSummaryResponse> GetSummary(DateOnly today, List<int> accessibleSongIds)
    {
        return new DashboardSummaryResponse
        {
            TotalSongs = await _context.Songs
                .AsNoTracking()
                .CountAsync(song => accessibleSongIds.Contains(song.Id)),
            ActiveSongs = await _context.Songs
                .AsNoTracking()
                .CountAsync(song => accessibleSongIds.Contains(song.Id) && song.Status != "Released"),
            UpcomingReleases = await _context.Releases
                .AsNoTracking()
                .CountAsync(release =>
                    accessibleSongIds.Contains(release.SongId) &&
                    release.ReleaseDate >= today && release.Status != "Released"),
            ScheduledContent = await _context.ContentItems
                .AsNoTracking()
                .CountAsync(contentItem =>
                    accessibleSongIds.Contains(contentItem.SongId) &&
                    contentItem.ScheduledAt >= today && contentItem.Status != "Published")
        };
    }

    private async Task<List<DashboardPipelineItemResponse>> GetPipeline(List<int> accessibleSongIds)
    {
        var counts = await _context.Songs
            .AsNoTracking()
            .Where(song => accessibleSongIds.Contains(song.Id))
            .GroupBy(song => song.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.Status, group => group.Count);

        return SongStatusOrder
            .Select(status => new DashboardPipelineItemResponse
            {
                Status = status,
                Label = SongStatusLabels[status],
                Count = counts.GetValueOrDefault(status)
            })
            .ToList();
    }

    private async Task<List<DashboardUpcomingItemResponse>> GetUpcoming(DateOnly today, List<int> accessibleSongIds)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release =>
                accessibleSongIds.Contains(release.SongId) &&
                release.ReleaseDate >= today && release.Status != "Released")
            .Select(release => new DashboardUpcomingItemResponse
            {
                SourceType = "Release",
                SourceId = release.Id,
                SongId = release.SongId,
                SongTitle = release.Song.Title,
                EventType = "ReleaseDate",
                Title = $"{release.Song.Title} release",
                Date = release.ReleaseDate!.Value,
                Status = release.Status,
                Platform = null,
                NavigationTarget = $"/songs/{release.SongId}"
            })
            .OrderBy(item => item.Date)
            .ThenBy(item => item.SongTitle)
            .ThenBy(item => item.SourceId)
            .Take(UpcomingLimit)
            .ToListAsync();

        var dueContent = await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem =>
                accessibleSongIds.Contains(contentItem.SongId) &&
                contentItem.DueDate >= today && contentItem.Status != "Published")
            .Select(contentItem => new DashboardUpcomingItemResponse
            {
                SourceType = "ContentItem",
                SourceId = contentItem.Id,
                SongId = contentItem.SongId,
                SongTitle = contentItem.Song.Title,
                EventType = "ContentDue",
                Title = contentItem.Title,
                Date = contentItem.DueDate!.Value,
                Status = contentItem.Status,
                Platform = contentItem.Platform,
                NavigationTarget = $"/songs/{contentItem.SongId}"
            })
            .OrderBy(item => item.Date)
            .ThenBy(item => item.SongTitle)
            .ThenBy(item => item.SourceId)
            .Take(UpcomingLimit)
            .ToListAsync();

        var scheduledContent = await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem =>
                accessibleSongIds.Contains(contentItem.SongId) &&
                contentItem.ScheduledAt >= today && contentItem.Status != "Published")
            .Select(contentItem => new DashboardUpcomingItemResponse
            {
                SourceType = "ContentItem",
                SourceId = contentItem.Id,
                SongId = contentItem.SongId,
                SongTitle = contentItem.Song.Title,
                EventType = "ContentScheduled",
                Title = contentItem.Title,
                Date = contentItem.ScheduledAt!.Value,
                Status = contentItem.Status,
                Platform = contentItem.Platform,
                NavigationTarget = $"/songs/{contentItem.SongId}"
            })
            .OrderBy(item => item.Date)
            .ThenBy(item => item.SongTitle)
            .ThenBy(item => item.SourceId)
            .Take(UpcomingLimit)
            .ToListAsync();

        return releases
            .Concat(dueContent)
            .Concat(scheduledContent)
            .OrderBy(item => item.Date)
            .ThenBy(item => item.SongTitle)
            .ThenBy(item => item.EventType)
            .ThenBy(item => item.SourceId)
            .Take(UpcomingLimit)
            .ToList();
    }

    private async Task<List<DashboardReleaseReadinessResponse>> GetReleaseReadiness(
        DateOnly today,
        int userId,
        List<int> accessibleSongIds)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release => accessibleSongIds.Contains(release.SongId) && release.Status != "Released")
            .Select(release => new
            {
                release.Id,
                release.SongId,
                SongTitle = release.Song.Title,
                release.ReleaseDate,
                release.Status,
            })
            .OrderBy(release => release.ReleaseDate == null)
            .ThenBy(release => release.ReleaseDate < today)
            .ThenBy(release => release.ReleaseDate)
            .ThenBy(release => release.SongTitle)
            .Take(ReleaseReadinessLimit)
            .ToListAsync();

        var response = new List<DashboardReleaseReadinessResponse>();

        foreach (var release in releases)
        {
            var readiness = await _releaseReadinessService.GetForAccessibleReleaseAsync(release.Id, userId);
            if (readiness is null)
            {
                continue;
            }

            response.Add(new DashboardReleaseReadinessResponse
            {
                ReleaseId = release.Id,
                SongId = release.SongId,
                SongTitle = release.SongTitle,
                ReleaseDate = release.ReleaseDate,
                Status = release.Status,
                CompletedItems = readiness.ReadyCount,
                TotalItems = readiness.RequiredCount,
                ReadinessPercentage = readiness.Percentage,
                NavigationTarget = $"/songs/{release.SongId}"
            });
        }

        return response;
    }

    private async Task<List<DashboardAnalyticsItemResponse>> GetAnalyticsOverview(List<int> accessibleSongIds)
    {
        var snapshots = await _context.AnalyticsSnapshots
            .AsNoTracking()
            .Where(snapshot => accessibleSongIds.Contains(snapshot.SongId))
            .Select(snapshot => new
            {
                snapshot.SongId,
                SongTitle = snapshot.Song.Title,
                snapshot.Platform,
                snapshot.SnapshotDate,
                snapshot.Views,
                snapshot.Likes,
                snapshot.Comments,
                snapshot.WatchTimeMinutes,
                snapshot.SubscribersGained,
                snapshot.CreatedAt
            })
            .OrderByDescending(snapshot => snapshot.SnapshotDate)
            .ThenByDescending(snapshot => snapshot.CreatedAt)
            .ThenBy(snapshot => snapshot.SongTitle)
            .Take(100)
            .ToListAsync();

        return snapshots
            .GroupBy(snapshot => new { snapshot.SongId, snapshot.Platform })
            .Select(group => group
                .OrderByDescending(snapshot => snapshot.SnapshotDate)
                .ThenByDescending(snapshot => snapshot.CreatedAt)
                .First())
            .OrderByDescending(snapshot => snapshot.SnapshotDate)
            .ThenByDescending(snapshot => snapshot.CreatedAt)
            .ThenBy(snapshot => snapshot.SongTitle)
            .Take(AnalyticsOverviewLimit)
            .Select(snapshot => new DashboardAnalyticsItemResponse
            {
                SongId = snapshot.SongId,
                SongTitle = snapshot.SongTitle,
                Platform = snapshot.Platform,
                SnapshotDate = snapshot.SnapshotDate,
                Views = snapshot.Views,
                Likes = snapshot.Likes,
                Comments = snapshot.Comments,
                WatchTimeMinutes = snapshot.WatchTimeMinutes,
                SubscribersGained = snapshot.SubscribersGained,
                NavigationTarget = $"/songs/{snapshot.SongId}"
            })
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetRecentActivity(List<int> accessibleSongIds)
    {
        var activities = new List<DashboardActivityItemResponse>();

        activities.AddRange(await GetSongActivity(accessibleSongIds));
        activities.AddRange(await GetReleaseActivity(accessibleSongIds));
        activities.AddRange(await GetContentActivity(accessibleSongIds));
        activities.AddRange(await GetCreditActivity(accessibleSongIds));
        activities.AddRange(await GetAnalyticsActivity(accessibleSongIds));
        activities.AddRange(await GetAudioActivity(accessibleSongIds));
        activities.AddRange(await GetVisualActivity(accessibleSongIds));

        return activities
            .OrderByDescending(activity => activity.OccurredAt)
            .ThenBy(activity => activity.SongTitle)
            .ThenBy(activity => activity.Type)
            .Take(RecentActivityLimit)
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetSongActivity(List<int> accessibleSongIds)
    {
        return await _context.Songs
            .AsNoTracking()
            .Where(song => accessibleSongIds.Contains(song.Id))
            .OrderByDescending(song => song.CreatedAt)
            .Take(RecentActivityLimit)
            .Select(song => new DashboardActivityItemResponse
            {
                Type = "SongCreated",
                SongId = song.Id,
                SongTitle = song.Title,
                Description = "Song created",
                OccurredAt = song.CreatedAt,
                NavigationTarget = $"/songs/{song.Id}"
            })
            .ToListAsync();
    }

    private async Task<List<DashboardActivityItemResponse>> GetReleaseActivity(List<int> accessibleSongIds)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release => accessibleSongIds.Contains(release.SongId))
            .Select(release => new
            {
                release.SongId,
                SongTitle = release.Song.Title,
                release.CreatedAt,
                release.UpdatedAt
            })
            .OrderByDescending(release => release.UpdatedAt)
            .Take(RecentActivityLimit)
            .ToListAsync();

        return releases
            .SelectMany(release =>
            {
                var items = new List<DashboardActivityItemResponse>
                {
                    CreateActivity(
                        "ReleaseCreated",
                        release.SongId,
                        release.SongTitle,
                        "Release plan created",
                        release.CreatedAt)
                };

                if (release.UpdatedAt > release.CreatedAt)
                {
                    items.Add(CreateActivity(
                        "ReleaseUpdated",
                        release.SongId,
                        release.SongTitle,
                        "Release plan updated",
                        release.UpdatedAt));
                }

                return items;
            })
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetContentActivity(List<int> accessibleSongIds)
    {
        var contentItems = await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem => accessibleSongIds.Contains(contentItem.SongId))
            .Select(contentItem => new
            {
                contentItem.SongId,
                SongTitle = contentItem.Song.Title,
                contentItem.CreatedAt,
                contentItem.UpdatedAt
            })
            .OrderByDescending(contentItem => contentItem.UpdatedAt)
            .Take(RecentActivityLimit)
            .ToListAsync();

        return contentItems
            .SelectMany(contentItem =>
            {
                var items = new List<DashboardActivityItemResponse>
                {
                    CreateActivity(
                        "ContentCreated",
                        contentItem.SongId,
                        contentItem.SongTitle,
                        "Content item created",
                        contentItem.CreatedAt)
                };

                if (contentItem.UpdatedAt > contentItem.CreatedAt)
                {
                    items.Add(CreateActivity(
                        "ContentUpdated",
                        contentItem.SongId,
                        contentItem.SongTitle,
                        "Content item updated",
                        contentItem.UpdatedAt));
                }

                return items;
            })
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetCreditActivity(List<int> accessibleSongIds)
    {
        var credits = await _context.Credits
            .AsNoTracking()
            .Where(credit => accessibleSongIds.Contains(credit.SongId))
            .Select(credit => new
            {
                credit.SongId,
                SongTitle = credit.Song.Title,
                credit.CreatedAt,
                credit.UpdatedAt
            })
            .OrderByDescending(credit => credit.UpdatedAt)
            .Take(RecentActivityLimit)
            .ToListAsync();

        return credits
            .SelectMany(credit =>
            {
                var items = new List<DashboardActivityItemResponse>
                {
                    CreateActivity(
                        "CreditCreated",
                        credit.SongId,
                        credit.SongTitle,
                        "Credit created",
                        credit.CreatedAt)
                };

                if (credit.UpdatedAt > credit.CreatedAt)
                {
                    items.Add(CreateActivity(
                        "CreditUpdated",
                        credit.SongId,
                        credit.SongTitle,
                        "Credit updated",
                        credit.UpdatedAt));
                }

                return items;
            })
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetAnalyticsActivity(List<int> accessibleSongIds)
    {
        return await _context.AnalyticsSnapshots
            .AsNoTracking()
            .Where(snapshot => accessibleSongIds.Contains(snapshot.SongId))
            .OrderByDescending(snapshot => snapshot.CreatedAt)
            .Take(RecentActivityLimit)
            .Select(snapshot => new DashboardActivityItemResponse
            {
                Type = "AnalyticsSnapshotRecorded",
                SongId = snapshot.SongId,
                SongTitle = snapshot.Song.Title,
                Description = "Analytics snapshot recorded",
                OccurredAt = snapshot.CreatedAt,
                NavigationTarget = $"/songs/{snapshot.SongId}"
            })
            .ToListAsync();
    }

    private async Task<List<DashboardActivityItemResponse>> GetAudioActivity(List<int> accessibleSongIds)
    {
        return await _context.AudioAssets
            .AsNoTracking()
            .Where(audioAsset => accessibleSongIds.Contains(audioAsset.SongId))
            .OrderByDescending(audioAsset => audioAsset.UploadedAt)
            .Take(RecentActivityLimit)
            .Select(audioAsset => new DashboardActivityItemResponse
            {
                Type = "AudioMetadataUploaded",
                SongId = audioAsset.SongId,
                SongTitle = audioAsset.Song.Title,
                Description = "Audio metadata uploaded",
                OccurredAt = audioAsset.UploadedAt,
                NavigationTarget = $"/songs/{audioAsset.SongId}"
            })
            .ToListAsync();
    }

    private async Task<List<DashboardActivityItemResponse>> GetVisualActivity(List<int> accessibleSongIds)
    {
        return await _context.VisualAssets
            .AsNoTracking()
            .Where(visualAsset => accessibleSongIds.Contains(visualAsset.SongId))
            .OrderByDescending(visualAsset => visualAsset.UploadedAt)
            .Take(RecentActivityLimit)
            .Select(visualAsset => new DashboardActivityItemResponse
            {
                Type = "VisualMetadataUploaded",
                SongId = visualAsset.SongId,
                SongTitle = visualAsset.Song.Title,
                Description = "Visual metadata uploaded",
                OccurredAt = visualAsset.UploadedAt,
                NavigationTarget = $"/songs/{visualAsset.SongId}"
            })
            .ToListAsync();
    }

    private static DashboardActivityItemResponse CreateActivity(
        string type,
        int songId,
        string songTitle,
        string description,
        DateTime occurredAt)
    {
        return new DashboardActivityItemResponse
        {
            Type = type,
            SongId = songId,
            SongTitle = songTitle,
            Description = description,
            OccurredAt = occurredAt,
            NavigationTarget = $"/songs/{songId}"
        };
    }
}
