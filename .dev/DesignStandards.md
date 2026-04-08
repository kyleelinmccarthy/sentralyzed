# Design Standards — Sentral

> **Last updated:** 2026-04-08
> **Extends:** Universal standards in `.dev/universal/DesignStandards.md`
> Project-specific UX decisions and overrides here.

## UX Principles (Project-Specific)

1. **Collaborative by default** — Features should support multi-user workflows (real-time where appropriate, shared views, assignments).
2. **Dashboard-centric** — The dashboard is the hub. All features are accessible from the sidebar navigation.
3. **Progressive complexity** — Simple features (tasks, notes) should be immediately usable. Complex features (whiteboards, project management) can have deeper UIs.

## Navigation Patterns

- **Sidebar navigation**: Primary navigation via left sidebar within `(dashboard)` layout
- **Feature pages**: Each feature has its own page under `(dashboard)/<feature>/`
- **Detail pages**: Entity details at `(dashboard)/<feature>/[id]/page.tsx`

## Form Patterns (Project-Specific)

- **Validation**: Zod schemas shared between client and server — same rules in both places
- **API integration**: Forms submit via the API client in `src/lib/api.ts`

## Content & Voice

<!-- Tone for this project — to be defined as the product matures -->
