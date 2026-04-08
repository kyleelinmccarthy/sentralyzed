# Design System — Sentral

> **Last updated:** 2026-04-08
> **Extends:** Universal tokens in `.dev/universal/DesignSystem.md`
> Override tokens and add project-specific components here.

## Styling Approach

- **Framework**: Tailwind CSS 4.0 (utility-first)
- **Dark mode**: next-themes with class strategy
- **Icons**: Lucide React

## Project Token Overrides

<!-- Override universal defaults for this project's branding when established. -->

```css
:root {
  /* Project-specific overrides — update as branding is finalized */
}
```

## Component Library

<!-- Document each reusable UI component as it's created. -->

### Components by Domain

| Domain        | Location                                 | Components                            |
| ------------- | ---------------------------------------- | ------------------------------------- |
| UI (generic)  | `apps/web/src/components/ui/`            | Reusable buttons, inputs, modals      |
| Layout        | `apps/web/src/components/layout/`        | Sidebar, Header, DashboardShell       |
| Assignments   | `apps/web/src/components/assignments/`   | UserAssignmentPicker                  |
| Expenses      | `apps/web/src/components/expenses/`      | ExpenseCard, ExpenseForm, ExpenseList |
| Files         | `apps/web/src/components/files/`         | File upload/display components        |
| Notifications | `apps/web/src/components/notifications/` | Notification system components        |
| Polls         | `apps/web/src/components/polls/`         | Poll creation and voting components   |
| Whiteboard    | `apps/web/src/components/whiteboard/`    | Canvas, Toolbar (custom-built)        |
| Calendar      | Uses Schedule-X                          | `@schedule-x/react` components        |

## Layout Patterns

<!-- Document project-specific layouts as they're established -->

## Icon System

- **Library**: Lucide React (`lucide-react`)
- **Usage**: Import individual icons, not the entire package
- **Sizing**: Use Tailwind size classes (`w-4 h-4`, `w-5 h-5`, etc.)

## Animation / Motion

<!-- Project-specific motion patterns beyond universal defaults -->
