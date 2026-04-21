# Stack & Dependencies — Sentral

> **Last updated:** 2026-04-08
> Claude Code: Update when dependencies are added, removed, or upgraded.
> Check this before suggesting package upgrades or new dependencies.

## Runtime & Language

| Component  | Version   | Notes                       |
| ---------- | --------- | --------------------------- |
| Node.js    | >= 20.0.0 | Required by engines field   |
| npm        | 10.8.2    | Specified as packageManager |
| TypeScript | ^5.7.0    | Strict mode, all packages   |

## API Dependencies (`apps/api`)

| Package             | Version  | Purpose                         | Pinned? |
| ------------------- | -------- | ------------------------------- | ------- |
| hono                | ^4.7.0   | HTTP framework                  | No      |
| @hono/node-server   | ^1.14.0  | Node.js adapter for Hono        | No      |
| @hono/zod-validator | ^0.7.6   | Request validation middleware   | No      |
| drizzle-orm         | ^0.38.0  | PostgreSQL ORM                  | No      |
| postgres            | ^3.4.0   | PostgreSQL driver (postgres.js) | No      |
| argon2              | ^0.44.0  | Password hashing                | No      |
| cookie              | ^1.1.1   | Cookie parsing/serialization    | No      |
| googleapis          | ^171.4.0 | Google OAuth integration        | No      |
| helmet              | ^8.1.0   | Security headers                | No      |
| ioredis             | ^5.10.1  | Redis client (sessions/caching) | No      |
| ws                  | ^8.20.0  | WebSocket server                | No      |
| zod                 | ^3.24.0  | Schema validation               | No      |

### API Dev Dependencies

| Package     | Version | Purpose                                    |
| ----------- | ------- | ------------------------------------------ |
| drizzle-kit | ^0.30.0 | Migration generation and studio            |
| tsx         | ^4.19.0 | TypeScript execution (dev server, scripts) |
| vitest      | ^3.0.0  | Unit testing                               |
| eslint      | ^9.0.0  | Linting                                    |

## Web Dependencies (`apps/web`)

| Package                   | Version  | Purpose                          | Pinned? |
| ------------------------- | -------- | -------------------------------- | ------- |
| next                      | ^15.3.0  | React framework (App Router)     | No      |
| react                     | ^19.1.0  | UI library                       | No      |
| react-dom                 | ^19.1.0  | React DOM renderer               | No      |
| zustand                   | ^5.0.0   | Client-side state management     | No      |
| lucide-react              | ^1.7.0   | Icon library                     | No      |
| next-themes               | ^0.4.6   | Dark mode / theme switching      | No      |
| yjs                       | ^13.6.30 | CRDT for real-time collaboration | No      |
| @schedule-x/calendar      | ^4.3.1   | Calendar component               | No      |
| @schedule-x/react         | ^4.1.0   | React bindings for Schedule-X    | No      |
| @schedule-x/theme-default | ^4.3.1   | Calendar default theme           | No      |
| dompurify                 | ^3.3.3   | HTML sanitization (client)       | No      |
| sanitize-html             | ^2.17.2  | HTML sanitization (server)       | No      |

### Web Dev Dependencies

| Package                   | Version | Purpose                     |
| ------------------------- | ------- | --------------------------- |
| tailwindcss               | ^4.0.0  | Utility-first CSS framework |
| @tailwindcss/postcss      | ^4.0.0  | PostCSS integration         |
| @playwright/test          | ^1.59.1 | E2E testing                 |
| @testing-library/react    | ^16.0.0 | React component testing     |
| @testing-library/jest-dom | ^6.0.0  | DOM assertion matchers      |
| @vitejs/plugin-react      | ^4.0.0  | Vitest React support        |
| jsdom                     | ^26.0.0 | DOM environment for tests   |
| vitest                    | ^3.0.0  | Unit testing                |
| eslint-config-next        | ^15.3.0 | Next.js ESLint config       |

## Shared Dependencies (`packages/shared`)

| Package | Version | Purpose                                        |
| ------- | ------- | ---------------------------------------------- |
| zod     | ^3.24.0 | Schema validation (shared between API and Web) |

## Root Dev Dependencies

| Package     | Version | Purpose                      |
| ----------- | ------- | ---------------------------- |
| turbo       | ^2.4.0  | Monorepo build orchestration |
| husky       | ^9.1.7  | Git hooks                    |
| lint-staged | ^16.4.0 | Pre-commit linting           |
| prettier    | ^3.5.0  | Code formatting              |

## Infrastructure

| Component   | Provider              | Notes                                              |
| ----------- | --------------------- | -------------------------------------------------- |
| Hosting     | Railway (Pro plan)    | Persistent Node.js processes, auto-deploy from Git |
| Database    | Railway PostgreSQL 16 | Private network, standard TCP connection           |
| CI/CD       | Railway               | Auto-deploy on push to `main`                      |
| Local DB    | Docker PostgreSQL 16  | Port 5433 via `docker-compose.dev.yml`             |
| Local Cache | Docker Redis 7 Alpine | Port 6379 (not used in production)                 |

> **Migration note (2026-04-21):** Moved from Coolify (self-hosted) + Neon to Railway Pro. Database driver changed from `@neondatabase/serverless` (HTTP) to `postgres.js` (TCP). See DEC-005, DEC-006, and `docs/infrastructure.md`.

## Version Constraints

- Node.js >= 20 required (engines field in root package.json)
- npm 10.8.2 specified as packageManager
- React 19 required by Next.js 15.3+
- Tailwind CSS 4.0 uses new engine (not compatible with v3 config files)

## Upgrade Log

| Date | Package | From | To  | Notes |
| ---- | ------- | ---- | --- | ----- |

<!-- Track major upgrades here -->
