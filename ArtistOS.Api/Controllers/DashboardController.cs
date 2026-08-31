using ArtistOS.Api.Data;
using ArtistOS.Api.Dtos;
using ArtistOS.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Controllers;

[Authorize]
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

    public DashboardController(AppDbContext context)
    {
        _context = context;
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

        var response = new DashboardResponse
        {
            Summary = await GetSummary(today, currentUserId),
            Pipeline = await GetPipeline(currentUserId),
            Upcoming = await GetUpcoming(today, currentUserId),
            ReleaseReadiness = await GetReleaseReadiness(today, currentUserId),
            AnalyticsOverview = await GetAnalyticsOverview(currentUserId),
            RecentActivity = await GetRecentActivity(currentUserId)
        };

        return response;
    }

    private async Task<DashboardSummaryResponse> GetSummary(DateOnly today, int? userId)
    {
        return new DashboardSummaryResponse
        {
            TotalSongs = await _context.Songs
                .AsNoTracking()
                .CountAsync(song => song.OwnerUserId == userId),
            ActiveSongs = await _context.Songs
                .AsNoTracking()
                .CountAsync(song => song.OwnerUserId == userId && song.Status != "Released"),
            UpcomingReleases = await _context.Releases
                .AsNoTracking()
                .CountAsync(release =>
                    release.Song.OwnerUserId == userId &&
                    release.ReleaseDate >= today && release.Status != "Released"),
            ScheduledContent = await _context.ContentItems
                .AsNoTracking()
                .CountAsync(contentItem =>
                    contentItem.Song.OwnerUserId == userId &&
                    contentItem.ScheduledAt >= today && contentItem.Status != "Published")
        };
    }

    private async Task<List<DashboardPipelineItemResponse>> GetPipeline(int? userId)
    {
        var counts = await _context.Songs
            .AsNoTracking()
            .Where(song => song.OwnerUserId == userId)
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

    private async Task<List<DashboardUpcomingItemResponse>> GetUpcoming(DateOnly today, int? userId)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release =>
                release.Song.OwnerUserId == userId &&
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
                contentItem.Song.OwnerUserId == userId &&
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
                contentItem.Song.OwnerUserId == userId &&
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
        int? userId)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release => release.Song.OwnerUserId == userId && release.Status != "Released")
            .Select(release => new
            {
                release.Id,
                release.SongId,
                SongTitle = release.Song.Title,
                release.ReleaseDate,
                release.Status,
                CompletedItems = release.ChecklistItems.Count(item => item.IsCompleted),
                TotalItems = release.ChecklistItems.Count
            })
            .OrderBy(release => release.ReleaseDate == null)
            .ThenBy(release => release.ReleaseDate < today)
            .ThenBy(release => release.ReleaseDate)
            .ThenBy(release => release.SongTitle)
            .Take(ReleaseReadinessLimit)
            .ToListAsync();

        return releases
            .Select(release => new DashboardReleaseReadinessResponse
            {
                ReleaseId = release.Id,
                SongId = release.SongId,
                SongTitle = release.SongTitle,
                ReleaseDate = release.ReleaseDate,
                Status = release.Status,
                CompletedItems = release.CompletedItems,
                TotalItems = release.TotalItems,
                ReadinessPercentage = release.TotalItems == 0
                    ? 0
                    : (int)Math.Round((double)release.CompletedItems / release.TotalItems * 100),
                NavigationTarget = $"/songs/{release.SongId}"
            })
            .ToList();
    }

    private async Task<List<DashboardAnalyticsItemResponse>> GetAnalyticsOverview(int? userId)
    {
        var snapshots = await _context.AnalyticsSnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetRecentActivity(int? userId)
    {
        var activities = new List<DashboardActivityItemResponse>();

        activities.AddRange(await GetSongActivity(userId));
        activities.AddRange(await GetReleaseActivity(userId));
        activities.AddRange(await GetContentActivity(userId));
        activities.AddRange(await GetCreditActivity(userId));
        activities.AddRange(await GetAnalyticsActivity(userId));
        activities.AddRange(await GetAudioActivity(userId));
        activities.AddRange(await GetVisualActivity(userId));

        return activities
            .OrderByDescending(activity => activity.OccurredAt)
            .ThenBy(activity => activity.SongTitle)
            .ThenBy(activity => activity.Type)
            .Take(RecentActivityLimit)
            .ToList();
    }

    private async Task<List<DashboardActivityItemResponse>> GetSongActivity(int? userId)
    {
        return await _context.Songs
            .AsNoTracking()
            .Where(song => song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetReleaseActivity(int? userId)
    {
        var releases = await _context.Releases
            .AsNoTracking()
            .Where(release => release.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetContentActivity(int? userId)
    {
        var contentItems = await _context.ContentItems
            .AsNoTracking()
            .Where(contentItem => contentItem.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetCreditActivity(int? userId)
    {
        var credits = await _context.Credits
            .AsNoTracking()
            .Where(credit => credit.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetAnalyticsActivity(int? userId)
    {
        return await _context.AnalyticsSnapshots
            .AsNoTracking()
            .Where(snapshot => snapshot.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetAudioActivity(int? userId)
    {
        return await _context.AudioAssets
            .AsNoTracking()
            .Where(audioAsset => audioAsset.Song.OwnerUserId == userId)
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

    private async Task<List<DashboardActivityItemResponse>> GetVisualActivity(int? userId)
    {
        return await _context.VisualAssets
            .AsNoTracking()
            .Where(visualAsset => visualAsset.Song.OwnerUserId == userId)
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
