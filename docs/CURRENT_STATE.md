# Artist OS Current State

Last updated: 2026-09-01

## Current Phase

Google Drive Media Upload MVP + Audio / Visual Asset File Association.

Current focus: Google Drive upload is implemented for existing AudioAsset and VisualAsset records. Authenticated DARKROOM SYSTEM users can connect Google Drive, refresh access backend-side, provision/reuse the DARKROOM SYSTEM root folder, provision/reuse an owned Song workspace folder tree, upload one Audio or Visual file per metadata asset, and persist the file association through provider-neutral `ExternalFileReference` rows. Google OAuth remains separate from Artist OS JWT authentication. Google token material stays backend-only and protected before database storage. Replace/version workflow, external Drive deletion, download, Drive browsing, Picker, synchronization, YouTube, publishing, and production deployment remain future work.

## Completed

- ASP.NET Core Web API project created.
- .NET 10 target framework configured.
- API controllers enabled with `app.MapControllers()`.
- Entity Framework Core configured.
- Npgsql configured for PostgreSQL.
- `AppDbContext` created.
- `Song` model created.
- Initial EF Core migration created and applied.
- Song validation constraint migration created and applied.
- Local PostgreSQL connectivity confirmed.
- Song CRUD API implemented and manually verified.
- Song API hardened with request/response DTOs.
- Basic Song validation implemented and manually verified.
- Song `CreatedAt` is server-controlled.
- Database max-length constraints added for Song `Title` and `Status`.
- Project workflow/rules captured in `AGENTS.md`.
- Long-term plan captured in `docs/PROJECT_PLAN.md`.
- Root README created for project presentation.
- React/TanStack frontend foundation added in `darkroom-web/`.
- DARKROOM SYSTEM app shell added with responsive desktop sidebar and mobile drawer.
- Frontend routes added for dashboard, songs, song workspace, calendar, team, settings, and login.
- Song API client added with configurable `VITE_API_BASE_URL`.
- `.env.example` added for frontend API configuration.
- Local transparent DARKROOM SYSTEM logo copied into `darkroom-web/src/assets/darkroom-logo.png`.
- Mock-only modules isolated for future workspace areas.
- Development CORS configured for the local frontend origin.
- Real browser-based frontend-to-backend Song CRUD verified.
- Default ASP.NET WeatherForecast template files removed.
- Root README updated to reflect the current DARKROOM SYSTEM frontend and real Song integration.
- `AudioAsset` model created and related to `Song`.
- AudioAsset metadata DTOs created.
- Nested AudioAsset metadata API implemented.
- AudioAsset EF Core migration created and applied.
- Audio tab now reads/writes real AudioAsset metadata through the ASP.NET Core API.
- Browser-based AudioAsset metadata create/edit/delete verified.
- Root solution file added for backend and test project builds.
- xUnit backend test project added under `tests/ArtistOS.Api.Tests/`.
- Song API CRUD and validation covered by automated integration-style tests.
- AudioAsset API CRUD, validation, and Song relationship behavior covered by automated integration-style tests.
- GitHub Actions CI workflow added for backend restore/build/test and frontend install/lint/build.
- Remote DARKROOM SYSTEM CI push run has been reported as successful.
- `VisualAsset` model created and related to `Song`.
- VisualAsset metadata DTOs created.
- Nested VisualAsset metadata API implemented.
- VisualAsset EF Core migration created and applied.
- Visuals tab now reads/writes real VisualAsset metadata through the ASP.NET Core API.
- Browser-based VisualAsset metadata create/edit/delete verified.
- VisualAsset API CRUD, validation, and Song relationship behavior covered by automated integration-style tests.
- `Release` model created and related to `Song`.
- Release metadata DTOs created.
- Nested Release metadata API implemented.
- Release EF Core migration created and applied.
- Release tab now reads/writes real Release metadata through the ASP.NET Core API.
- `ReleaseChecklistItem` model created and related to `Release`.
- ReleaseChecklist metadata DTOs created.
- Nested Release checklist metadata API implemented.
- ReleaseChecklist EF Core migration created and applied.
- Existing Release rows are backfilled with standard checklist items by the migration.
- Release tab now reads/writes real Release checklist metadata through the ASP.NET Core API.
- Release checklist progress is derived from persisted item completion state.
- Browser-based Release metadata create/edit/delete verified.
- Release API create/read/update/delete, validation, timestamps, duplicate prevention, and Song relationship behavior covered by automated integration-style tests.
- `ContentItem` model created and related to `Song`.
- ContentItem metadata DTOs created.
- Nested ContentItem metadata API implemented.
- ContentItem EF Core migration created and applied.
- Content tab now reads/writes real ContentItem metadata through the ASP.NET Core API.
- Content publishing/platform actions remain planned and are clearly labeled in the frontend.
- Browser-based ContentItem metadata create/edit/delete verified.
- ContentItem API create/read/update/delete, validation, timestamps, and Song relationship behavior covered by automated integration-style tests.
- `Credit` model created and related to `Song`.
- Credit metadata DTOs created.
- Nested Credit metadata API implemented.
- Credit EF Core migration created and applied.
- Credits tab now reads/writes real Credit metadata through the ASP.NET Core API.
- Planned split remains metadata-only and is clearly labeled in the frontend.
- Browser-based Credit metadata create/edit/delete verified.
- Credit API create/read/update/delete, validation, timestamps, split bounds, and Song relationship behavior covered by automated integration-style tests.
- `AnalyticsSnapshot` model created and related to `Song`.
- AnalyticsSnapshot metadata DTOs created.
- Nested AnalyticsSnapshot metadata API implemented.
- AnalyticsSnapshot EF Core migration created and applied.
- Analytics tab now reads/writes real AnalyticsSnapshot metadata through the ASP.NET Core API.
- Analytics trend display now uses persisted manual snapshot data.
- External analytics ingestion remains planned and is clearly labeled in the frontend.
- Browser-based AnalyticsSnapshot metadata create/edit/delete/refresh verified.
- AnalyticsSnapshot API create/read/update/delete, validation, timestamp, duplicate prevention, ordering, and Song relationship behavior covered by automated integration-style tests.
- Browser-based Release checklist create-on-release, refresh persistence, check/uncheck, progress, and server timestamp behavior verified.
- ReleaseChecklist API default initialization, read/order, update, validation, timestamps, and Release/Song relationship behavior covered by automated integration-style tests.
- `CalendarEntryResponse` read DTO created.
- `CalendarController` aggregate API implemented at `GET /api/calendar`.
- Calendar entries are assembled from `Release.ReleaseDate`, `ContentItem.DueDate`, `ContentItem.ScheduledAt`, and `ContentItem.PublishedAt`.
- Calendar supports optional inclusive `from` and `to` `DateOnly` filters.
- Calendar returns `400 Bad Request` when `from` is after `to`.
- Calendar entries are sorted by date, song title, event type, and source id.
- Calendar route now reads real backend data through TanStack Query.
- Mock calendar data was retired.
- Browser-based Calendar aggregation, month-range loading, persistence after refresh, date move, deletion, and Song navigation verified.
- Calendar API empty, filtering, ordering, live update, delete, cascade, and source-domain behavior covered by automated integration-style tests.
- `DashboardController` aggregate API implemented at `GET /api/dashboard`.
- Dashboard summary is derived from persisted Songs, Releases, and ContentItems.
- Dashboard pipeline is derived from canonical Song statuses.
- Dashboard upcoming work is derived from future ReleaseDate, ContentItem DueDate, and ContentItem ScheduledAt values.
- Dashboard release readiness is derived from persisted ReleaseChecklistItems.
- Dashboard analytics overview uses latest stored AnalyticsSnapshot per Song and platform.
- Dashboard recent activity is conservatively derived from existing source timestamps.
- Dashboard route now reads real backend data through TanStack Query.
- Mock Dashboard upcoming, recent activity, and performance data were retired.
- Browser-based Dashboard summary, pipeline, upcoming work, release readiness, analytics overview, recent activity, source update/delete behavior, and Song navigation verified.
- Dashboard API empty, summary, pipeline, upcoming, readiness, analytics, activity, live update, and delete behavior covered by automated integration-style tests.
- Frontend test stack added with Vitest, React Testing Library, jest-dom, user-event, and jsdom.
- Frontend `npm run test` and `npm run test:watch` scripts added.
- Shared frontend test setup and QueryClient render helper added under `darkroom-web/src/test/`.
- Initial frontend tests added for StatusBadge/status constants, Dashboard success/empty/error/loading states, Songs list/empty/error states, and Create Song request construction.
- Frontend tests mock the frontend API service boundary and do not require the ASP.NET backend, PostgreSQL, localhost, or network access.
- GitHub Actions frontend job now runs install, lint, test, and build.
- `User` model created.
- User authentication DTOs created.
- Authentication API implemented at `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- Passwords are hashed with ASP.NET Core Identity's `PasswordHasher<TUser>`.
- ASP.NET Core JWT Bearer authentication configured for local frontend/backend development.
- Login and registration return short-lived signed JWT access tokens plus safe user metadata.
- Local frontend CORS allows `Authorization: Bearer` requests from `http://localhost:8080`.
- `Song.OwnerUserId` and `Song.OwnerUser` added as nullable ownership fields for backward-compatible existing data.
- New Songs created while authenticated receive owner assignment from the current backend session.
- The frontend stores the JWT access token in `sessionStorage` and the shared API client sends it in the `Authorization` header.
- Login/register UI now uses the real authentication API.
- Dashboard, Songs, Song workspace, Calendar, Team, and Settings routes are protected by the authenticated frontend app shell.
- Authenticated session restore, logout, invalid credentials handling, Song creation, Song workspace load, and Song owner assignment were verified in a real browser.
- Auth API and Song owner assignment are covered by automated backend integration-style tests.
- Auth flow, protected-route behavior, logout, and safe-user UI behavior are covered by automated frontend tests.
- Backend resource ownership is enforced for Songs, AudioAssets, VisualAssets, Releases, ReleaseChecklistItems, ContentItems, Credits, AnalyticsSnapshots, Calendar, and Dashboard.
- Protected backend endpoints return `401 Unauthorized` without a valid session.
- Missing, unowned, cross-user, and legacy-unowned resources return `404 Not Found` to normal authenticated users.
- Nested Song workspace APIs verify ownership through the parent Song and reject cross-Song id mixing.
- Calendar and Dashboard aggregate only the current user's records.
- Frontend API client dispatches a centralized unauthorized event on backend `401` responses, and the app shell redirects back to `/login`.
- Backend ownership behavior is covered by automated two-user integration-style tests, including legacy unowned Song invisibility.
- Browser-based two-user ownership verification confirmed that each user can only see their own Song data and receives `404` for the other user's Song and nested routes.
- Cookie authentication transport was removed from backend runtime code.
- JWT logout endpoint returns success for frontend cleanup, but does not server-revoke already-issued stateless access tokens.
- Google Drive architecture discovery documented in `docs/GOOGLE_DRIVE_ARCHITECTURE.md`.
- `GoogleDriveConnection` model created and related one-to-one with `User`.
- Google Drive connection DTOs created for connect, status, and disconnect.
- Google Drive connection API implemented at `GET /api/integrations/google-drive/status`, `POST /api/integrations/google-drive/connect`, `GET /api/integrations/google-drive/callback`, and `POST /api/integrations/google-drive/disconnect`.
- Official `Google.Apis.Auth` package added for Google OAuth authorization URL creation, code exchange, token revocation, and ID token validation.
- Google OAuth scopes are limited to `openid`, `email`, and `https://www.googleapis.com/auth/drive.file`.
- Google OAuth state is protected with ASP.NET Core Data Protection and includes initiating `User.Id`, nonce, PKCE code verifier, issue time, and expiration.
- Google refresh tokens are protected with ASP.NET Core Data Protection before being stored in PostgreSQL.
- Reconnect preserves an existing protected refresh token when Google does not return a replacement refresh token.
- Google Drive disconnect removes the current user's local connection after best-effort token revocation.
- Settings now reads real Google Drive connection status and supports connect, reconnect, and disconnect actions.
- Google Drive connection behavior is covered by automated backend integration-style tests using a fake Google OAuth provider.
- Google Drive Settings behavior is covered by focused frontend tests using mocked API services.
- Official `Google.Apis.Drive.v3` package added for Drive v3 API support.
- Backend-only Google access-token refresh added for Drive API operations.
- `ExternalFileReference` model created for provider-neutral external folder/file references.
- ExternalFileReference EF Core migration created and applied.
- Drive workspace API implemented at `GET /api/songs/{songId}/drive-workspace` and `POST /api/songs/{songId}/drive-workspace/provision`.
- Drive workspace provisioning creates/reuses `DARKROOM SYSTEM`, `Songs`, Song root, `Audio`, `Visuals`, `Release`, and `Content` folders.
- `GoogleDriveConnection.RootFolderId` is the canonical persisted root folder reference after provisioning.
- Song folder and section folder references are persisted in `ExternalFileReferences`.
- Repeated Drive workspace provisioning reuses persisted references when Drive folders still exist.
- Missing/deleted root or Song folder references are recovered by creating and saving replacement folders.
- Song workspace Overview now includes a small Google Drive provisioning panel.
- Google Drive workspace behavior is covered by automated backend tests using a fake Drive API client.
- Backend-mediated Google Drive upload implemented for AudioAsset and VisualAsset files.
- AudioAsset uploads target the provisioned Song `Audio` folder.
- VisualAsset uploads target the provisioned Song `Visuals` folder.
- Uploads stream from the ASP.NET multipart file stream into the Google Drive v3 upload client abstraction.
- `ExternalFileReference` now stores uploaded file references with safe metadata including display name, MIME type, size, web view link, resource type, and asset association context.
- AudioAsset and VisualAsset now have nullable `ExternalFileReferenceId` links, so existing metadata-only assets remain valid.
- Successful uploads synchronize cached `FileName`, `FileSizeBytes`, and `UploadedAt` from the confirmed Drive result.
- Re-upload to an already-linked asset returns a conflict; replace/version workflow remains planned.
- Deleting Artist OS asset metadata does not automatically delete the external Google Drive binary.
- If Drive upload succeeds but database persistence fails, the backend attempts best-effort cleanup of the newly-created Drive file.
- Audio and Visuals tabs now show no-file-linked, upload-pending, linked-file, and Open in Drive states.
- Google Drive media upload behavior is covered by automated backend tests using fake OAuth and fake Drive clients.
- Focused frontend upload tests cover metadata-only upload action, successful linked-file display, backend failure display, and absence of token text.

## Current Implementation

Backend project:

```text
ArtistOS.Api/
```

Frontend project:

```text
darkroom-web/
```

Backend test project:

```text
tests/ArtistOS.Api.Tests/
```

CI workflow:

```text
.github/workflows/ci.yml
```

Current backend architecture:

```text
AuthController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
SongsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AudioAssetsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
VisualAssetsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
ReleasesController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
ContentItemsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
CreditsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AnalyticsSnapshotsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
ReleaseChecklistController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
CalendarController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
DashboardController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
GoogleDriveIntegrationController -> GoogleDriveConnectionService -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
DriveWorkspacesController -> GoogleDriveWorkspaceService -> GoogleDriveApiClient -> Google Drive API
DriveWorkspacesController -> GoogleDriveWorkspaceService -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AudioAssetsController -> GoogleDriveAssetUploadService -> GoogleDriveApiClient -> Google Drive API
VisualAssetsController -> GoogleDriveAssetUploadService -> GoogleDriveApiClient -> Google Drive API
GoogleDriveAssetUploadService -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
```

No backend repository layer has been introduced. Google Drive services exist because OAuth state protection, token exchange/refresh, folder provisioning, media upload, external file reference persistence, and best-effort upload cleanup are integration/security concerns that would make controllers too large and sensitive.

Development-only backend CORS is configured in `ArtistOS.Api/Program.cs` using the named policy `LocalFrontend`.

Allowed local frontend origin:

```text
http://localhost:8080
```

Allowed methods:

```text
GET
POST
PUT
DELETE
OPTIONS
```

The `Authorization` header is allowed for local JWT Bearer requests. Credentialed CORS cookies are no longer required by Artist OS authentication.

Current frontend architecture:

```text
TanStack Router routes
  -> DARKROOM SYSTEM app shell/pages
  -> TanStack Query
  -> isolated Auth, Song, AudioAsset, VisualAsset, Release, ReleaseChecklist, ContentItem, Credit, AnalyticsSnapshot, Calendar, Dashboard, Google Drive, and Drive Workspace API services
  -> ASP.NET Core API
```

Future workspace areas use centralized mock modules under `darkroom-web/src/services/mock/`. They are visually present for architecture and navigation, but they are not backend-backed yet.

Settings now uses a dedicated Google Drive API service for connection status, connect, reconnect, and disconnect.

## Current Frontend Routes

Implemented in `darkroom-web/src/routes/`.

```text
/                 redirects to /dashboard
/login
/dashboard
/songs
/songs/$songId
/calendar
/team
/settings
```

Song workspace tabs implemented inside `/songs/$songId`:

```text
Overview
Audio
Visuals
Release
Content
Credits
Analytics
```

## Real API Integration

The frontend uses the real backend for local user authentication:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

Auth uses short-lived JWT Bearer access tokens. Login and registration responses return an access token, token type, expiration timestamp, and safe user shape without password or password hash fields.

All existing Song workspace data endpoints now require an authenticated session. Normal authenticated users only see resources owned by their own `User.Id`. Legacy rows with `OwnerUserId = null` remain unowned and are invisible through normal authenticated APIs.

Current JWT details:

- Issuer: `ArtistOS.Api`
- Audience: `ArtistOS.DarkroomWeb`
- Access token lifetime: `20` minutes
- Clock skew: `30` seconds
- User id claim: `sub`
- Optional non-secret claim: email
- Signing key source: .NET User Secrets, environment variables, or test host configuration
- Refresh tokens: not implemented
- Logout semantics: frontend token cleanup only; no server-side JWT revocation

The frontend uses the real backend for Song CRUD:

```text
GET    /api/songs
GET    /api/songs/{id}
POST   /api/songs
PUT    /api/songs/{id}
DELETE /api/songs/{id}
```

The frontend also uses the real backend for AudioAsset metadata:

```text
GET    /api/songs/{songId}/audio-assets
GET    /api/songs/{songId}/audio-assets/{audioAssetId}
POST   /api/songs/{songId}/audio-assets
PUT    /api/songs/{songId}/audio-assets/{audioAssetId}
DELETE /api/songs/{songId}/audio-assets/{audioAssetId}
```

The frontend also uses the real backend for VisualAsset metadata:

```text
GET    /api/songs/{songId}/visual-assets
GET    /api/songs/{songId}/visual-assets/{visualAssetId}
POST   /api/songs/{songId}/visual-assets
PUT    /api/songs/{songId}/visual-assets/{visualAssetId}
DELETE /api/songs/{songId}/visual-assets/{visualAssetId}
```

The frontend also uses the real backend for Release metadata:

```text
GET    /api/songs/{songId}/release
POST   /api/songs/{songId}/release
PUT    /api/songs/{songId}/release
DELETE /api/songs/{songId}/release
```

The frontend also uses the real backend for Release checklist metadata:

```text
GET    /api/songs/{songId}/release/checklist
GET    /api/songs/{songId}/release/checklist/{checklistItemId}
PUT    /api/songs/{songId}/release/checklist/{checklistItemId}
```

The frontend also uses the real backend for ContentItem metadata:

```text
GET    /api/songs/{songId}/content-items
GET    /api/songs/{songId}/content-items/{contentItemId}
POST   /api/songs/{songId}/content-items
PUT    /api/songs/{songId}/content-items/{contentItemId}
DELETE /api/songs/{songId}/content-items/{contentItemId}
```

The frontend also uses the real backend for Credit metadata:

```text
GET    /api/songs/{songId}/credits
GET    /api/songs/{songId}/credits/{creditId}
POST   /api/songs/{songId}/credits
PUT    /api/songs/{songId}/credits/{creditId}
DELETE /api/songs/{songId}/credits/{creditId}
```

The frontend also uses the real backend for AnalyticsSnapshot metadata:

```text
GET    /api/songs/{songId}/analytics
GET    /api/songs/{songId}/analytics/{analyticsSnapshotId}
POST   /api/songs/{songId}/analytics
PUT    /api/songs/{songId}/analytics/{analyticsSnapshotId}
DELETE /api/songs/{songId}/analytics/{analyticsSnapshotId}
```

The frontend also uses the real backend for the Calendar aggregate:

```text
GET    /api/calendar
GET    /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
```

The frontend also uses the real backend for the Dashboard aggregate:

```text
GET    /api/dashboard
```

The frontend also uses the real backend for Google Drive connection status and lifecycle:

```text
GET    /api/integrations/google-drive/status
POST   /api/integrations/google-drive/connect
GET    /api/integrations/google-drive/callback
POST   /api/integrations/google-drive/disconnect
```

The frontend also uses the real backend for safe Song Drive workspace inspection and provisioning:

```text
GET    /api/songs/{songId}/drive-workspace
POST   /api/songs/{songId}/drive-workspace/provision
```

The frontend also uses the real backend for AudioAsset and VisualAsset Google Drive upload:

```text
POST   /api/songs/{songId}/audio-assets/{audioAssetId}/upload
POST   /api/songs/{songId}/visual-assets/{visualAssetId}/upload
```

`POST /api/integrations/google-drive/connect` returns a Google authorization URL. The frontend performs full browser navigation to Google from that URL. The callback endpoint does not require an Artist OS Bearer header because Google redirects the browser directly back to the backend; instead, it validates protected, expiring OAuth state created during the authenticated connect request.

Current frontend API base URL behavior:

- `VITE_API_BASE_URL` controls the backend URL.
- Default frontend fallback value is `http://localhost:5178`.
- `darkroom-web/.env.example` documents `VITE_API_BASE_URL=http://localhost:5178`.
- Authenticated requests use `Authorization: Bearer <access_token>`.
- The frontend stores the access token in `sessionStorage` under `artist-os.access-token`.
- The token survives browser refresh in the same tab/session, but is cleared by sign out, invalid/expired-token handling, and closing the browser session.
- New Songs created while authenticated are assigned `OwnerUserId` by the backend from the current session.
- The frontend does not send `OwnerUserId` when creating or updating Songs.
- `401 Unauthorized` from the backend triggers a centralized frontend auth event and returns the user to `/login`.
- Unowned, missing, or cross-user resources are treated as `404 Not Found`.
- `PUT /api/songs/{id}` is handled as `204 No Content`; the client refetches the song afterward.
- `PUT /api/songs/{songId}/audio-assets/{audioAssetId}` is handled as `204 No Content`; the client refetches the audio asset afterward.
- `PUT /api/songs/{songId}/visual-assets/{visualAssetId}` is handled as `204 No Content`; the client refetches the visual asset afterward.
- `PUT /api/songs/{songId}/release` is handled as `204 No Content`; the client refetches the release afterward.
- `PUT /api/songs/{songId}/release/checklist/{checklistItemId}` is handled as `204 No Content`; the client refetches the checklist item afterward.
- `PUT /api/songs/{songId}/content-items/{contentItemId}` is handled as `204 No Content`; the client refetches the content item afterward.
- `PUT /api/songs/{songId}/credits/{creditId}` is handled as `204 No Content`; the client refetches the credit afterward.
- `PUT /api/songs/{songId}/analytics/{analyticsSnapshotId}` is handled as `204 No Content`; the client refetches the analytics snapshot afterward.
- Calendar uses month-scoped TanStack Query requests with inclusive `from` and `to` date filters.
- Dashboard uses a portfolio-scoped TanStack Query request with key `["dashboard"]`.

If the backend host is unreachable, the Song API service switches to an explicit in-memory development fallback and the UI shows a fallback notice. Other API errors are not hidden.

Verified normal browser path:

```text
http://localhost:8080
  -> http://localhost:5178/api/songs
  -> PostgreSQL artist_os
```

When the backend is running with CORS configured, the fallback notice does not appear.

## Mock-Only Areas

These frontend areas are mock-only and do not have backend persistence yet:

- Audio waveform display, playback, replace/version workflow, and external Drive file deletion.
- Visual thumbnails, previews, playback, replace/version workflow, and external Drive file deletion.
- Automatic release checklist completion from asset/content/credit records.
- Content publishing and platform delivery.
- Contributor directory, team permissions, contracts, royalties, and payout workflow.
- External analytics ingestion and automated platform sync.
- Standalone calendar events, reminders, drag/drop rescheduling, and external calendar sync.
- Team.
- Settings.
- Team roles, collaboration permissions, password recovery, email verification, and production auth hardening.

## Current User Model

```csharp
public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Song> Songs { get; set; } = [];
}
```

Relationship:

```text
User 1 -> many Songs
Song OwnerUserId is nullable for backward compatibility with existing records
```

`PasswordHash` is internal persistence data and is not exposed by auth API responses.

## Current Song Model

```csharp
public class Song
{
    public int Id { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(40)]
    public string Status { get; set; } = "Demo";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? OwnerUserId { get; set; }
    public User? OwnerUser { get; set; }

    public ICollection<AudioAsset> AudioAssets { get; set; } = [];

    public ICollection<VisualAsset> VisualAssets { get; set; } = [];

    public Release? Release { get; set; }

    public ICollection<ContentItem> ContentItems { get; set; } = [];

    public ICollection<Credit> Credits { get; set; } = [];

    public ICollection<AnalyticsSnapshot> AnalyticsSnapshots { get; set; } = [];
}
```

## Current AudioAsset Model

```csharp
public class AudioAsset
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string Type { get; set; } = "Demo";
    public string FileName { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "Draft";
    public int? DurationSeconds { get; set; }
    public long? FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsCurrent { get; set; }
}
```

Relationship:

```text
Song 1 -> many AudioAssets
```

AudioAsset is metadata-only. No audio binary data is stored in PostgreSQL.

## Current VisualAsset Model

```csharp
public class VisualAsset
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string Type { get; set; } = "CoverArt";
    public string FileName { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "Draft";
    public int? Width { get; set; }
    public int? Height { get; set; }
    public long? FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public bool IsCurrent { get; set; }
}
```

Relationship:

```text
Song 1 -> many VisualAssets
```

VisualAsset is metadata-only. No image/video binary data, thumbnails, or base64 media are stored in PostgreSQL.

## Current Release Model

```csharp
public class Release
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public DateOnly? ReleaseDate { get; set; }
    public string ReleaseType { get; set; } = "Single";
    public string? Distributor { get; set; }
    public string? Isrc { get; set; }
    public string? Upc { get; set; }
    public string Status { get; set; } = "Planning";
    public string Platforms { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ReleaseChecklistItem> ChecklistItems { get; set; } = [];
}
```

Relationship:

```text
Song 1 -> 0 or 1 Release
Release 1 -> many ReleaseChecklistItems
```

Release is metadata-only. No distributor API delivery, publishing action, or external platform integration exists yet.

Release platforms are stored as a single normalized comma-separated string in PostgreSQL and returned as a string array through the API. This keeps the first release-planning milestone understandable without introducing platform join tables before real platform integrations exist.

## Current ReleaseChecklistItem Model

```csharp
public class ReleaseChecklistItem
{
    public int Id { get; set; }
    public int ReleaseId { get; set; }
    public Release Release { get; set; } = null!;
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Relationship:

```text
Release 1 -> many ReleaseChecklistItems
```

ReleaseChecklistItem is metadata-only. It tracks preparation readiness and notes; it does not publish, upload, validate external assets, or deliver a release to a distributor.

Default checklist keys:

```text
Master
Cover
Metadata
Credits
Canvas
MusicVideo
ContentPlan
```

## Current ContentItem Model

```csharp
public class ContentItem
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "Teaser";
    public string Status { get; set; } = "Idea";
    public string? Platform { get; set; }
    public string? OwnerName { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateOnly? ScheduledAt { get; set; }
    public DateOnly? PublishedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Relationship:

```text
Song 1 -> many ContentItems
```

ContentItem is metadata-only. No platform publishing, scheduled social posting, media upload, or external API delivery exists yet.

## Current Credit Model

```csharp
public class Credit
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string ContributorName { get; set; } = string.Empty;
    public string Role { get; set; } = "Artist";
    public string? Contact { get; set; }
    public string Status { get; set; } = "Pending";
    public decimal? SplitPercentage { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

Relationship:

```text
Song 1 -> many Credits
```

Credit is metadata-only. `SplitPercentage` is an optional planned split field and does not represent payment processing, royalty settlement, accounting, or a legal split agreement.

## Current AnalyticsSnapshot Model

```csharp
public class AnalyticsSnapshot
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Song Song { get; set; } = null!;
    public string Platform { get; set; } = "YouTube";
    public DateOnly SnapshotDate { get; set; }
    public long Views { get; set; }
    public long Likes { get; set; }
    public long Comments { get; set; }
    public long WatchTimeMinutes { get; set; }
    public long SubscribersGained { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

Relationship:

```text
Song 1 -> many AnalyticsSnapshots
```

AnalyticsSnapshot is metadata-only. No YouTube API, Spotify API, TikTok API, Instagram API, OAuth connection, scheduled ingestion, or automated sync exists yet.

Snapshots are intentionally modeled as time-series records rather than one mutable analytics row. This allows Artist OS to preserve metric history over time.

## Current Calendar Read Model

Calendar is a read-only aggregate assembled from existing persisted domain dates.

Persisted source dates:

```text
Release.ReleaseDate
ContentItem.DueDate
ContentItem.ScheduledAt
ContentItem.PublishedAt
```

Current Calendar event types:

```text
ReleaseDate
ContentDue
ContentScheduled
ContentPublished
```

Calendar entries are not independently editable. Each entry includes a navigation target back to `/songs/{songId}` so editing still happens in the source Song workspace.

There is no `CalendarEvent` EF model, database table, or migration in the current implementation.

## Current Dashboard Read Model

Dashboard is a read-only aggregate assembled from existing persisted Artist OS records.

Current response sections:

```text
summary
pipeline
upcoming
releaseReadiness
analyticsOverview
recentActivity
```

Summary definitions:

- `TotalSongs`: current user's persisted Songs.
- `ActiveSongs`: current user's Songs whose lifecycle `Status` is not `Released`.
- `UpcomingReleases`: current user's Releases with `ReleaseDate >=` the current UTC date and `Status` not `Released`.
- `ScheduledContent`: current user's ContentItems with `ScheduledAt >=` the current UTC date and `Status` not `Published`.

Pipeline behavior:

- Uses the canonical Song status order.
- Returns every canonical status with a count, including zero-count statuses.
- Does not introduce a second Dashboard-specific lifecycle taxonomy.

Upcoming behavior:

- Uses future `Release.ReleaseDate`, `ContentItem.DueDate`, and `ContentItem.ScheduledAt` values.
- Excludes `ContentItem.PublishedAt` because it represents historical completion.
- Excludes past dates, released releases, and published content.
- Returns a bounded list sorted chronologically.

Release readiness behavior:

- Uses persisted ReleaseChecklistItems.
- Derives completed items, total items, and rounded readiness percentage.
- Does not store readiness percentages.

Analytics overview behavior:

- Uses persisted AnalyticsSnapshot records.
- Selects the latest snapshot per Song and platform.
- Does not sum historical snapshots as if each snapshot were independent traffic.
- Does not imply live external analytics sync.

Recent activity behavior:

- Derives conservative activity from existing source timestamps only.
- Includes source-created/source-updated style descriptions where timestamps support them.
- Does not invent users, audit history, previous values, or external sync events.

There is no `Dashboard`, `DashboardStats`, cached KPI, `ActivityLog`, or audit-history table in the current implementation.

## Current DTOs

The Song API uses DTOs instead of exposing the EF entity directly as the API contract.

- `CreateSongRequest`
- `UpdateSongRequest`
- `SongResponse`
- `CreateAudioAssetRequest`
- `UpdateAudioAssetRequest`
- `AudioAssetResponse`
- `CreateVisualAssetRequest`
- `UpdateVisualAssetRequest`
- `VisualAssetResponse`
- `CreateReleaseRequest`
- `UpdateReleaseRequest`
- `ReleaseResponse`
- `UpdateReleaseChecklistItemRequest`
- `ReleaseChecklistItemResponse`
- `CreateContentItemRequest`
- `UpdateContentItemRequest`
- `ContentItemResponse`
- `CreateCreditRequest`
- `UpdateCreditRequest`
- `CreditResponse`
- `CreateAnalyticsSnapshotRequest`
- `UpdateAnalyticsSnapshotRequest`
- `AnalyticsSnapshotResponse`
- `CalendarEntryResponse`
- `DashboardResponse`
- `DashboardSummaryResponse`
- `DashboardPipelineItemResponse`
- `DashboardUpcomingItemResponse`
- `DashboardReleaseReadinessResponse`
- `DashboardAnalyticsItemResponse`
- `DashboardActivityItemResponse`

DTOs are used because they solve current API contract problems:

- prevent clients from setting `Id`
- prevent clients from setting or changing `CreatedAt`
- provide focused request validation
- keep response shape explicit
- keep one-to-one Release metadata separate from the `Song` persistence model
- keep fixed Release checklist metadata separate from future automated readiness rules and distributor validation
- keep ContentItem planning metadata separate from future platform publishing behavior
- keep Credit contributor metadata separate from future user/team/payment/legal systems
- keep AnalyticsSnapshot metadata separate from future external analytics ingestion behavior
- keep Calendar as a read-only aggregate over Release and ContentItem source dates instead of duplicating dates into a separate table
- keep Dashboard as a read-only aggregate over existing source records instead of persisting derived portfolio state

## Validation / Normalization

Current backend validation rules:

- `Title` is required.
- `Title` is trimmed before saving.
- Empty or whitespace-only `Title` values are rejected.
- `Title` max length is `200`.
- `Status` is required.
- `Status` is trimmed before saving.
- Empty or whitespace-only `Status` values are rejected.
- `Status` max length is `40`.
- `Status` must match an allowed Song status.

Allowed Song statuses:

```text
Idea
Demo
Recording
Mixing
Mastering
ReleasePreparation
ContentCampaign
Released
Analytics
```

Status input is matched case-insensitively and normalized to the canonical casing above before saving.

Current AudioAsset backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `UploadedAt` is server-controlled.
- `Type` is required and trimmed before saving.
- `Type` must be one of the supported audio asset types.
- `FileName` is required and trimmed before saving.
- `FileName` max length is `255`.
- `Version` must be a positive whole number.
- `Status` is required and trimmed before saving.
- `Status` must be one of the supported audio asset statuses.
- `DurationSeconds` is optional and must be non-negative when supplied.
- `FileSizeBytes` is optional and must be non-negative when supplied.

Allowed AudioAsset types:

```text
Demo
Recording
Mix
Master
```

Allowed AudioAsset statuses:

```text
Draft
Review
Approved
Final
```

Current VisualAsset backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `UploadedAt` is server-controlled.
- `Type` is required and trimmed before saving.
- `Type` must be one of the supported visual asset types.
- `FileName` is required and trimmed before saving.
- `FileName` max length is `255`.
- `Version` must be a positive whole number.
- `Status` is required and trimmed before saving.
- `Status` must be one of the supported visual asset statuses.
- `Width` is optional and must be positive when supplied.
- `Height` is optional and must be positive when supplied.
- `FileSizeBytes` is optional and must be non-negative when supplied.

Allowed VisualAsset types:

```text
CoverArt
MusicVideo
Visualizer
SpotifyCanvas
PromoAsset
SocialContent
```

Allowed VisualAsset statuses:

```text
Draft
InProgress
Review
Approved
Final
```

Current Release backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `CreatedAt` is server-controlled.
- `UpdatedAt` is server-controlled and changes on update.
- `ReleaseDate` is optional.
- `ReleaseType` is required and trimmed before saving.
- `ReleaseType` must be one of the supported release types.
- `Distributor` is optional, trimmed before saving, and limited to `120` characters.
- `ISRC` is optional, trimmed before saving, and limited to `20` characters.
- `UPC` is optional, trimmed before saving, and limited to `20` characters.
- `Status` is required and trimmed before saving.
- `Status` must be one of the supported release statuses.
- `Platforms` are optional and must contain only supported values when supplied.
- A Song can have at most one Release row.

Allowed Release types:

```text
Single
```

`EP` and `Album` are intentionally not enabled yet because the current implemented aggregate is still a single Song. Multi-song release modeling can be introduced when that product requirement exists.

Allowed Release statuses:

```text
Planning
Preparing
Ready
Scheduled
Released
```

Allowed Release platforms:

```text
Spotify
AppleMusic
YouTube
YouTubeMusic
SoundCloud
TikTok
Other
```

Current ReleaseChecklist backend validation rules:

- `ReleaseId` comes from the existing Release relationship.
- `Id` is database-controlled.
- `Key` and `Label` are server-defined standard values.
- `IsCompleted` can be changed by the client.
- `CompletedAt` is server-controlled.
- `CompletedAt` is set when an item changes from incomplete to complete.
- `CompletedAt` is cleared when an item changes from complete to incomplete.
- `Notes` is optional, trimmed before saving, and limited to `1000` characters.
- `SortOrder` is server-defined for the standard checklist.
- A Release can have one checklist item per standard `Key`.
- Custom checklist items are not implemented in this milestone.

Default ReleaseChecklist keys:

```text
Master
Cover
Metadata
Credits
Canvas
MusicVideo
ContentPlan
```

Current ContentItem backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `CreatedAt` is server-controlled.
- `UpdatedAt` is server-controlled and changes on update.
- `Title` is required, trimmed before saving, and limited to `200` characters.
- `Type` is required, trimmed before saving, and must be one of the supported content item types.
- `Status` is required, trimmed before saving, and must be one of the supported content item statuses.
- `Platform` is optional, trimmed before saving, and must be one of the supported content item platforms when supplied.
- `OwnerName` is optional, trimmed before saving, and limited to `120` characters.
- `DueDate`, `ScheduledAt`, and `PublishedAt` are optional metadata dates.
- `Notes` is optional, trimmed before saving, and limited to `1000` characters.

Allowed ContentItem types:

```text
Teaser
Snippet
MusicVideo
Visualizer
BehindTheScenes
TikTok
InstagramReel
YouTubeShort
ArtworkPost
```

Allowed ContentItem statuses:

```text
Idea
Planned
InProduction
Editing
Ready
Scheduled
Published
```

Allowed ContentItem platforms:

```text
Instagram
TikTok
YouTube
YouTubeShorts
Spotify
CrossPlatform
Other
```

Current Credit backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `CreatedAt` is server-controlled.
- `UpdatedAt` is server-controlled and changes on update.
- `ContributorName` is required, trimmed before saving, and limited to `160` characters.
- `Role` is required, trimmed before saving, and must be one of the supported credit roles.
- `Status` is required, trimmed before saving, and must be one of the supported credit statuses.
- `Contact` is optional, trimmed before saving, and limited to `160` characters.
- `SplitPercentage` is optional and must be between `0` and `100` when supplied.
- `Notes` is optional, trimmed before saving, and limited to `1000` characters.
- A Song can have multiple Credits.
- The same contributor can appear more than once with different roles.

Allowed Credit roles:

```text
Artist
FeaturedArtist
Producer
Songwriter
RecordingEngineer
MixEngineer
MasteringEngineer
Director
Designer
```

Allowed Credit statuses:

```text
Pending
Confirmed
```

Status decision:

```text
Pending
Confirmed
```

`Invited` is intentionally not supported yet because no invite/auth/team workflow exists.

Split decision:

```text
SplitPercentage is included as nullable planned split metadata.
```

No cross-record rule requires planned splits to sum to `100` in this milestone.

Current AnalyticsSnapshot backend validation rules:

- `SongId` comes from the route.
- `Id` is database-controlled.
- `CreatedAt` is server-controlled and does not change on update.
- `SnapshotDate` is required and represents the client-supplied measurement date.
- `Platform` is required, trimmed before saving, and must be one of the supported analytics platforms.
- `Views`, `Likes`, `Comments`, `WatchTimeMinutes`, and `SubscribersGained` must be non-negative whole numbers.
- A Song can have many AnalyticsSnapshots across dates and platforms.
- Duplicate snapshots for the same `SongId`, `Platform`, and `SnapshotDate` are rejected with `409 Conflict`.

Allowed AnalyticsSnapshot platforms:

```text
YouTube
Spotify
TikTok
Instagram
Other
```

Platform decision:

```text
AnalyticsSnapshot uses a small provider-neutral platform list for manually entered metrics.
```

Uniqueness decision:

```text
The database enforces one AnalyticsSnapshot per Song + Platform + SnapshotDate.
```

The frontend also performs matching basic form validation for user experience, but backend validation remains the trusted source.

Current Calendar backend validation and read rules:

- `from` and `to` are optional `DateOnly` query filters.
- Filters are inclusive.
- `from` after `to` returns `400 Bad Request`.
- Entries are produced only when a source date exists.
- One ContentItem can produce up to three entries when due, scheduled, and published dates are present.
- Entries are ordered by date, Song title, event type, and source id.

Current Dashboard backend read rules:

- Uses `DateOnly.FromDateTime(DateTime.UtcNow)` as the server-side definition of today.
- Summary counts are derived at request time.
- Pipeline returns all canonical Song statuses in deterministic order.
- Upcoming work is bounded to 8 future Release/Content planning entries.
- Release readiness is bounded to 5 useful non-released Releases.
- Analytics overview is bounded to 5 latest Song/platform snapshots.
- Recent activity is bounded to 8 derived timestamp entries.

## Database / Migrations

Database:

```text
artist_os
```

PostgreSQL is expected locally on port `5432`.

Current database tables:

- `AnalyticsSnapshots`
- `AudioAssets`
- `ContentItems`
- `Credits`
- `ExternalFileReferences`
- `GoogleDriveConnections`
- `Releases`
- `ReleaseChecklistItems`
- `Songs`
- `Users`
- `VisualAssets`
- `__EFMigrationsHistory`

Applied migrations:

```text
20260828171115_InitialCreate
20260828180003_AddSongValidationConstraints
20260829071423_AddAudioAssetMetadata
20260829075405_AddVisualAssetMetadata
20260829130234_AddReleaseMetadata
20260829133738_AddContentItemMetadata
20260830055757_AddCreditMetadata
20260830061847_AddAnalyticsSnapshotMetadata
20260830104509_AddReleaseChecklistItems
20260830165052_AddUserAuthenticationFoundation
20260831103457_AddGoogleDriveConnectionFoundation
20260831115419_AddExternalFileReferenceFoundation
```

No migration was created for Calendar. The Calendar API is an aggregate read model over existing `Releases` and `ContentItems` columns.

No migration was created for Dashboard. The Dashboard API is an aggregate read model over existing source tables.

The `AddUserAuthenticationFoundation` migration created the `Users` table and added nullable `Songs.OwnerUserId` so existing Songs remain valid.

The `AddGoogleDriveConnectionFoundation` migration created the `GoogleDriveConnections` table for one user-owned Google Drive connection per Artist OS user.

The `AddExternalFileReferenceFoundation` migration created the `ExternalFileReferences` table for provider-neutral external folder/file metadata owned by an Artist OS user.

The `AddAssetFileUploadReferences` migration added nullable AudioAsset/VisualAsset links to `ExternalFileReferences` and added safe uploaded file metadata fields to `ExternalFileReferences`.

Current `Songs` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `Title` character varying(200), required.
- `Status` character varying(40), required.
- `CreatedAt` timestamp with time zone, required.
- `OwnerUserId` integer, optional, foreign key to `Users`.

Current `Users` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `Email` character varying(254), required.
- `NormalizedEmail` character varying(254), required, unique index.
- `PasswordHash` text, required.
- `DisplayName` character varying(120), optional.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `GoogleDriveConnections` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `UserId` integer, required, unique foreign key to `Users`.
- `GoogleSubject` character varying(255), required.
- `GoogleEmail` character varying(254), required.
- `GoogleEmailVerified` boolean, required.
- `ProtectedRefreshToken` text, optional.
- `GrantedScopes` character varying(500), required.
- `Status` character varying(40), required.
- `RootFolderId` character varying(255), optional.
- `ConnectedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.
- `LastSuccessfulRefreshAt` timestamp with time zone, optional.
- `RevokedAt` timestamp with time zone, optional.

Current `ExternalFileReferences` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `OwnerUserId` integer, required, foreign key to `Users`.
- `SongId` integer, optional, foreign key to `Songs`.
- `GoogleDriveConnectionId` integer, optional, foreign key to `GoogleDriveConnections`.
- `Provider` character varying(40), required.
- `ExternalId` character varying(255), required.
- `ResourceType` character varying(80), required.
- `IsFolder` boolean, required.
- `DisplayName` character varying(255), required.
- `MimeType` character varying(255), optional.
- `SizeBytes` bigint, optional.
- `WebViewLink` character varying(2048), optional.
- `LinkedResourceType` character varying(80), optional.
- `LinkedResourceId` integer, optional.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `AudioAssets` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `Type` character varying(40), required.
- `FileName` character varying(255), required.
- `Version` integer, required.
- `Status` character varying(40), required.
- `DurationSeconds` integer, optional.
- `FileSizeBytes` bigint, optional.
- `UploadedAt` timestamp with time zone, required.
- `IsCurrent` boolean, required.
- `ExternalFileReferenceId` integer, optional, foreign key to `ExternalFileReferences`.

Current `VisualAssets` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `Type` character varying(40), required.
- `FileName` character varying(255), required.
- `Version` integer, required.
- `Status` character varying(40), required.
- `Width` integer, optional.
- `Height` integer, optional.
- `FileSizeBytes` bigint, optional.
- `UploadedAt` timestamp with time zone, required.
- `IsCurrent` boolean, required.
- `ExternalFileReferenceId` integer, optional, foreign key to `ExternalFileReferences`.

Current `Releases` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `ReleaseDate` date, optional.
- `ReleaseType` character varying(40), required.
- `Distributor` character varying(120), optional.
- `Isrc` character varying(20), optional.
- `Upc` character varying(20), optional.
- `Status` character varying(40), required.
- `Platforms` character varying(255), required.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `ReleaseChecklistItems` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `ReleaseId` integer, required, foreign key to `Releases`.
- `Key` character varying(40), required.
- `Label` character varying(80), required.
- `IsCompleted` boolean, required.
- `CompletedAt` timestamp with time zone, optional.
- `Notes` character varying(1000), optional.
- `SortOrder` integer, required.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `ContentItems` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `Title` character varying(200), required.
- `Type` character varying(40), required.
- `Status` character varying(40), required.
- `Platform` character varying(40), optional.
- `OwnerName` character varying(120), optional.
- `DueDate` date, optional.
- `ScheduledAt` date, optional.
- `PublishedAt` date, optional.
- `Notes` character varying(1000), optional.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `Credits` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `ContributorName` character varying(160), required.
- `Role` character varying(40), required.
- `Contact` character varying(160), optional.
- `Status` character varying(40), required.
- `SplitPercentage` numeric, optional.
- `Notes` character varying(1000), optional.
- `CreatedAt` timestamp with time zone, required.
- `UpdatedAt` timestamp with time zone, required.

Current `AnalyticsSnapshots` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `Platform` character varying(40), required.
- `SnapshotDate` date, required.
- `Views` bigint, required.
- `Likes` bigint, required.
- `Comments` bigint, required.
- `WatchTimeMinutes` bigint, required.
- `SubscribersGained` bigint, required.
- `CreatedAt` timestamp with time zone, required.

Current Calendar persistence:

- No dedicated Calendar table.
- No standalone CalendarEvent entity.
- Reads `Releases.ReleaseDate`.
- Reads `ContentItems.DueDate`.
- Reads `ContentItems.ScheduledAt`.
- Reads `ContentItems.PublishedAt`.

Current Dashboard persistence:

- No dedicated Dashboard table.
- No cached KPI table.
- No ActivityLog or audit-history table.
- Reads existing Songs, Releases, ReleaseChecklistItems, ContentItems, Credits, AudioAssets, VisualAssets, and AnalyticsSnapshots.

Indexes:

- `IX_AudioAssets_SongId`
- `IX_AudioAssets_SongId_Type`
- `IX_Releases_SongId`, unique
- `IX_VisualAssets_SongId`
- `IX_VisualAssets_SongId_Type`
- `IX_ContentItems_SongId`
- `IX_ContentItems_SongId_ScheduledAt`
- `IX_ContentItems_SongId_Status`
- `IX_Credits_SongId`
- `IX_Credits_SongId_Role`
- `IX_Credits_SongId_Status`
- `IX_AnalyticsSnapshots_SongId`
- `IX_AnalyticsSnapshots_SongId_SnapshotDate`
- `IX_AnalyticsSnapshots_SongId_Platform_SnapshotDate`, unique
- `IX_ReleaseChecklistItems_ReleaseId`
- `IX_ReleaseChecklistItems_ReleaseId_Key`, unique
- `IX_ReleaseChecklistItems_ReleaseId_SortOrder`
- `IX_GoogleDriveConnections_UserId`, unique
- `IX_GoogleDriveConnections_UserId_GoogleSubject`

## Packages

Current backend packages:

- `Google.Apis.Auth` version `1.76.0`
- `Microsoft.AspNetCore.Authentication.JwtBearer` version `10.0.11`
- `Microsoft.AspNetCore.OpenApi` version `10.0.11`
- `Microsoft.EntityFrameworkCore.Design` version `10.0.11`
- `Npgsql.EntityFrameworkCore.PostgreSQL` version `10.0.3`

Current frontend foundation includes:

- React 19
- TypeScript
- Vite
- TanStack Router / Start
- TanStack Query
- Tailwind CSS
- Radix/shadcn-style UI primitives
- Lucide icons

Current CI foundation:

- Workflow file: `.github/workflows/ci.yml`
- Workflow name: `DARKROOM SYSTEM CI`
- Runs on pushes to `main`.
- Runs on pull requests targeting `main`.
- Backend and frontend jobs run independently on Ubuntu runners.
- Backend job uses .NET `10.0.x`.
- Frontend job uses Node `24.x`.
- Frontend dependency cache uses `darkroom-web/package-lock.json`.
- Frontend job runs `npm ci`, `npm run lint`, `npm run test`, and `npm run build`.
- No PostgreSQL database or database secrets are required.
- No deployment, artifact publishing, Docker image build, or production hosting is configured.
- First remote push run has been reported as successful.

Current backend test packages:

- `Microsoft.AspNetCore.Mvc.Testing` version `10.0.11`
- `Microsoft.EntityFrameworkCore.Sqlite` version `10.0.11`
- `Microsoft.NET.Test.Sdk` version `17.14.1`
- `coverlet.collector` version `6.0.4`
- `xunit` version `2.9.3`
- `xunit.runner.visualstudio` version `3.1.4`

Current frontend test packages:

- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

## Error Handling Status

Backend expected API errors:

- Invalid request body validation returns `400 Bad Request` through normal ASP.NET Core `[ApiController]` behavior.
- Missing song returns `404 Not Found`.
- Missing audio asset returns `404 Not Found`.
- Missing release, checklist, or checklist item returns `404 Not Found`.
- Calendar `from` after `to` returns `400 Bad Request`.
- Dashboard currently exposes no mutation routes, so there are no Dashboard-specific user input validation paths.

Frontend expected API behavior:

- Unreachable backend host triggers an explicit development fallback notice.
- Non-unreachable API errors show an error state and retry action.
- Mock-only areas are labeled as mock-only.
- Audio playback/waveform behavior is explicitly described as future work.
- Calendar standalone events, reminders, drag/drop rescheduling, and external calendar sync are described as future work.
- Dashboard external analytics sync, notifications, audit history, and automatic readiness are described as future work.
- Browser requests from `http://localhost:8080` to `http://localhost:5178` are allowed in Development by the backend CORS policy.
- Protected backend endpoints return `401 Unauthorized` when no authenticated session exists.
- Missing, unowned, cross-user, and legacy-unowned Song-scoped resources return `404 Not Found`.
- Dashboard and Calendar aggregates are filtered to the current authenticated user.
- Expired, missing, malformed, or invalid JWT access tokens return `401 Unauthorized`.

No custom global backend exception handling has been added yet.

## Tests / Build Status

Automated tests:

- Backend test project exists at `tests/ArtistOS.Api.Tests/`.
- Backend tests use xUnit with `WebApplicationFactory<Program>`.
- Backend tests use an isolated SQLite in-memory EF Core database.
- Backend tests do not connect to or wipe the local PostgreSQL `artist_os` database.
- Frontend test script exists at `npm run test`.
- Frontend watch test script exists at `npm run test:watch`.
- Frontend tests use Vitest with jsdom and a shared setup file.
- Frontend component tests use a fresh TanStack Query `QueryClient` per render with retries disabled.
- Frontend tests mock API services such as `authApi`, `dashboardApi`, and `songsApi` instead of depending on ASP.NET, PostgreSQL, localhost, or network availability.
- Frontend automated test foundation currently has 32 focused tests.
- Auth API behavior has automated integration-style coverage for registration, duplicate email, login, invalid credentials, current JWT, logout semantics, password hash safety, malformed tokens, expired tokens, and unauthenticated access.
- Song owner assignment has automated integration-style coverage for authenticated creates and spoofed owner rejection.
- Resource ownership has automated integration-style coverage for unauthenticated `401`, cross-user `404`, nested Song resource scoping, Calendar/Dashboard scoping, and legacy unowned Song invisibility.
- Song API behavior has both automated test coverage and earlier pragmatic manual HTTP verification.
- AudioAsset API behavior has both automated test coverage and earlier pragmatic manual HTTP/browser verification.
- VisualAsset API behavior has both automated test coverage and pragmatic manual HTTP/browser verification.
- Release API behavior has both automated test coverage and pragmatic manual HTTP/browser verification.
- ReleaseChecklist API behavior has both automated test coverage and pragmatic browser verification.
- ContentItem API behavior has both automated test coverage and pragmatic browser verification.
- Credit API behavior has both automated test coverage and pragmatic browser verification.
- AnalyticsSnapshot API behavior has both automated test coverage and pragmatic browser verification.
- Calendar aggregate API behavior has both automated test coverage and pragmatic browser verification.
- Dashboard aggregate API behavior has both automated test coverage and pragmatic browser verification.
- Authentication/session behavior has both automated test coverage and pragmatic browser verification.
- Google Drive connection behavior has automated backend coverage for unauthenticated access, disconnected status, protected state, callback success, invalid/expired state, denied OAuth, user isolation, safe status responses, protected refresh-token persistence, reconnect refresh-token preservation, and disconnect behavior.
- Google Drive workspace behavior has automated backend coverage for unauthenticated access, owned Song provisioning, cross-user `404`, missing Google connection, `ReauthRequired` connection, root provisioning, idempotent repeated provisioning, Song folder creation, persisted external reference reuse, deleted root recovery, deleted Song folder recovery, connection ownership isolation, refresh failure reauth marking, and no-token API responses.
- Google Drive Settings behavior has automated frontend coverage for disconnected, connected, reconnect-needed, connect navigation, disconnect mutation, API error, and no-token-rendering states.

Verification run during the latest Cookie Auth -> JWT Bearer Auth Migration milestone:

```text
npm ci
npm run lint
npm run test
npm run build
dotnet build
dotnet test
dotnet ef migrations list
Browser two-user ownership check
```

Results:

```text
npm ci: succeeded, 0 vulnerabilities.
npm run lint: completed with 0 errors and 8 warnings.
npm run test: succeeded, 26 passed, 0 failed, 0 skipped.
npm run build: succeeded.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 202 passed, 0 failed, 0 skipped.
dotnet ef migrations list: succeeded; AddUserAuthenticationFoundation is listed as applied and no new JWT migration was created.
Browser two-user ownership check: completed with a named Playwright CLI session. Verified User A and User B receive different JWTs, `/auth/me` succeeds with valid Bearer tokens, each user can see only their own Song data, Dashboard and Calendar are scoped per user, cross-user Song and nested audio access return `404 Not Found`, missing/invalid tokens return `401 Unauthorized`, logout clears the frontend token, and refresh restores the app from the valid `sessionStorage` token.
```

Verification run during the Google Drive Discovery Architecture Report milestone:

```text
dotnet build
dotnet test
git status --short ArtistOS.Api/Migrations
Google/OAuth/Drive runtime-code and credential scan
```

Results:

```text
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 202 passed, 0 failed, 0 skipped.
No EF migration was created for this documentation-only milestone.
No Google OAuth or Drive runtime code was added.
No Google credentials were added.
JWT auth runtime code was unchanged.
Frontend tests were not run because no frontend files changed.
```

Verification run during the Google Drive Connection Foundation milestone:

```text
npm ci
npm run lint
npm run test
npm run build
dotnet build
dotnet test
dotnet ef database update
dotnet ef migrations list
Security scan for Google credential/token leakage
```

Results:

```text
npm ci: succeeded, 0 vulnerabilities.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test: succeeded, 32 passed, 0 failed, 0 skipped.
npm run build: succeeded.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 215 passed, 0 failed, 0 skipped.
dotnet ef database update: succeeded; AddGoogleDriveConnectionFoundation was applied.
dotnet ef migrations list: succeeded; AddGoogleDriveConnectionFoundation is listed.
Security scan found no real Google secrets. Google token references are expected code/test/doc symbols only.
Real Google OAuth browser verification is blocked until Google Cloud OAuth credentials are configured in User Secrets.
```

Verification run during the Google Drive Folder Provisioning + External File Reference Foundation milestone:

```text
dotnet build -c Release /p:UseAppHost=false
dotnet test -c Release /p:UseAppHost=false
dotnet ef database update --configuration Release
npm ci
npm install
npm run lint
npm run test
npm run build
```

Results:

```text
dotnet build -c Release /p:UseAppHost=false: succeeded, 0 warnings, 0 errors.
dotnet test -c Release /p:UseAppHost=false: succeeded, 230 passed, 0 failed, 0 skipped.
dotnet ef database update --configuration Release: succeeded; AddExternalFileReferenceFoundation was applied.
npm ci: blocked by a Windows EPERM file lock on native frontend dependency binaries.
npm install: succeeded, 0 vulnerabilities; Windows reported cleanup locks on native temp dependency folders.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test: succeeded, 32 passed, 0 failed, 0 skipped.
npm run build: succeeded.
Real Google Drive folder verification was not performed in this automated run; it requires manually retrying against the local authenticated browser session with the new backend code running.
```

Verification run during the Google Drive Media Upload MVP milestone:

```text
dotnet build
dotnet build -c Release /p:UseAppHost=false
dotnet test -c Release /p:UseAppHost=false
dotnet ef database update --configuration Release
dotnet ef migrations list --configuration Release
npm ci
npm install
npm run lint
npm run test
npm run build
Sensitive-string scan for token/code/secret/session URI patterns
```

Results:

```text
dotnet build: blocked by running local ArtistOS.Api process 6224 locking Debug ArtistOS.Api.exe.
dotnet build -c Release /p:UseAppHost=false: succeeded, 0 warnings, 0 errors.
dotnet test -c Release /p:UseAppHost=false: succeeded, 247 passed, 0 failed, 0 skipped.
dotnet ef database update --configuration Release: succeeded; AddAssetFileUploadReferences was applied.
dotnet ef migrations list --configuration Release: succeeded; AddAssetFileUploadReferences is listed as applied.
npm ci: blocked by a Windows EPERM file lock on lightningcss native dependency binary.
npm install: succeeded, 0 vulnerabilities.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test: succeeded, 35 passed, 0 failed, 0 skipped.
npm run build: succeeded.
Sensitive-string scan found expected docs/code field names and fake test tokens only; no real Google credential pattern was found in source/docs.
Real Google Drive upload browser verification was not performed in this automated run; it requires an authenticated local browser session, connected Google account, and a small user-selected test file.
```

Automated frontend coverage now includes:

- StatusBadge canonical Song label rendering and fallback status rendering.
- Canonical Song status order and lifecycle order.
- Dashboard aggregate success rendering for summary, pipeline, upcoming work, release readiness, analytics overview, and recent activity.
- Dashboard empty-state rendering for zero summary values and empty aggregate sections.
- Dashboard loading state.
- Dashboard error state and retry behavior.
- Dashboard navigation links back to the Song workspace.
- Songs list rendering for returned Songs, titles, and statuses.
- Songs empty state.
- Songs error state and retry action.
- Create Song dialog interaction and request payload construction.
- Login success flow.
- Login invalid-credentials error state.
- Registration request flow.
- Protected app shell rendering after authenticated `/api/auth/me`.
- Protected route redirect when `/api/auth/me` returns `401`.
- Global unauthorized API event redirects the app shell back to `/login`.
- Logout action.
- JWT login response storage in `sessionStorage`.
- Shared API client Bearer header attachment.
- Shared API client multipart upload request behavior without forcing JSON content type.
- Stored-token session restore through backend `/api/auth/me`.
- Invalid-token clearing on `401`.
- Frontend token clearing during logout.
- Audio asset metadata-only upload action.
- Audio upload service call with selected browser `File`.
- Linked Drive file display with provider, size, and Open in Drive link.
- Upload backend failure display.
- Linked-file UI does not render Google token material.

Automated backend coverage now includes:

- Song create/read/list/update/delete success paths.
- Song `400 Bad Request` validation paths.
- Song `404 Not Found` missing-resource paths.
- AudioAsset metadata create/read/list/update/delete success paths.
- AudioAsset `400 Bad Request` validation paths.
- AudioAsset `404 Not Found` missing Song and missing AudioAsset paths.
- Song-to-AudioAsset relationship behavior, including many AudioAssets per Song and deleting AudioAsset metadata without deleting the parent Song.
- VisualAsset metadata create/read/list/update/delete success paths.
- VisualAsset `400 Bad Request` validation paths.
- VisualAsset `404 Not Found` missing Song and missing VisualAsset paths.
- Song-to-VisualAsset relationship behavior, including many VisualAssets per Song and deleting VisualAsset metadata without deleting the parent Song.
- Audio/Visual upload authentication, ownership, and cross-Song asset scoping.
- Audio/Visual upload validation for empty, unsupported, and oversized files.
- Audio upload uses the provisioned Drive `Audio` folder and persists an `AudioAssetFile` external reference.
- Visual upload uses the provisioned Drive `Visuals` folder and persists a `VisualAssetFile` external reference.
- Successful upload synchronizes cached asset filename, file size, and uploaded timestamp.
- Re-upload to an already-linked asset returns `409 Conflict`.
- Missing Google connection and `ReauthRequired` connection return conflict responses.
- Google access-token refresh failure marks the connection `ReauthRequired`.
- Drive upload failure does not create a successful external reference or asset association.
- Database persistence failure after Drive success attempts best-effort Drive file cleanup.
- Upload responses do not return Google token material.
- Metadata-only assets without external file references continue to read successfully.
- Release metadata create/read/update/delete success paths.
- Release `400 Bad Request` validation paths.
- Release `404 Not Found` missing Song and missing Release paths.
- Release duplicate creation returns `409 Conflict`.
- Release server-controlled `CreatedAt` and `UpdatedAt` behavior.
- Song-to-Release relationship behavior, including one Release per Song and deleting Release metadata without deleting the parent Song.
- ReleaseChecklist default initialization when a Release is created.
- ReleaseChecklist list ordering by `SortOrder`.
- ReleaseChecklist `404 Not Found` missing Song, missing Release, and missing item paths.
- ReleaseChecklist item update paths for complete/incomplete state.
- ReleaseChecklist server-controlled `CompletedAt`, `CreatedAt`, and `UpdatedAt` behavior.
- ReleaseChecklist notes validation and trimming.
- Release-to-ReleaseChecklist relationship behavior, including deleting checklist metadata with the parent Release/Song relationship intact.
- ContentItem metadata create/read/list/update/delete success paths.
- ContentItem `400 Bad Request` validation paths.
- ContentItem `404 Not Found` missing Song and missing ContentItem paths.
- ContentItem server-controlled `CreatedAt` and `UpdatedAt` behavior.
- Song-to-ContentItem relationship behavior, including many ContentItems per Song and deleting ContentItem metadata without deleting the parent Song.
- Credit metadata create/read/list/update/delete success paths.
- Credit `400 Bad Request` validation paths.
- Credit `404 Not Found` missing Song and missing Credit paths.
- Credit server-controlled `CreatedAt` and `UpdatedAt` behavior.
- Credit split percentage bounds.
- Song-to-Credit relationship behavior, including many Credits per Song, the same contributor with multiple roles, and deleting Credit metadata without deleting the parent Song.
- AnalyticsSnapshot metadata create/read/list/update/delete success paths.
- AnalyticsSnapshot `400 Bad Request` validation paths.
- AnalyticsSnapshot `404 Not Found` missing Song and missing AnalyticsSnapshot paths.
- AnalyticsSnapshot duplicate `SongId + Platform + SnapshotDate` behavior returning `409 Conflict`.
- AnalyticsSnapshot server-controlled `CreatedAt` behavior.
- AnalyticsSnapshot list ordering by measurement date.
- Song-to-AnalyticsSnapshot relationship behavior, including many snapshots across dates/platforms and deleting AnalyticsSnapshot metadata without deleting the parent Song.
- Calendar empty state.
- Calendar ReleaseDate aggregation.
- Calendar ContentItem due, scheduled, and published aggregation.
- Calendar multiple entries from one ContentItem.
- Calendar Song id, Song title, status, platform, and navigation target response data.
- Calendar inclusive filtering and one-sided filtering.
- Calendar invalid `from`/`to` range returns `400 Bad Request`.
- Calendar deterministic ordering.
- Calendar reflects ReleaseDate and ContentItem date updates.
- Calendar entries disappear after Release, ContentItem, or parent Song deletion.
- Dashboard empty database response.
- Dashboard summary count definitions.
- Dashboard canonical pipeline ordering and zero-count statuses.
- Dashboard upcoming ReleaseDate, Content DueDate, and Content ScheduledAt aggregation.
- Dashboard upcoming past-event exclusion, chronological ordering, and result bounding.
- Dashboard ReleaseChecklist readiness derivation for `0 / 7`, `4 / 7`, and `7 / 7`.
- Dashboard checklist changes reflected immediately.
- Dashboard latest AnalyticsSnapshot per Song and platform selection.
- Dashboard analytics result bounding.
- Dashboard conservative recent activity derivation.
- Dashboard source update/delete behavior with no separately persisted Dashboard state.

Previous frontend verification during the latest AudioAsset metadata milestone:

```text
npm run build: succeeded.
npm run lint: completed with 0 errors and 8 warnings.
```

The frontend build generated the TanStack route tree successfully.

The frontend build also emitted existing Vite/Nitro advisory warnings. They did not fail the build.

Previous Playwright route and real API checks confirmed:

- `/` redirects to `/dashboard`.
- `/dashboard` renders.
- `/login` renders as a standalone login shell.
- `/songs` renders.
- `/songs/$songId` renders the song workspace and requested tabs.
- `/calendar` renders.
- `/team` renders.
- `/settings` renders.
- Mobile shell renders and the navigation drawer opens.
- Browser `GET /api/songs` from `http://localhost:8080` returned `200 OK`.
- No CORS errors appeared in the browser console.
- No fallback notice appeared while the backend was running.
- A Song was created from the frontend and persisted through the real API.
- The created Song appeared in the PostgreSQL-backed list.
- The Song was edited from the frontend.
- `PUT /api/songs/{id}` returned `204 No Content` and the frontend refetched correctly.
- `CreatedAt` remained server-controlled and unchanged during edit.
- The Song workspace loaded the real Song by id.
- Frontend validation surfaced a required-title message before sending an invalid create request.
- The Song was deleted from the frontend.
- The deleted Song remained gone after refresh and `GET /api/songs/{id}` returned `404`.
- Calendar now renders real backend aggregate data from Release and ContentItem dates.

Latest manual AudioAsset API checks confirmed:

- Temporary Song could be created when the database had no existing Songs.
- `POST /api/songs/{songId}/audio-assets` returned `201 Created`.
- `Type`, `FileName`, and `Status` were trimmed/normalized correctly.
- `GET /api/songs/{songId}/audio-assets` returned `200 OK`.
- `GET /api/songs/{songId}/audio-assets/{audioAssetId}` returned `200 OK`.
- `PUT /api/songs/{songId}/audio-assets/{audioAssetId}` returned `204 No Content`.
- `UploadedAt` remained server-controlled during update.
- Invalid AudioAsset `Type` returned `400 Bad Request`.
- Invalid AudioAsset `Status` returned `400 Bad Request`.
- Missing Song returned `404 Not Found`.
- Missing AudioAsset returned `404 Not Found`.
- `DELETE /api/songs/{songId}/audio-assets/{audioAssetId}` returned `204 No Content`.
- Deleted AudioAsset returned `404 Not Found`.
- Temporary verification Song was deleted after verification.
- Song count was preserved after cleanup.

Latest Playwright browser checks confirmed:

- A temporary Song was created through the frontend.
- Song workspace loaded at `/songs/{songId}`.
- Audio tab loaded real metadata from the backend.
- Audio tab showed real metadata labels instead of mock-only labels.
- Add asset dialog saved metadata only and did not imply file upload.
- Created metadata rendered under the correct type section.
- Page refresh preserved the created AudioAsset metadata.
- Edit dialog updated file name, type, version, status, duration, size, and current flag.
- Updated metadata moved from Mix to Master after changing type.
- Delete confirmation stated that only metadata is removed.
- Deleted metadata disappeared from the Audio tab.
- Browser console showed no CORS/API errors during verification.

Latest browser VisualAsset checks confirmed:

- Song workspace loaded at `/songs/{songId}`.
- Visuals tab loaded real metadata from the backend.
- Visuals tab showed real metadata labels instead of mock-only labels.
- Add asset dialog saved metadata only and did not imply file upload.
- Created metadata rendered under the correct type section.
- Page refresh preserved the created VisualAsset metadata.
- Edit dialog updated file name, type, status, dimensions, size, and current flag.
- Updated metadata moved from Cover Art to Music Video after changing type.
- Delete confirmation stated that only metadata is removed.
- Deleted metadata disappeared from the Visuals tab.
- Placeholder visual frames remained clearly placeholder.
- Browser verification reported no CORS/API errors.

Latest browser Release checks confirmed:

- Song workspace loaded at `/songs/{songId}`.
- Release tab loaded real metadata from the backend.
- Empty state appeared when a Song had no Release.
- Release plan was created through the frontend.
- Standard checklist items were initialized when the Release plan was created.
- Release checklist loaded real persisted metadata from the backend.
- The checklist displayed Master, Cover, Metadata, Credits, Canvas, Music Video, and Content Plan.
- Checking an item persisted immediately.
- Page refresh preserved checked checklist state.
- Checking multiple items updated derived progress from `0 / 7 COMPLETE` to `4 / 7 COMPLETE`.
- Unchecking an item cleared its server-controlled `CompletedAt` timestamp.
- Completed items retained server-controlled `CompletedAt` timestamps.
- Checklist progress is derived in the frontend and not stored as a separate percentage.
- Page refresh preserved the created Release metadata.
- Release plan was edited through the frontend.
- Updated release date, distributor, identifiers, status, and platforms persisted.
- `CreatedAt` remained server-controlled and `UpdatedAt` changed after update.
- Delete confirmation stated that only release metadata is removed.
- Deleted Release metadata disappeared from the Release tab.
- The parent Song still existed after deleting Release metadata.
- Release checklist UI did not imply external publishing or distributor delivery.
- Browser verification reported no CORS/API errors during the completed verification flow.

Latest browser ContentItem checks confirmed:

- Song workspace loaded at `/songs/{songId}`.
- Content tab loaded real metadata from the backend.
- Empty state appeared when a Song had no ContentItems.
- Content item metadata was created through the frontend.
- Page refresh preserved the created ContentItem metadata.
- Content item metadata was edited through the frontend.
- Updated title, status, platform, owner, dates, and notes persisted.
- Delete confirmation stated that only planning metadata is removed.
- Deleted ContentItem metadata disappeared from the Content tab.
- The parent Song still existed after deleting ContentItem metadata.
- Content UI remained clear that Published status is metadata only and does not post to a platform.
- Calendar route now reads real backend aggregate data.

Latest browser Credit checks confirmed:

- Song workspace loaded at `/songs/{songId}`.
- Credits tab loaded real metadata from the backend.
- Empty state appeared when a Song had no Credits.
- Credit metadata was created through the frontend.
- Page refresh preserved the created Credit metadata.
- Credit metadata was edited through the frontend.
- Updated contributor name, role, contact, status, planned split, and notes persisted.
- Multiple Credit records were added for the same Song.
- The same contributor can appear with more than one role.
- Delete confirmation stated that only the credit record is removed.
- Deleted Credit metadata disappeared from the Credits tab.
- The parent Song still existed after deleting Credit metadata.
- Credits UI remained clear that planned splits do not create payment, royalty, legal, or team-account workflows.

Latest browser AnalyticsSnapshot checks confirmed:

- Song workspace loaded at `/songs/{songId}`.
- Analytics tab loaded real snapshot metadata from the backend.
- Empty state appeared when a Song had no AnalyticsSnapshots.
- Manual analytics snapshot metadata was created through the frontend.
- Page refresh preserved the created AnalyticsSnapshot metadata.
- A second AnalyticsSnapshot produced a real views-over-time trend.
- AnalyticsSnapshot metadata was edited through the frontend.
- Updated view count persisted.
- Delete confirmation stated that only DARKROOM SYSTEM analytics metadata is removed and no external platform is affected.
- Deleted AnalyticsSnapshot metadata disappeared from the Analytics tab.
- The parent Song still existed after deleting AnalyticsSnapshot metadata.
- Temporary verification Song was deleted after verification.
- Analytics UI remained clear that values are manually recorded metadata and not synced external analytics.

Latest browser Calendar checks confirmed:

- Calendar route loaded real backend aggregate data from `/api/calendar`.
- Month view requested inclusive visible month ranges.
- Empty state appeared when no Release or ContentItem dates existed for the visible month.
- A ReleaseDate entry appeared on the correct date.
- ContentItem DueDate, ScheduledAt, and PublishedAt entries appeared on the correct dates.
- Updating ReleaseDate moved the Calendar entry to the new month/date.
- Updating ContentItem dates moved/removed the corresponding Calendar entries.
- Deleting a ContentItem removed its Calendar entry.
- Clicking a Calendar entry opened the source Song workspace.
- Refreshing Calendar preserved persisted Release entries.
- Browser console showed no CORS/API errors during verification.
- Calendar UI did not imply Google Calendar sync, automatic publishing, or external platform delivery.

Latest browser Dashboard checks confirmed:

- Dashboard route loaded real backend aggregate data from `/api/dashboard`.
- Dashboard summary cards reflected persisted Song, Release, and ContentItem source data.
- Song lifecycle pipeline reflected canonical Song status counts.
- Upcoming work showed future ReleaseDate, Content DueDate, and Content ScheduledAt rows.
- Release readiness showed derived `4 / 7` checklist progress and `57%`.
- Analytics overview showed the latest stored AnalyticsSnapshot for the Song/platform instead of summing older snapshots.
- Recent activity showed conservative timestamp-derived activity without fake users or external sync claims.
- Clicking a Dashboard readiness row opened the source Song workspace.
- Updating a Release to `Released` removed it from upcoming release/readiness aggregates.
- Deleting a ContentItem removed its Dashboard upcoming entries.
- Refreshing Dashboard preserved the persisted aggregate state.
- Browser console showed no CORS/API errors during verification.
- Dashboard UI did not imply live analytics, platform sync, Google Drive, publishing, notifications, or audit history.

## Security / Secrets Status

- `appsettings.json` does not currently contain the local database password.
- The README shows a placeholder `YOUR_PASSWORD` value for setup.
- `darkroom-web/.env.example` contains no secrets.
- User passwords are hashed with ASP.NET Core Identity's `PasswordHasher<TUser>`.
- Auth responses expose `Id`, `Email`, and `DisplayName`; they do not expose plaintext passwords or password hashes.
- Auth responses include short-lived JWT access tokens for login/register only.
- Browser authentication state uses `sessionStorage`, not an HttpOnly cookie.
- JWT access tokens use `sub` for stable `User.Id`, plus email and a token id.
- JWT validation checks issuer, audience, lifetime, signature, and signing key.
- The JWT signing key is not stored in tracked appsettings files and should be configured through .NET User Secrets or environment variables.
- Google OAuth client id and client secret are not stored in tracked appsettings files and should be configured through .NET User Secrets or environment variables.
- Google refresh tokens are protected with ASP.NET Core Data Protection before persistence in `GoogleDriveConnections.ProtectedRefreshToken`.
- Google access tokens and refresh tokens are not returned to the React frontend.
- Google Drive API access tokens are refreshed on demand backend-side from the protected refresh token and are not persisted or returned to the frontend.
- Drive workspace API responses return safe folder metadata only.
- Drive upload API responses return safe asset and external reference metadata only; Google token material is not returned.
- Resumable upload session URIs are not logged or returned.
- Google OAuth state is protected and expiring, and callback handling does not depend on the browser supplying an Artist OS Bearer header.
- Production deployment must configure persistent/shared Data Protection keys appropriate to the hosting topology.
- Frontend route protection is implemented for the app shell.
- Backend resource authorization is enforced across existing Song workspace APIs, Calendar, and Dashboard.
- `OwnerUserId` is the current backend security boundary for normal user data access.
- Legacy unowned Songs remain invisible to normal authenticated users until a future ownership/backfill decision is made.
- Latest secret scan found only the expected `YOUR_PASSWORD` placeholder in README setup instructions.

## Git Status Notes

Current AudioAsset, VisualAsset, Release, ReleaseChecklist, ContentItem, Credit, AnalyticsSnapshot, Calendar aggregate, Dashboard aggregate, Frontend Test Foundation, Authentication / User Ownership Foundation, Backend Resource Ownership Enforcement, and Cookie Auth -> JWT Bearer Auth Migration work is uncommitted.

The frontend build generated route/output artifacts as expected. Build output remains ignored.

Remote GitHub Actions status:

- First remote push run for DARKROOM SYSTEM CI has been reported as successful.

## Known Technical Debt

- `Status` values are enforced in DTO validation but still stored as a string; this is acceptable for the current stage.
- AudioAsset `Type` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- VisualAsset `Type` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- Release `ReleaseType`, `Status`, and `Platforms` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- ReleaseChecklist `Key` values are server-defined strings for the fixed checklist; this is acceptable while custom checklist items are intentionally out of scope.
- ContentItem `Type`, `Status`, and `Platform` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- Credit `Role` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- AnalyticsSnapshot `Platform` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- Existing pre-auth Songs have nullable `OwnerUserId`, remain unowned, and are invisible to normal authenticated users until a future ownership/backfill decision is made.
- JWT access tokens are stored in `sessionStorage`, which is JavaScript-accessible; future production hardening must account for XSS risk.
- Logout does not server-revoke already-issued stateless JWT access tokens.
- Password reset, email verification, account management, refresh-token/session rotation, revocation, and rate limiting are not implemented yet.
- The API does not yet enforce only one current AudioAsset per Song + Type.
- The API does not yet enforce only one current VisualAsset per Song + Type.
- Current upload limits are MVP/development application limits only; production hosting and reverse proxies will need matching request-size configuration.
- Drive upload and PostgreSQL persistence are not one atomic transaction; the backend attempts best-effort Drive cleanup if persistence fails after upload succeeds.
- Deleting AudioAsset or VisualAsset metadata does not automatically delete linked external Drive binaries.
- Replacing an already-linked asset file is intentionally blocked until a version/replace workflow exists.
- Release platforms are stored as a comma-separated string; a normalized platform table may become useful when real integrations exist.
- ContentItem platform is stored as a string; richer channel/account modeling can wait until platform integrations exist.
- Credit contributors are plain Song-scoped metadata strings; a normalized contributor directory can wait until team/auth requirements exist.
- Planned split percentages are stored independently per Credit and are not validated to total `100` across a Song.
- Analytics snapshots are manually entered metadata and are not ingested from external platform APIs.
- Release checklist items are not automatically completed from AudioAsset, VisualAsset, Credit, or ContentItem records yet.
- Calendar is read-only and currently aggregates only Release and ContentItem dates.
- Calendar does not yet support standalone sessions, reminders, external sync, or drag/drop rescheduling.
- Dashboard is read-only and derives recent activity only from current source timestamps, not from an audit log.
- Dashboard does not yet support notifications, saved filters, or user-specific/team-specific views.
- Backend integration tests use SQLite in-memory, so they do not cover PostgreSQL-provider-specific behavior.
- Frontend automated tests are intentionally focused and do not yet cover the entire app, all routes, all workspace tabs, or visual regression.
- `npm run lint` still reports fast-refresh warnings from helper exports and existing UI primitive patterns.

## Not Yet Implemented

- Team collaboration or permissions.
- Password reset, email verification, social login, MFA, account management, and production session hardening.
- Google Drive download, Drive browsing, Picker, synchronization, external file deletion, and replace/version workflow.
- YouTube integration and automated analytics ingestion.
- Audio playback and waveform processing.
- Visual preview/thumbnail generation and playback.
- Automatic Release checklist completion based on asset/content/credit metadata.
- Distributor delivery or publishing workflow.
- Content publishing and platform delivery.
- Standalone calendar events, reminders, drag/drop rescheduling, and external calendar sync.
- Dashboard notifications, saved filters, user-specific/team-specific views, and audit history.
- Contributor directory, contracts, royalties, payment workflow, and authenticated team permissions.
- Production deployment.

## Google Drive Compatibility

JWT authentication remains separate from Google OAuth.

Expected future shape:

```text
JWT authenticated DARKROOM user
  -> User.Id
  -> owned Songs
  -> GoogleDriveConnection
  -> backend-managed Google Drive OAuth tokens
```

Google OAuth tokens are backend-managed and must not be exposed to the React frontend or embedded into Artist OS JWT access tokens.

## Recommended Next Milestone

Start the asset replace/version workflow planning milestone only after approval.

Suggested scope:

- Decide whether replacing a linked file creates a new `ExternalFileReference` version or a separate asset record.
- Add explicit user action for replacing/deleting external Drive files.
- Keep browser Drive Picker, arbitrary browsing, playback, waveform, thumbnails, YouTube, and publishing out of the milestone.
- Do not change Song behavior.
