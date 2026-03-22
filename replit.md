# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the **emos** music recommendation app — recommends playlists based on work role and mental state using an interactive emotion wheel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + Framer Motion + Zustand

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── emos/               # React+Vite frontend (served at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## App: emos

Music recommendation app for knowledge workers. Users:
1. Enter their work role (Engineer, Designer, PM, etc.)
2. Select 3–5 states from a 3-ring emotion wheel (inner: primary, middle: modifiers, outer: intent)
3. Click "Generate My Sound" → backend maps states to music attributes and fetches Spotify results
4. View/play embedded playlists and recommended tracks
5. Optionally submit 👍/👎 feedback saved to DB

### Environment Variables Required

- `SPOTIFY_CLIENT_ID` — Spotify Developer App client ID
- `SPOTIFY_CLIENT_SECRET` — Spotify Developer App client secret

Without these, the app uses mock Spotify playlist IDs (real embeds still work).

### Key Files

**Frontend** (`artifacts/emos/src/`)
- `App.tsx` — Root router (Landing → Wheel → Results)
- `components/magnetic-grid.tsx` — Canvas dot-grid animation background
- `components/emotion-wheel.tsx` — SVG 3-ring interactive wheel
- `pages/landing.tsx` — Role input page
- `pages/wheel.tsx` — State selection page
- `pages/results.tsx` — Music results + feedback
- `store/use-app-store.ts` — Zustand store (role, selectedStates, results)
- `index.css` — Dark theme CSS variables (black + lime #CBFF00)

**Backend** (`artifacts/api-server/src/`)
- `routes/music.ts` — POST /api/generate-music-profile, POST /api/submit-feedback
- `lib/musicMapping.ts` — mapStateToMusic() logic (BPM, mood, energy, instrumental)
- `lib/spotify.ts` — Spotify Client Credentials auth + search + recommendations

**DB** (`lib/db/src/schema/feedback.ts`) — feedback table for session ratings

### API Endpoints

- `GET /api/healthz` — Health check
- `POST /api/generate-music-profile` — Body: `{ role, states[] }` → `{ profile, playlists, tracks, sessionId }`
- `POST /api/submit-feedback` — Body: `{ sessionId, rating, role, states }` → `{ success, message }`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and Zod schemas from OpenAPI

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/`. Music routes handle Spotify integration and music profile mapping.

### `artifacts/emos` (`@workspace/emos`)

React + Vite frontend. Served at `/`. Uses Framer Motion for animations, Zustand for state, wouter for routing.

### `lib/db` (`@workspace/db`)

Database layer. Has `feedback` table for storing user session feedback.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval config. Run `pnpm --filter @workspace/api-spec run codegen` after changing the spec.

### `lib/api-zod` / `lib/api-client-react`

Generated from OpenAPI. Do not edit manually.
