# Google Drive Architecture

Last updated: 2026-08-31

## 1. Executive Summary

Google Drive should become Artist OS's large media storage provider, while Artist OS remains the system of record for music workflow metadata.

Recommended architecture:

```text
Authenticated DARKROOM SYSTEM user
  -> Artist OS JWT
  -> ASP.NET Core API
  -> User-owned Google Drive connection
  -> Google Drive files and folders
```

React should never receive Google OAuth access tokens or refresh tokens. The ASP.NET Core backend should own the Google OAuth flow, token exchange, token refresh, Drive API calls, and authorization checks. PostgreSQL should store metadata, ownership, connection state, and external file references. Google Drive should store WAV, MP3, stems, artwork, video, and other large binary files.

This document began as architecture discovery. The connection foundation, folder provisioning foundation, and first upload MVP have since been implemented separately. Download, Drive browsing, Picker, synchronization, automatic folder rename, external file deletion, replace/version workflow, preview/playback, and waveform/thumbnail processing remain future work.

Current implemented Drive foundation:

- Google OAuth connection is persisted per Artist OS user.
- Google refresh tokens are protected before database storage.
- The backend refreshes Google access tokens on demand for Drive API operations.
- `GoogleDriveConnection.RootFolderId` stores the canonical DARKROOM SYSTEM root folder id.
- `ExternalFileReferences` stores provider-neutral references for the `Songs` folder, Song root folders, and Song child folders.
- Song Drive workspace provisioning is idempotent and scoped through Artist OS JWT ownership.
- AudioAsset and VisualAsset upload uses backend-mediated Google Drive upload.
- Uploaded AudioAsset and VisualAsset files are associated through `ExternalFileReferences`.
- Existing metadata-only assets remain valid with null file association.
- React receives only safe folder metadata, never Google token material.

Primary Google references used:

- Google OAuth 2.0 for web server apps: https://developers.google.com/identity/protocols/oauth2/web-server
- Google Drive API scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- Google Drive upload types: https://developers.google.com/workspace/drive/api/guides/manage-uploads
- Google OpenID Connect: https://developers.google.com/identity/openid-connect/openid-connect

## 2. Current Artist OS Constraints

Current implemented constraints from the codebase:

- ASP.NET Core Web API is the trusted backend.
- React owns the UI and talks to the backend through REST/JSON.
- Artist OS authentication uses short-lived JWT Bearer access tokens.
- JWT `sub` identifies the current Artist OS `User.Id`.
- `User.Id` is the current ownership boundary for Songs and nested resources.
- Existing Song workspace resources are user-scoped through the parent Song.
- Missing, unowned, cross-user, and legacy-unowned records return `404 Not Found` to normal authenticated users.
- AudioAsset and VisualAsset are metadata-only records today.
- PostgreSQL stores workflow metadata.
- Large files must not be stored directly in PostgreSQL.
- Google Drive and YouTube are planned future integrations, not current runtime code.

These constraints are good for Google Drive because the backend already has a stable authenticated user boundary.

## 3. Recommended OAuth Architecture

Use Google OAuth 2.0 Authorization Code flow for a web server application, completed by the ASP.NET Core backend.

Recommended future flow:

```text
1. User signs in to Artist OS.
2. React calls the backend "connect Google Drive" endpoint with Artist OS JWT.
3. Backend creates a short-lived OAuth state record tied to User.Id.
4. Backend redirects the browser to Google's OAuth consent page.
5. User consents at Google.
6. Google redirects back to an ASP.NET Core callback endpoint.
7. Backend validates state.
8. Backend exchanges the authorization code for tokens server-side.
9. Backend validates the Google identity response.
10. Backend stores protected refresh-token material and connection metadata.
11. Backend redirects the browser back to the React settings/integrations page.
```

Important boundaries:

- Artist OS JWT remains the app authentication mechanism.
- Google OAuth is an external integration connection, not the Artist OS login system.
- Google tokens are not embedded inside Artist OS JWTs.
- Google authorization codes and tokens stay server-side.
- OAuth `state` must be tied to the authenticated Artist OS user to prevent cross-account connection confusion.
- Request offline access so the backend can refresh Google access tokens when the user is not actively completing the OAuth flow.
- Prefer a proven Google/.NET OAuth client library when implementation starts, instead of hand-rolling every protocol detail.

For extra hardening, use PKCE with S256 if the chosen .NET Google OAuth library supports it cleanly for this web-server flow.

## 4. Recommended Google Scopes

Recommended MVP scopes:

```text
openid
email
https://www.googleapis.com/auth/drive.file
```

Why:

- `openid` lets Artist OS receive an ID token and identify the Google account.
- `email` lets Artist OS display the connected Google email address.
- The Google `sub` claim should be stored as the stable Google account identifier. Email can change and should not be the primary external identity key.
- `drive.file` is the right Drive scope for Artist OS's first Drive milestone because it gives per-file access to files the app creates or the user explicitly opens/shares with the app.

Scopes to avoid in the MVP:

- `https://www.googleapis.com/auth/drive`: too broad for the current product need.
- `https://www.googleapis.com/auth/drive.readonly`: broader read access than needed for app-created or explicitly selected assets.
- `https://www.googleapis.com/auth/drive.metadata.readonly`: useful for broad browsing metadata, but not enough for creating/uploading Artist OS media files.
- `https://www.googleapis.com/auth/drive.appdata`: meant for hidden app data, not user-facing WAV/artwork/video libraries.

Possible later scope additions:

- Add broader scopes only if a future milestone requires browsing or managing files outside files Artist OS created or the user explicitly selected.
- Use incremental authorization if a later feature needs additional Google access.

## 5. Token / Credential Strategy

The backend should treat Google credentials as high-risk secrets.

Recommended strategy:

- Store Google OAuth client id and client secret outside source control.
- Use .NET User Secrets for local development.
- Use environment variables or a managed secret store for production.
- Store Google refresh tokens only in protected/encrypted form.
- Do not store access tokens long term unless a concrete need appears.
- Refresh access tokens on demand inside the backend.
- Store token metadata such as granted scopes, expiration, status, and last successful refresh time.
- On disconnect, revoke the Google token when possible and delete or render unusable the stored protected refresh token.
- If Google refresh fails with invalid/revoked credentials, mark the connection as `ReauthRequired` instead of repeatedly retrying silently.

Local/early protection option:

- ASP.NET Core Data Protection can protect token strings before database storage.

Production hardening option:

- Use cloud KMS or a dedicated secret manager envelope-encryption pattern.

Do not:

- Commit `client_secret.json`.
- Store Google refresh tokens in plaintext PostgreSQL rows.
- Send Google refresh tokens or access tokens to React.
- Put Google token data into Artist OS JWT claims.
- Log authorization codes, access tokens, refresh tokens, or resumable upload session URIs.

## 6. Proposed Connection Data Model

Recommended future model:

```csharp
public class GoogleDriveConnection
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string GoogleSubject { get; set; } = string.Empty;
    public string GoogleEmail { get; set; } = string.Empty;
    public bool GoogleEmailVerified { get; set; }

    public string ProtectedRefreshToken { get; set; } = string.Empty;
    public string GrantedScopes { get; set; } = string.Empty;
    public string Status { get; set; } = "Connected";

    public string? RootFolderId { get; set; }

    public DateTime ConnectedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastSuccessfulRefreshAt { get; set; }
    public DateTime? RevokedAt { get; set; }
}
```

Recommended constraints:

- One active Google Drive connection per Artist OS user for the MVP.
- Unique index on active `UserId`.
- Unique index on `UserId + GoogleSubject` if reconnect history is retained.
- `GoogleEmail` is display metadata, not the primary identity key.
- `Status` should start as a string only if it follows the current project pattern; it can become an enum later if needed.

Possible statuses:

```text
Connected
ReauthRequired
Disconnected
Revoked
```

Do not add this model until the implementation milestone is approved. This section is a proposed design only.

## 7. Drive File Reference Architecture

Artist OS should use provider-neutral file reference metadata rather than adding Google-specific fields directly to every asset model.

Recommended future model:

```csharp
public class ExternalFileReference
{
    public int Id { get; set; }
    public int OwnerUserId { get; set; }
    public int? SongId { get; set; }
    public int? GoogleDriveConnectionId { get; set; }

    public string Provider { get; set; } = "GoogleDrive";
    public string ProviderFileId { get; set; } = string.Empty;
    public string? ProviderFolderId { get; set; }

    public string FileName { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    public long? SizeBytes { get; set; }
    public string? WebViewLink { get; set; }

    public string AssetKind { get; set; } = string.Empty;
    public string? VersionLabel { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Why this shape:

- Keeps Google provider details out of core Song workflow entities.
- Allows AudioAsset and VisualAsset to remain meaningful Artist OS metadata.
- Keeps the door open for other providers without redesigning every domain table.
- Gives the backend one consistent place to enforce ownership and provider file id rules.

Recommended relationship for first implementation:

- Add optional `ExternalFileReferenceId` to AudioAsset and VisualAsset when file association begins.
- Keep existing metadata fields like `FileName`, `FileSizeBytes`, and `UploadedAt` for current display/metadata behavior.
- Let the file reference store provider identity and external links.

Do not store raw binary media in PostgreSQL.

Implemented upload MVP:

- `AudioAssets.ExternalFileReferenceId` and `VisualAssets.ExternalFileReferenceId` are nullable links to `ExternalFileReferences`.
- `ExternalFileReferences` stores uploaded file metadata with `SizeBytes`, `WebViewLink`, `LinkedResourceType`, and `LinkedResourceId`.
- Folder references and uploaded file references share the same provider-neutral table; files use `IsFolder = false`.
- Audio uploads use resource type `AudioAssetFile`; Visual uploads use `VisualAssetFile`.

## 8. Folder Architecture

Recommended Google Drive folder root:

```text
DARKROOM SYSTEM/
```

Recommended Song folder shape:

```text
DARKROOM SYSTEM/
  Songs/
    {SongId} - {SanitizedSongTitle}/
      Audio/
        Demo/
        Recording/
        Mix/
        Master/
      Visuals/
        CoverArt/
        MusicVideo/
        Visualizer/
        SpotifyCanvas/
        PromoAsset/
        SocialContent/
      Release/
      Content/
```

Rules:

- Store Google folder ids in Artist OS metadata after creating folders.
- Treat folder ids as canonical; names are display/organization hints.
- Include the Artist OS Song id in folder names so folders remain recognizable if a title changes.
- Sanitize title text before using it in folder names.
- Do not rely on path strings to locate files; use Drive file/folder ids.
- Do not automatically rename Drive folders every time a Song title changes in the MVP. That can be a later maintenance action.

Possible future folder reference model:

```text
ExternalFolderReference
  Id
  OwnerUserId
  SongId
  Provider
  ProviderFolderId
  Purpose
  DisplayName
  CreatedAt
  UpdatedAt
```

Implemented foundation: `RootFolderId` on `GoogleDriveConnection` is used for the DARKROOM SYSTEM root folder. Provider-neutral `ExternalFileReferences` store the `Songs` folder, Song root folder, and `Audio`, `Visuals`, `Release`, and `Content` folder ids.

## 9. Ownership & Authorization Rules

Every Google Drive operation must start from an authenticated Artist OS user.

Required rule chain:

```text
JWT Bearer token
  -> validated `sub`
  -> Artist OS User.Id
  -> owned Song / nested resource
  -> user's GoogleDriveConnection
  -> allowed Drive operation
```

Authorization rules:

- A user can only use their own Google Drive connection.
- A user can only attach Drive files to Songs they own.
- Nested AudioAsset/VisualAsset operations must still verify the parent Song belongs to the user.
- Cross-user resources should continue returning `404 Not Found`.
- The backend must not accept arbitrary Drive file ids and trust them blindly.
- When associating an existing Drive file, the backend must verify access through the current user's Google connection before saving the reference.
- The frontend must not send `OwnerUserId`.
- File references should include `OwnerUserId` or be reachable through owned Song data so authorization remains cheap and obvious.
- Legacy unowned Songs should remain invisible to normal users until a separate ownership/backfill decision is made.

Google account identity and Artist OS identity should stay separate:

- Artist OS `User.Id` owns app data.
- Google `sub` identifies the connected external Google account.
- Google email is display metadata only.

## 10. Upload Architecture

Recommended MVP upload architecture:

```text
React file picker
  -> ASP.NET Core authenticated upload endpoint
  -> backend validates User.Id and Song ownership
  -> backend refreshes Google access token
  -> backend creates/uses Drive folders
  -> backend streams file to Google Drive using resumable upload
  -> backend stores ExternalFileReference metadata
  -> backend links AudioAsset or VisualAsset metadata
```

Why:

- Google tokens stay server-side.
- The backend can enforce Artist OS ownership before touching Drive.
- Uploads can be tied to existing Song workspace records.
- The frontend can remain a normal Artist OS client using Artist OS JWT.

Use Google Drive resumable uploads for Artist OS media files.

Reasons:

- WAV, stems, artwork, and video can be large.
- Resumable uploads recover better from interrupted networks.
- The same upload style can handle small files with minimal extra overhead.
- Progress UI can be added cleanly around chunked upload behavior.

Do not implement browser-direct Google token uploads in the MVP. Browser-direct resumable upload sessions may become useful later for very large video files, but resumable session URIs must be treated like temporary secrets and controlled carefully.

Implementation detail for later:

- Avoid loading complete files into backend memory.
- Stream from request body to Google upload stream.
- Enforce file size, MIME type, and extension rules before upload.
- Add cancellation support.
- Clean up metadata if a Drive upload fails after partial progress.

Implemented MVP details:

- Browser uploads use authenticated multipart form requests to the ASP.NET Core API.
- The backend streams from `IFormFile.OpenReadStream()` into the Google Drive upload client abstraction and does not copy the whole file into an application `MemoryStream`.
- Audio uploads target the provisioned Song `Audio` folder.
- Visual uploads target the provisioned Song `Visuals` folder.
- Upload validation checks non-empty file, extension, MIME type, and MVP size limits.
- Audio limit: 500 MB. Supported types: WAV, MP3, FLAC, M4A.
- Visual image limit: 100 MB. Supported image types: PNG, JPG/JPEG, WEBP.
- Visual video limit: 2 GB. Supported video types: MP4, MOV, WEBM.
- A successful upload updates cached `FileName`, `FileSizeBytes`, and `UploadedAt` from the confirmed Drive upload result.
- If an asset already has a linked file, upload returns conflict; replace/version workflow is planned separately.
- If Drive upload succeeds but PostgreSQL persistence fails, the backend attempts best-effort deletion of the just-created Drive file.
- Deleting Artist OS asset metadata does not automatically delete the external Google Drive binary.

## 11. Existing Domain Impact

Recommended minimal domain impact:

- `User`: gains one optional active Google Drive connection.
- `Song`: should remain the workflow root and ownership boundary.
- `AudioAsset`: can later link to an external file reference.
- `VisualAsset`: can later link to an external file reference.
- `Release`: may later reference final deliverable files or folders, but should not own Drive credentials.
- `ContentItem`: may later reference visual/video assets, but should not call Drive directly.
- `Credit`: no immediate Drive impact.
- `AnalyticsSnapshot`: no immediate Drive impact.
- `Calendar`: no immediate Drive impact.
- `Dashboard`: may later show Drive connection/file status derived from source records.

Avoid adding `GoogleDriveFileId` directly to every current model. A provider-neutral reference keeps the domain cleaner and avoids repainting the whole schema when another storage provider or reference type appears.

## 12. Proposed Implementation Milestones

Recommended phases:

1. Discovery report
   - Complete this architecture document.
   - No runtime Google code.

2. Connection persistence foundation
   - Add `GoogleDriveConnection`.
   - Add protected token storage.
   - Add migration and tests.
   - Add config placeholders only, with secrets stored outside source.

3. OAuth connect/status/disconnect API
   - Add connect redirect endpoint.
   - Add callback endpoint.
   - Add connection status endpoint.
   - Add disconnect/revoke endpoint.
   - Keep React token-free.

4. Frontend settings integration
   - Replace Settings placeholder with real connection status.
   - Add connect/disconnect buttons.
   - Keep file upload out of this phase.

5. Folder provisioning
   - Create or locate `DARKROOM SYSTEM` root folder.
   - Create Song folders on demand.
   - Store folder ids.

6. File reference model
   - Add provider-neutral external file reference metadata.
   - Add optional links from AudioAsset and VisualAsset.
   - Add tests for ownership and cross-user behavior.

Milestones 2 through the folder/reference foundation are implemented. Optional asset links and uploaded file references are now implemented for AudioAsset and VisualAsset only.

7. Upload MVP
   - Implement backend-mediated resumable upload.
   - Attach uploaded files to AudioAsset/VisualAsset metadata.
   - Add size/type validation and tests.

Milestone 7 is implemented for AudioAsset and VisualAsset uploads. It does not include replace/version workflow, external deletion, Drive Picker, arbitrary browsing, downloads, thumbnails, playback, waveform processing, or production large-video hardening.

8. Asset workflow refinement
   - Add replace/new-version behavior.
   - Add current-file rules.
   - Add Drive open/view links.

9. Production hardening
   - Token rotation/revocation behavior.
   - Secret manager/KMS plan.
   - Background retry policy.
   - Audit logging.
   - Google OAuth verification readiness.

## 13. Google Cloud Setup Requirements

No Google Cloud setup is required for this discovery milestone.

When implementation starts:

- Create or choose a Google Cloud project.
- Enable the Google Drive API.
- Configure the OAuth consent screen.
- Add test users while the app is in testing mode.
- Create an OAuth client of type `Web application`.
- Add local backend redirect URI, for example:

```text
http://localhost:5178/api/integrations/google-drive/callback
```

- Add production HTTPS redirect URI later.
- Store client id and client secret outside source control.
- Configure local values with .NET User Secrets.
- Decide the production secret storage mechanism before deployment.
- Prepare OAuth verification materials if Google requires them for the selected scopes and production user type.

Recommended local secret names for a later implementation:

```text
GoogleDrive:ClientId
GoogleDrive:ClientSecret
```

Do not add real values to `appsettings.json`.

## 14. Security Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Google refresh token leaked from database | Store protected/encrypted token material only; restrict logs and database access. |
| Google tokens exposed to React | Complete OAuth and Drive calls in the backend; return only connection/file metadata to React. |
| CSRF or account mix-up during OAuth callback | Use short-lived state tied to the Artist OS `User.Id`; validate state before token exchange. |
| User attaches another user's file reference | Enforce Artist OS ownership through JWT `sub`, owned Song lookup, and current user's connection. |
| Overbroad Google account access | Start with `drive.file`, avoid broad `drive`, and use incremental authorization later. |
| Drive file id spoofing | Verify Drive file access through the current user's Google connection before saving references. |
| Logging secrets | Redact auth codes, tokens, refresh tokens, upload session URIs, and provider responses that may contain secrets. |
| Orphaned files after failed database save | Use clear failure handling and reconciliation jobs once uploads exist. |
| Orphaned metadata after failed upload | Save file reference metadata only after Drive confirms upload success. |
| Revoked Google access causes repeated failures | Mark connection `ReauthRequired` and surface a clear reconnect state. |
| XSS steals Artist OS JWT from sessionStorage | Existing known risk; future production hardening should address token storage and frontend XSS controls. |

## 15. Open Decisions

Questions to decide before implementation:

- Should MVP allow one Google Drive connection per user or multiple accounts per user? Recommendation: one active connection per user first.
- Should Artist OS create one global root folder per Google account or one root folder per Artist OS workspace/team? Recommendation: one user-owned root folder until team workspaces exist.
- Should Song folder creation happen when a Song is created or only when the first file is uploaded? Recommendation: on demand at first upload to avoid empty Drive clutter.
- Should existing Drive files be selectable through Google Picker in the first file milestone, or should MVP only upload new files? Recommendation: upload new files first; Picker can follow.
- Should file reference metadata be a shared table for all providers from day one? Decision: yes. `ExternalFileReferences` is implemented as the provider-neutral table.
- Should old local metadata rows be backfilled into file references? Recommendation: no, because current assets are metadata-only and have no external provider identity.
- Should upload limits vary by asset type? Decision: yes. Audio is limited to 500 MB, visual images to 100 MB, and visual videos to 2 GB for the MVP.
- Should first upload MVP allow replacing already-linked files? Decision: no. Re-upload is rejected until a replace/version workflow exists.
- Should deleting Artist OS asset metadata delete the external Drive binary? Decision: no. External deletion must be an explicit future workflow.
- Should Drive folder renames follow Song title changes automatically? Decision: no for this foundation. Folder names are not automatically changed when `Song.Title` changes; provide a manual maintenance action later.

## 16. Final Recommendation

Proceed with Google Drive in small milestones after this report is approved.

The first implementation milestone should be Google Drive connection persistence and OAuth connect/status/disconnect, without file upload. That gives Artist OS a secure integration boundary before the project handles large media files.

Implemented first connection foundation result:

```text
User can connect Google Drive
User can see connected account status
User can disconnect/revoke
React never sees Google tokens
No files are uploaded yet
No Song behavior changes yet
```

This keeps the project aligned with the long-term vision while preserving the current working Song workspace and JWT ownership model.
