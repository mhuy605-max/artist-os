namespace ArtistOS.Api.Integrations.GoogleDrive;

public class GoogleDriveAuthorizationRequest
{
    private readonly Func<string, string> _buildUrlWithState;

    public GoogleDriveAuthorizationRequest(string codeVerifier, Func<string, string> buildUrlWithState)
    {
        CodeVerifier = codeVerifier;
        _buildUrlWithState = buildUrlWithState;
    }

    public string CodeVerifier { get; }

    public string BuildUrlWithState(string protectedState)
    {
        return _buildUrlWithState(protectedState);
    }
}
