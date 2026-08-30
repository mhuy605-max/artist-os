# Artist OS Current State

Last updated: 2026-08-30

## Current Phase

Analytics Snapshot Foundation.

Current focus: Analytics snapshot metadata is now PostgreSQL-backed and connected to the Song workspace Analytics tab. Metrics are manually entered metadata snapshots only. YouTube ingestion, platform OAuth, automated sync, authentication, and external analytics integrations remain future work.

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
- Release preparation checklist remains planned/mock-only and is clearly labeled in the frontend.
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
SongsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AudioAssetsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
VisualAssetsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
ReleasesController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
ContentItemsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
CreditsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AnalyticsSnapshotsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
```

No backend repository or service layer has been introduced yet. This is intentional because current Song, AudioAsset metadata, VisualAsset metadata, Release metadata, ContentItem metadata, Credit metadata, and AnalyticsSnapshot metadata CRUD/validation do not contain enough business logic to justify those abstractions.

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
```

Current frontend architecture:

```text
TanStack Router routes
  -> DARKROOM SYSTEM app shell/pages
  -> TanStack Query
  -> isolated Song, AudioAsset, VisualAsset, Release, ContentItem, Credit, and AnalyticsSnapshot API services
  -> ASP.NET Core API
```

Future workspace areas use centralized mock modules under `darkroom-web/src/services/mock/`. They are visually present for architecture and navigation, but they are not backend-backed yet.

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

Current frontend API base URL behavior:

- `VITE_API_BASE_URL` controls the backend URL.
- Default frontend fallback value is `http://localhost:5178`.
- `darkroom-web/.env.example` documents `VITE_API_BASE_URL=http://localhost:5178`.
- `PUT /api/songs/{id}` is handled as `204 No Content`; the client refetches the song afterward.
- `PUT /api/songs/{songId}/audio-assets/{audioAssetId}` is handled as `204 No Content`; the client refetches the audio asset afterward.
- `PUT /api/songs/{songId}/visual-assets/{visualAssetId}` is handled as `204 No Content`; the client refetches the visual asset afterward.
- `PUT /api/songs/{songId}/release` is handled as `204 No Content`; the client refetches the release afterward.
- `PUT /api/songs/{songId}/content-items/{contentItemId}` is handled as `204 No Content`; the client refetches the content item afterward.
- `PUT /api/songs/{songId}/credits/{creditId}` is handled as `204 No Content`; the client refetches the credit afterward.
- `PUT /api/songs/{songId}/analytics/{analyticsSnapshotId}` is handled as `204 No Content`; the client refetches the analytics snapshot afterward.

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

- Dashboard metadata beyond base Song records.
- Audio waveform display, file upload, playback, and external file association.
- Visual thumbnails, file upload, previews, playback, and external file association.
- Release preparation checklist.
- Content publishing and platform delivery.
- Contributor directory, team permissions, contracts, royalties, and payout workflow.
- External analytics ingestion and automated platform sync.
- Calendar.
- Team.
- Settings.
- Login/authentication.

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
}
```

Relationship:

```text
Song 1 -> 0 or 1 Release
```

Release is metadata-only. No distributor API delivery, publishing action, or external platform integration exists yet.

Release platforms are stored as a single normalized comma-separated string in PostgreSQL and returned as a string array through the API. This keeps the first release-planning milestone understandable without introducing platform join tables before real platform integrations exist.

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
- `CreateContentItemRequest`
- `UpdateContentItemRequest`
- `ContentItemResponse`
- `CreateCreditRequest`
- `UpdateCreditRequest`
- `CreditResponse`
- `CreateAnalyticsSnapshotRequest`
- `UpdateAnalyticsSnapshotRequest`
- `AnalyticsSnapshotResponse`

DTOs are used because they solve current API contract problems:

- prevent clients from setting `Id`
- prevent clients from setting or changing `CreatedAt`
- provide focused request validation
- keep response shape explicit
- keep one-to-one Release metadata separate from the `Song` persistence model
- keep ContentItem planning metadata separate from future platform publishing behavior
- keep Credit contributor metadata separate from future user/team/payment/legal systems
- keep AnalyticsSnapshot metadata separate from future external analytics ingestion behavior

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
- `Releases`
- `Songs`
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
```

Current `Songs` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `Title` character varying(200), required.
- `Status` character varying(40), required.
- `CreatedAt` timestamp with time zone, required.

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

## Packages

Current backend packages:

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

## Error Handling Status

Backend expected API errors:

- Invalid request body validation returns `400 Bad Request` through normal ASP.NET Core `[ApiController]` behavior.
- Missing song returns `404 Not Found`.
- Missing audio asset returns `404 Not Found`.

Frontend expected API behavior:

- Unreachable backend host triggers an explicit development fallback notice.
- Non-unreachable API errors show an error state and retry action.
- Mock-only areas are labeled as mock-only.
- Audio file upload/playback/waveform behavior is explicitly described as future work.
- Browser requests from `http://localhost:8080` to `http://localhost:5178` are allowed in Development by the backend CORS policy.

No custom global backend exception handling has been added yet.

## Tests / Build Status

Automated tests:

- Backend test project exists at `tests/ArtistOS.Api.Tests/`.
- Backend tests use xUnit with `WebApplicationFactory<Program>`.
- Backend tests use an isolated SQLite in-memory EF Core database.
- Backend tests do not connect to or wipe the local PostgreSQL `artist_os` database.
- No frontend test script exists yet.
- Song API behavior has both automated test coverage and earlier pragmatic manual HTTP verification.
- AudioAsset API behavior has both automated test coverage and earlier pragmatic manual HTTP/browser verification.
- VisualAsset API behavior has both automated test coverage and pragmatic manual HTTP/browser verification.
- Release API behavior has both automated test coverage and pragmatic manual HTTP/browser verification.
- ContentItem API behavior has both automated test coverage and pragmatic browser verification.
- Credit API behavior has both automated test coverage and pragmatic browser verification.
- AnalyticsSnapshot API behavior has both automated test coverage and pragmatic browser verification.

Verification run during the latest Analytics snapshot milestone:

```text
dotnet build
dotnet test
dotnet ef database update
dotnet ef migrations list
npm ci
npm run lint
npm run build
Browser verification
```

Results:

```text
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 136 passed, 0 failed, 0 skipped.
dotnet ef database update: succeeded.
dotnet ef migrations list: confirmed 20260830061847_AddAnalyticsSnapshotMetadata is applied.
npm ci: succeeded, 0 vulnerabilities.
npm run lint: completed with 0 errors and 8 warnings.
npm run build: succeeded.
Browser verification: succeeded.
```

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
- Release metadata create/read/update/delete success paths.
- Release `400 Bad Request` validation paths.
- Release `404 Not Found` missing Song and missing Release paths.
- Release duplicate creation returns `409 Conflict`.
- Release server-controlled `CreatedAt` and `UpdatedAt` behavior.
- Song-to-Release relationship behavior, including one Release per Song and deleting Release metadata without deleting the parent Song.
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
- Calendar remained visibly mock-only.

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
- Page refresh preserved the created Release metadata.
- Release plan was edited through the frontend.
- Updated release date, distributor, identifiers, status, and platforms persisted.
- `CreatedAt` remained server-controlled and `UpdatedAt` changed after update.
- Delete confirmation stated that only release metadata is removed.
- Deleted Release metadata disappeared from the Release tab.
- The parent Song still existed after deleting Release metadata.
- Checklist remained clearly labeled as planned.
- Browser verification reported no unexpected CORS/API errors. Chrome logged expected `404 Not Found` responses for the intentional empty Release state before creation and after deletion.

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
- Calendar remained mock-only.

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

## Security / Secrets Status

- `appsettings.json` does not currently contain the local database password.
- The README shows a placeholder `YOUR_PASSWORD` value for setup.
- `darkroom-web/.env.example` contains no secrets.
- Latest secret scan found only the expected `YOUR_PASSWORD` placeholder in README setup instructions.

## Git Status Notes

Current AudioAsset, VisualAsset, Release, ContentItem, Credit, and AnalyticsSnapshot metadata foundation work is uncommitted.

The frontend build generated route/output artifacts as expected. Build output remains ignored.

Remote GitHub Actions status:

- First remote push run for DARKROOM SYSTEM CI has been reported as successful.

## Known Technical Debt

- `Status` values are enforced in DTO validation but still stored as a string; this is acceptable for the current stage.
- AudioAsset `Type` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- VisualAsset `Type` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- Release `ReleaseType`, `Status`, and `Platforms` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- ContentItem `Type`, `Status`, and `Platform` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- Credit `Role` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- AnalyticsSnapshot `Platform` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- The API does not yet enforce only one current AudioAsset per Song + Type.
- The API does not yet enforce only one current VisualAsset per Song + Type.
- Release platforms are stored as a comma-separated string; a normalized platform table may become useful when real integrations exist.
- ContentItem platform is stored as a string; richer channel/account modeling can wait until platform integrations exist.
- Credit contributors are plain Song-scoped metadata strings; a normalized contributor directory can wait until team/auth requirements exist.
- Planned split percentages are stored independently per Credit and are not validated to total `100` across a Song.
- Analytics snapshots are manually entered metadata and are not ingested from external platform APIs.
- Backend integration tests use SQLite in-memory, so they do not cover PostgreSQL-provider-specific behavior.
- There is no frontend test script yet.
- `npm run lint` still reports fast-refresh warnings from helper exports and existing UI primitive patterns.

## Not Yet Implemented

- Real authentication.
- Team collaboration or permissions.
- Google Drive integration.
- YouTube integration and automated analytics ingestion.
- Real audio file upload, playback, waveform processing, and external file association.
- Real visual file upload, preview/thumbnail generation, playback, and external file association.
- Release preparation checklist persistence.
- Distributor delivery or publishing workflow.
- Content publishing, platform delivery, and real calendar persistence.
- Contributor directory, contracts, royalties, payment workflow, and authenticated team permissions.
- Production deployment.

## Recommended Next Milestone

Start the release preparation checklist persistence foundation.

Suggested scope:

- Add persisted checklist items related to the existing Song Release metadata.
- Keep checklist records metadata-only and avoid distributor delivery or external publishing.
- Add focused API routes and backend tests.
- Connect the Release tab checklist to real backend metadata without implementing platform delivery.
