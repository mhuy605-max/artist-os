You are working in the DARKROOM SYSTEM frontend.

The public product brand is DARKROOM SYSTEM. Internal backend identifiers may still use `ArtistOS.*`; do not rename backend projects, namespaces, migrations, JWT identifiers, database names, or solution files from frontend work.

## Frontend Stack

- React 19
- TypeScript
- TanStack Start / Router
- TanStack Query
- Tailwind CSS
- Vite
- npm with `package-lock.json`

Use npm. Do not reintroduce Bun, Lovable build/runtime dependencies, or template package identity.

## Architecture Boundaries

Current structure:

```text
src/routes/                         TanStack route entries
src/components/darkroom/pages/      top-level route page modules
src/components/darkroom/workbench/  Song workspace shell and tab modules
src/components/darkroom/AppShell.tsx authenticated app shell
src/components/ui/                  shared UI primitives
src/services/api/                   backend API service boundary
src/services/mock/                  remaining future-only support data
src/types/                          shared frontend types
src/assets/                         DARKROOM assets
```

React owns presentation, routing, forms, and client state. The ASP.NET Core backend owns trusted validation, authorization, persistence, Google OAuth, Google Drive operations, and media delivery.

Do not change API routes, auth semantics, collaboration behavior, media security, Google Drive token boundaries, or Song fallback behavior unless the current task explicitly requires it.

## Branding

Use DARKROOM SYSTEM for user-visible and repository-facing product branding.

The official logo source is `src/assets/darkroom-logo.png`. Use it directly and preserve transparency, aspect ratio, monochrome appearance, and original mark. Do not redraw, crop, recolor, distort, approximate, or replace it.

## Development

Run locally with:

```bash
npm ci
npm run dev -- --host localhost --port 8080
```

The frontend defaults to backend API base URL `http://localhost:5178`. Override with `VITE_API_BASE_URL` in a local `.env` file based on `.env.example`. Do not commit local `.env` files or secrets.

## Verification

Use the smallest relevant checks for ordinary changes and the full checks for milestones:

```bash
npm ci
npm run lint
npm run test
npm run build
```

Current lint has known Fast Refresh warnings from helper exports and existing UI primitive patterns. Do not hide lint errors by disabling important rules.

## Safety

Keep changes focused. Do not do unrelated architecture refactors, route changes, dependency upgrades, UI redesigns, or backend work from this frontend directory unless the user explicitly asks.

Do not commit, push, deploy, reset, clean, or discard unrelated changes unless explicitly instructed.