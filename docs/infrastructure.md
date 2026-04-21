# Infrastructure Guide

## Architecture Overview

Sentral runs as a monorepo with three main services:

- **Web** (Next.js 15): Frontend at `app.sentral.com`
- **API** (Hono.js): Backend at `api.sentral.com` (HTTP + WebSocket)
- **Database**: PostgreSQL 16

## Hosting: Railway (Pro Plan)

> **Migrated from Coolify (self-hosted) — April 2026.**
> Self-hosting was retired due to hardware/network issues with the owned infrastructure. Railway was chosen because it supports persistent Node.js processes (required for WebSocket/Yjs), managed Postgres, and keeps all services in one platform.

### Why Railway

- **WebSocket support**: Railway runs long-lived Node.js processes, unlike Vercel (serverless, no persistent connections). Chat real-time messaging, whiteboard collaboration (Yjs CRDT), typing indicators, and presence all require persistent WebSocket connections.
- **Managed Postgres**: Railway provisions PostgreSQL 16 in the same private network as the app services, giving lower latency than external DB providers.
- **Single platform**: Web, API, and database all in one Railway project. No split infrastructure across Vercel + separate WS host + external DB.
- **Git-based deploys**: Auto-deploy on push to `main` from GitHub, same as Coolify was configured.

### Railway Pro Plan

|                               | Details                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| **Base cost**                 | $20/mo (includes $20 usage credit)                            |
| **Compute pricing**           | ~$0.000463/min per vCPU (usage beyond credit)                 |
| **Max resources per service** | 32 vCPU, 32 GB RAM                                            |
| **Team members**              | Multiple members with role-based permissions                  |
| **Support**                   | Prioritized with SLOs + dedicated Slack Connect channel       |
| **Custom domains**            | Supported with automatic SSL                                  |
| **Estimated monthly total**   | $20–35/mo for Web + API + Postgres at low-to-moderate traffic |

The $20/mo base is essentially prepaid compute. If your services consume $20+ in compute, you pay no extra for the plan itself — only the overage.

Hobby plan ($5/mo) exists but is limited to 8 GB RAM / 8 vCPU and doesn't support team members. Pro is recommended for production.

### Services

| Railway Service | What it runs                    | Dockerfile            | Public URL           |
| --------------- | ------------------------------- | --------------------- | -------------------- |
| **web**         | Next.js 15 standalone           | `apps/web/Dockerfile` | `app.sentral.com`    |
| **api**         | Hono.js HTTP + WebSocket server | `apps/api/Dockerfile` | `api.sentral.com`    |
| **postgres**    | Railway managed PostgreSQL 16   | (one-click provision) | Private network only |

### Networking

The API service handles both HTTP and WebSocket traffic on a single port. Railway exposes one public port per service, so the HTTP API and WebSocket server must share the same port (unlike local dev where they use 3001 and 3002 separately).

- **Web** → communicates with **API** via public URL or Railway's private network
- **API** → communicates with **Postgres** via Railway's private network (no public exposure)
- **Clients** → connect to WebSocket at `wss://api.sentral.com` (same origin as REST API)

### Environment Variables

**API service:**

```
DATABASE_URL=<railway-postgres-connection-string>
PORT=3001
NODE_ENV=production
ENABLE_WS=true
WS_PORT=3001                                    # Same port as HTTP in production
FRONTEND_URL=https://app.sentral.com
SESSION_SECRET=<secret>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=https://api.sentral.com/auth/google/callback
ENCRYPTION_KEY=<key>
COOKIE_DOMAIN=.sentral.com
```

**Web service:**

```
NEXT_PUBLIC_API_URL=https://api.sentral.com
NEXT_PUBLIC_WS_URL=wss://api.sentral.com
```

### Deploy Workflow

1. Push to `main` on GitHub
2. Railway detects changes, builds via Dockerfile
3. Health check passes → traffic shifts to new container
4. Old container drains connections and shuts down

### Custom Domains

1. In Railway dashboard → service → Settings → Custom Domain
2. Add `app.sentral.com` to web service, `api.sentral.com` to API service
3. Railway provides CNAME targets — add these as DNS records in your domain registrar
4. SSL certificates are provisioned automatically

## Database: Railway PostgreSQL

### Connection

Railway Postgres runs in the project's private network. The `DATABASE_URL` connection string is provided automatically when you link the Postgres service to your API service.

For migrations (which need a direct/unpooled connection), use `DATABASE_URL_UNPOOLED` if Railway provides a pooled connection by default. Check `drizzle.config.ts` for the migration connection config.

### Driver

Railway Postgres uses standard TCP connections. If migrating from Neon (HTTP-based serverless driver), the database driver in `apps/api/src/db/index.ts` needs to change:

**From (Neon serverless HTTP):**

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

**To (standard postgres.js TCP):**

```typescript
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
const sql = postgres(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

The `postgres` package is already listed in `apps/api` dependencies. All Drizzle schema files, queries, services, and migrations remain unchanged — only the driver initialization changes.

### Schema Management

```bash
# Generate migrations from schema changes
npm run db:generate --workspace=@sentral/api

# Push schema directly (initial setup or dev)
npm run db:push --workspace=@sentral/api

# Run migrations (production)
npm run db:migrate --workspace=@sentral/api
```

### Backups

Railway Pro includes automatic daily backups for managed Postgres. Configure retention and point-in-time recovery in the Railway dashboard under the Postgres service settings.

For manual backups:

```bash
# Export via pg_dump (use the public connection string)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Local Development

Local dev continues to use Docker for Postgres (and optionally Redis):

```bash
# Start PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Push schema to local DB
npm run db:push --workspace=@sentral/api

# Seed dev data
npm run db:seed --workspace=@sentral/api

# Start all apps in dev mode (web:3000, api:3001, ws:3002)
npm run dev
```

Local dev uses separate ports for HTTP (3001) and WebSocket (3002). In production on Railway, they share a single port.

## Previous Infrastructure (Retired)

<details>
<summary>Coolify self-hosted setup (retired April 2026)</summary>

### Home Server Setup

- **Platform**: Coolify on Ubuntu 22.04/24.04 LTS
- **Proxy**: Cloudflare Tunnel for reverse proxy
- **Services**: PostgreSQL 16 + Redis 7 via Coolify one-click
- **Deploy**: GitHub webhook → Coolify auto-deploy
- **Hostnames**:
  - `app.sentral.com` → `localhost:80` (Next.js)
  - `api.sentral.com` → `localhost:3001` (Hono API)
  - `coolify.sentral.com` → `localhost:8000` (Dashboard)

Retired due to hardware/network reliability issues with owned infrastructure.

</details>
