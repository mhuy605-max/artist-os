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

    public DbSet<User> Users { get; set; }

    public DbSet<AudioAsset> AudioAssets { get; set; }

    public DbSet<VisualAsset> VisualAssets { get; set; }

    public DbSet<Release> Releases { get; set; }

    public DbSet<ContentItem> ContentItems { get; set; }

    public DbSet<Credit> Credits { get; set; }

    public DbSet<AnalyticsSnapshot> AnalyticsSnapshots { get; set; }

    public DbSet<ReleaseChecklistItem> ReleaseChecklistItems { get; set; }

    public DbSet<GoogleDriveConnection> GoogleDriveConnections { get; set; }

    public DbSet<ExternalFileReference> ExternalFileReferences { get; set; }

    public DbSet<SongMember> SongMembers { get; set; }

    public DbSet<SongInvitation> SongInvitations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(user => user.NormalizedEmail)
                .IsUnique();
        });

        modelBuilder.Entity<Song>(entity =>
        {
            entity.HasIndex(song => song.OwnerUserId);

            entity.HasOne(song => song.OwnerUser)
                .WithMany(user => user.Songs)
                .HasForeignKey(song => song.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SongMember>(entity =>
        {
            entity.ToTable("SongMembers", table =>
            {
                table.HasCheckConstraint(
                    "CK_SongMembers_Role",
                    "\"Role\" IN ('EDITOR', 'VIEWER')");
            });

            entity.Property(member => member.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasIndex(member => member.SongId);
            entity.HasIndex(member => member.UserId);
            entity.HasIndex(member => new
            {
                member.SongId,
                member.UserId
            })
                .IsUnique();

            entity.HasOne(member => member.Song)
                .WithMany(song => song.SongMembers)
                .HasForeignKey(member => member.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(member => member.User)
                .WithMany(user => user.SongMemberships)
                .HasForeignKey(member => member.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SongInvitation>(entity =>
        {
            entity.ToTable("SongInvitations", table =>
            {
                table.HasCheckConstraint(
                    "CK_SongInvitations_Role",
                    "\"Role\" IN ('EDITOR', 'VIEWER')");
                table.HasCheckConstraint(
                    "CK_SongInvitations_Status",
                    "\"Status\" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED')");
            });

            entity.Property(invitation => invitation.Role)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(invitation => invitation.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasIndex(invitation => invitation.SongId);
            entity.HasIndex(invitation => invitation.InvitedUserId);
            entity.HasIndex(invitation => invitation.InvitedByUserId);
            entity.HasIndex(invitation => invitation.Status);
            entity.HasIndex(invitation => new
            {
                invitation.SongId,
                invitation.InvitedUserId
            })
                .IsUnique()
                .HasDatabaseName("IX_SongInvitations_SongId_InvitedUserId_Pending")
                .HasFilter("\"Status\" = 'PENDING'");

            entity.HasOne(invitation => invitation.Song)
                .WithMany(song => song.SongInvitations)
                .HasForeignKey(invitation => invitation.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(invitation => invitation.InvitedUser)
                .WithMany(user => user.SongInvitationsReceived)
                .HasForeignKey(invitation => invitation.InvitedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(invitation => invitation.InvitedByUser)
                .WithMany(user => user.SongInvitationsSent)
                .HasForeignKey(invitation => invitation.InvitedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GoogleDriveConnection>(entity =>
        {
            entity.HasIndex(connection => connection.UserId)
                .IsUnique();
            entity.HasIndex(connection => new
            {
                connection.UserId,
                connection.GoogleSubject
            });

            entity.HasOne(connection => connection.User)
                .WithOne(user => user.GoogleDriveConnection)
                .HasForeignKey<GoogleDriveConnection>(connection => connection.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExternalFileReference>(entity =>
        {
            entity.HasIndex(reference => reference.OwnerUserId);
            entity.HasIndex(reference => reference.SongId);
            entity.HasIndex(reference => new
            {
                reference.OwnerUserId,
                reference.Provider,
                reference.ResourceType,
                reference.SongId
            });
            entity.HasIndex(reference => new
            {
                reference.OwnerUserId,
                reference.Provider,
                reference.ExternalId
            })
                .IsUnique();

            entity.HasOne(reference => reference.OwnerUser)
                .WithMany(user => user.ExternalFileReferences)
                .HasForeignKey(reference => reference.OwnerUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(reference => reference.Song)
                .WithMany(song => song.ExternalFileReferences)
                .HasForeignKey(reference => reference.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(reference => reference.GoogleDriveConnection)
                .WithMany(connection => connection.ExternalFileReferences)
                .HasForeignKey(reference => reference.GoogleDriveConnectionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AudioAsset>(entity =>
        {
            entity.HasIndex(audioAsset => audioAsset.SongId);
            entity.HasIndex(audioAsset => new { audioAsset.SongId, audioAsset.Type });
            entity.HasIndex(audioAsset => new { audioAsset.AssetFamilyId, audioAsset.Version })
                .IsUnique();
            entity.HasIndex(audioAsset => audioAsset.AssetFamilyId)
                .IsUnique()
                .HasDatabaseName("IX_AudioAssets_AssetFamilyId_Current")
                .HasFilter("\"IsCurrent\" = TRUE");
            entity.HasIndex(audioAsset => audioAsset.ExternalFileReferenceId);

            entity.HasOne(audioAsset => audioAsset.Song)
                .WithMany(song => song.AudioAssets)
                .HasForeignKey(audioAsset => audioAsset.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(audioAsset => audioAsset.ExternalFileReference)
                .WithMany()
                .HasForeignKey(audioAsset => audioAsset.ExternalFileReferenceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<VisualAsset>(entity =>
        {
            entity.HasIndex(visualAsset => visualAsset.SongId);
            entity.HasIndex(visualAsset => new { visualAsset.SongId, visualAsset.Type });
            entity.HasIndex(visualAsset => new { visualAsset.AssetFamilyId, visualAsset.Version })
                .IsUnique();
            entity.HasIndex(visualAsset => visualAsset.AssetFamilyId)
                .IsUnique()
                .HasDatabaseName("IX_VisualAssets_AssetFamilyId_Current")
                .HasFilter("\"IsCurrent\" = TRUE");
            entity.HasIndex(visualAsset => visualAsset.ExternalFileReferenceId);

            entity.HasOne(visualAsset => visualAsset.Song)
                .WithMany(song => song.VisualAssets)
                .HasForeignKey(visualAsset => visualAsset.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(visualAsset => visualAsset.ExternalFileReference)
                .WithMany()
                .HasForeignKey(visualAsset => visualAsset.ExternalFileReferenceId)
                .OnDelete(DeleteBehavior.SetNull);
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
