namespace ArtistOS.Api.Security;

public class ArtistOsDataProtectionOptions
{
    public string ApplicationName { get; set; } = "ArtistOS.Api";

    public string? KeyRingPath { get; set; }
}
