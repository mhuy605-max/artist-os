using System.ComponentModel.DataAnnotations;

namespace ArtistOS.Api.Dtos;

public class UpdateReleaseChecklistItemRequest
{
    public bool IsCompleted { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
