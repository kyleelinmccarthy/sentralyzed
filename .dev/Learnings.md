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
