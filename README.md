# Artist OS

Artist OS is a full-stack music workflow platform for managing songs, production assets, release planning, content campaigns, credits, and analytics in one workspace.

The project is currently in early backend development. The implemented system is an ASP.NET Core Web API connected to PostgreSQL with a working Song CRUD API.

## Overview

Music projects often spread across drive folders, local files, spreadsheets, message threads, content calendars, and analytics dashboards. Artist OS is designed to bring those pieces into one focused workspace for artists and music teams.

Artist OS is not a streaming service, Spotify clone, e-commerce app, generic file manager, or social network. The long-term product is a creative operations workspace centered around the lifecycle of a song.

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
Phase 1 - Backend Foundation
```

Implemented and verified:

- ASP.NET Core Web API backend
- PostgreSQL connection through EF Core and Npgsql
- Initial EF Core migration for `Song`
- `AppDbContext`
- `Song` model
- Song CRUD API
- OpenAPI mapping in development

Not implemented yet:

- React frontend
- Authentication
- Google Drive integration
- YouTube analytics
- Song workspace UI
- Audio/visual asset management
- Release/content pipeline
- Collaboration features
- CI/CD and deployment

## Current Features

### Song CRUD API

The backend currently supports basic CRUD operations for songs.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/songs` | List all songs ordered by `Id`. |
| `GET` | `/api/songs/{id}` | Get one song by id. Returns `404` when missing. |
| `POST` | `/api/songs` | Create a new song. Returns `201 Created`. |
| `PUT` | `/api/songs/{id}` | Update an existing song. Returns `400` for id mismatch and `404` when missing. |
| `DELETE` | `/api/songs/{id}` | Delete a song. Returns `404` when missing. |

Current `Song` shape:

```csharp
public class Song
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Demo";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

## Planned Features

These are planned product directions, not currently implemented features:

- React dashboard and workspace UI
- Song detail workspace with Overview, Audio, Visuals, Content, Release, Credits, and Analytics tabs
- Audio asset metadata for demos, recordings, mixes, and masters
- Visual asset metadata for artwork, music videos, and content assets
- Google Drive integration for large media file storage
- Release management and release preparation checklists
- Content planning, scheduling, and campaign timeline
- Credits and contributor tracking
- Authentication, teams, and collaboration
- YouTube Data/Analytics integration
- Automated tests, CI/CD, and deployment

## Architecture

Current and planned architecture:

```text
React (planned)
        |
        | REST / JSON
        v
ASP.NET Core Web API
        |
        v
Entity Framework Core
        |
        v
Npgsql
        |
        v
PostgreSQL
```

Future external integrations, such as Google Drive and YouTube APIs, will connect to the backend without replacing the core Artist OS domain model.

## Tech Stack

### Current Backend

- ASP.NET Core Web API
- .NET 10
- C#
- Entity Framework Core
- Npgsql Entity Framework Core provider
- PostgreSQL

Verified package references:

| Package | Version |
| --- | --- |
| `Microsoft.AspNetCore.OpenApi` | `10.0.11` |
| `Microsoft.EntityFrameworkCore.Design` | `10.0.11` |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | `10.0.3` |

### Planned Frontend

- React
- TypeScript
- Tailwind CSS

### Planned Integrations

- Google Drive API
- YouTube APIs

### Planned DevOps

- GitHub Actions
- CI/CD
- Production deployment

## API

Base local URL from the current HTTP launch profile:

```text
http://localhost:5178
```

Song endpoints:

```text
GET    /api/songs
GET    /api/songs/{id}
POST   /api/songs
PUT    /api/songs/{id}
DELETE /api/songs/{id}
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
│   │   ├── SongsController.cs
│   │   └── WeatherForecastController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Migrations/
│   │   ├── 20260828171115_InitialCreate.cs
│   │   ├── 20260828171115_InitialCreate.Designer.cs
│   │   └── AppDbContextModelSnapshot.cs
│   ├── Models/
│   │   └── Song.cs
│   ├── Properties/
│   │   └── launchSettings.json
│   ├── appsettings.Development.json
│   ├── appsettings.json
│   ├── ArtistOS.Api.csproj
│   └── Program.cs
├── docs/
│   ├── CURRENT_STATE.md
│   └── PROJECT_PLAN.md
├── AGENTS.md
└── README.md
```

Generated `bin/` and `obj/` folders are intentionally omitted from this tree.

## Getting Started

### Prerequisites

- .NET SDK compatible with `net10.0`
- PostgreSQL running locally
- EF Core CLI tools, if you need to create or apply migrations

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

### 6. Test The API

```bash
curl http://localhost:5178/api/songs
```

Or create a test song:

```bash
curl -X POST http://localhost:5178/api/songs \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Demo Song\",\"status\":\"Demo\"}"
```

## Database

Artist OS currently uses PostgreSQL for persistence and EF Core migrations for schema evolution.

Current database:

```text
artist_os
```

Current tables:

- `Songs`
- `__EFMigrationsHistory`

Current migration:

```text
20260828171115_InitialCreate
```

Large media files such as WAV, MP3, stems, artwork, and video files should not be stored directly in PostgreSQL. The planned direction is to store metadata in PostgreSQL and large files in an external provider such as Google Drive.

## Roadmap

### Foundation

- [x] Backend foundation
- [x] PostgreSQL + EF Core setup
- [x] Initial Song model and migration
- [x] Song CRUD API
- [ ] Basic Song validation
- [ ] Automated backend tests

### Product

- [ ] React frontend
- [ ] Song workspace
- [ ] Audio and visual asset management
- [ ] Release and content workflow
- [ ] Credits and contributor management
- [ ] Authentication and collaboration

### Integrations / Delivery

- [ ] Google Drive integration
- [ ] YouTube analytics
- [ ] CI/CD and deployment

## Development Principles

- Keep changes focused, incremental, and verified.
- Use EF Core migrations for schema changes.
- Keep secrets out of source control.
- Store large media files externally; PostgreSQL stores metadata and references.
- Keep React responsible for the frontend UI and ASP.NET responsible for the backend API.

## Project Documentation

- `docs/PROJECT_PLAN.md` describes the long-term product direction and roadmap.
- `docs/CURRENT_STATE.md` describes what is actually implemented now.
- `AGENTS.md` captures the engineering workflow and collaboration rules for this project.
