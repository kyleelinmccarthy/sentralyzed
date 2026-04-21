# Decisions — Sentral

> Architecture Decision Records (ADRs). **Append-only.**
> Claude Code: Add an entry whenever a meaningful technical decision is made.
> **Never delete entries** — mark superseded decisions as `Superseded by DEC-XXX`.

<!--
TEMPLATE — Copy for each new decision:

## DEC-[NUMBER] — [Title]
- **Date:** YYYY-MM-DD
- **Status:** Accepted | Superseded by DEC-XXX | Deprecated
- **Context:** What situation or problem prompted this decision?
- **Options Considered:**
  1. **[Option A]** — Pros: ... / Cons: ...
  2. **[Option B]** — Pros: ... / Cons: ...
- **Decision:** What was chosen and why.
- **Consequences:** What this means going forward. Trade-offs accepted.
- **Related:** Links to relevant learnings, architecture sections, or other decisions.
-->

## DEC-001 — Adopt Dev Framework for Project Intelligence

- **Date:** 2026-04-08
- **Status:** Accepted
- **Context:** Need structured way to maintain project knowledge across Claude Code sessions and prevent context amnesia.
- **Decision:** Using .dev/ directory framework with CLAUDE.md entry point and universal/project-specific doc layers.
- **Consequences:** All significant decisions logged here. Claude Code reads before deciding, writes after deciding. Human review on periodic cadence.

## DEC-002 — Hono.js over Express for API Layer

- **Date:** 2026-04-08
- **Status:** Accepted
- **Context:** Needed a Node.js HTTP framework for the REST API layer.
- **Options Considered:**
  1. **Express** — Pros: massive ecosystem, most docs/examples / Cons: slow, no native TypeScript, middleware-heavy
  2. **Hono** — Pros: fast, TypeScript-native, Web Standards API, lightweight, built-in validation / Cons: smaller ecosystem
  3. **Fastify** — Pros: fast, good TS support, schema validation / Cons: heavier, plugin system complexity
- **Decision:** Hono.js. TypeScript-first design, Web Standards alignment, excellent performance, and clean middleware pattern fit the project's needs.
- **Consequences:** Use `@hono/node-server` for Node.js runtime. Validation via `@hono/zod-validator`. Middleware uses Hono's context pattern.

## DEC-003 — Drizzle ORM over Prisma

- **Date:** 2026-04-08
- **Status:** Accepted
- **Context:** Needed a TypeScript ORM for PostgreSQL data access.
- **Options Considered:**
  1. **Prisma** — Pros: great DX, auto-generated client, migrations / Cons: code generation step, heavy runtime, query engine binary
  2. **Drizzle** — Pros: TypeScript-native schemas, no codegen, lightweight, SQL-like query builder / Cons: younger ecosystem, fewer guides
- **Decision:** Drizzle ORM. No code generation step means schemas are pure TypeScript, faster builds, and the SQL-like API gives more control.
- **Consequences:** Schema defined in `src/db/schema/` with one file per table. Use `drizzle-kit` for migrations. Schema helpers (`_helpers.ts`) provide reusable column sets.

## DEC-004 — Cookie-based Sessions over JWT

- **Date:** 2026-04-08
- **Status:** Accepted
- **Context:** Needed authentication strategy for the API.
- **Options Considered:**
  1. **JWT (stateless)** — Pros: no server-side state, easy horizontal scaling / Cons: can't revoke tokens, larger payload, complex refresh logic
  2. **Cookie-based sessions** — Pros: simple revocation, httpOnly security, small cookie size / Cons: requires session store, sticky sessions for scaling
- **Decision:** Cookie-based sessions with Redis store. Simpler security model — tokens are opaque, revocation is immediate, httpOnly prevents XSS theft.
- **Consequences:** Session cookie (`sentral_session`) is httpOnly with 7-day expiry. Redis stores session data. Auth middleware validates session on each request.

## DEC-005 — Railway Pro over Vercel for Hosting

- **Date:** 2026-04-21
- **Status:** Accepted
- **Context:** Self-hosted Coolify infrastructure retired due to hardware/network issues. Need a new hosting platform that supports the full stack including persistent WebSocket connections (chat, whiteboard Yjs CRDT sync, presence).
- **Options Considered:**
  1. **Vercel + Neon** — Pros: excellent Next.js DX, serverless scaling, Neon already integrated / Cons: no WebSocket support (serverless is stateless), would require separate WS host (Railway/Fly) or switching to a managed real-time service (Pusher, PartyKit, Liveblocks), in-memory state lost across invocations, rate limiting broken
  2. **Railway Pro** — Pros: persistent Node.js processes (WebSocket works as-is), managed Postgres in same private network, single platform for all services, team member support, $20/mo base / Cons: no serverless auto-scaling, single-process model
  3. **Fly.io** — Pros: edge deployment, persistent processes, Postgres support / Cons: more complex networking, less polished dashboard, similar pricing
- **Decision:** Railway Pro. WebSocket support with zero code changes to the real-time layer is the decisive factor. All services (Web, API, Postgres) in one project. Pro tier ($20/mo) gives team member access, 32 GB/32 vCPU ceiling, and priority support. Estimated $20–35/mo total.
- **Consequences:** Migrate from Neon serverless HTTP driver to standard `postgres.js` TCP driver (~5 line change in `db/index.ts`). HTTP and WebSocket servers must share a single port in production (Railway exposes one port per service). Chat real-time, whiteboard presence, and future Yjs CRDT sync all work without architectural changes.
- **Related:** Supersedes Coolify self-hosted setup. See `docs/infrastructure.md` for full Railway configuration.

## DEC-006 — Railway Postgres over Neon for Database

- **Date:** 2026-04-21
- **Status:** Accepted
- **Context:** With hosting moving to Railway, need to decide whether to keep Neon (external serverless Postgres) or use Railway's managed Postgres.
- **Options Considered:**
  1. **Keep Neon** — Pros: zero migration effort, already integrated, serverless autoscaling / Cons: external network hop adds latency, Neon HTTP driver not needed in non-serverless context, cold starts on free tier
  2. **Railway Postgres** — Pros: same private network as API (lower latency), standard TCP connection, no cold starts, backups included, simpler infra (everything in one platform) / Cons: requires driver swap (`@neondatabase/serverless` → `postgres.js`), need to recreate schema and migrate data
- **Decision:** Railway managed Postgres. Co-located in the same private network as the API service. Standard TCP driver (`postgres.js`) is already a project dependency. All Drizzle schema, queries, and migrations remain unchanged — only the driver initialization in `db/index.ts` changes.
- **Consequences:** Remove `@neondatabase/serverless` dependency. Update `db/index.ts` to use `postgres` + `drizzle-orm/postgres-js`. Run `db:push` or `db:migrate` against the new Railway Postgres instance. Seed or migrate existing data if needed.
- **Related:** DEC-005 (Railway hosting decision). See `docs/infrastructure.md` for driver change details.
