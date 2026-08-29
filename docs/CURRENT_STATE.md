# Artist OS Current State

Last updated: 2026-08-29

## Current Phase

Audio Asset Metadata Foundation.

Current focus: the first automated backend test foundation now covers current Song and AudioAsset API behavior. Actual audio file upload, playback, waveform processing, and Google Drive storage remain future work.

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

Current backend architecture:

```text
SongsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
AudioAssetsController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
```

No backend repository or service layer has been introduced yet. This is intentional because current Song and AudioAsset metadata CRUD/validation do not contain enough business logic to justify those abstractions.

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
  -> isolated Song and AudioAsset API services
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

Current frontend API base URL behavior:

- `VITE_API_BASE_URL` controls the backend URL.
- Default frontend fallback value is `http://localhost:5178`.
- `darkroom-web/.env.example` documents `VITE_API_BASE_URL=http://localhost:5178`.
- `PUT /api/songs/{id}` is handled as `204 No Content`; the client refetches the song afterward.
- `PUT /api/songs/{songId}/audio-assets/{audioAssetId}` is handled as `204 No Content`; the client refetches the audio asset afterward.

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
- Visual assets.
- Release metadata and checklist.
- Content campaign items.
- Credits and collaborators.
- Analytics.
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

## Current DTOs

The Song API uses DTOs instead of exposing the EF entity directly as the API contract.

- `CreateSongRequest`
- `UpdateSongRequest`
- `SongResponse`
- `CreateAudioAssetRequest`
- `UpdateAudioAssetRequest`
- `AudioAssetResponse`

DTOs are used because they solve current API contract problems:

- prevent clients from setting `Id`
- prevent clients from setting or changing `CreatedAt`
- provide focused request validation
- keep response shape explicit

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

The frontend also performs matching basic form validation for user experience, but backend validation remains the trusted source.

## Database / Migrations

Database:

```text
artist_os
```

PostgreSQL is expected locally on port `5432`.

Current database tables:

- `AudioAssets`
- `Songs`
- `__EFMigrationsHistory`

Applied migrations:

```text
20260828171115_InitialCreate
20260828180003_AddSongValidationConstraints
20260829071423_AddAudioAssetMetadata
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

Indexes:

- `IX_AudioAssets_SongId`
- `IX_AudioAssets_SongId_Type`

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

Verification run during the latest backend test foundation milestone:

```text
dotnet build
dotnet test
```

Results:

```text
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 35 passed, 0 failed, 0 skipped.
```

Automated backend coverage now includes:

- Song create/read/list/update/delete success paths.
- Song `400 Bad Request` validation paths.
- Song `404 Not Found` missing-resource paths.
- AudioAsset metadata create/read/list/update/delete success paths.
- AudioAsset `400 Bad Request` validation paths.
- AudioAsset `404 Not Found` missing Song and missing AudioAsset paths.
- Song-to-AudioAsset relationship behavior, including many AudioAssets per Song and deleting AudioAsset metadata without deleting the parent Song.

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

## Security / Secrets Status

- `appsettings.json` does not currently contain the local database password.
- The README shows a placeholder `YOUR_PASSWORD` value for setup.
- `darkroom-web/.env.example` contains no secrets.
- Latest secret scan found only the expected `YOUR_PASSWORD` placeholder in README setup instructions.

## Git Status Notes

Current AudioAsset metadata foundation work is uncommitted.

The frontend build generated route/output artifacts as expected. Build output remains ignored.

## Known Technical Debt

- `Status` values are enforced in DTO validation but still stored as a string; this is acceptable for the current stage.
- AudioAsset `Type` and `Status` values are enforced in DTO validation but still stored as strings; this is acceptable for the current stage.
- The API does not yet enforce only one current AudioAsset per Song + Type.
- Backend integration tests use SQLite in-memory, so they do not cover PostgreSQL-provider-specific behavior.
- There is no frontend test script yet.
- `npm run lint` still reports fast-refresh warnings from helper exports and existing UI primitive patterns.

## Not Yet Implemented

- Real authentication.
- Team collaboration or permissions.
- Google Drive integration.
- YouTube integration.
- Real audio file upload, playback, waveform processing, and external file association.
- Backend visual asset management.
- Backend release management.
- Backend content calendar or campaign tools.
- Backend credits management.
- Backend analytics.
- CI/CD.
- Production deployment.

## Recommended Next Milestone

Start the Visual Asset metadata foundation.

Suggested scope:

- Add metadata-only `VisualAsset` backend model and migration.
- Add nested VisualAsset API under Song.
- Keep real image/video file storage out of PostgreSQL.
- Do not begin Google Drive or large-file upload yet.
