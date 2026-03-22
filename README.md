# EMOS

A music recommendation app for knowledge workers. Pick your role (Engineer, Designer, PM, etc.), select your current emotional state via an interactive emotion wheel, and get personalized Spotify playlist recommendations.

Built with React 19, Express 5, PostgreSQL, and the Spotify API.

## Desktop Setup

### Prerequisites

- **Node.js 24**
- **pnpm** — install with `npm install -g pnpm`
- **PostgreSQL** — for the backend database
- **Spotify Developer credentials** (optional — the app falls back to mock data without them)

### Install

```bash
# Clone the repo and install dependencies
pnpm install
```

### Configure (optional)

Create `artifacts/api-server/.env` with your Spotify credentials:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

If you have PostgreSQL running, push the database schema:

```bash
cd lib/db
pnpm run push
```

### Run

Start the frontend and backend in two separate terminals:

```bash
# Terminal 1 — Frontend (Vite dev server)
cd artifacts/emos
pnpm run dev
# → http://localhost:5173

# Terminal 2 — Backend (Express API server)
cd artifacts/api-server
pnpm run dev
# → http://localhost:3000
```

Open http://localhost:5173 in your browser.

## Project Structure

```
artifacts/
  emos/              # React + Vite frontend
  api-server/        # Express API backend
lib/
  api-spec/          # OpenAPI 3.1 spec + codegen config
  api-client-react/  # Generated React Query hooks
  api-zod/           # Generated Zod schemas
  db/                # Drizzle ORM schema + migrations
```

## Useful Commands

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm run build` | Build all packages + typecheck |
| `pnpm run typecheck` | Run TypeScript typechecking |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API client from OpenAPI spec |
| `cd lib/db && pnpm run push` | Push database schema changes |
