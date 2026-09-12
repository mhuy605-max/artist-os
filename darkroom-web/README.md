# DARKROOM SYSTEM Frontend

This is the React frontend for DARKROOM SYSTEM.

The frontend is a TanStack Start application that talks to the ASP.NET Core backend through typed service modules under `src/services/api/`. It owns presentation, routing, client-side state, forms, and local UI behavior. Trusted validation, authorization, persistence, Google OAuth, Google Drive operations, and media delivery remain backend responsibilities.

## Stack

- React 19
- TypeScript
- TanStack Start / Router
- TanStack Query
- Tailwind CSS
- Vite
- npm with `package-lock.json`

There is no active Lovable build/runtime dependency or Lovable editor workflow in the current frontend.

## Local Development

Install dependencies:

```bash
npm ci
```

Run the dev server:

```bash
npm run dev -- --host localhost --port 8080
```

The frontend defaults to `http://localhost:8080`.

The backend is expected at `http://localhost:5178` by default. Override this with a local `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:5178
```

Use `darkroom-web/.env.example` as the safe template. Do not commit local `.env` files or secrets.

## Scripts

```bash
npm run lint
npm run test
npm run test:watch
npm run build
npm run preview
```

`npm run test` uses Vitest and mocked frontend API services. It does not require PostgreSQL, the ASP.NET backend, localhost, or network access.

## Architecture

```text
src/routes/                         TanStack route entries
src/components/darkroom/AppShell.tsx authenticated workspace shell
src/components/darkroom/pages/      Dashboard, Songs, Calendar, Team, Settings, Login
src/components/darkroom/workbench/  Song workspace shell and tab modules
src/components/ui/                  shared UI primitives
src/services/api/                   backend API service boundary
src/services/mock/                  remaining future-only support data
src/types/                          frontend API/domain types
src/assets/                         official DARKROOM assets
```

Current routes:

```text
/
/login
/dashboard
/songs
/songs/$songId
/calendar
/team
/settings
```

The `/` route redirects to `/dashboard`. Authenticated workspace routes are protected by the app shell.

## Branding

The public product brand is DARKROOM SYSTEM. The official logo source is `src/assets/darkroom-logo.png`; use it as-is without redrawing, cropping, recoloring, distorting, or replacing it with another mark.

Internal backend identifiers may still use `ArtistOS.*`; do not rename them from frontend work.

## Backend Integration

The frontend uses `Authorization: Bearer <access_token>` for authenticated API requests. The token is stored in `sessionStorage` for the current browser session.

The Song API service has an explicit local-development fallback only when the backend host is unreachable. Other API errors are surfaced instead of hidden.

Google OAuth tokens and Google Drive API calls stay backend-side. React receives only safe status, folder, asset, and media-access metadata.