# DARKROOM SYSTEM

DARKROOM SYSTEM is a full-stack music workflow platform for artists and music teams. It manages songs, production assets, release preparation, content planning, credits, collaboration, and manually recorded analytics in one authenticated workspace.

The public product name is DARKROOM SYSTEM. Existing internal backend identifiers such as `ArtistOS.Api`, `ArtistOS.slnx`, C# namespaces, migration history, database naming, and JWT technical identifiers are intentionally retained.

## What It Does

DARKROOM SYSTEM centers work around the lifecycle of a song:

```text
Idea -> Demo -> Recording -> Mixing -> Mastering -> Release Preparation -> Content Campaign -> Released -> Analytics
```

The product is not a streaming service, Spotify clone, e-commerce app, generic file manager, or social network. It is a creative operations workspace for managing music projects from idea through release and review.

## Current Stack

Frontend:

- React 19
- TypeScript
- TanStack Start / Router
- TanStack Query
- Tailwind CSS
- Vite
- npm / `package-lock.json`

Backend:

- ASP.NET Core Web API
- .NET 10
- C#
- Entity Framework Core
- Npgsql
- PostgreSQL

Storage and integrations:

- PostgreSQL stores workflow metadata, ownership, collaboration, and provider references.
- Google Drive stores binary media files such as audio, artwork, and video.
- Google OAuth is handled by the backend; Google tokens are never exposed to React.
- YouTube and automated external analytics ingestion remain future work.

## Core Capabilities

Implemented application capabilities include:

- Authenticated user registration, login, logout cleanup, and current-session restore.
- Song catalog and Song workspace routes.
- Song-scoped OWNER / EDITOR / VIEWER collaboration with member management and invitation inbox.
- Audio asset metadata, version families, Google Drive upload, linked playback access, and Replace File.
- Visual asset metadata, version families, Google Drive upload, linked image/video preview access, and Replace File.
- Release metadata, release checklist records, and backend-derived release readiness.
- Content planning metadata.
- Credit contributor metadata and optional planned split metadata.
- Manual analytics snapshots.
- Dashboard aggregate over existing source records.
- Calendar aggregate over Release and Content dates.
- Backend-mediated signed media URLs with short-lived access tokens.

Not yet implemented:

- Password reset, email verification, MFA, refresh-token rotation, and server-side JWT revocation.
- Google Drive Picker, browsing, download-original, synchronization, and external file deletion.
- YouTube ingestion, publishing, distributor delivery, waveform processing, generated thumbnails, image optimization, and video transcoding.
- Production deployment and infrastructure security controls.

## Architecture

```text
DARKROOM SYSTEM React frontend
        |
        | REST / JSON with JWT Bearer auth
        v
ASP.NET Core Web API
        |
        v
EF Core / Npgsql
        |
        v
PostgreSQL metadata

ASP.NET Core API
        |
        v
Google Drive binary media storage
```

React owns presentation, routing, client state, and forms. ASP.NET Core owns trusted validation, authorization, persistence, Google OAuth, Google Drive operations, and media delivery. PostgreSQL stores metadata; large media binaries are stored externally in Google Drive.

## Local Development

Prerequisites:

- .NET SDK compatible with `net10.0`
- PostgreSQL running locally on port `5432`
- Node.js and npm
- EF Core CLI tools when creating or applying migrations

Create the local PostgreSQL database:

```bash
createdb artist_os
```

Configure backend secrets from `ArtistOS.Api/` using .NET User Secrets or equivalent environment variables. Do not commit real values.

```bash
cd ArtistOS.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=artist_os;Username=postgres;Password=YOUR_PASSWORD"
dotnet user-secrets set "Jwt:SigningKey" "YOUR_LONG_DEVELOPMENT_SIGNING_KEY"
dotnet user-secrets set "GoogleDrive:ClientId" "YOUR_GOOGLE_OAUTH_CLIENT_ID"
dotnet user-secrets set "GoogleDrive:ClientSecret" "YOUR_GOOGLE_OAUTH_CLIENT_SECRET"
```

Apply migrations from `ArtistOS.Api/` when needed:

```bash
dotnet ef database update
```

Run the backend:

```bash
cd ArtistOS.Api
dotnet run --launch-profile http
```

The local API defaults to `http://localhost:5178`.

Run the frontend:

```bash
cd darkroom-web
npm ci
npm run dev -- --host localhost --port 8080
```

The local frontend defaults to `http://localhost:8080`. The frontend API base URL defaults to `http://localhost:5178`; override it with `VITE_API_BASE_URL` in a local `.env` file based on `darkroom-web/.env.example`.

## Verification

From the repository root:

```bash
dotnet test
```

From `darkroom-web/`:

```bash
npm ci
npm run lint
npm run test
npm run build
```

Backend tests use an isolated SQLite in-memory test database through `WebApplicationFactory`; they do not connect to or wipe the local PostgreSQL `artist_os` database. Frontend tests mock the frontend API service boundary and do not require the ASP.NET backend, PostgreSQL, localhost, or network access.

## Repository Structure

```text
ArtistOS/
├── ArtistOS.Api/              # ASP.NET Core backend; internal name intentionally retained
├── darkroom-web/              # DARKROOM SYSTEM React frontend
├── docs/                      # project plan, current state, architecture notes
├── tests/ArtistOS.Api.Tests/  # backend integration-style tests
├── ArtistOS.slnx              # solution file; internal name intentionally retained
├── AGENTS.md                  # root collaboration instructions
└── README.md
```

Key frontend areas:

```text
darkroom-web/src/routes/                    # TanStack routes
darkroom-web/src/components/darkroom/pages/ # top-level page modules
darkroom-web/src/components/darkroom/workbench/ # Song workspace modules
darkroom-web/src/services/api/              # backend API clients
darkroom-web/src/services/mock/             # remaining future-only support data
darkroom-web/src/assets/darkroom-logo.png   # official logo asset
```

## Project Status

Product V1 and V1.1 application work is complete. Architecture stabilization has passed A0, A1, A2, and A3; A4 handles branding and repository hygiene. A5 is the next verification milestone after A4.

Current implementation truth lives in `docs/CURRENT_STATE.md`. Long-term product direction lives in `docs/PROJECT_PLAN.md`.