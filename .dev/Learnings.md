# Learnings — Sentral

> Hard-won knowledge. Bugs, gotchas, surprises, and better approaches discovered through experience.
> Claude Code: **Read this before implementing.** Add entries when something unexpected happens.
> **Never delete entries** — consolidate during periodic reviews.
> Recurring learnings should be promoted to CodingStandards.md as formal standards.

<!--
TEMPLATE — Copy for each new learning:

## L-[NUMBER] — [Short descriptive title]
- **Date:** YYYY-MM-DD
- **Category:** Bug | Gotcha | Performance | Pattern | Tool | Integration | Security
- **Severity:** Low | Medium | High | Critical
- **What happened:** Brief description of the situation.
- **Root cause:** Why it happened (or best theory if uncertain).
- **Solution/Workaround:** How it was resolved.
- **Prevention:** How to avoid this in the future.
- **Time lost:** Rough estimate (helps prioritize prevention)
- **Related:** Links to code, decisions, other learnings, or external resources.
-->

## L-003 — Node ESM requires explicit .js extensions in compiled relative imports

- **Date:** 2026-04-22
- **Category:** Bug
- **Severity:** Critical
- **What happened:** API container crashed on Railway with `ERR_MODULE_NOT_FOUND: Cannot find module '/app/apps/api/dist/db/schema/_helpers' imported from /app/apps/api/dist/db/schema/users.js`. 303 extensionless relative imports across 86 files in `apps/api/src/` compiled straight through `tsc` into `dist/` and Node's ESM loader rejected them.
- **Root cause:** `apps/api/package.json` is ESM (`"type": "module"`) but `tsconfig` uses `"moduleResolution": "bundler"`, which lets source files write `from './foo'`. `tsc` does NOT rewrite those specifiers during compilation. Dev mode (`tsx`) tolerates extensionless imports at runtime; production (`node dist/index.js`) does not. The crash only surfaced after the Railway migration made compiled output the execution path — previously, the failure mode was latent.
- **Solution/Workaround:** Switched `apps/api` build to **tsup** (esbuild) with `bundle: true` + `splitting: true`. esbuild rewrites relative imports to include `.js`, and splitting hoists modules reachable from multiple entries (notably `lib/better-auth.js`) into shared chunks so singleton state is preserved across `@sentral/api/app` and `@sentral/api/auth` consumers. See DEC-007.
- **Prevention:** Don't pair ESM (`"type": "module"`) output with `moduleResolution: "bundler"` unless the build tool rewrites imports. Either (a) use a bundler build like tsup/esbuild (current choice), (b) switch to `moduleResolution: "nodenext"` and write `.js` extensions in all source imports, or (c) add a post-build import-rewriter. New `packages/` modules that emit their own `dist/` for runtime consumption must do one of these too — one-off extensionless imports in `packages/shared` source were a latent bug waiting for a consumer that hit them.
- **Time lost:** ~45 minutes
- **Related:** `apps/api/tsup.config.ts`, `apps/api/package.json`, DEC-007, L-001 (the Better Auth OOM workaround that made `tsc --noCheck` load-bearing is no longer necessary for the build path)

## L-002 — Web Dockerfile must build @sentral/shared before @sentral/web

- **Date:** 2026-04-22
- **Category:** Bug
- **Severity:** High
- **What happened:** Docker web build failed with `Module not found: Can't resolve '@sentral/shared/types/*'` for asset, poll, settings, expense routes.
- **Root cause:** `packages/shared/package.json` `exports` field resolves to `./dist/types/*.js` under the `default` condition. The `dist/` directory is gitignored, so inside the Docker builder layer it only exists if `@sentral/shared` is explicitly built. The web Dockerfile was missing the build step; the API Dockerfile already had it. Even with `transpilePackages: ['@sentral/shared']`, Next.js still resolves via the `exports` field and fails when the target file is absent.
- **Solution/Workaround:** Added `RUN npm run build --workspace=@sentral/shared` before `npm run build --workspace=@sentral/web` in `apps/web/Dockerfile`, matching the API Dockerfile pattern.
- **Prevention:** Any new Dockerfile that consumes `@sentral/shared` must build it first. If the package ever adds a new consumer app, mirror the two `RUN` lines from `apps/api/Dockerfile`.
- **Time lost:** ~10 minutes
- **Related:** `apps/web/Dockerfile`, `apps/api/Dockerfile`, `packages/shared/package.json`

## L-001 — Better Auth type inference causes tsc OOM

- **Date:** 2026-04-14
- **Category:** Gotcha
- **Severity:** Critical
- **What happened:** `tsc` OOMs (>8GB) when compiling the API package, and `next build` OOMs when `@sentral/api` is in `transpilePackages`.
- **Root cause:** Better Auth's `betterAuth()` return type triggers massive TypeScript generic expansion. Even with the `better-auth.js` / `better-auth.d.ts` isolation trick, running `tsc` on the full API still OOMs because the type-checker loads transitive types from `better-auth` package declarations.
- **Solution/Workaround:** Three-part fix: (1) API builds with `tsc --noCheck` (emit-only, no type-checking), (2) `better-auth.js` copied manually to dist/ since it's plain JS, (3) API moved to `serverExternalPackages` so Next.js webpack doesn't bundle it. Conditional exports ensure TypeScript consumers get types from source while runtime uses compiled dist/.
- **Prevention:** Never add `@sentral/api` back to `transpilePackages`. Never use `tsc` without `--noCheck` for the API build. If adding new Better Auth features, keep all Better Auth imports isolated in `better-auth.js` (plain JS).
- **Time lost:** ~2 hours across sessions
- **Related:** `apps/api/src/lib/better-auth.js`, `apps/api/src/lib/better-auth.d.ts`, `apps/web/next.config.ts`
