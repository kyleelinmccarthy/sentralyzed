# CLAUDE.md — Sentral

> Entry point for Claude Code. Read relevant `.dev/` docs before making changes — don't guess.

## Project

- **Name:** Sentral
- **Created:** 2026-04-08
- **Stack:** Next.js 15 + Hono.js + PostgreSQL + Redis (Turborepo monorepo)
- **Status:** Active Development

## Rules

> **MANDATORY: Update `.dev/` docs after every task.** Changelog always. Learnings/Decisions/Architecture when relevant. No exceptions. See [CONTRIBUTING.md](.dev/CONTRIBUTING.md).

1. **Before writing code** → read [Architecture.md](.dev/Architecture.md) and [CodingStandards.md](.dev/CodingStandards.md)
2. **Before design/architecture choices** → check [Decisions.md](.dev/Decisions.md) for prior decisions
3. **Before implementing UI** → read [DesignSystem.md](.dev/DesignSystem.md) and [DesignStandards.md](.dev/DesignStandards.md)
4. **Before implementing anything** → check [Learnings.md](.dev/Learnings.md) for known pitfalls
5. **Before adding dependencies** → check [Stack.md](.dev/Stack.md) for existing deps and constraints
6. **Before brainstorming or prototyping** → create a proposal in [Proposals.md](.dev/Proposals.md) first
7. **Project standards override universal** → [.dev/CodingStandards.md](.dev/CodingStandards.md) wins over [.dev/universal/CodingStandards.md](.dev/universal/CodingStandards.md)

## Context Loading

Choose based on task size. When `.dev/.summary.md` exists, use it for efficiency.

**Quick tasks** (bug fix, small tweak):
→ Load `.dev/.summary.md` only. It has architecture, active decisions, critical learnings, and stack in one file.

**Standard tasks** (feature, refactor):
→ Load Architecture.md + CodingStandards.md (both levels) + Learnings.md + Decisions.md + Proposals.md + Stack.md + Feature Index

**Large tasks** (new module, major refactor):
→ Load ALL `.dev/` docs including universals.

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

## Docs

| Doc                          | When to Read                      | Path                                                                   |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Summary**                  | Quick tasks — condensed context   | [.dev/.summary.md](.dev/.summary.md)                                   |
| Architecture                 | Adding features, refactoring      | [.dev/Architecture.md](.dev/Architecture.md)                           |
| Coding Standards (universal) | Baseline conventions              | [.dev/universal/CodingStandards.md](.dev/universal/CodingStandards.md) |
| Coding Standards (project)   | Project overrides                 | [.dev/CodingStandards.md](.dev/CodingStandards.md)                     |
| Design System                | Creating/modifying UI             | [.dev/DesignSystem.md](.dev/DesignSystem.md)                           |
| Design Standards             | UX decisions                      | [.dev/DesignStandards.md](.dev/DesignStandards.md)                     |
| Decisions                    | Architectural/tech choices        | [.dev/Decisions.md](.dev/Decisions.md)                                 |
| Learnings                    | Check for pitfalls                | [.dev/Learnings.md](.dev/Learnings.md)                                 |
| Proposals                    | Brainstorming, idea tracking      | [.dev/Proposals.md](.dev/Proposals.md)                                 |
| Stack                        | Dependencies & versions           | [.dev/Stack.md](.dev/Stack.md)                                         |
| **Feature Index**            | Before modifying a feature/system | [.dev/features/FeatureIndex.md](.dev/features/FeatureIndex.md)         |
| Changelog                    | Recent session history            | [.dev/Changelog.md](.dev/Changelog.md)                                 |
| Contributing                 | When updating docs                | [.dev/CONTRIBUTING.md](.dev/CONTRIBUTING.md)                           |

## Team Mode

If `.dev/.team` exists, this project uses team mode:

- Detect current user from `git config user.name` (lowercased, spaces → hyphens)
- If `.dev/team/<username>/` doesn't exist, offer to create it (the user is new to the team)
- **At session start:** read `.dev/team/<username>/context.md` to resume where they left off
- **At session start:** read `.dev/team/<username>/preferences.md` — if it only contains HTML comments (no real content has been filled in), ask the developer to set up their preferences before proceeding with work. Ask about each section one at a time:
  1. **Communication Style** — How do you prefer me to communicate? (e.g., concise vs detailed, show alternatives, explain reasoning)
  2. **Coding Preferences** — Any personal style preferences? (e.g., named functions vs arrow functions, explicit types, brace style)
  3. **Areas of Expertise** — What are you strongest at? (so I can adjust my level of detail by topic)
  4. **Working On** — What are you currently focused on in this project?
     Write their answers into `preferences.md`, replacing the placeholder comments with real content. Keep answers concise — a few bullet points per section, not essays.
- **At session end:** update `.dev/team/<username>/context.md` with current task state, blockers, and next steps
- Use `@username` attribution on Learnings, Decisions, and Changelog entries
- Prefix entries with username: `L-<username>-001`, `DEC-<username>-001`
- See [.dev/team/TEAM_GUIDE.md](.dev/team/TEAM_GUIDE.md) for collaboration rules

---

_Dev Framework — [.dev/README.md](.dev/README.md)_
