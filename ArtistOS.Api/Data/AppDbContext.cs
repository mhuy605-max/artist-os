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
    }
}
