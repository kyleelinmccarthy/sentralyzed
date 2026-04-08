# Coding Standards — Sentral

> **Last updated:** 2026-04-08
> **Extends:** Universal standards in `.dev/universal/CodingStandards.md`
> Project-specific overrides and additions below. Universal standards apply unless overridden here.

## Project Context

**Application type:** Collaborative workspace platform (SPA + REST API + WebSocket)
**Primary language:** TypeScript (strict mode)
**Framework:** Next.js 15 (App Router) + Hono.js
**Data access:** Drizzle ORM with PostgreSQL
**Testing:** Vitest (unit) + Playwright (E2E)
**DI approach:** Manual injection via service functions
**Logging:** Console-based (structured logging TBD)
**Error handling:** Try/catch in services, HTTP error responses in routes

## Established Patterns

### Pattern: Drizzle Schema Definition

- **Use when:** Adding a new database table
- **Implementation:** One file per table in `apps/api/src/db/schema/`. Import `timestamps()` and `softDelete()` helpers from `_helpers.ts`. Export table from barrel `index.ts`.
- **Example location:** `apps/api/src/db/schema/`

### Pattern: Route → Service Separation

- **Use when:** Adding new API endpoints
- **Implementation:** Create a route file in `src/routes/<feature>/index.ts` that handles HTTP concerns (validation, response formatting). Business logic lives in `src/services/<feature>.service.ts`. Mount the route in `src/app.ts` via `app.route()`.
- **Example location:** `apps/api/src/routes/tasks/index.ts` + `apps/api/src/services/tasks.service.ts`

### Pattern: Zod Validator Sharing

- **Use when:** Defining request/response schemas
- **Implementation:** Define Zod schemas in `packages/shared/src/validators/<feature>.ts`. Import in API routes via `@sentral/shared/validators/<feature>` for `@hono/zod-validator`. Import in web forms for client-side validation.
- **Example location:** `packages/shared/src/validators/`

### Pattern: Auth Middleware Usage

- **Use when:** Protecting API endpoints
- **Implementation:** Apply `authMiddleware` to routes that need authentication. Use `requireRole('admin')` or `requireRole('manager')` for role-based access. Access user from Hono context.
- **Example location:** `apps/api/src/middleware/auth.ts`

### Pattern: Dashboard Route Groups

- **Use when:** Adding new authenticated pages
- **Implementation:** Create page in `apps/web/src/app/(dashboard)/<feature>/page.tsx`. The `(dashboard)` layout provides the authenticated shell (sidebar, header). `(auth)` group is for login/register only.
- **Example location:** `apps/web/src/app/(dashboard)/tasks/page.tsx`

### Pattern: Zustand Store

- **Use when:** Managing client-side state
- **Implementation:** Create store in `apps/web/src/stores/`. Use `create` from Zustand. Access in components via hook. Keep stores focused on one domain.
- **Example location:** `apps/web/src/stores/auth.ts`

### Pattern: API Client Calls

- **Use when:** Making API requests from the frontend
- **Implementation:** Use the fetch wrapper in `apps/web/src/lib/api.ts` which handles credentials (`include`), base URL (`NEXT_PUBLIC_API_URL`), and content type headers.
- **Example location:** `apps/web/src/lib/api.ts`

### Pattern: Shared Types

- **Use when:** Defining TypeScript interfaces used by both API and Web
- **Implementation:** Define types in `packages/shared/src/types/<feature>.ts`. Import via `@sentral/shared/types/<feature>`.
- **Example location:** `packages/shared/src/types/`

## File & Folder Conventions

- **API routes**: `apps/api/src/routes/<feature>/index.ts`
- **API services**: `apps/api/src/services/<feature>.service.ts`
- **DB schema**: `apps/api/src/db/schema/<table>.ts` (one table per file)
- **Web pages**: `apps/web/src/app/(dashboard)/<feature>/page.tsx`
- **Web components**: `apps/web/src/components/<domain>/ComponentName.tsx`
- **Web hooks**: `apps/web/src/hooks/use<Name>.ts`
- **Shared types**: `packages/shared/src/types/<feature>.ts`
- **Shared validators**: `packages/shared/src/validators/<feature>.ts`
- **Tests**: Co-located in `__tests__/` directories next to source

## API Conventions

- **URL structure**: `/api/<feature>` (plural nouns), e.g., `/api/tasks`, `/api/projects`
- **Request/response format**: JSON
- **Validation**: Zod schemas via `@hono/zod-validator` on route handlers
- **Auth**: Cookie-based sessions, `authMiddleware` on protected routes
- **Error responses**: `{ error: string }` with appropriate HTTP status codes

## Anti-Patterns (Project-Specific)

- **Don't use Excalidraw** for whiteboards — custom canvas-based whiteboard is built from scratch (see feedback memory)
- **Don't call Drizzle directly from routes** — always go through a service
- **Don't use JWT** — project uses cookie-based sessions (see DEC-004)
