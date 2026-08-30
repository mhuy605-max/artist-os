using ArtistOS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtistOS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Song> Songs { get; set; }

    public DbSet<AudioAsset> AudioAssets { get; set; }

    public DbSet<VisualAsset> VisualAssets { get; set; }

    public DbSet<Release> Releases { get; set; }

    public DbSet<ContentItem> ContentItems { get; set; }

    public DbSet<Credit> Credits { get; set; }

    public DbSet<AnalyticsSnapshot> AnalyticsSnapshots { get; set; }

    public DbSet<ReleaseChecklistItem> ReleaseChecklistItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AudioAsset>(entity =>
        {
            entity.HasIndex(audioAsset => audioAsset.SongId);
            entity.HasIndex(audioAsset => new { audioAsset.SongId, audioAsset.Type });

            entity.HasOne(audioAsset => audioAsset.Song)
                .WithMany(song => song.AudioAssets)
                .HasForeignKey(audioAsset => audioAsset.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VisualAsset>(entity =>
        {
            entity.HasIndex(visualAsset => visualAsset.SongId);
            entity.HasIndex(visualAsset => new { visualAsset.SongId, visualAsset.Type });

            entity.HasOne(visualAsset => visualAsset.Song)
                .WithMany(song => song.VisualAssets)
                .HasForeignKey(visualAsset => visualAsset.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Release>(entity =>
        {
            entity.HasIndex(release => release.SongId)
                .IsUnique();

            entity.HasOne(release => release.Song)
                .WithOne(song => song.Release)
                .HasForeignKey<Release>(release => release.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReleaseChecklistItem>(entity =>
        {
            entity.HasIndex(checklistItem => checklistItem.ReleaseId);
            entity.HasIndex(checklistItem => new { checklistItem.ReleaseId, checklistItem.SortOrder });
            entity.HasIndex(checklistItem => new { checklistItem.ReleaseId, checklistItem.Key })
                .IsUnique();

            entity.HasOne(checklistItem => checklistItem.Release)
                .WithMany(release => release.ChecklistItems)
                .HasForeignKey(checklistItem => checklistItem.ReleaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContentItem>(entity =>
        {
            entity.HasIndex(contentItem => contentItem.SongId);
            entity.HasIndex(contentItem => new { contentItem.SongId, contentItem.Status });
            entity.HasIndex(contentItem => new { contentItem.SongId, contentItem.ScheduledAt });

            entity.HasOne(contentItem => contentItem.Song)
                .WithMany(song => song.ContentItems)
                .HasForeignKey(contentItem => contentItem.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Credit>(entity =>
        {
            entity.HasIndex(credit => credit.SongId);
            entity.HasIndex(credit => new { credit.SongId, credit.Role });
            entity.HasIndex(credit => new { credit.SongId, credit.Status });

            entity.HasOne(credit => credit.Song)
                .WithMany(song => song.Credits)
                .HasForeignKey(credit => credit.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AnalyticsSnapshot>(entity =>
        {
            entity.HasIndex(snapshot => snapshot.SongId);
            entity.HasIndex(snapshot => new { snapshot.SongId, snapshot.SnapshotDate });
            entity.HasIndex(snapshot => new
                {
                    snapshot.SongId,
                    snapshot.Platform,
                    snapshot.SnapshotDate
                })
                .IsUnique();

            entity.HasOne(snapshot => snapshot.Song)
                .WithMany(song => song.AnalyticsSnapshots)
                .HasForeignKey(snapshot => snapshot.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
