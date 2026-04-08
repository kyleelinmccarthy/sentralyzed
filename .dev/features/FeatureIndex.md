# Feature Index — Sentral

> Master index of all documented features, systems, and utilities.
> Claude Code: Scan this index to find the right doc before modifying a feature, system, or utility.
> **Last updated:** 2026-04-08

## Features

> User-facing functionality — things a user directly interacts with.

| Name               | One-liner                                          | Doc |
| ------------------ | -------------------------------------------------- | --- |
| Auth               | Login, register, Google OAuth, session management  | —   |
| Dashboard          | Overview page with stats and activity feed         | —   |
| Projects           | Project creation, management, and collaboration    | —   |
| Tasks              | Task CRUD, assignment, status tracking             | —   |
| Goals              | Goal setting and progress tracking                 | —   |
| Calendar           | Schedule viewing and event management (Schedule-X) | —   |
| Chat               | Real-time messaging between users                  | —   |
| Forums             | Discussion threads and topic management            | —   |
| Whiteboards        | Real-time collaborative canvas (custom-built, Yjs) | —   |
| Files              | File upload, storage, and sharing                  | —   |
| Expenses           | Expense tracking, categories, and reporting        | —   |
| Assignments        | User assignment management and picker              | —   |
| Polls              | Poll creation, voting, and results                 | —   |
| Feedback           | User feedback collection and management            | —   |
| Assets             | Asset tracking and management                      | —   |
| Clients            | Client/customer management                         | —   |
| Entity Links       | Cross-linking between different entities           | —   |
| Pins               | Pin/bookmark important items                       | —   |
| Settings           | User and workspace settings                        | —   |
| Admin              | User management, invitations, role assignment      | —   |
| Activity           | Activity feed and audit log                        | —   |
| GitHub Integration | GitHub repository and issue integration            | —   |

## Systems

> Runtime infrastructure that features depend on.

| Name                | One-liner                                | Doc |
| ------------------- | ---------------------------------------- | --- |
| Auth Middleware     | Cookie-based session validation and RBAC | —   |
| WebSocket Server    | Real-time communication (ws + Yjs CRDTs) | —   |
| Security Middleware | Rate limiting, headers, CORS             | —   |
| API Client          | Frontend fetch wrapper with credentials  | —   |

## Utilities

> Shared tools, helpers, singletons — cross-cutting concerns used by multiple features/systems.

| Name                   | One-liner                                          | Doc |
| ---------------------- | -------------------------------------------------- | --- |
| Drizzle Schema Helpers | `timestamps()` and `softDelete()` reusable columns | —   |
| Shared Validators      | Zod schemas in `@sentral/shared/validators`        | —   |
| Shared Types           | TypeScript interfaces in `@sentral/shared/types`   | —   |
| Expense Helpers        | Utility functions for expense calculations         | —   |
