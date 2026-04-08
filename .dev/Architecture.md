# Architecture — Sentral

> **Last updated:** 2026-04-08
> Claude Code: Update this doc when adding components, changing relationships, or modifying infrastructure.

## System Overview

Sentral is a collaborative workspace platform organized as an npm workspaces monorepo with Turborepo orchestration. It provides project management, communication, file sharing, and real-time collaboration tools for teams. The system consists of a Next.js frontend, a Hono.js REST API, a separate WebSocket server for real-time features, PostgreSQL for persistence, and Redis for sessions/caching.

## Tech Stack

| Layer          | Technology           | Version                       | Notes                                    |
| -------------- | -------------------- | ----------------------------- | ---------------------------------------- |
| Frontend       | Next.js (App Router) | 15.3+                         | React 19, Turbopack dev server           |
| UI             | Tailwind CSS         | 4.0+                          | Utility-first, dark mode via next-themes |
| State          | Zustand              | 5.0+                          | Client-side state management             |
| API Framework  | Hono.js              | 4.7+                          | On @hono/node-server                     |
| ORM            | Drizzle ORM          | 0.38+                         | TypeScript-native, postgres.js driver    |
| Database       | PostgreSQL           | 16                            | Port 5433 (non-default)                  |
| Cache/Sessions | Redis                | 7                             | Port 6379                                |
| Real-time      | WebSocket (ws) + Yjs | ws 8.20+, yjs 13.6+           | CRDTs for collaborative editing          |
| Validation     | Zod                  | 3.24+                         | Shared between client and server         |
| Build          | Turborepo            | 2.4+                          | Monorepo orchestration                   |
| Testing        | Vitest + Playwright  | Vitest 3.0+, Playwright 1.59+ | Unit + E2E                               |
| Language       | TypeScript           | 5.7+                          | Strict mode                              |

## Directory Structure

```
/
├── .dev/                  # Project intelligence framework
├── apps/
│   ├── api/               # Hono.js REST API + WebSocket server (Node.js)
│   │   ├── src/
│   │   │   ├── app.ts          # Route mounting, middleware setup
│   │   │   ├── index.ts        # Server entry point (HTTP + WS)
│   │   │   ├── db/
│   │   │   │   ├── schema/     # Drizzle table definitions (one per file)
│   │   │   │   ├── migrations/ # Generated SQL migrations
│   │   │   │   └── seed/       # Test data seeding
│   │   │   ├── middleware/     # Auth, security, CORS
│   │   │   ├── routes/         # Feature route handlers
│   │   │   ├── services/       # Business logic layer
│   │   │   └── ws/             # WebSocket server + handlers
│   │   └── drizzle.config.ts
│   └── web/               # Next.js 15 App Router (React 19, Turbopack)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/         # Login, register pages
│       │   │   ├── (dashboard)/    # Authenticated feature pages
│       │   │   └── layout.tsx      # Root layout
│       │   ├── components/         # UI components by domain
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # API client, utilities
│       │   └── stores/             # Zustand stores
│       └── e2e/                    # Playwright E2E tests
├── packages/
│   ├── shared/            # Shared TypeScript types + Zod validators
│   │   └── src/
│   │       ├── types/     # TypeScript interfaces/types
│   │       └── validators/ # Zod schemas
│   └── config/            # Shared tsconfig, eslint, prettier configs
├── docs/                  # Infrastructure and deployment docs
├── docker-compose.dev.yml # PostgreSQL + Redis for local dev
├── turbo.json             # Turborepo pipeline config
└── package.json           # Root workspace config
```

## Component Map

### API Layer (`apps/api`)

- **Framework**: Hono.js on @hono/node-server
- **Routing**: `src/routes/` — each feature has its own route file/directory, mounted in `src/app.ts`
- **Services**: `src/services/` — business logic layer, one service per domain (auth, projects, tasks, etc.)
- **Database**: Drizzle ORM with PostgreSQL (postgres.js driver). Schema in `src/db/schema/`, each table in its own file with a barrel export in `index.ts`. Schema helpers (`_helpers.ts`) provide `timestamps()` and `softDelete()` column sets.
- **Auth**: Cookie-based sessions. Middleware in `src/middleware/auth.ts` provides `authMiddleware` and `requireRole()`. Passwords hashed with Argon2. Google OAuth supported.
- **Security**: `src/middleware/security.ts` — rate limiting (20 req/15min auth, 200 req/min general), security headers
- **WebSocket**: Separate server on port 3002 (`src/ws/`). Authenticates via session cookie, tracks connections, 30s heartbeat.
- **Validation**: @hono/zod-validator with schemas from `@sentral/shared/validators`

### Web Layer (`apps/web`)

- **Framework**: Next.js 15 with App Router, React 19
- **Routing**: `src/app/(dashboard)/` for authenticated pages, `src/app/(auth)/` for login/register
- **State**: Zustand store (`src/stores/auth.ts`)
- **API client**: `src/lib/api.ts` — fetch wrapper with credentials, base URL from `NEXT_PUBLIC_API_URL`
- **Styling**: Tailwind CSS 4.0, dark mode via next-themes
- **Icons**: Lucide React
- **Calendar**: Schedule-X components
- **Testing**: Vitest + @testing-library/react (unit), Playwright (e2e in `e2e/`)

### Shared Package (`packages/shared`)

Exports types and Zod validators via subpath exports:

- `@sentral/shared/types/*` — TypeScript interfaces for all domains
- `@sentral/shared/validators/*` — Zod schemas used by both API validation and form validation

## Data Flow

### API Request Lifecycle

```
Client Request
  → @hono/node-server
  → Logger middleware
  → CORS middleware
  → Security middleware (rate limiting, headers)
  → Auth middleware (session cookie → Redis → user context)
  → Route handler
  → Service layer (business logic)
  → Drizzle ORM → PostgreSQL
  → JSON response
```

### Real-time Collaboration Flow

```
Client WebSocket
  → ws server (port 3002)
  → Session cookie auth
  → Connection tracking
  → Yjs CRDT sync (whiteboards, collaborative editing)
  → Broadcast to connected clients
```

## Ports

| Service    | Port |
| ---------- | ---- |
| Web        | 3000 |
| API HTTP   | 3001 |
| WebSocket  | 3002 |
| PostgreSQL | 5433 |
| Redis      | 6379 |

## Auth Architecture

- **Strategy**: Cookie-based sessions with Redis store
- **Cookie**: `sentral_session`, httpOnly, 7-day expiry
- **Hashing**: Argon2 for passwords
- **OAuth**: Google OAuth supported
- **Roles**: Three roles — `admin`, `manager`, `member`
- **Registration**: Invite-only via token
- **Middleware**: `authMiddleware` (session validation), `requireRole()` (RBAC)

## Integration Points

| Service      | Purpose                    | Notes                                  |
| ------------ | -------------------------- | -------------------------------------- |
| Google OAuth | Social login               | via `googleapis` package               |
| GitHub       | GitHub integration feature | API integration for project management |
| Redis        | Session store + caching    | ioredis client                         |

## Deployment

Self-hosted via Coolify with Cloudflare Tunnel. See `docs/infrastructure.md` for details.

## Known Constraints & Technical Debt

<!-- Be honest. Future sessions need to know about landmines. -->

- PostgreSQL on port 5433 (non-default) to avoid conflicts with local installs
- WebSocket server runs as separate process on different port from HTTP API
