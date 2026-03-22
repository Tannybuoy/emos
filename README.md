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

### Set up PostgreSQL

Install PostgreSQL and create the database:

```bash
# Option A: Using the CLI tools (add PostgreSQL bin to PATH if needed)
createdb -U postgres emos

# Option B: Using Docker (easiest)
docker run --name emos-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=emos -p 5432:5432 -d postgres:16
```

On Windows, if `createdb`/`psql` aren't recognized, add `C:\Program Files\PostgreSQL\<version>\bin` to your system PATH.

### Configure

Create `artifacts/api-server/.env`:

```
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/emos
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

Replace `YOUR_PASSWORD` with your PostgreSQL password (or `postgres` if using Docker).

Spotify credentials are optional — the app falls back to mock data without them.

### Push the database schema

```bash
cd lib/db
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/emos  # Windows
# export DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/emos  # macOS/Linux
pnpm run push
```

### Run

From the project root:

```bash
pnpm dev
```

This starts all services together:

- **Frontend**: http://localhost:5173
- **API server**: http://localhost:3000
- **Mockup sandbox**: http://localhost:5174

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
