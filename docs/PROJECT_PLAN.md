# Artist OS Project Plan

## Product Vision

Artist OS is a web-based workspace for artists and music teams to manage the complete lifecycle of a song.

The goal is not to build a music streaming service. Artist OS solves the problem of music projects being fragmented across Google Drive, local files, spreadsheets, messaging apps, YouTube Studio, and content calendars.

Artist OS should become one central workspace connecting these resources.

## Core Product Flow

A music project should move roughly through:

```text
IDEA
DEMO
RECORDING
MIXING
MASTERING
RELEASE PREPARATION
CONTENT CAMPAIGN
RELEASED
ANALYTICS
```

The Song is the central domain object.

## Main User Experience

The dashboard should answer:

- What songs are currently being worked on?
- What releases are coming?
- What content needs to be finished?
- What changed recently?
- How are released songs performing?

Every song should eventually have its own workspace at a route like `/songs/{songId}`.

Song workspace tabs:

- Overview
- Audio
- Visuals
- Content
- Release
- Credits
- Analytics

## Audio Asset Management

A song may contain audio assets such as:

- Demo
- Recording
- Mix
- Master

Files should eventually live in Google Drive. Artist OS stores metadata and references to those files rather than duplicating large media files in PostgreSQL.

Future asset metadata may include:

- Id
- SongId
- Type
- Version
- GoogleDriveFileId
- Filename
- UploadedAt
- Status

## Release Management

A song may have release information such as:

- Release date
- Distributor
- ISRC
- UPC
- Platforms
- Release status

Possible release lifecycle:

```text
PLANNING
PREPARING
READY
SCHEDULED
RELEASED
```

Release preparation should eventually include a checklist for master, cover, metadata, credits, Spotify Canvas, music video, and related deliverables.

## Content Management

Content belongs to a song or release campaign.

Examples:

- Teaser
- Snippet
- Music video
- Visualizer
- Behind the scenes
- TikTok
- Instagram Reel
- YouTube Short
- Artwork post

Possible content lifecycle:

```text
IDEA
PLANNED
IN_PRODUCTION
EDITING
READY
SCHEDULED
PUBLISHED
```

Content should eventually be visible through a calendar or timeline.

## Credits

Songs should support contributors such as:

- Artist
- Featured artist
- Producer
- Songwriter
- Recording engineer
- Mix engineer
- Mastering engineer
- Director
- Designer

Future versions may support ownership or split percentages.

## Analytics

Released songs should eventually connect to external analytics. The initial target is YouTube.

Possible future metrics:

- Views
- Likes
- Comments
- Watch time
- Subscriber growth
- Content performance
- Release performance

Analytics should belong to releases or content rather than being isolated dashboards.

## Users And Collaboration

Artist OS will eventually support teams.

Possible roles:

- Owner
- Admin
- Artist
- Producer
- Engineer
- Manager
- Collaborator

Do not implement complex role-based permissions prematurely.

## Technical Architecture

```text
React + TypeScript + Tailwind CSS
        |
        | REST / JSON
        v
ASP.NET Core Web API
Controllers
Services when needed
Entity Framework Core
        |
        v
PostgreSQL
```

Future integrations:

- Google Drive API
- YouTube API
- GitHub Actions for CI/CD

## Target Repository Structure

```text
ArtistOS/
├── backend/
│   └── ArtistOS.Api/
├── frontend/
│   └── artist-os-web/
├── docs/
│   ├── PROJECT_PLAN.md
│   └── CURRENT_STATE.md
└── README.md
```

The repository may temporarily differ while the project is early.

## Development Phases

### Phase 1 - Backend Foundation

Goal: learn and establish ASP.NET + PostgreSQL.

Features:

- Song entity
- Song CRUD
- PostgreSQL
- EF Core migrations
- Validation
- Basic error handling

Not included:

- Authentication
- Google Drive
- Analytics

### Phase 2 - React Foundation

Create the React frontend.

Features:

- Dashboard shell
- Song list
- Create song
- Song details
- Edit song
- Connect React to ASP.NET API

### Phase 3 - Song Workspace

Build the core Artist OS experience.

Workspace areas:

- Overview
- Audio
- Visuals
- Release
- Content
- Credits

### Phase 4 - Asset Management

Introduce:

- AudioAsset
- VisualAsset
- Asset versions

Initially store metadata for local development and prepare the architecture for Google Drive.

### Phase 5 - Google Drive

Add Google OAuth and Drive integration.

Features:

- Connect Drive
- Browse project assets
- Associate Drive files with songs
- Upload assets through Artist OS

### Phase 6 - Release And Content Pipeline

Add release management, release checklists, content planning, content calendar, and campaign workflow.

### Phase 7 - Authentication And Collaboration

Add authentication, users, artist/team workspace, permissions, and collaborators.

### Phase 8 - YouTube Integration

Connect YouTube, associate videos with releases/content, retrieve analytics, and display release performance.

### Phase 9 - CI/CD And Deployment

Add GitHub Actions, backend tests, frontend tests/build, production build, and deployment for frontend, backend, and database.

## Engineering Principles

1. Do not overengineer.
2. Prefer understandable code over clever abstractions.
3. Explain important architecture decisions.
4. Make incremental changes.
5. Build and test after meaningful changes.
6. Do not generate the entire backend blindly.
7. Introduce services when business logic justifies them.
8. Do not introduce repository pattern merely to wrap EF Core.
9. Use DTOs when API/domain separation becomes useful.
10. Database changes must use EF Core migrations.
11. Never commit secrets.
12. Do not store large media files in PostgreSQL.
13. React owns the frontend.
14. Do not create Razor Views.
15. Avoid premature microservices.
