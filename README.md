# Artist OS / DARKROOM SYSTEM

Artist OS is a full-stack music workflow platform for managing songs, production assets, release planning, content campaigns, credits, and analytics in one workspace.

DARKROOM SYSTEM is the current React frontend experience for Artist OS.

The product is not a streaming service, Spotify clone, e-commerce app, generic file manager, or social network. The long-term goal is a creative operations workspace centered around the lifecycle of a song.

## Core Workflow

The intended music project lifecycle:

```text
Idea
  -> Demo
  -> Recording
  -> Mixing
  -> Mastering
  -> Release Preparation
  -> Content Campaign
  -> Released
  -> Analytics
```

The `Song` is currently the central implemented domain concept.

## Current Status

Current phase:

```text
Credits Metadata Foundation
```

Implemented and verified:

- ASP.NET Core Web API backend
- PostgreSQL connection through EF Core and Npgsql
- EF Core migrations for `Song`
- `AppDbContext`
- `Song` model with validation constraints
- Song CRUD API with request/response DTOs
- Development OpenAPI mapping
- Development CORS for the local frontend
- DARKROOM SYSTEM React frontend
- Real browser-based Song CRUD integration between frontend and backend
- AudioAsset metadata model related to Song
- Nested AudioAsset metadata API
- Real browser-based Audio tab metadata create/read/update/delete
- VisualAsset metadata model related to Song
- Nested VisualAsset metadata API
- Real browser-based Visuals tab metadata create/read/update/delete
- Release metadata model related to Song
- Nested Release metadata API
- Real browser-based Release tab metadata create/read/update/delete
- ContentItem metadata model related to Song
- Nested ContentItem metadata API
- Real browser-based Content tab metadata create/read/update/delete
- Credit metadata model related to Song
- Nested Credit metadata API
- Real browser-based Credits tab metadata create/read/update/delete
- Automated backend integration tests for current Song, AudioAsset, VisualAsset, Release, ContentItem, and Credit API behavior
- GitHub Actions CI workflow for backend build/tests and frontend lint/build

Planned, not implemented yet:

- Real authentication
- Google Drive integration
- YouTube analytics
- Real audio file upload, playback, waveform processing, or external file storage
- Real release publishing or distributor delivery
- Contributor directory, team permissions, contracts, royalties, or payout workflow
- Backend analytics
- Continuous delivery and production deployment

## Current Implemented Frontend

DARKROOM SYSTEM currently includes:

- React 19
- TypeScript
- Vite
- TanStack Router / Start
- TanStack Query
- Tailwind CSS
- DARKROOM SYSTEM design system
- Responsive app shell with desktop sidebar and mobile drawer
- Local transparent logo asset

Current routes:

```text
/login
/dashboard
/songs
/songs/:id
/calendar
/team
/settings
```

The `/` route redirects to `/dashboard`.

## Real Backend Integration

Song CRUD, AudioAsset metadata, VisualAsset metadata, Release metadata, ContentItem metadata, and Credit metadata are connected to the ASP.NET Core backend.

Browser-based create, read, update, and delete works against:

```text
http://localhost:5178/api/songs
http://localhost:5178/api/songs/{songId}/audio-assets
http://localhost:5178/api/songs/{songId}/visual-assets
http://localhost:5178/api/songs/{songId}/release
http://localhost:5178/api/songs/{songId}/content-items
http://localhost:5178/api/songs/{songId}/credits
```

The Song workspace loads real Song data by id. The Audio tab loads and writes real AudioAsset metadata for the selected Song. The Visuals tab loads and writes real VisualAsset metadata for the selected Song. The Release tab loads and writes real Release metadata for the selected Song. The Content tab loads and writes real ContentItem metadata for the selected Song. The Credits tab loads and writes real Credit metadata for the selected Song. Local CORS is configured for frontend development from:

```text
http://localhost:8080
```

If the backend is unreachable during local development, the Song API service uses an explicit in-memory fallback so the frontend remains navigable. The UI shows a fallback notice in that mode. Other API errors are surfaced instead of hidden.

## Mock-Only Areas

These areas are visible in the frontend but are not backend-backed yet:

- Dashboard metadata beyond real Song records
- Audio waveform display, file upload, playback, and external file association
- Visual thumbnails, file upload, previews, playback, and external file association
- Release preparation checklist
- Release publishing and distributor delivery
- Content publishing and platform delivery
- Contributor directory, team permissions, contracts, royalties, and payout workflow
- Analytics
- Calendar
- Team
- Settings
- Authentication

## Current Features

### Song CRUD API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs` | List all songs ordered by `Id`. |
| `GET` | `/api/songs/{id}` | Get one song by id. Returns `404` when missing. |
| `POST` | `/api/songs` | Create a new song. Returns `201 Created`. |
| `PUT` | `/api/songs/{id}` | Update an existing song. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{id}` | Delete a song. Returns `204 No Content` or `404` when missing. |

Current `Song` shape:

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
}
```

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

### AudioAsset Metadata API

The backend supports metadata-only audio assets nested under a Song.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs/{songId}/audio-assets` | List audio asset metadata for a Song. |
| `GET` | `/api/songs/{songId}/audio-assets/{audioAssetId}` | Get one audio asset metadata record. |
| `POST` | `/api/songs/{songId}/audio-assets` | Create an audio asset metadata record. Returns `201 Created`. |
| `PUT` | `/api/songs/{songId}/audio-assets/{audioAssetId}` | Update an audio asset metadata record. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{songId}/audio-assets/{audioAssetId}` | Delete an audio asset metadata record. Returns `204 No Content` or `404` when missing. |

Current `AudioAsset` shape:

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

### VisualAsset Metadata API

The backend supports metadata-only visual assets nested under a Song.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs/{songId}/visual-assets` | List visual asset metadata for a Song. |
| `GET` | `/api/songs/{songId}/visual-assets/{visualAssetId}` | Get one visual asset metadata record. |
| `POST` | `/api/songs/{songId}/visual-assets` | Create a visual asset metadata record. Returns `201 Created`. |
| `PUT` | `/api/songs/{songId}/visual-assets/{visualAssetId}` | Update a visual asset metadata record. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{songId}/visual-assets/{visualAssetId}` | Delete a visual asset metadata record. Returns `204 No Content` or `404` when missing. |

Current `VisualAsset` shape:

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

### Release Metadata API

The backend supports one metadata-only release plan per Song.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs/{songId}/release` | Get release metadata for a Song. Returns `404` when the Song or release plan is missing. |
| `POST` | `/api/songs/{songId}/release` | Create a release metadata record. Returns `201 Created` or `409 Conflict` when one already exists. |
| `PUT` | `/api/songs/{songId}/release` | Update the release metadata record. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{songId}/release` | Delete the release metadata record only. Returns `204 No Content` or `404` when missing. |

Current `Release` shape:

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

Allowed Release type:

```text
Single
```

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

### ContentItem Metadata API

The backend supports metadata-only content campaign items nested under a Song.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs/{songId}/content-items` | List content item metadata for a Song. |
| `GET` | `/api/songs/{songId}/content-items/{contentItemId}` | Get one content item metadata record. |
| `POST` | `/api/songs/{songId}/content-items` | Create a content item metadata record. Returns `201 Created`. |
| `PUT` | `/api/songs/{songId}/content-items/{contentItemId}` | Update a content item metadata record. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{songId}/content-items/{contentItemId}` | Delete a content item metadata record. Returns `204 No Content` or `404` when missing. |

Current `ContentItem` shape:

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

### Credit Metadata API

The backend supports metadata-only contributor credits nested under a Song.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs/{songId}/credits` | List credit metadata for a Song. |
| `GET` | `/api/songs/{songId}/credits/{creditId}` | Get one credit metadata record. |
| `POST` | `/api/songs/{songId}/credits` | Create a credit metadata record. Returns `201 Created`. |
| `PUT` | `/api/songs/{songId}/credits/{creditId}` | Update a credit metadata record. Returns `204 No Content`. |
| `DELETE` | `/api/songs/{songId}/credits/{creditId}` | Delete a credit metadata record. Returns `204 No Content` or `404` when missing. |

Current `Credit` shape:

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

`SplitPercentage` is optional planned split metadata only. It does not represent payment processing, royalty settlement, accounting, or a legal split agreement.

## Architecture

Current architecture:

```text
DARKROOM SYSTEM React frontend
        |
        | REST / JSON
        v
ASP.NET Core Web API
        |
        v
EF Core / Npgsql
        |
        v
PostgreSQL
```

Future integrations:

- Google Drive
- YouTube

## Tech Stack

### Backend

- ASP.NET Core Web API
- .NET 10
- C#
- Entity Framework Core
- Npgsql Entity Framework Core provider
- PostgreSQL

Current backend packages:

| Package | Version |
| --- | --- |
| `Microsoft.AspNetCore.OpenApi` | `10.0.11` |
| `Microsoft.EntityFrameworkCore.Design` | `10.0.11` |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | `10.0.3` |

### Frontend

- React 19
- TypeScript
- Vite
- TanStack Router / Start
- TanStack Query
- Tailwind CSS
- Radix/shadcn-style UI primitives
- Lucide icons

### Tests

- xUnit
- ASP.NET Core `WebApplicationFactory`
- EF Core SQLite in-memory test database

### CI

GitHub Actions is configured to verify pushes to `main` and pull requests targeting `main`.

The CI workflow checks:

- Backend restore, build, and tests
- Frontend dependency install, lint, and build

No PostgreSQL credentials or production secrets are required for the CI foundation. Backend tests use an isolated in-memory SQLite database.

## Development URLs

Local development defaults:

| App | URL |
| --- | --- |
| Frontend | `http://localhost:8080` |
| Backend | `http://localhost:5178` |

These are local development URLs, not production deployment URLs.

## API

Song endpoints:

```text
GET    /api/songs
GET    /api/songs/{id}
POST   /api/songs
PUT    /api/songs/{id}
DELETE /api/songs/{id}
```

Audio asset metadata endpoints:

```text
GET    /api/songs/{songId}/audio-assets
GET    /api/songs/{songId}/audio-assets/{audioAssetId}
POST   /api/songs/{songId}/audio-assets
PUT    /api/songs/{songId}/audio-assets/{audioAssetId}
DELETE /api/songs/{songId}/audio-assets/{audioAssetId}
```

Visual asset metadata endpoints:

```text
GET    /api/songs/{songId}/visual-assets
GET    /api/songs/{songId}/visual-assets/{visualAssetId}
POST   /api/songs/{songId}/visual-assets
PUT    /api/songs/{songId}/visual-assets/{visualAssetId}
DELETE /api/songs/{songId}/visual-assets/{visualAssetId}
```

Release metadata endpoints:

```text
GET    /api/songs/{songId}/release
POST   /api/songs/{songId}/release
PUT    /api/songs/{songId}/release
DELETE /api/songs/{songId}/release
```

Content item metadata endpoints:

```text
GET    /api/songs/{songId}/content-items
GET    /api/songs/{songId}/content-items/{contentItemId}
POST   /api/songs/{songId}/content-items
PUT    /api/songs/{songId}/content-items/{contentItemId}
DELETE /api/songs/{songId}/content-items/{contentItemId}
```

Credit metadata endpoints:

```text
GET    /api/songs/{songId}/credits
GET    /api/songs/{songId}/credits/{creditId}
POST   /api/songs/{songId}/credits
PUT    /api/songs/{songId}/credits/{creditId}
DELETE /api/songs/{songId}/credits/{creditId}
```

Example create request:

```bash
curl -X POST http://localhost:5178/api/songs \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"After Hours\",\"status\":\"Demo\"}"
```

Example list request:

```bash
curl http://localhost:5178/api/songs
```

## Repository Structure

Current concise structure:

```text
ArtistOS/
├── ArtistOS.Api/
│   ├── Controllers/
│   │   ├── AudioAssetsController.cs
│   │   ├── ContentItemsController.cs
│   │   ├── CreditsController.cs
│   │   ├── ReleasesController.cs
│   │   ├── SongsController.cs
│   │   └── VisualAssetsController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Dtos/
│   ├── Migrations/
│   ├── Models/
│   │   ├── AudioAsset.cs
│   │   ├── ContentItem.cs
│   │   ├── Credit.cs
│   │   ├── Release.cs
│   │   ├── Song.cs
│   │   └── VisualAsset.cs
│   ├── Properties/
│   │   └── launchSettings.json
│   ├── appsettings.Development.json
│   ├── appsettings.json
│   ├── ArtistOS.Api.csproj
│   └── Program.cs
├── darkroom-web/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── CURRENT_STATE.md
│   └── PROJECT_PLAN.md
├── tests/
│   └── ArtistOS.Api.Tests/
├── ArtistOS.slnx
├── AGENTS.md
└── README.md
```

Generated `bin/`, `obj/`, `node_modules/`, and frontend build output folders are intentionally omitted from this tree.

## Getting Started

### Prerequisites

- .NET SDK compatible with `net10.0`
- PostgreSQL running locally
- EF Core CLI tools, if you need to create or apply migrations
- Node.js/npm for the frontend

### 1. Clone The Repository

```bash
git clone <repository-url>
cd ArtistOS
```

### 2. Create The PostgreSQL Database

Create a local database named:

```text
artist_os
```

The current development setup expects PostgreSQL to be available on port `5432`.

### 3. Configure The Connection String Safely

Do not commit real database passwords to `appsettings.json`.

From the backend project folder:

```bash
cd ArtistOS.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=artist_os;Username=postgres;Password=YOUR_PASSWORD"
```

Replace `YOUR_PASSWORD` with your local PostgreSQL password.

### 4. Apply EF Core Migrations

```bash
dotnet ef database update
```

### 5. Run The Backend

```bash
dotnet run --launch-profile http
```

The API should listen at:

```text
http://localhost:5178
```

### 6. Run The Frontend

From the frontend project folder:

```bash
cd darkroom-web
npm install
npm run dev -- --host localhost --port 8080
```

The frontend should listen at:

```text
http://localhost:8080
```

The default API base URL is `http://localhost:5178`. To override it, create a local `.env` file from `darkroom-web/.env.example`.

### 7. Run Backend Tests

From the repository root:

```bash
dotnet test
```

The backend tests use an isolated in-memory SQLite database through `WebApplicationFactory`; they do not connect to or wipe the local `artist_os` PostgreSQL database.

## Database

Artist OS currently uses PostgreSQL for persistence and EF Core migrations for schema evolution.

Current database:

```text
artist_os
```

Current tables:

- `AudioAssets`
- `ContentItems`
- `Credits`
- `Releases`
- `Songs`
- `VisualAssets`
- `__EFMigrationsHistory`

Current migrations:

```text
20260828171115_InitialCreate
20260828180003_AddSongValidationConstraints
20260829071423_AddAudioAssetMetadata
20260829075405_AddVisualAssetMetadata
20260829130234_AddReleaseMetadata
20260829133738_AddContentItemMetadata
20260830055757_AddCreditMetadata
```

Large media files such as WAV, MP3, stems, artwork, and video files should not be stored directly in PostgreSQL. The planned direction is to store metadata in PostgreSQL and large files in an external provider such as Google Drive.

## Roadmap

### Foundation

- [x] Backend foundation
- [x] PostgreSQL + EF Core setup
- [x] Initial Song model and migration
- [x] Song validation constraints
- [x] Song CRUD API
- [x] AudioAsset metadata model and migration
- [x] Nested AudioAsset metadata API
- [x] VisualAsset metadata model and migration
- [x] Nested VisualAsset metadata API
- [x] Release metadata model and migration
- [x] Nested Release metadata API
- [x] ContentItem metadata model and migration
- [x] Nested ContentItem metadata API
- [x] Credit metadata model and migration
- [x] Nested Credit metadata API
- [x] Local frontend development CORS
- [x] Automated backend tests
- [ ] Automated frontend tests

### Product

- [x] React frontend foundation
- [x] DARKROOM SYSTEM app shell
- [x] Song list UI
- [x] Song detail workspace UI
- [x] Browser-based real Song CRUD integration
- [x] Browser-based real AudioAsset metadata integration
- [x] Browser-based real VisualAsset metadata integration
- [x] Browser-based real Release metadata integration
- [x] Browser-based real ContentItem metadata integration
- [x] Browser-based real Credit metadata integration
- [ ] Real audio file upload and external file association
- [ ] Real visual file upload and external file association
- [ ] Release preparation checklist persistence
- [ ] Release publishing and distributor delivery
- [ ] Content publishing and platform delivery
- [ ] Contributor directory, contracts, royalties, and payout workflow
- [ ] Authentication and collaboration

### Integrations / Delivery

- [ ] Google Drive integration
- [ ] YouTube analytics
- [x] GitHub Actions CI foundation
- [ ] CD and production deployment

## Development Principles

- Keep changes focused, incremental, and verified.
- Let the current milestone control scope.
- Use EF Core migrations for schema changes.
- Keep secrets out of source control.
- Store large media files externally; PostgreSQL stores metadata and references.
- Keep React responsible for the frontend UI and ASP.NET responsible for the backend API.

## Project Documentation

- `docs/PROJECT_PLAN.md` describes the long-term product direction and roadmap.
- `docs/CURRENT_STATE.md` describes what is actually implemented now.
- `AGENTS.md` captures the engineering workflow and collaboration rules for this project.
