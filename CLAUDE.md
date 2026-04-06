# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sentral is a collaborative workspace platform (Next.js 15 + Hono.js + PostgreSQL) organized as an npm workspaces monorepo with Turborepo orchestration. Real-time collaboration uses WebSocket (ws) + Yjs CRDTs.

## Commands

### Development

```bash
# Start all services (requires Docker for Postgres + Redis)
docker compose -f docker-compose.dev.yml up -d
npm run dev                    # Starts web (3000) + API (3001) + WS (3002)
```

### Build / Lint / Type-check

```bash
npm run build                  # All apps via Turbo
npm run lint                   # ESLint across all packages
npm run type-check             # tsc --noEmit across all packages
npm run format                 # Prettier format
npm run format:check           # Prettier check
```

### Testing

```bash
npm run test                             # All unit tests (Vitest)
npx vitest run path/to/file.test.ts      # Single test file (from app dir)

# Workspace-scoped
npm run test --workspace=@sentral/api
npm run test --workspace=@sentral/web

# E2E (Playwright, web only)
npm run test:e2e --workspace=@sentral/web
```

### Database (run from repo root, executes in apps/api)

```bash
npm run db:generate --workspace=@sentral/api   # Generate migrations from schema changes
npm run db:push --workspace=@sentral/api       # Push schema directly (dev)
npm run db:migrate --workspace=@sentral/api    # Run migrations (prod)
npm run db:studio --workspace=@sentral/api     # Drizzle Studio GUI
npm run db:seed --workspace=@sentral/api       # Seed test data
```

## Architecture

```
apps/
  api/          # Hono.js REST API + WebSocket server (Node.js)
  web/          # Next.js 15 App Router (React 19, Turbopack)
packages/
  shared/       # Shared TypeScript types + Zod validators
  config/       # Shared tsconfig, eslint, prettier configs
```

### API (apps/api)

- **Framework**: Hono.js on @hono/node-server
- **Routing**: `src/routes/` — each feature has its own route file/directory, mounted in `src/app.ts`
- **Services**: `src/services/` — business logic layer, one service per domain (auth, projects, tasks, etc.)
- **Database**: Drizzle ORM with PostgreSQL (postgres.js driver). Schema in `src/db/schema/`, each table in its own file with a barrel export in `index.ts`. Schema helpers (`_helpers.ts`) provide `timestamps()` and `softDelete()` column sets.
- **Auth**: Cookie-based sessions. Middleware in `src/middleware/auth.ts` provides `authMiddleware` and `requireRole()`. Passwords hashed with Argon2. Google OAuth supported.
- **Security**: `src/middleware/security.ts` — rate limiting (20 req/15min auth, 200 req/min general), security headers
- **WebSocket**: Separate server on port 3002 (`src/ws/`). Authenticates via session cookie, tracks connections, 30s heartbeat.
- **Validation**: @hono/zod-validator with schemas from `@sentral/shared/validators`

### Web (apps/web)

- **Framework**: Next.js 15 with App Router, React 19
- **Routing**: `src/app/(dashboard)/` for authenticated pages, `src/app/(auth)/` for login/register
- **State**: Zustand store (`src/stores/auth.ts`)
- **API client**: `src/lib/api.ts` — fetch wrapper with credentials, base URL from `NEXT_PUBLIC_API_URL`
- **Styling**: Tailwind CSS 4.0
- **Testing**: Vitest + @testing-library/react (unit), Playwright (e2e in `e2e/`)

### Shared (packages/shared)

Exports types and Zod validators via subpath exports:

- `@sentral/shared/types/*`
- `@sentral/shared/validators/*`

## Ports

| Service    | Port |
| ---------- | ---- |
| Web        | 3000 |
| API HTTP   | 3001 |
| WebSocket  | 3002 |
| PostgreSQL | 5433 |
| Redis      | 6379 |

## Auth & Roles

Three roles: `admin`, `manager`, `member`. Invite-only registration via token. Session cookie (`sentral_session`) is httpOnly, 7-day expiry.

## Deployment

Self-hosted via Coolify with Cloudflare Tunnel. See `docs/infrastructure.md` for details.
