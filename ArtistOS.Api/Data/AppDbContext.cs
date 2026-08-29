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
    }
}
