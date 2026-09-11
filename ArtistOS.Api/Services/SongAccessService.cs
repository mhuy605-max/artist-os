using ArtistOS.Api.Data;
using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Services;

public enum SongAccessLevel
{
    NO_ACCESS,
    OWNER,
    EDITOR,
    VIEWER
}

public sealed record SongAccessCapabilities(
    SongAccessLevel AccessLevel,
    bool CanRead,
    bool CanEdit,
    bool CanManageMembers);

public class SongAccessService
{
    private readonly AppDbContext _context;

    public SongAccessService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SongAccessLevel> GetAccessLevelAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var songOwnerUserId = await _context.Songs
            .Where(song => song.Id == songId)
            .Select(song => song.OwnerUserId)
            .FirstOrDefaultAsync(cancellationToken);

        if (songOwnerUserId is null)
        {
            return SongAccessLevel.NO_ACCESS;
        }

        if (songOwnerUserId == userId)
        {
            return SongAccessLevel.OWNER;
        }

        var memberRole = await _context.SongMembers
            .Where(member => member.SongId == songId && member.UserId == userId)
            .Select(member => (SongMemberRole?)member.Role)
            .FirstOrDefaultAsync(cancellationToken);

        return memberRole switch
        {
            SongMemberRole.EDITOR => SongAccessLevel.EDITOR,
            SongMemberRole.VIEWER => SongAccessLevel.VIEWER,
            _ => SongAccessLevel.NO_ACCESS
        };
    }

    public IQueryable<Song> WhereAccessibleTo(IQueryable<Song> songs, int userId)
    {
        return songs.Where(song =>
            song.OwnerUserId != null &&
            (song.OwnerUserId == userId ||
                song.SongMembers.Any(member => member.UserId == userId)));
    }

    public SongAccessLevel GetAccessLevel(Song song, int userId, SongMemberRole? memberRole = null)
    {
        if (song.OwnerUserId is null)
        {
            return SongAccessLevel.NO_ACCESS;
        }

        if (song.OwnerUserId == userId)
        {
            return SongAccessLevel.OWNER;
        }

        return memberRole switch
        {
            SongMemberRole.EDITOR => SongAccessLevel.EDITOR,
            SongMemberRole.VIEWER => SongAccessLevel.VIEWER,
            _ => SongAccessLevel.NO_ACCESS
        };
    }

    public async Task<bool> CanReadAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await GetAccessLevelAsync(songId, userId, cancellationToken);
        return GetCapabilities(accessLevel).CanRead;
    }

    public async Task<SongAccessCapabilities> GetCapabilitiesAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await GetAccessLevelAsync(songId, userId, cancellationToken);
        return GetCapabilities(accessLevel);
    }

    public async Task<bool> CanEditAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await GetAccessLevelAsync(songId, userId, cancellationToken);
        return GetCapabilities(accessLevel).CanEdit;
    }

    public async Task<bool> CanManageMembersAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await GetAccessLevelAsync(songId, userId, cancellationToken);
        return GetCapabilities(accessLevel).CanManageMembers;
    }

    public async Task<bool> IsOwnerAsync(
        int songId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var accessLevel = await GetAccessLevelAsync(songId, userId, cancellationToken);
        return accessLevel == SongAccessLevel.OWNER;
    }

    public static SongAccessCapabilities GetCapabilities(SongAccessLevel accessLevel) =>
        accessLevel switch
        {
            SongAccessLevel.OWNER => new SongAccessCapabilities(accessLevel, true, true, true),
            SongAccessLevel.EDITOR => new SongAccessCapabilities(accessLevel, true, true, false),
            SongAccessLevel.VIEWER => new SongAccessCapabilities(accessLevel, true, false, false),
            _ => new SongAccessCapabilities(SongAccessLevel.NO_ACCESS, false, false, false)
        };
}
