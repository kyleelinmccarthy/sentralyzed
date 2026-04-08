# Universal Coding Standards

> These standards apply to all projects. Project-specific overrides go in the project's
> `.dev/CodingStandards.md`. If a project standard conflicts with a universal one,
> the project standard wins — but log the deviation in `.dev/Decisions.md`.

## Core Principles

- **DRY** — Don't Repeat Yourself. Extract shared logic, but not prematurely. Duplication is better than the wrong abstraction.
- **SOLID** — Follow the five principles as guidelines:
  - **S**ingle Responsibility: One reason to change per class/module.
  - **O**pen/Closed: Extend behavior without modifying existing code.
  - **L**iskov Substitution: Subtypes must be substitutable for their base types.
  - **I**nterface Segregation: Many specific interfaces over one general-purpose one.
  - **D**ependency Inversion: Depend on abstractions, not concretions.
- **KISS** — Keep It Simple. The simplest solution that works is usually the right one. Complexity must justify itself.
- **TDD** — Write tests first when feasible. Red → Green → Refactor. At minimum, write tests alongside code, never after as an afterthought.
- **YAGNI** — Don't build it until you need it. Avoid speculative abstractions.
- **Composition over Inheritance** — Prefer composing behavior from small pieces over deep inheritance hierarchies.
- **Fail Fast** — Surface errors early and loudly. Silent failures are bugs.

## Next.js / React / TypeScript Conventions

### Naming

| Element          | Convention                                                      | Example                                  |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Components       | PascalCase                                                      | `UserProfile`, `DashboardLayout`         |
| Component files  | PascalCase matching component                                   | `UserProfile.tsx`                        |
| Hooks            | camelCase with `use` prefix                                     | `useAuth()`, `useTimeEntries()`          |
| Utilities        | camelCase                                                       | `formatCurrency()`, `parseDate()`        |
| Constants        | SCREAMING_SNAKE_CASE                                            | `MAX_RETRIES`, `API_BASE_URL`            |
| Types/Interfaces | PascalCase, no `I` prefix                                       | `User`, `TimeEntry`, `DashboardProps`    |
| CSS modules      | camelCase in code                                               | `styles.cardHeader`                      |
| API routes       | kebab-case                                                      | `/api/time-entries`, `/api/user-profile` |
| Env variables    | SCREAMING*SNAKE_CASE with `NEXT_PUBLIC*` prefix for client-side | `NEXT_PUBLIC_API_URL`                    |

### Patterns

- **Server Components by default** — Only use `'use client'` when you need interactivity, browser APIs, or hooks.
- **Co-location** — Keep components, styles, tests, and types close to where they're used.
- **Custom hooks for logic** — Extract stateful logic into hooks. Components should be mostly render logic.
- **Barrel exports with restraint** — Use `index.ts` for public API of a module, but don't barrel everything.
- **Zod for validation** — Use Zod schemas for form validation and API response parsing. Share schemas between client and server.

### Code Organization (Next.js App Router)

```
app/
├── (auth)/           # Route groups for layout sharing
│   ├── login/
│   └── register/
├── dashboard/
│   ├── page.tsx      # Route page
│   ├── layout.tsx    # Route layout
│   └── loading.tsx   # Loading UI
├── api/              # API routes
├── layout.tsx        # Root layout
└── globals.css

components/
├── ui/               # Generic reusable (Button, Input, Modal)
├── features/         # Feature-specific (TimeEntryForm, PayrollTable)
└── layouts/          # Layout components (Sidebar, Header)

lib/
├── hooks/            # Custom hooks
├── utils/            # Utility functions
├── types/            # Shared TypeScript types
└── api/              # API client functions
```

### Error Handling (React/Next.js)

- Use `error.tsx` boundaries for route-level errors
- Use React Error Boundaries for component-level errors
- API calls: try/catch with typed error responses
- Show user-friendly messages; log detailed errors server-side
- Toast notifications for transient errors; inline for form validation

### Testing (React/TypeScript)

- Use Vitest or Jest with React Testing Library
- Test behavior, not implementation — query by role/label, not class/id
- Test naming: `it('should display error when form submitted empty')`
- Mock API calls at the fetch/axios level, not component level
- Snapshot tests only for stable, rarely-changing UI

## General Web / HTML / CSS / Accessibility

### HTML

- Semantic elements always: `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<header>`, `<footer>`
- One `<h1>` per page, heading hierarchy never skips levels
- All `<img>` tags have meaningful `alt` text (empty `alt=""` only for decorative images)
- All form inputs have associated `<label>` elements (not just placeholder text)
- Use `<button>` for actions, `<a>` for navigation — never interchange them

### CSS

- Mobile-first approach — base styles for mobile, progressive enhancement with `min-width` media queries
- Use CSS custom properties (variables) for theming values — colors, spacing, typography
- Prefer `rem` for font sizes, `em` for component-relative spacing, `px` for borders/shadows
- Avoid `!important` — if you need it, the specificity architecture needs fixing
- Use logical properties when possible (`margin-inline`, `padding-block`) for RTL support

### Accessibility (WCAG 2.1 AA minimum)

- Color contrast: 4.5:1 for normal text, 3:1 for large text (18px+ bold or 24px+ regular)
- All interactive elements keyboard-accessible with visible focus indicators
- Touch targets: minimum 44x44px
- Motion: respect `prefers-reduced-motion` — disable animations when set
- Screen reader: test with NVDA or VoiceOver periodically
- ARIA: use native HTML semantics first. ARIA only when no semantic element exists.
- Forms: associate errors with inputs via `aria-describedby`

## Git Workflow

### Branch Naming

```
feature/[short-description]     — New feature
fix/[short-description]         — Bug fix
refactor/[short-description]    — Code restructure
chore/[short-description]       — Tooling, deps, config
docs/[short-description]        — Documentation only
hotfix/[short-description]      — Production emergency fix
```

### Commit Messages

```
type(scope): short description

[optional body — what and why, not how]

[optional footer — breaking changes, issue refs]
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

Examples:

- `feat(timesheet): add overtime calculation for biweekly pay periods`
- `fix(auth): prevent token refresh race condition on concurrent requests`
- `refactor(api): extract Paylocity client into standalone service`

### PR Conventions

- PR title matches commit convention
- Description includes: what changed, why, how to test
- Self-review before requesting others
- Keep PRs focused — one concern per PR when possible
