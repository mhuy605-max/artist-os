# Artist OS Current State

Last updated: 2026-09-12

## Current Phase

Product V1 Feature Freeze Complete. Security S4A local application verification completed. V1.1 Song Workspace Collaboration is DONE. Architecture Stabilization A3 Architecture Cleanup is complete.

Current focus: DARKROOM SYSTEM is product feature frozen for V1 after the Product Completion Audit, Team surface honesty cleanup, app-owned Security S2 hardening, and S4A local attack-oriented application verification. The audit found no Product P0 blockers; the only accepted Product P1 gap was the visible Team route showing mock collaborators and an Invite action even though collaboration was not implemented for V1. S4A found no remaining application-owned P0/P1 security findings. V1.1 Song Workspace Collaboration C0 passed, C1 added the backend collaboration foundation, C2 added member/invitation lifecycle APIs, C3 added collaborator-aware top-level Song visibility plus Dashboard/Calendar aggregate visibility, C4 converted normal nested Song-domain metadata authorization, C5 converted media plus Google Drive provider operations to the collaboration model, C6 verified the backend collaboration security/regression baseline without finding remaining P0/P1 defects, C7 added frontend role-aware workspace behavior using backend Song access metadata, C8 added song workspace Members UI plus the real invitation inbox, C9 hardened the C7/C8 frontend collaboration UX, stale-state handling, pending states, responsive edge cases, accessibility/copy, and regression coverage, C10 completed final end-to-end verification plus DONE documentation, A0 completed the whole-project architecture and Lovable trace audit, A1 removed the active Lovable build/runtime dependency, A2 removed verified dead mocks, unused UI primitives, stale dependency entries, Bun artifacts, and passive Lovable metadata, and A3 removed the remaining public Workbench facade by extracting standalone pages into focused modules. Generated thumbnails, image optimization/transcoding, video transcoding/codec normalization, external Drive deletion, download-original, Drive browsing, Picker, synchronization, waveform processing, YouTube, publishing, distributor delivery, infrastructure security verification, and production deployment remain future work.

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
- Release checklist notes and supported manual completion state are persisted; canonical Release readiness is calculated separately at read time.
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
- Analytics Workspace Product Polish Sprint #9 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive, Dashboard, or external analytics integration changes.
- Analytics tab information hierarchy now presents `ANALYTICS / PERFORMANCE`, Latest Performance, and Performance History.
- Latest Performance displays the latest stored AnalyticsSnapshot per recorded platform instead of summing historical cumulative snapshots across dates or platforms.
- Performance History is chronological, filterable by recorded platform, and uses same-platform `change since previous snapshot` copy for presentation-only deltas.
- Watch time remains labeled in minutes to match the persisted `watchTimeMinutes` unit.
- Analytics create/edit/delete UX now uses existing persisted fields only and productized duplicate platform/date conflict copy.
- Misleading Analytics copy and UI were removed, including stale `Real backend data`, `Real metadata`, mixed-platform fake charting, external sync/import/API status language, and unsupported live analytics claims.
- External analytics ingestion remains planned and is clearly labeled in the frontend.
- Browser-based AnalyticsSnapshot metadata create/edit/delete/refresh verified.
- AnalyticsSnapshot API create/read/update/delete, validation, timestamp, duplicate prevention, ordering, and Song relationship behavior covered by automated integration-style tests.
- Song Workspace Architecture & Stabilization Sprint #10 completed without backend API, database, auth, Google Drive, or product-feature changes.
- The former monolithic `darkroom-web/src/components/darkroom/Workbench.tsx` was reduced from roughly 5,585 lines to roughly 1,398 lines.
- Song Workspace shell and routing composition now live in `darkroom-web/src/components/darkroom/workbench/Workbench.tsx`.
- Overview, Audio, Visuals, Release, Content, Credits, and Analytics workspace implementations now each have their own module boundary under `darkroom-web/src/components/darkroom/workbench/`.
- Shared Song Workspace query keys and small cross-workspace helpers now live in `darkroom-web/src/components/darkroom/workbench/shared.ts`.
- The shared metadata tile component used by Overview and Release now lives in `darkroom-web/src/components/darkroom/workbench/shared-ui.tsx`.
- The public `@/components/darkroom/Workbench` import path remains available for existing routes and tests.
- Existing polished Song Workspace UI, copy, route behavior, API calls, and tests were preserved during extraction.
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
- Dashboard release readiness is derived from the canonical backend Release readiness service.
- Dashboard analytics overview uses latest stored AnalyticsSnapshot per Song and platform.
- Dashboard recent activity is conservatively derived from existing source timestamps.
- Dashboard route now reads real backend data through TanStack Query.
- Mock Dashboard upcoming, recent activity, and performance data were retired.
- Browser-based Dashboard summary, pipeline, upcoming work, release readiness, analytics overview, recent activity, source update/delete behavior, and Song navigation verified.
- Dashboard API empty, summary, pipeline, upcoming, readiness, analytics, activity, live update, and delete behavior covered by automated integration-style tests.
- Dashboard Product Polish Sprint #1 completed as a frontend-only refinement with no backend API contract, endpoint, schema, or migration changes.
- Dashboard information hierarchy now presents catalog state, next attention, release readiness, stored analytics snapshots, and recent timestamp-derived changes in order.
- Dashboard loading, error, and empty states were refined, including a layout-preserving loading skeleton and a supported New Song action for the empty state.
- Songs Portfolio Product Polish Sprint #2 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, or Google Drive behavior changes.
- Songs page now presents the Song catalog as a project portfolio using only real Song API fields: `id`, `title`, `status`, and `createdAt`.
- Songs page create flow, lifecycle presentation, search/filter/sort controls, loading/error/empty states, long-title wrapping, and row navigation were refined.
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
- V1.1 Song Workspace Collaboration C0 architecture audit passed with song-scoped OWNER / EDITOR / VIEWER as the locked permission model.
- `SongMember` model created for active Song collaborators with `EDITOR` and `VIEWER` roles only.
- `SongInvitation` model created for in-app invitations between existing DARKROOM users with `PENDING`, `ACCEPTED`, `DECLINED`, and `REVOKED` statuses.
- `AddSongWorkspaceCollaboration` EF Core migration created for `SongMembers`, `SongInvitations`, collaboration check constraints, relationship constraints, membership uniqueness, and one-pending-invitation uniqueness.
- `SongAccessService` added to resolve OWNER, EDITOR, VIEWER, and NO_ACCESS and expose the canonical read/edit/member-management capability matrix.
- `SongCollaborationService` added for member/invitation lifecycle rules.
- Collaboration API endpoints added for member listing, song-scoped pending invitation listing, inviting existing DARKROOM users, current-user pending invitation inbox, accepting invitations, declining invitations, revoking pending invitations, member role changes, and member removal.
- Top-level Song list/detail queries now return owned and accepted-member Songs with `CurrentUserRole`, `CanEdit`, and `CanManageMembers` access metadata.
- Top-level Song update now allows OWNER and EDITOR users while preserving server-controlled ownership; VIEWER receives `403 Forbidden` and unrelated users receive `404 Not Found`.
- Top-level Song delete remains OWNER-only; accepted EDITOR/VIEWER users receive `403 Forbidden`.
- Dashboard and Calendar aggregates now use accepted accessible Songs instead of owner-only Song filters.
- Pending invitations, removed memberships, unrelated Songs, and legacy unowned Songs do not become visible through C3 accessible Song queries.
- Normal nested Song metadata endpoints for AudioAsset, VisualAsset, Release, ReleaseChecklist, ReleaseReadiness, ContentItem, Credit, and AnalyticsSnapshot now use the collaboration role matrix.
- OWNER and EDITOR users can mutate normal nested Song workspace metadata; VIEWER users can read and receive `403 Forbidden` for nested metadata mutation attempts.
- Authenticated users with no Song access receive `404 Not Found` for nested Song metadata endpoints, preserving anti-enumeration semantics.
- Nested child resources remain bound to the route Song id; cross-Song child/resource mismatches return `404 Not Found`.
- Audio/Visual upload, media-access, media streaming, Replace File, and Google Drive workspace/provider operations now use the collaboration role matrix.
- Requesting users determine DARKROOM authorization for media and Drive operations, while `Song.OwnerUserId` remains the canonical Google Drive storage/provider owner.
- OWNER and EDITOR users can upload and replace AudioAsset/VisualAsset files into the owner's Google Drive workspace, even when the editor has no personal Google Drive connection.
- VIEWER users can request media access and stream linked media, but receive `403 Forbidden` for upload, Replace File, and Drive workspace provisioning.
- Accepted OWNER, EDITOR, and VIEWER users can read safe Drive workspace metadata; provisioning remains OWNER-only.
- Media tokens remain bound to the requesting DARKROOM user and are revalidated against current Song membership/access on every stream request, so removed members lose access even if an old token has not expired.
- Media streaming resolves Google Drive refresh and file reads through the Song owner's Google Drive connection while preserving existing GET, HEAD, Range, and media security-header behavior.
- V1.1 Song Workspace Collaboration C6 backend security/regression verification passed without code, schema, migration, frontend, deployment, commit, or push changes.
- Frontend `Song` types now consume backend `currentUserRole`, `canEdit`, and `canManageMembers` metadata.
- A small frontend Song access helper derives OWNER, EDITOR, VIEWER, read-only, owner-only delete, and owner-only Drive provisioning UI capabilities from the backend response.
- Songs catalog rows now show shared role context and hide Song edit/delete controls according to backend access metadata; Song delete remains OWNER-only in the UI.
- Song workspace header and Overview now show role/read-only context and keep direct shared-song routes readable.
- Viewer users can read workspace tabs, media metadata, media playback/preview surfaces, release readiness/checklists, content, credits, and analytics without seeing mutation controls.
- Editor users keep normal workspace edit/upload/replace controls, and shared media upload/replace UI no longer requires the editor's personal Google Drive connection.
- Project storage setup/provisioning controls remain OWNER-only in the frontend; non-owner shared users can read safe workspace metadata without Settings prompts.
- Frontend C7 coverage verifies fail-closed access derivation, catalog role controls, viewer read-only tab behavior, editor shared upload behavior, owner-only Drive provisioning UI, and `403` auth-token preservation.
- Song workspace headers now expose a Members dialog that reads the backend member roster, shows the owner as a non-removable owner row, lists active collaborators, and gives OWNER users invite, role-change, member-remove, and pending-invitation revoke controls.
- Members UI invite flow submits existing DARKROOM account email plus `EDITOR` or `VIEWER` role to the collaboration API and surfaces backend duplicate, unknown-email, self/owner invite, and stale-permission responses without inventing frontend-only permission rules.
- The Team route now serves as the real current-user invitation inbox instead of a planned-state team page, with pending song invitations, Accept, Decline, song links, empty/loading/error states, and collaboration cache invalidation after responses.
- Frontend C8 coverage verifies owner/member/pending invitation rendering, owner management controls, editor/viewer read-only member views, invite errors, role changes, member removal, invitation revocation, inbox accept/decline, stale invitation handling, Team route navigation, and narrow-width usability.
- V1.1 Song Workspace Collaboration C9 hardened the Members dialog and Team invitation inbox without schema, deployment, commit, or push changes.
- The Members dialog now orders active workspace members, pending invitations, and invite controls distinctly; owner rows have no management controls or empty action area.
- Pending invitation rows now visibly identify pending invitations and preserve full long email/name values through accessible `title` attributes while keeping truncated layouts.
- Invite controls now use `Invite collaborator` copy, clear stale errors on meaningful input changes, disable email/role/submit controls while a request is pending, and continue to invalidate member, pending-invitation, and inbox queries after success.
- Member remove and pending-invitation revoke confirmations now keep destructive actions disabled while pending and contain rejected mutation promises while still surfacing backend stale/failure messages and refetching affected data.
- The Team invitation inbox now loads inside the authenticated app shell, preventing invitation API calls before session restore; long song titles preserve full values through `title` attributes.
- Invitation accept/decline actions now guard against duplicate clicks, mutually disable both row actions while one response is pending, and render clean stale/conflict messages using shared API problem parsing.
- Development and production CORS method allow-lists now include `PATCH`, fixing browser-based member role updates from the React frontend.
- Frontend C9 coverage adds regression tests for authenticated-shell query timing, invite pending locks, invite error reset, owner role exclusion, stale remove/revoke failures, stale invitation conflicts, accept/decline mutual exclusion, long email/title handling, and large member rosters.
- Backend C9 coverage verifies production CORS preflight support for `PATCH`, protecting browser role-update flows.
- V1.1 Song Workspace Collaboration C10 final verification passed without product-feature, schema, migration, deployment, commit, or push changes.
- C10 verified the OWNER / EDITOR / VIEWER collaboration model across automated frontend tests, automated backend tests, Release builds, local PostgreSQL migration state, live API probes, and real browser smoke checks.
- C10 live checks covered pending invitation non-access, duplicate invite conflict handling, accepted Editor and Viewer access metadata, Dashboard and Calendar visibility for accepted collaborators, Viewer read-only media metadata access, Editor media metadata mutation, non-member anti-enumeration, role update propagation, invitation accept/decline/revoke behavior, member removal access revocation, local Google Drive disconnected handling, and mobile Team overflow.
- V1.1 Song Workspace Collaboration checkpoint status: C0 PASS, C1 PASS, C2 PASS, C3 PASS, C4 PASS, C5 PASS, C6 PASS, C7 PASS, C8 PASS, C9 PASS, C10 PASS.
- V1.1 SONG WORKSPACE COLLABORATION — DONE.
- Architecture Stabilization A0 whole-project architecture and Lovable trace audit passed.
- Architecture Stabilization A1 Lovable Independence removed the active `@lovable.dev/vite-tanstack-config` build dependency and replaced it with project-owned Vite configuration.
- The frontend Vite config now directly wires TanStack Start, React, Tailwind, Vite native tsconfig path resolution, the `@` alias, React/TanStack dedupe, local dev port `8080`, the `src/server.ts` SSR error wrapper entry, and Nitro build output using a provider-neutral `node-server` preset until deployment hosting is selected.
- Active Lovable runtime error reporting was removed from the root route error boundary while preserving the generic DARKROOM error page and console logging.
- A1 verification passed after `npm ci`: frontend lint completed with the same 8 existing Fast Refresh warnings and 0 errors, frontend tests passed with 18 files and 234 tests, frontend production build succeeded, and dev-server/browser smoke confirmed route loading on `http://localhost:8080`.
- Architecture Stabilization A2 Dead Code & Dependency Cleanup removed proven-unused mock service files, unused shadcn/Radix UI primitive files, their sole direct dependency entries, the tracked Bun lock/config artifacts, `.lovable/project.json`, and passive Lovable logo asset metadata while preserving the DARKROOM logo and Song API mock fallback.
- A2 verification passed after `npm ci`: frontend lint completed with 0 errors and 5 remaining Fast Refresh warnings, frontend tests passed with 18 files and 234 tests, frontend production build succeeded, and dev-server/HTTP smoke confirmed route loading plus logo delivery on `http://localhost:8080`.
- Architecture Stabilization A3 Architecture Cleanup extracted Dashboard, Songs, Calendar, Team, Settings, and Login pages from the public `darkroom-web/src/components/darkroom/Workbench.tsx` facade into focused page modules under `darkroom-web/src/components/darkroom/pages/`.
- Routes and frontend tests now import standalone pages directly, and Song workspace routes/tests import the existing focused `darkroom-web/src/components/darkroom/workbench/Workbench.tsx` module directly.
- Shared top-level page query keys now live in `darkroom-web/src/components/darkroom/pages/page-query-keys.ts`.
- The obsolete public `darkroom-web/src/components/darkroom/Workbench.tsx` facade was removed without changing product behavior, API contracts, backend code, database schema, authentication, Google Drive/media behavior, route URLs, DARKROOM logo assets, README branding, deployment settings, or Song API fallback behavior.
- A3 verification passed: frontend lint completed with 0 errors and 5 remaining Fast Refresh warnings, frontend tests passed with 18 files and 234 tests, frontend production build succeeded, and backend `dotnet test` passed with 390 tests.
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
- Media Experience V2 architecture/design milestone completed and selected short-lived Artist OS signed media URLs backed by domain-scoped backend streaming endpoints.
- `POST /api/songs/{songId}/audio-assets/{audioAssetId}/media-access` implemented for JWT-authenticated media access issuance.
- `POST /api/songs/{songId}/visual-assets/{visualAssetId}/media-access` implemented for JWT-authenticated media access issuance.
- `GET` and `HEAD /api/songs/{songId}/audio-assets/{audioAssetId}/media?token=...` implemented for short-lived signed-token audio media delivery.
- `GET` and `HEAD /api/songs/{songId}/visual-assets/{visualAssetId}/media?token=...` implemented for short-lived signed-token visual media delivery.
- Media access tokens use ASP.NET Core Data Protection time-limited protection with a 5-minute lifetime and are bound to user, Song, asset kind, asset id, linked ExternalFileReference id, and stream purpose.
- Media GET/HEAD requests re-resolve persisted ownership and link state; token contents alone are not treated as sufficient authorization.
- Media delivery supports full GET, HEAD, and single byte-range GET with `200 OK`, `206 Partial Content`, and `416 Range Not Satisfiable` behavior.
- Byte-range media requests are forwarded to the Google Drive provider abstraction instead of fetching the full file for a partial browser seek.
- Media responses set private/no-store cache behavior, `Accept-Ranges: bytes`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: no-referrer`.
- Media V2.0 backend behavior is covered by 24 focused automated integration-style tests using fake OAuth and fake Drive clients.
- Media V2.0 verification on 2026-09-07: `dotnet build` passed, full `dotnet test` passed with 271 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 117 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Media Experience V2.1 inline Audio Playback implemented for linked AudioAsset records in the Audio workspace.
- Audio playback uses `POST /api/songs/{songId}/audio-assets/{audioAssetId}/media-access` to acquire a short-lived signed Artist OS media URL before assigning it to the native audio element.
- Audio playback supports play/pause, seek, elapsed/duration display, loading/buffering/error states, near-expiry media-access refresh, one automatic stale-token recovery attempt, and one active player at a time.
- Metadata-only/unlinked AudioAsset records do not render fake disabled playback controls.
- Focused frontend playback tests cover linked/unlinked rendering, signed media URL use, play/pause, seek, duration/time updates, buffering/end/error states, stale media access refresh, one-active-player behavior, safe Drive guidance errors, accessible controls, and absence of waveform/download/replace controls.
- Media V2.1 verification on 2026-09-07: `dotnet build` passed, full `dotnet test` passed with 271 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 137 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Media Experience V2.2 inline Image Preview implemented for linked image VisualAsset records in the Visuals workspace.
- Image preview uses `POST /api/songs/{songId}/visual-assets/{visualAssetId}/media-access` to acquire a short-lived signed Artist OS media URL before assigning it to native image elements.
- Image preview supports compact row previews, a larger accessible dialog preview, PNG/JPEG/WEBP detection from MIME type or safe extension, loading/error/retry states, near-expiry media-access refresh for large preview open, and stale linked-file invalidation.
- Metadata-only/unlinked VisualAsset records and video VisualAsset records do not render fake image previews or request image media access.
- Focused frontend image preview tests cover linked/unlinked rendering, signed media URL use, loading/load/error states, retry, disconnected/reauth guidance, PNG/JPEG/WEBP support, unsupported SVG/video exclusion, large dialog open/close, stale access refresh, linked-file change invalidation, accessibility labels, no signed URL persistence, and absence of download/version/edit-image controls.
- Media V2.2 verification on 2026-09-07: `dotnet build` passed, full `dotnet test` passed with 271 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 159 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Media Experience V2.3 inline Video Preview implemented for linked video VisualAsset records in the Visuals workspace.
- Video preview uses `POST /api/songs/{songId}/visual-assets/{visualAssetId}/media-access` to lazily acquire a short-lived signed Artist OS media URL on first Play before assigning it to a native video element.
- Video preview supports MP4, MOV, and WEBM detection from MIME type or safe extension, play/pause, seek, elapsed/duration display, loading/buffering/error states, near-expiry media-access refresh before new playback attempts, one controlled stale-token retry after native media failure, stale linked-file invalidation, and one active video at a time inside the Visuals workspace.
- Browser codec support is treated as best-effort: unsupported/corrupt/provider-failed playback keeps the VisualAsset usable and shows product fallback copy instead of claiming all uploaded videos are playable.
- Metadata-only/unlinked VisualAsset records and image VisualAsset records do not render fake video playback or request video media access.
- Focused frontend video preview tests cover linked/unlinked rendering, image/video separation, signed media URL use, no autoplay, play/pause, seek, duration/time updates, buffering/end/error states, disconnected/reauth guidance, codec/browser fallback, stale media access refresh/retry, one-active-video behavior, linked-file change invalidation, accessible controls, no signed URL persistence, and absence of download/version/transcoding/poster controls.
- Media V2.3 verification on 2026-09-07: `dotnet build` passed, full `dotnet test` passed with 271 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 185 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Media Experience V2.4 Asset Versioning & Replace File implemented for AudioAsset and VisualAsset records.
- `AssetFamilyId` added to AudioAsset and VisualAsset as the stable version-lineage identifier.
- The `AddAssetVersionFamilies` EF Core migration was created and applied.
- Existing VisualAsset rows are backfilled with one independent family per row.
- Existing AudioAsset rows are backfilled into shared families only for unambiguous old `SongId + Type` groups; ambiguous groups safely receive one independent family per row.
- Database constraints now enforce unique `(AssetFamilyId, Version)` values and at most one current row per asset family.
- Normal Add Audio/Visual asset creates a new independent family with server-controlled version `1` and `IsCurrent = true`.
- Audio and Visual metadata updates no longer let clients alter version number or current-version state.
- `POST /api/songs/{songId}/audio-assets/{audioAssetId}/versions` creates a metadata-only next AudioAsset version in the same family, makes it current, demotes the previous current version, and leaves file/link metadata empty.
- `POST /api/songs/{songId}/visual-assets/{visualAssetId}/versions` creates a metadata-only next VisualAsset version in the same family, makes it current, demotes the previous current version, and leaves file/link metadata empty.
- New version numbers are server-generated as max existing family version plus one and are not reused after deletion.
- `POST /api/songs/{songId}/audio-assets/{audioAssetId}/replace-file` replaces the linked file reference on the same AudioAsset row without changing id, family, version, type, or current state.
- `POST /api/songs/{songId}/visual-assets/{visualAssetId}/replace-file` replaces the linked file reference on the same VisualAsset row without changing id, family, version, type, or current state.
- Replace File requires an already-linked asset; unlinked assets return a conflict directing the user to upload first.
- Replace File creates a new provider file and new `ExternalFileReference`, detaches the old file reference from active asset ownership, and intentionally does not delete the old Google Drive binary.
- Replace File preserves Draft/Review/InProgress status and moves Approved/Final assets back to Review.
- Deleting the current version promotes the highest remaining version in that family; deleting a historical version does not alter the current version.
- Audio and Visuals tabs now group records by asset family, show version counts, expose Create New Version, and show Replace File only for linked records.
- Metadata-only created versions show a clear no-file-attached state instead of fake upload/playback/preview controls.
- Media V2.4 verification on 2026-09-08: `dotnet build` passed, full `dotnet test` passed with 293 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 190 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Release Readiness Automation implemented without database schema changes or migrations.
- `ReleaseReadinessService` is the canonical backend source for readiness calculation across Release Workspace, Song Overview, and Dashboard.
- `GET /api/songs/{songId}/release/readiness` returns `Ready`, `Incomplete`, and `NotRequired` readiness items with `Derived`, `Hybrid`, or `Manual` source metadata and user-facing reasons.
- Master readiness is derived from any current linked Final AudioAsset with type `Master`; historical non-current Final versions do not count.
- Cover readiness is derived from any current linked Final VisualAsset with type `CoverArt`.
- Spotify Canvas is required only when the Release platforms include exact `Spotify`; otherwise it is `NotRequired` and excluded from the readiness denominator.
- Credits readiness is hybrid: at least one Credit with all contributors confirmed is derived ready, while manual checklist completion can still mark the item ready.
- Content Plan readiness is hybrid: at least one non-Idea ContentItem is derived ready, while manual checklist completion can still mark the item ready.
- Metadata readiness is hybrid and requires Release date, valid Release type, and at least one platform; Distributor, ISRC, UPC, and Release status are not treated as proof.
- Music Video remains optional/manual in this first implementation and is excluded from required readiness unless manually completed.
- Manual completion override is blocked for derived-only Master, Cover, and Canvas checklist keys; notes remain editable.
- AudioAsset, VisualAsset, Credit, ContentItem, Release, and ReleaseChecklist frontend mutations invalidate the canonical Release readiness query.
- Release Readiness Automation verification on 2026-09-08: `dotnet build` passed, full `dotnet test` passed with 313 backend tests, `npm run lint` passed with 0 errors and the existing 8 Fast Refresh warnings, `npm run test` passed with 190 frontend tests, and `npm run build` passed with existing Vite/Nitro advisories.
- Browser smoke verification on 2026-09-08 created a local disposable user, created a Release Preparation Song, created a Spotify Release, and confirmed Release Workspace, Song Overview, and Dashboard display the canonical `1 / 6` required readiness state from real backend data.
- Product Completion Audit found no Product P0 blockers and identified the old mock Team surface as the only accepted Product P1 gap before Product V1 Feature Freeze.
- Team route now presents DARKROOM SYSTEM V1 as a personal workspace, with future collaboration clearly planned instead of mocked.
- Fake Team collaborators and Invite behavior were removed from the V1 frontend surface.
- Application Security Hardening S2 completed without schema changes, migrations, Google scope changes, Drive file/folder feature work, JWT architecture redesign, or product-scope reopening.
- Auth endpoints now use a strict rate-limit policy for register/login.
- Normal API, aggregate read API, media-access, media-stream, and upload/replace-file endpoint groups now use dedicated app-level rate/concurrency-limit policies.
- Login and registration password inputs are bounded at 200 characters in backend DTO validation and the frontend auth form.
- Backend-generated public API/frontend URLs now flow through trusted `PublicUrls` configuration with Development localhost fallback and non-Development startup validation.
- Google OAuth callback URLs, Settings redirects, and signed media URLs now use trusted public URL generation instead of request `Host` header values.
- Production CORS now requires exact configured frontend origins and does not use wildcard origins or credentialed browser cookies.
- Forwarded headers are enabled with conservative ASP.NET Core defaults and a single-forward limit for future reverse-proxy deployment.
- Production exception handling now returns generic JSON `500` responses while logging unexpected exceptions server-side.
- API security headers are applied, including `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and production `Strict-Transport-Security` plus API CSP.
- Data Protection now has a stable application-name configuration and a production key-ring path hook; non-Development startup fails when the key-ring path is missing.
- Focused backend security-hardening tests were added for auth/API/media/upload limits, password bounds, trusted public URL behavior, production CORS/security headers, callback redirects, and production Data Protection startup validation.
- Security S4A local attack-oriented application verification completed without runtime application code changes, schema changes, migrations, product features, deployment work, cloud resources, provider selection, commits, or pushes.
- S4A added focused backend attack-verification tests for JWT tampering variants, hostile CORS origin behavior, malicious Host safety for media URLs, Data Protection restart persistence, Data Protection purpose isolation, double-extension/path-segment upload filenames, malformed/multi-range media requests, intentional short-lived media-token replay behavior, and production-like security headers.
- S4A frontend inspection found no user-controlled raw HTML or Markdown rendering path. The existing `dangerouslySetInnerHTML` usage is limited to chart CSS variable style generation from chart configuration.
- S4A local server probe found no running frontend on `http://localhost:8080` and no running backend on `http://localhost:5178`, so optional browser smoke was not performed in this verification pass.
- Focused Dashboard frontend tests were updated for the polished command-center labels and still cover success, empty, loading, error/retry, metrics, upcoming, readiness, analytics, recent activity, and navigation behavior.
- Focused Songs frontend tests were updated for polished portfolio labels, empty/loading/error/retry states, search/lifecycle filtering, workspace row links, create validation, create failure display, and long-title rendering.
- Song Workspace Overview Product Polish Sprint #3 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, or Google Drive architecture changes.
- Song workspace shell now emphasizes project identity, lifecycle state, created date, a quiet Projects back link, and controlled responsive tabs.
- Song workspace Overview now summarizes real existing workspace data for project state, next attention, workspace areas, release readiness, and project storage.
- Song workspace Overview no longer shows fake artwork, fake artist metadata, mock task lists, mock collaborators, fake BPM/key/genre/release metrics, or lifecycle percentage math.
- Google Drive disconnected storage is now treated as a normal Overview state; the Overview checks connection status first and does not call the Drive workspace endpoint while disconnected.
- Focused Song Workspace Overview frontend tests cover empty, populated, partial-error, loading, not-found, unexpected-error, tab navigation, and Google Drive storage states.
- Audio Workspace Product Polish Sprint #4 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive OAuth, or Drive upload behavior changes.
- Audio tab information hierarchy now presents the real Audio workspace header, total/linked/final summary, and populated asset type sections only.
- Audio tab empty state now uses one product-focused empty state instead of four large empty type panels.
- Audio asset rows now emphasize real file identity, asset type/version, status/current state, duration, size, added date, and Drive file association status.
- Audio upload UX now distinguishes connected, disconnected, reauthorization, checking, linked-file, and backend upload failure states using product copy instead of raw API ProblemDetails JSON.
- Audio linked-file UX now shows safe `ExternalFileReference` metadata and only renders Open in Drive when a safe `webViewLink` is available.
- Audio delete confirmation now clearly states that deleting an Artist OS AudioAsset with a linked Drive file leaves the external Google Drive binary in place.
- Misleading Audio copy and fake waveform-like mini bars were removed from the Audio tab.
- Focused Audio upload/frontend tests cover metadata upload action, linked file display, productized backend upload failure, empty state, populated sections, create/edit metadata, delete copy, disconnected Drive, reauth Drive, safe Open in Drive behavior, and absence of token text.
- Visuals Workspace Product Polish Sprint #5 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive OAuth, or Drive upload behavior changes.
- Visuals tab information hierarchy now presents the real Visuals workspace header, total/linked/final/video summary, and populated asset type sections only.
- Visuals tab empty state now uses one product-focused empty state instead of six large empty type panels.
- Visual asset rows now emphasize real file identity, asset type/version, status/current state, dimensions, size, added date, and Drive file association status.
- Visual upload UX now distinguishes connected, disconnected, reauthorization, checking, linked-file, and backend upload failure states using product copy instead of raw API ProblemDetails JSON.
- Visual linked-file UX now shows safe `ExternalFileReference` metadata and only renders Open in Drive when a safe `webViewLink` is available.
- Visual delete confirmation now clearly states that deleting an Artist OS VisualAsset with a linked Drive file leaves the external Google Drive binary in place.
- Misleading Visual fake preview/gallery frames and placeholder labels were removed from the Visuals tab.
- Focused Visual upload/frontend tests cover image upload action, video upload action, linked file display, productized backend upload failure, empty state, populated sections, create/edit metadata, delete copy, disconnected Drive, reauth Drive, safe Open in Drive behavior, and absence of token text.
- Release Workspace Product Polish Sprint #6 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive OAuth, Drive architecture, or upload behavior changes.
- Release tab information hierarchy now presents `RELEASE / CONTROL`, Release State, Release Details, Readiness, and Preparation Checklist.
- No-release state now uses one focused `NO RELEASE SET UP` state and does not render checklist rows before a Release exists.
- Release state/details now present status, release date, release type, distributor, platforms, ISRC, UPC, created date, and updated date using existing real Release fields.
- Readiness now uses the canonical backend Release readiness response for required-ready count, percentage, and next incomplete readiness reason.
- Checklist rows are compact and keep notes behind Add/Edit note dialogs while still showing saved note previews.
- Delete confirmation clarifies that removing Release setup removes Release metadata and the preparation checklist from DARKROOM SYSTEM while the parent Song remains.
- Misleading publishing/distributor/sync copy was removed from the Release tab; no publishing actions, platform sync, ISRC/UPC generation, or distributor validation were introduced.
- Focused Release frontend tests cover loading, error, no-release, create/edit/delete, state/details/platforms/identifiers, readiness, checklist completion, notes, checklist failure, and truth-in-UX behavior.
- Content Workspace Product Polish Sprint #7 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive OAuth, Drive architecture, upload, Calendar, or Dashboard behavior changes.
- Content tab information hierarchy now presents `CONTENT / PRODUCTION`, Summary, Content Pipeline, and Content Items.
- Content summary derives total, in-production, scheduled, and published counts from real ContentItem status and date fields.
- Content pipeline presents canonical ContentItem statuses as compact counts instead of unsupported publishing columns.
- Content item rows now emphasize title, type, status, platform, owner, due date, scheduled date, published date, notes preview, and updated date using existing real fields.
- Create/edit/delete UX was refined around existing metadata fields only; no social publishing, media upload, external sync, Drive, Calendar, Dashboard, or authentication behavior was added.
- Content date presentation distinguishes due, scheduled, and published dates; published items with old due dates are not treated as overdue active production work.
- Misleading Content copy was removed, including `Real backend data`, repeated no-publish row text, upload/media delete implications, and internal future-work placeholders.
- Focused Content frontend tests cover hierarchy, summary/pipeline, item presentation, create/edit/delete, date behavior, loading/error/empty states, and truth-in-UX copy.
- Credits Workspace Product Polish Sprint #8 completed as a frontend-only refinement with no backend API contract, endpoint, schema, migration, auth, ownership, Google Drive OAuth, Drive architecture, upload, Calendar, Dashboard, or other workspace tab behavior changes.
- Credits tab information hierarchy now presents `CREDITS / CONTRIBUTORS`, Summary, Credit Coverage / Planned Splits, and Contributors.
- Credits summary derives total credits, distinct contributor names, confirmed credits, and pending credits from real Credit metadata.
- Planned split coverage displays the recorded split total as informational metadata only; missing splits are allowed and no Song-level `100%` validation, royalty, payout, contract, or publishing workflow was introduced.
- Credit rows now emphasize contributor name, role, status, contact, planned split, updated date, notes preview, and created date using existing real fields.
- Create/edit/delete UX was refined around existing Credit metadata fields only; no contributor accounts, invitations, team membership, signatures, contracts, royalties, payouts, legal ownership, publishing registration, or external platform behavior was added.
- Missing contact, missing planned split, and pending confirmation indicators are presentation-only attention cues.
- Misleading Credits copy was removed, including `Real backend data`, collaborator/account/invite wording, repeated legal/payment disclaimers, and internal future-work placeholders.
- Focused Credits frontend tests cover hierarchy, summary, contributor presentation, create/edit/delete, validation, loading/error/empty states, planned split metadata behavior, and truth-in-UX copy.

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
ReleaseReadinessController -> ReleaseReadinessService -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
CalendarController -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
DashboardController -> ReleaseReadinessService -> AppDbContext -> EF Core -> Npgsql -> PostgreSQL
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

Production/non-Development CORS is environment-aware and requires exact configured frontend origins from `Cors:AllowedOrigins` and/or `PublicUrls:FrontendBaseUrl`. It does not fall back to wildcard origins or credentialed browser cookies.

Trusted public URL generation is centralized through `PublicUrlService` and currently covers Google OAuth callback URL generation, Google Drive Settings redirect fallback, and signed media URL generation. Development falls back to:

```text
API: http://localhost:5178
Frontend: http://localhost:8080
```

Non-Development startup validates configured public URLs, CORS origins, non-wildcard `AllowedHosts`, and Data Protection key-ring path before serving requests.

Current frontend architecture:

```text
TanStack Router routes
  -> DARKROOM SYSTEM app shell/pages
  -> TanStack Query
  -> isolated Auth, Song, AudioAsset, VisualAsset, Release, ReleaseChecklist, ReleaseReadiness, ContentItem, Credit, AnalyticsSnapshot, Calendar, Dashboard, Google Drive, and Drive Workspace API services
  -> ASP.NET Core API
```

Remaining future-only support data is isolated under `darkroom-web/src/services/mock/` where still used. The Team route no longer renders mock collaborators.

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

The frontend also uses the real backend for canonical Release readiness:

```text
GET    /api/songs/{songId}/release/readiness
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

These visible or planned areas are not backend-backed production capabilities yet:

- Audio waveform display, download-original, replacement audit/history views, and external Drive file deletion.
- Visual thumbnails/posters, transcoding, download-original, replacement audit/history views, and external Drive file deletion.
- Content publishing and platform delivery.
- Contributor directory, team permissions, contracts, royalties, and payout workflow.
- External analytics ingestion and automated platform sync.
- Standalone calendar events, reminders, drag/drop rescheduling, and external calendar sync.
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

- Uses the canonical `ReleaseReadinessService`.
- Derives required-ready count, required count, total item count, rounded readiness percentage, item state, source, and reason.
- Excludes `NotRequired` items from the percentage denominator.
- Does not store readiness percentages or write derived readiness back to ReleaseChecklist rows.

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
- `AssetFamilyId` uuid, required.
- `Type` character varying(40), required.
- `FileName` character varying(255), required.
- `Version` integer, required.
- `Status` character varying(40), required.
- `DurationSeconds` integer, optional.
- `FileSizeBytes` bigint, optional.
- `UploadedAt` timestamp with time zone, required.
- `IsCurrent` boolean, required.
- `ExternalFileReferenceId` integer, optional, foreign key to `ExternalFileReferences`.
- Unique index on (`AssetFamilyId`, `Version`).
- Filtered unique current-version index on `AssetFamilyId` where `IsCurrent` is true.

Current `VisualAssets` schema:

- `Id` integer primary key, generated by PostgreSQL identity.
- `SongId` integer, required, foreign key to `Songs`.
- `AssetFamilyId` uuid, required.
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
- Unique index on (`AssetFamilyId`, `Version`).
- Filtered unique current-version index on `AssetFamilyId` where `IsCurrent` is true.

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
- Dashboard external analytics sync, notifications, audit history, and distributor delivery are described as future work.
- Browser requests from `http://localhost:8080` to `http://localhost:5178` are allowed in Development by the backend CORS policy.
- Protected backend endpoints return `401 Unauthorized` when no authenticated session exists.
- Missing, unowned, cross-user, and legacy-unowned Song-scoped resources return `404 Not Found`.
- Dashboard and Calendar aggregates are filtered to the current authenticated user.
- Expired, missing, malformed, or invalid JWT access tokens return `401 Unauthorized`.
- Application rate limiting returns `429 Too Many Requests` with a generic JSON error and a safe `Retry-After` header.
- Upload and replace-file endpoints use an app-level concurrency limiter to reduce duplicate large-file operations per user/IP partition.
- Media-access and media-stream endpoints use dedicated limits separate from normal metadata APIs.

Production/non-Development backend exception handling now returns a generic JSON `500` response and logs unexpected exceptions server-side without exposing stack traces through API responses.

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
- Frontend automated tests currently have 211 focused tests.
- Auth API behavior has automated integration-style coverage for registration, duplicate email, login, invalid credentials, current JWT, logout semantics, password hash safety, malformed tokens, expired tokens, and unauthenticated access.
- Song owner assignment has automated integration-style coverage for authenticated creates and spoofed owner rejection.
- Resource ownership has automated integration-style coverage for unauthenticated `401`, cross-user `404`, nested Song resource scoping, Calendar/Dashboard scoping, and legacy unowned Song invisibility.
- Song collaboration foundation has automated coverage for `SongMember`, `SongInvitation`, collaboration constraints, song delete cascade cleanup, `SongAccessService` role resolution, capability evaluation, owner precedence, legacy unowned Song no-access behavior, and existing endpoint owner-only regression during C1.
- Song collaboration APIs have automated coverage for member list access, owner response representation, owner-only invite/revoke/role-change/removal, editor/viewer member-list access, current-user invitation inbox scoping, accept/decline lifecycle, cross-song member/invitation IDOR protection, invitation ownership IDOR protection, server-controlled-field overposting resistance, and existing endpoint owner-only regression during C2.
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
- Security hardening behavior has automated backend coverage for auth rate limiting, normal API rate limiting, aggregate rate limiting, media stream rate limiting, upload concurrency limiting, password length bounds, trusted public URL generation, production CORS/security headers, callback redirect URL trust, and production Data Protection startup validation.
- Security S4A attack-verification behavior has automated backend coverage for JWT tampering variants, hostile CORS origin behavior, malicious Host safety for media URLs, Data Protection restart persistence, Data Protection purpose isolation, double-extension/path-segment upload filenames, malformed/multi-range media requests, accepted short-lived media-token replay, and production-like security headers.
- V1.1 Song Workspace Collaboration C6 backend security/regression verification covered C1-C5 collaboration authorization, owner precedence, invitation/member access separation, removal and role-change revocation, Song and nested-domain IDOR, Dashboard/Calendar scoping, media-token validation, Google Drive owner-backed storage, upload/replace authorization, safe API errors, token non-exposure, and V1 regression behavior.

Verification run during the Security S4A Local Attack-Oriented Application Security Verification milestone:

```text
dotnet build ArtistOS.slnx
dotnet test ArtistOS.slnx
npm run lint
npm run test
npm run build
frontend/backend localhost availability probe
frontend unsafe-rendering scan
backend sensitive-logging scan
```

Results:

```text
dotnet build ArtistOS.slnx: succeeded, 0 warnings, 0 errors.
dotnet test ArtistOS.slnx: succeeded, 336 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test: succeeded, 195 passed, 0 failed, 0 skipped.
npm run build: succeeded with existing Vite/Nitro advisories.
localhost probe: frontend and backend were not running, so optional browser smoke was not performed.
frontend unsafe-rendering scan: no user-controlled raw HTML/Markdown rendering path found.
backend sensitive-logging scan: no intentional logging of JWTs, Google tokens, OAuth codes/state, PKCE verifier, signed media tokens, JWT signing key, Google ClientSecret, or DB password found.
```

Verification run during the V1.1 Song Workspace Collaboration C1 foundation milestone:

```text
dotnet build ArtistOS.slnx
dotnet test ArtistOS.slnx
```

Results:

```text
dotnet build ArtistOS.slnx: succeeded, 0 warnings, 0 errors.
dotnet test ArtistOS.slnx: succeeded, 351 passed, 0 failed, 0 skipped.
```

Verification run during the V1.1 Song Workspace Collaboration C2 member and invitation backend API milestone:

```text
dotnet build ArtistOS.slnx
dotnet test ArtistOS.slnx
```

Results:

```text
dotnet build ArtistOS.slnx: succeeded, 0 warnings, 0 errors.
dotnet test ArtistOS.slnx: succeeded, 364 passed, 0 failed, 0 skipped.
```

Verification run during the Application Security Hardening S2 milestone:

```text
dotnet build ArtistOS.slnx
dotnet test ArtistOS.slnx --no-build
npm run lint
npm run test
npm run build
```

Results:

```text
dotnet build ArtistOS.slnx: succeeded, 0 warnings, 0 errors.
dotnet test ArtistOS.slnx --no-build: succeeded, 324 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test: succeeded, 195 passed, 0 failed, 0 skipped.
npm run build: succeeded with existing Vite/Nitro advisories.
```

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

Latest Dashboard Product Polish frontend verification:

```text
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run test -- --run: succeeded, 35 passed, 0 failed, 0 skipped.
npm run build: succeeded.
```

Latest Songs Portfolio Product Polish frontend verification:

```text
npm run test -- --run src/components/darkroom/SongsPage.test.tsx: succeeded, 9 passed, 0 failed, 0 skipped.
npm run test -- --run: succeeded, 40 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded.
```

Latest Song Workspace Overview Product Polish frontend verification:

```text
npm run test -- --run src/components/darkroom/SongWorkspaceOverview.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test -- --run: succeeded, 50 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded.
```

Latest Content Workspace Product Polish Sprint #7 verification:

```text
npm run test -- ContentWorkspace.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test: succeeded, 96 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded. Vite emitted an existing `vite-tsconfig-paths` advisory and Nitro emitted an existing `inlineDynamicImports` advisory; neither failed the build.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 247 passed, 0 failed, 0 skipped.
Real browser verification: completed against local backend/frontend using a disposable authenticated user and Song.
```

Latest Credits Workspace Product Polish Sprint #8 verification:

```text
npm run test -- CreditsWorkspace.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test: succeeded, 106 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded. Vite emitted an existing `vite-tsconfig-paths` advisory and Nitro emitted an existing `inlineDynamicImports` advisory; neither failed the build.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 247 passed, 0 failed, 0 skipped.
Real browser verification: completed against local backend/frontend using a disposable authenticated user and Song.
```

Latest Analytics Workspace Product Polish Sprint #9 verification:

```text
npm run test -- AnalyticsWorkspace.test.tsx: succeeded, 11 passed, 0 failed, 0 skipped.
npm run test: succeeded, 117 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded. Vite emitted an existing `vite-tsconfig-paths` advisory and Nitro emitted an existing `inlineDynamicImports` advisory; neither failed the build.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 247 passed, 0 failed, 0 skipped.
Real browser verification: completed against local backend/frontend using a disposable authenticated user and Song.
```

Latest Song Workspace Architecture & Stabilization Sprint #10 verification:

```text
npm run test -- AnalyticsWorkspace.test.tsx: succeeded, 11 passed, 0 failed, 0 skipped.
npm run test -- CreditsWorkspace.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test -- ContentWorkspace.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test -- ReleaseWorkspace.test.tsx: succeeded, 14 passed, 0 failed, 0 skipped.
npm run test -- SongWorkspaceOverview.test.tsx: succeeded, 10 passed, 0 failed, 0 skipped.
npm run test -- AssetUpload.test.tsx: succeeded, 25 passed, 0 failed, 0 skipped.
npm run test: succeeded, 117 passed, 0 failed, 0 skipped.
npm run lint: completed with 0 errors and 8 existing Fast Refresh warnings.
npm run build: succeeded. Vite emitted the existing `vite-tsconfig-paths` advisory and Nitro emitted the existing `inlineDynamicImports` advisory; neither failed the build.
dotnet build: succeeded, 0 warnings, 0 errors.
dotnet test: succeeded, 247 passed, 0 failed, 0 skipped.
Real browser regression verification: completed against local backend/frontend using a disposable authenticated user and Song with Overview, Audio, Visuals, Release, Content, Credits, and Analytics populated.
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
- Songs loading state.
- Songs error state and retry action.
- Songs search and lifecycle filtering.
- Songs project row navigation links.
- Songs long-title rendering without mock artist, BPM, collaborator, release date, artwork, or progress metadata.
- Create Song dialog interaction and request payload construction.
- Create Song required-title validation before sending a request.
- Create Song backend failure display.
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
- Song workspace Overview empty-state summary using real Song and related workspace API data.
- Song workspace Overview populated-state summary for audio assets, visual assets, release, checklist readiness, content, credits, and analytics snapshots.
- Song workspace Overview partial secondary-query failure behavior.
- Song workspace Overview structured loading, not-found, and unexpected-error states.
- Song workspace Overview tab navigation through the next-attention and workspace-area actions.
- Song workspace Google Drive disconnected, connected/unprovisioned, provision action, and provisioned storage states without rendering folder ids or token material.
- Content workspace hierarchy, real summary counts, canonical pipeline counts, item presentation, create/edit/delete metadata flows, date status labels, empty/loading/error states, and unsupported publishing/upload/sync copy removal.
- Credits workspace hierarchy, real summary counts, contributor presentation, create/edit/delete metadata flows, planned split metadata display, validation, empty/loading/error states, and unsupported invite/account/contract/payment/royalty/legal copy removal.
- Analytics workspace hierarchy, latest-per-platform display, chronological history, recorded-platform filtering, same-platform deltas, create/edit/delete metadata flows, validation, duplicate-date conflict copy, loading/error/empty states, and unsupported live sync/import/API status/chart copy removal.

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
- Dashboard canonical Release readiness derivation from existing asset, credit, content, Release, and manual checklist records.
- Dashboard readiness changes reflected immediately after source records change.
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
- This earlier VisualAsset metadata verification predated Visuals Product Polish Sprint #5, which later removed placeholder visual frames.
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
- Checking supported manual items updated persisted checklist state.
- Unchecking an item cleared its server-controlled `CompletedAt` timestamp.
- Completed items retained server-controlled `CompletedAt` timestamps.
- Canonical readiness is calculated by the backend and not stored as a separate percentage.
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

Latest browser Content Workspace Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real ContentItem metadata through the existing authenticated backend APIs.
- Content tab rendered the polished `CONTENT / PRODUCTION` hierarchy with Summary, Content Pipeline, and Content Items.
- Summary counts and pipeline counts reflected persisted ContentItem source data.
- Browser-based ContentItem metadata create, edit, and delete worked through the existing API integration.
- Calendar displayed Content Due and Scheduled Content entries after the browser-edited ContentItem dates were moved into the current month.
- Delete confirmation stated that only the ContentItem planning metadata is removed from DARKROOM SYSTEM and did not imply uploaded media deletion.
- Content UI no longer rendered stale `Real backend data`, repeated no-publish row copy, upload/media delete implications, or internal future-work placeholders.
- Desktop and mobile viewport checks confirmed long content titles wrapped without breaking the layout.
- Desktop and mobile screenshots were captured at `output/playwright/content-polish/content-workspace-desktop.png` and `output/playwright/content-polish/content-workspace-mobile.png`.
- A disposable browser-created ContentItem was deleted through the UI, and the temporary verification Song was deleted through the API after verification.
- Browser console still showed an existing `GET /api/songs/{id}/release` `404 Not Found` when a Song has no Release. It did not block Content verification, but it remains console noise to address in a later polish/cleanup pass.

Latest browser Credits Workspace Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real Credit metadata through the existing authenticated backend APIs.
- Credits tab rendered the polished `CREDITS / CONTRIBUTORS` hierarchy with Summary, Credit Coverage / Planned Splits, and Contributors.
- Empty state appeared when a Song had no Credits, and planned split coverage stayed hidden until real Credit data existed.
- Browser-based Credit metadata create, edit, and delete worked through the existing API integration.
- Page refresh preserved real Credit metadata loaded from the backend.
- Summary counts reflected persisted Credit source data, including total Credits, distinct contributor names, confirmed, and pending counts.
- Planned split coverage displayed an exact `100% recorded` state from persisted Credit split metadata while still allowing one missing split.
- Same contributor/different role records, Pending and Confirmed states, missing contact, missing planned split, zero split, notes preview, and long contributor/contact wrapping were verified.
- Delete confirmation now states that only contributor credit metadata is removed and does not introduce unsupported payment, royalty, legal, contract, invite, account, or publishing workflow language.
- Desktop and mobile viewport checks confirmed the polished Credits layout remains readable and actionable.
- Desktop and mobile screenshots were captured at `output/playwright/credits-polish/credits-workspace-desktop.png` and `output/playwright/credits-polish/credits-workspace-mobile.png`.
- A disposable browser-created Credit was deleted through the UI, and the temporary verification Song was deleted through the API after verification.
- Browser console still showed existing route-guard/no-release noise: one initial `401 Unauthorized` from navigating directly before login state was restored and existing `GET /api/songs/{id}/release` `404 Not Found` requests when a Song has no Release. These did not block Credits verification.

Latest browser AnalyticsSnapshot checks confirmed:

- Song workspace loaded at `/songs/{songId}` with real Song and AnalyticsSnapshot data.
- Analytics tab rendered the polished `ANALYTICS / PERFORMANCE` hierarchy with Latest Performance and Performance History.
- Empty state appeared when a Song had no AnalyticsSnapshots and did not render fake charts or zero-performance cards.
- A YouTube AnalyticsSnapshot was created through the frontend with large values and zero values.
- A clean browser load confirmed persisted backend snapshots appeared in the Analytics tab.
- Latest Performance selected the latest stored snapshot per platform and did not sum historical cumulative snapshots.
- Performance History displayed snapshots chronologically by measurement date.
- Same-platform delta copy appeared as `change since previous snapshot` and compared only YouTube to the previous YouTube snapshot.
- Recorded-platform filtering limited history to available platforms.
- Watch time remained displayed in minutes.
- AnalyticsSnapshot metadata was edited through the frontend and the updated view count persisted.
- Delete confirmation stated that only recorded DARKROOM SYSTEM performance data is removed and no external platform analytics are affected.
- Deleted AnalyticsSnapshot metadata disappeared from the Analytics tab.
- Dashboard analytics overview still used the latest stored AnalyticsSnapshot for the Song/platform after the Analytics tab polish.
- Analytics UI did not render unsupported live sync, import, external API status, OAuth, platform ingestion, or fake chart controls.
- Desktop and mobile screenshots were captured at `output/playwright/analytics-polish/analytics-workspace-desktop.png` and `output/playwright/analytics-polish/analytics-workspace-mobile.png`.
- The temporary verification Song was deleted through the API after verification, and the temporary QA state file was removed.
- Browser console still showed the existing no-release noise: `GET /api/songs/{id}/release` `404 Not Found` requests when a Song has no Release. These did not block Analytics verification.

Latest browser Song Workspace Architecture & Stabilization checks confirmed:

- Local backend and frontend loaded at `http://localhost:5178` and `http://localhost:8080`.
- A disposable authenticated user and Song were seeded through existing APIs.
- The disposable Song included one real AudioAsset, VisualAsset, Release, ContentItem, Credit, and AnalyticsSnapshot record.
- Dashboard loaded the seeded aggregate data and linked into the Song workspace.
- Song Workspace Overview loaded the extracted shell, tab rail, workspace summary, release readiness, and Drive disconnected storage state.
- Audio, Visuals, Release, Content, Credits, and Analytics tabs rendered populated real backend data after extraction.
- Tab switching across all seven Song Workspace tabs worked in the browser.
- Desktop and mobile screenshots were captured at `output/playwright/architecture-stabilization/song-workspace-desktop.png` and `output/playwright/architecture-stabilization/song-workspace-mobile.png`.
- Browser console showed no errors or warnings during the release-present regression pass.
- The temporary verification Song was deleted through the API after verification.

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
- Release readiness is now served by the canonical backend readiness service; older browser notes used checklist-count wording before this automation milestone.
- Analytics overview showed the latest stored AnalyticsSnapshot for the Song/platform instead of summing older snapshots.
- Recent activity showed conservative timestamp-derived activity without fake users or external sync claims.
- Clicking a Dashboard readiness row opened the source Song workspace.
- Dashboard Product Polish Sprint #1 verified the refined command-center hierarchy on desktop and mobile browser viewports using local real API data.
- Browser screenshots were captured at `output/playwright/dashboard-polish/dashboard-desktop.png` and `output/playwright/dashboard-polish/dashboard-mobile.png`.
- Updating a Release to `Released` removed it from upcoming release/readiness aggregates.
- Deleting a ContentItem removed its Dashboard upcoming entries.
- Refreshing Dashboard preserved the persisted aggregate state.
- Browser console showed no CORS/API errors on the Dashboard route during verification.
- Clicking from Dashboard into the Song workspace succeeded; at that time the workspace emitted a Google Drive disconnected `409 Conflict`, which was later addressed in the Song Workspace Overview Product Polish Sprint #3.
- Dashboard UI did not imply live analytics, platform sync, Google Drive, publishing, notifications, or audit history.

Latest browser Songs Portfolio Product Polish checks confirmed:

- `/songs` loaded real backend Song data through the existing `GET /api/songs` integration.
- Empty state rendered for an authenticated user with no Songs.
- Create dialog required a title before sending a create request.
- A temporary long-title Song was created through the browser using the existing `POST /api/songs` integration.
- The created Song appeared with real title, lifecycle status, created date, and workspace navigation only.
- Songs portfolio did not render mock artist, artwork, BPM, release date, progress, collaborator count, file count, readiness, stream, or task metadata.
- Search found the long-title project from loaded client data.
- Lifecycle filtering showed the no-match state for a non-matching status and restored the project for the matching status.
- Clicking the project row opened the existing Song workspace route.
- Desktop and mobile screenshots were captured at `output/playwright/songs-polish/songs-desktop.png` and `output/playwright/songs-polish/songs-mobile.png`.
- Browser console and network checks showed no CORS/API errors on the `/songs` route.
- The Song workspace navigation check exposed the earlier Google Drive disconnected `409 Conflict`, which was later addressed in the Song Workspace Overview Product Polish Sprint #3.
- The temporary verification Song was deleted after verification.

Latest browser Song Workspace Overview Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data through the existing authenticated backend APIs.
- The polished workspace shell showed the real long Song title, lifecycle state, created date, quiet Projects back link, and responsive tab rail.
- Overview rendered Project state, Next attention, Workspace areas, and Project storage in the intended hierarchy.
- Overview empty workspace state used real API responses and did not render fake artwork, mock task/team/activity labels, artist, BPM, key, genre, collaborator count, file count, stream count, or fake lifecycle completion math.
- Next attention selected the Audio tab through the existing tab system.
- Desktop, tablet, and mobile viewport checks confirmed the long title wrapped without overlap and Overview sections remained readable.
- Google Drive disconnected state rendered as normal product storage UI with an Open Settings action.
- With Google Drive disconnected, Overview checked `/api/integrations/google-drive/status` but did not request `/api/songs/{songId}/drive-workspace`, avoiding the previous expected `409 Conflict` console error.
- Browser console and network checks showed no CORS/API errors on normal Song workspace Overview load.
- Missing Song route settled into the friendly `Project not found` state.
- Browser screenshots were captured at `output/playwright/song-overview-polish/song-overview-desktop.png` and `output/playwright/song-overview-polish/song-overview-mobile.png`.
- The temporary verification Song was deleted after verification.

Latest browser Audio Workspace Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real AudioAsset metadata through the existing authenticated backend APIs.
- Audio tab rendered the polished `AUDIO / ASSETS` hierarchy, summary counts, and populated Demo, Mix, and Master sections.
- The empty Audio tab rendered a single `NO AUDIO ASSETS` state.
- Google Drive disconnected state rendered as normal upload guidance with an Open Settings action instead of raw upload failure JSON.
- Audio tab no longer rendered the stale `Real backend data`, `Real metadata`, future-only Google Drive association copy, or fake waveform wording.
- Desktop and mobile viewport checks confirmed long filenames wrapped without breaking the layout.
- Corrected-localhost browser network checks showed `200 OK` responses for authenticated Song, AudioAsset, Google Drive status, and related workspace requests.
- Desktop and mobile screenshots were captured at `output/playwright/audio-polish/audio-workspace-desktop.png` and `output/playwright/audio-polish/audio-workspace-mobile.png`.
- Real Google Drive file upload was not attempted in-browser because the disposable verification account did not have Google Drive connected.
- The temporary verification Songs were deleted after verification.

Latest browser Audio Playback V2.1 checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real AudioAsset metadata through the existing authenticated backend APIs.
- Audio tab rendered the existing no-assets state, then a real metadata-only AudioAsset created through the browser rendered as an unlinked asset.
- Metadata-only/unlinked AudioAsset rows did not show Play controls or fake disabled playback UI.
- Browser API traffic showed successful authenticated register, Song create, Song workspace load, Google Drive status, AudioAsset list, AudioAsset create, and cleanup requests.
- Browser console showed no errors on the corrected `http://localhost:8080` frontend origin.
- Browser screenshot was captured at `output/playwright/audio-playback-v21/audio-unlinked-state.png`.
- Real inline playback against a linked Google Drive audio file was not attempted in-browser because the disposable verification account did not have Google Drive connected or a safe linked real audio asset available. Linked playback behavior is covered by focused frontend tests using the media-access API boundary.
- The temporary verification Song was deleted after verification.

Latest browser Image Preview V2.2 checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real VisualAsset metadata through the existing authenticated backend APIs.
- Visuals tab rendered the existing no-assets state, then a real metadata-only VisualAsset created through the browser rendered as an unlinked asset.
- Metadata-only/unlinked VisualAsset rows did not show image preview controls, fake thumbnails, or visual media-access requests.
- Browser API traffic showed successful authenticated register, Song create, Song workspace load, Google Drive status, VisualAsset list, VisualAsset create, and cleanup requests.
- Mobile viewport verification confirmed the Visuals workspace layout remained readable for metadata-only visuals.
- Browser screenshots were captured at `output/playwright/image-preview-v22/visuals-unlinked-desktop.png` and `output/playwright/image-preview-v22/visuals-unlinked-mobile.png`.
- Real inline image preview against a linked Google Drive image file was not attempted in-browser because the disposable verification account did not have Google Drive connected or a safe linked real image asset available. Linked preview, large preview, and media-access behavior are covered by focused frontend tests using the media-access API boundary.
- The temporary verification Song was deleted after verification.

Latest browser Video Preview V2.3 checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real VisualAsset metadata through the existing authenticated backend APIs.
- Visuals tab rendered a real metadata-only `Music Video` VisualAsset created through the browser.
- Metadata-only/unlinked video VisualAsset rows did not show video preview controls, fake playback, or visual media-access requests.
- Browser API traffic showed successful authenticated register, Song create, Song workspace load, Google Drive status, VisualAsset list, VisualAsset create, and cleanup requests.
- Desktop and mobile viewport checks confirmed the unlinked-video Visuals workspace layout remained readable without horizontal overflow.
- Browser screenshots were captured at `output/playwright/video-preview-v23/visuals-unlinked-video-desktop.png` and `output/playwright/video-preview-v23/visuals-unlinked-video-mobile.png`.
- Real inline video preview against a linked Google Drive video file was not attempted in-browser because the disposable verification account did not have Google Drive connected or a safe linked real video asset available. Linked video playback, seek, stale-access retry, codec fallback, and media-access behavior are covered by focused frontend tests using the media-access API boundary.
- The temporary verification Song was deleted after verification.

Latest browser Visuals Workspace Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real VisualAsset metadata through the existing authenticated backend APIs.
- Visuals tab rendered the polished `VISUALS / ASSETS` hierarchy, total/linked/final/video summary, and populated Cover Art, Music Video, Spotify Canvas, and Social Content sections.
- The empty Visuals tab rendered a single `NO VISUAL ASSETS` state.
- Browser-based VisualAsset metadata create and edit worked through the existing API integration.
- Metadata-only delete confirmation stated that only the DARKROOM SYSTEM asset record is removed.
- Google Drive disconnected state rendered as normal upload guidance with an Open Settings action instead of raw upload failure JSON.
- Visuals tab no longer rendered stale `Real metadata`, future-only preview copy, fake preview frames, or `Placeholder` labels.
- Desktop and mobile viewport checks confirmed long visual filenames wrapped without breaking the layout.
- Desktop and mobile screenshots were captured at `output/playwright/visuals-polish/visuals-workspace-desktop.png` and `output/playwright/visuals-polish/visuals-workspace-mobile.png`.
- Real Google Drive file upload and real Open in Drive navigation were not attempted in-browser because the disposable verification account did not have Google Drive connected.
- Linked visual file states, safe Open in Drive behavior, upload conflict copy, reauth guidance, and productized upload failure states were verified with focused frontend tests.
- The temporary verification Songs were deleted after verification.

Latest browser Release Workspace Product Polish checks confirmed:

- `/songs/{songId}` loaded real Song workspace data and real Release/ReleaseChecklist metadata through the existing authenticated backend APIs.
- Release tab rendered the polished `RELEASE / CONTROL` hierarchy with Release State, Release Details, Readiness, and Preparation Checklist.
- The no-release state rendered a single `NO RELEASE SET UP` state without checklist rows.
- Browser-based Release metadata create, field persistence after refresh, edit/platform selection, checklist initialization, check/uncheck, server-controlled `CompletedAt`, note save, readiness changes, fully-complete checklist, delete release, and parent Song survival after deletion were verified.
- Release UI no longer rendered stale `Real backend data`, `Ready to distribute`, `SYNCED`, or platform publishing/sync claims.
- Desktop and mobile viewport checks confirmed the Release control room layout remained readable without clipped state text.
- Desktop and mobile screenshots were captured at `output/playwright/release-polish/release-workspace-desktop.png` and `output/playwright/release-polish/release-workspace-mobile.png`.
- Browser console showed no errors or warnings in a fresh final verification session.
- The temporary verification Songs were deleted after verification.

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
- Media access API responses return a short-lived Artist OS signed media URL plus safe metadata only; they do not return Google access tokens, refresh tokens, protected refresh tokens, or the main Artist OS JWT.
- Media signed tokens are protected with ASP.NET Core time-limited Data Protection and expire after 5 minutes.
- Media stream endpoints validate the signed media token and then re-check the current database collaboration access and owner-backed link chain before contacting Google Drive.
- Media stream endpoints authenticate with the short-lived media token only; the main Artist OS JWT is intentionally not placed in the media URL.
- Resumable upload session URIs are not logged or returned.
- Google OAuth state is protected and expiring, and callback handling does not depend on the browser supplying an Artist OS Bearer header.
- Production deployment must configure persistent/shared Data Protection keys appropriate to the hosting topology.
- Production-like startup validates trusted public URLs, exact CORS origins, non-wildcard `AllowedHosts`, and a Data Protection key-ring path.
- Register/login, normal API, aggregate API, media-access, media-stream, and upload/replace-file operations have app-level rate/concurrency protection.
- Production/non-Development API responses include generic exception bodies for unexpected failures while logging server-side details.
- API security headers are applied, including production HSTS and API CSP.
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
- Password reset, email verification, account management, refresh-token/session rotation, and server-side JWT revocation are not implemented yet.
- The API now enforces one current AudioAsset per `AssetFamilyId`; it intentionally does not enforce one current AudioAsset per Song + Type because type is classification, not version lineage.
- The API now enforces one current VisualAsset per `AssetFamilyId`; it intentionally does not enforce one current VisualAsset per Song + Type because type is classification, not version lineage.
- Current upload limits are MVP/development application limits only; production hosting and reverse proxies will need matching request-size configuration.
- Current rate limits are app-level protections only; production still needs edge/CDN/WAF protection and provider ingress controls.
- Drive upload and PostgreSQL persistence are not one atomic transaction; the backend attempts best-effort Drive cleanup if persistence fails after upload succeeds.
- Deleting AudioAsset or VisualAsset metadata does not automatically delete linked external Drive binaries.
- Replace File is implemented for linked assets; replacement audit history and old Google Drive binary cleanup remain future work.
- Metadata-only new asset versions currently retain a non-null `UploadedAt` creation timestamp for schema compatibility even before a file is attached.
- Media access URLs contain short-lived signed query tokens; avoid logging full media URLs/query strings in hosting, reverse-proxy, analytics, or browser telemetry.
- Signed media-token query leakage prevention still requires production reverse-proxy/CDN/server log redaction configuration outside the app.
- Media V2.0 uses current stored MIME/size metadata for HEAD responses; it does not yet synchronize provider ETag, checksum, duration, dimensions, or generated preview metadata.
- Image Preview V2.2 streams the original linked image through the existing secure media endpoint; generated thumbnails and image optimization remain future performance work.
- Video Preview V2.3 streams the original linked video through the existing secure media endpoint; transcoding, generated posters, codec normalization, and persisted duration extraction remain future performance/compatibility work.
- Release platforms are stored as a comma-separated string; a normalized platform table may become useful when real integrations exist.
- ContentItem platform is stored as a string; richer channel/account modeling can wait until platform integrations exist.
- Credit contributors are plain Song-scoped metadata strings; a normalized contributor directory can wait until team/auth requirements exist.
- Planned split percentages are stored independently per Credit and are not validated to total `100` across a Song.
- Analytics snapshots are manually entered metadata and are not ingested from external platform APIs.
- Release readiness is automatically calculated from existing AudioAsset, VisualAsset, Credit, ContentItem, Release, and selected manual checklist records; derived readiness is intentionally not persisted back to checklist rows.
- Calendar is read-only and currently aggregates only Release and ContentItem dates.
- Calendar does not yet support standalone sessions, reminders, external sync, or drag/drop rescheduling.
- Dashboard is read-only and derives recent activity only from current source timestamps, not from an audit log.
- Dashboard does not yet support notifications, saved filters, or user-specific/team-specific views.
- Song workspace load still emits a browser console `404 Not Found` for `GET /api/songs/{id}/release` when a Song has no Release. The UI handles the no-release state, but the console noise should be cleaned up later.
- The `GET /api/songs/{id}/release` optional-resource contract still deserves a future backend contract decision; returning a clean optional/no-release representation would avoid expected browser-network 404 noise without hiding real missing-resource errors.
- Extracted Song Workspace modules intentionally preserve some local domain-specific helpers; further abstraction should wait until Media Experience V2 reveals real reuse.
- Backend integration tests use SQLite in-memory, so they do not cover PostgreSQL-provider-specific behavior.
- Frontend automated tests are intentionally focused and do not yet cover the entire app, all routes, all workspace tabs, or visual regression.
- `npm run lint` still reports fast-refresh warnings from helper exports and existing UI primitive patterns.
- Passive Lovable documentation traces remain for later cleanup in `darkroom-web/AGENTS.md` and `darkroom-web/README.md`.
- Production secret storage is still configuration-provider based; a cloud/provider secret vault is not wired in this repository.
- Production Data Protection has a filesystem/key-ring configuration hook, but the actual shared durable key store must be selected and mounted by deployment infrastructure.
- PostgreSQL TLS/private-networking, backup, restore, monitoring, and managed-provider security controls are still deployment responsibilities.

## Not Yet Implemented

- Global organization/team roles and team-facing permission management beyond Song workspace collaboration.
- Password reset, email verification, social login, MFA, account management, production refresh-token/session hardening, and server-side JWT revocation.
- Google Drive download-original, Drive browsing, Picker, synchronization, external file deletion, and replacement audit/history views.
- YouTube integration and automated analytics ingestion.
- Waveform processing.
- Generated thumbnails, image optimization, and generated video posters.
- Transcoding or browser codec normalization.
- Persisting derived Release readiness back into checklist rows.
- Distributor delivery or publishing workflow.
- Content publishing and platform delivery.
- Standalone calendar events, reminders, drag/drop rescheduling, and external calendar sync.
- Dashboard notifications, saved filters, user-specific/team-specific views, and audit history.
- Contributor directory, contracts, royalties, payment workflow, and authenticated team permissions.
- Infrastructure security hardening, CDN/WAF/DDoS protection, reverse-proxy log redaction, production secret vault wiring, PostgreSQL hosting controls, and production deployment.

## Google Drive Compatibility

JWT authentication remains separate from Google OAuth.

Expected future shape:

```text
JWT authenticated DARKROOM user
  -> User.Id
  -> owned or accepted-member Songs
  -> Song.OwnerUserId as canonical storage owner
  -> owner's GoogleDriveConnection
  -> backend-managed Google Drive OAuth tokens
```

Google OAuth tokens are backend-managed and must not be exposed to the React frontend or embedded into Artist OS JWT access tokens.

Media delivery now follows the same separation:

```text
JWT authenticated DARKROOM user
  -> short-lived Artist OS media access URL
  -> signed media token validation
  -> current Song collaboration access re-check
  -> owner-backed Song/asset/file reference re-check
  -> backend-managed Google Drive stream/range request through the owner's connection
```

Main Artist OS JWTs and Google OAuth tokens are not exposed in media URLs.

## Recommended Next Milestone

A4 — Branding & Repository Hygiene.

Suggested scope:

- Remove or reconcile remaining passive Lovable documentation traces where they are no longer accurate.
- Review repository-facing names, docs, and favicon/branding surfaces without changing product behavior.
- Preserve product behavior, security-sensitive backend code, Google Drive/media/collaboration behavior, route URLs, database schema, and deployment settings.
- Do not begin A4 until explicitly requested.
