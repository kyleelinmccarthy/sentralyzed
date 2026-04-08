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
