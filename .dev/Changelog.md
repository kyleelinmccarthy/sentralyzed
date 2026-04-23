# Changelog — Sentral

> Session log. One entry per Claude Code session summarizing what was accomplished.
> Newest sessions at top. Claude Code: Add an entry at the end of each session.

<!--
FORMAT:

## YYYY-MM-DD — [Brief session summary]
**Focus:** [What this session was primarily about]
- Key accomplishment or change
- Key accomplishment or change
- Issues encountered (reference L-### in Learnings.md if logged)
- Decisions made (reference DEC-### in Decisions.md if logged)
-->

## 2026-04-22 — Fix API prod crash: swap tsc for tsup to rewrite ESM imports

**Focus:** Unblock Railway — API container crashed on boot with `ERR_MODULE_NOT_FOUND` for relative imports

- Swapped `apps/api` build from `tsc --noCheck` + manual `cp` of `better-auth.js` to `tsup` in bundle+splitting mode (`apps/api/tsup.config.ts`)
- tsup/esbuild rewrites relative imports to include `.js` at emit time, fixing the production crash where Node ESM rejected `from './_helpers'` in compiled output
- `splitting: true` hoists `lib/better-auth.js` into a shared chunk so `dist/app.js` and `dist/lib/better-auth.js` (both exported via `@sentral/api/app` and `@sentral/api/auth`) share a single `auth` singleton instead of each shipping its own
- Side benefit: esbuild never type-checks, so the `--noCheck` workaround for L-001's tsc OOM is no longer load-bearing for the build path (type-check still runs tsc separately)
- Fixed missing `.js` extension in [packages/shared/src/validators/poll.ts:2](packages/shared/src/validators/poll.ts#L2) — the only offender in `packages/shared` source; all other files were already correct
- Added `tsup ^8.5.1` to `apps/api` devDependencies
- Logged L-003 and DEC-007
- Verified: `node apps/api/dist/index.js` boots cleanly (HTTP + WS server start, Better Auth initializes)

## 2026-04-22 — Fix web Docker build: missing shared package compile step

**Focus:** Unblock the web Docker build failing on `@sentral/shared/types/*` resolution

- Added `RUN npm run build --workspace=@sentral/shared` before the web build in `apps/web/Dockerfile` so the `dist/` output referenced by the package's `exports` field exists at module-resolution time (the API Dockerfile already did this)
- Logged L-002 in Learnings.md

## 2026-04-22 — Railway Migration Implementation

**Focus:** Implement code changes required for Coolify/Vercel → Railway migration

- Swapped DB driver from `@neondatabase/serverless` (HTTP) to `postgres@^3.4.5` (TCP) in `apps/api/src/db/index.ts` and `apps/api/src/db/seed/seed-data.ts`; Drizzle schema and queries unchanged
- Refactored `apps/api/src/ws/server.ts` to accept `{ port } | { server }`, enabling WS to attach to an existing HTTP server for Railway's single-port model (SRP — strategy decided by caller)
- Added TDD test `apps/api/src/__tests__/ws-server.test.ts` covering both port modes, written before the refactor
- Updated `apps/api/src/index.ts` to derive WS mode from env: `WS_PORT === PORT` (or absent) → attach to HTTP server; different `WS_PORT` → separate port for local dev (KISS, no new env vars)
- Added `output: 'standalone'` + `outputFileTracingRoot` to `apps/web/next.config.ts` so the Dockerfile's standalone copy actually has something to copy
- Removed `VERCEL_URL` dead-code branch from `apps/web/src/lib/auth-client.ts`
- Updated `.env.example` with `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_SECRET`; cleaned Vercel comment; documented WS port behavior
- Updated `docs/infrastructure.md` with actual domain (`sentral.solvretech.com`)
- Updated `.dev/Stack.md` deps table and added Upgrade Log entries

## 2026-04-21 — Railway Migration Documentation

**Focus:** Document hosting migration from self-hosted Coolify to Railway Pro

- Rewrote `docs/infrastructure.md` with full Railway setup guide (services, networking, env vars, database driver change, deploy workflow, cost breakdown)
- Preserved retired Coolify setup in a collapsed details section for reference
- Added DEC-005 (Railway Pro over Vercel for hosting) and DEC-006 (Railway Postgres over Neon)
- Updated Stack.md infrastructure table to reflect Railway
- No code changes — documentation only session

## 2026-04-14 — Fix TypeScript OOM in Build Pipeline

**Focus:** Build infrastructure — eliminate OOM during `next build` and `tsc`

- Pre-built `@sentral/shared` and `@sentral/api` packages with conditional exports (`types` → source TS, `default` → compiled JS in dist/)
- Changed API build from no-op echo to `tsc --noCheck` + copy `better-auth.js` (tsc type-checking itself OOMs on the API due to Better Auth's massive generics)
- Moved `@sentral/api` from `transpilePackages` to `serverExternalPackages` in Next.js config — webpack no longer bundles the entire API, just loads it at runtime
- Added `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` to `next.config.ts` since type-check/lint run as separate turbo tasks
- Fixed latent prerender error: Better Auth client needed absolute URL during SSR (was hidden by OOM)
- Full turbo build now completes in ~9s (previously OOM'd at 4GB+ / 8GB+)
- Logged learning: L-001 (Better Auth type inference causes tsc OOM)

## 2026-04-08 — Project Documentation Framework Initialized

**Focus:** Framework setup

- Initialized Dev Framework (.dev/ directory structure)
- Created universal coding, design, and UX standards
- Pre-populated Architecture.md, Stack.md, and CodingStandards.md from existing project knowledge
- Seeded Decisions.md with foundational ADRs (DEC-001 through DEC-004)
- Set up team mode structure
- Documented all 22 implemented features in FeatureIndex.md
