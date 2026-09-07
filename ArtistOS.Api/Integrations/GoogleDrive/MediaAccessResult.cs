using ArtistOS.Api.Dtos;

namespace ArtistOS.Api.Integrations.GoogleDrive;

public class MediaAccessResult
{
    public MediaAccessStatus Status { get; set; }

    public MediaAccessResponse? Response { get; set; }

    public AuthorizedMediaResource? Resource { get; set; }

    public static MediaAccessResult Success(MediaAccessResponse response)
    {
        return new MediaAccessResult
        {
            Status = MediaAccessStatus.Success,
            Response = response
        };
    }

    public static MediaAccessResult Authorized(AuthorizedMediaResource resource)
    {
        return new MediaAccessResult
        {
            Status = MediaAccessStatus.Success,
            Resource = resource
        };
    }

    public static MediaAccessResult Failure(MediaAccessStatus status)
    {
        return new MediaAccessResult
        {
            Status = status
        };
    }
}
