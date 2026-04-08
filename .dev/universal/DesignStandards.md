# Universal Design Standards

> Baseline UX conventions. Project-specific overrides go in `.dev/DesignStandards.md`.

## UX Principles

1. **Clarity over cleverness** — Every interaction should be immediately understandable.
2. **Consistency** — Same patterns for same actions across the entire app.
3. **Feedback** — Every user action gets a visible response within 100ms.
4. **Forgiveness** — Support undo, confirmation for destructive actions, clear escape hatches.
5. **Progressive disclosure** — Show the minimum needed, reveal complexity on demand.

## Layout Patterns

- **Content width**: Max 1280px for content areas, centered with auto margins.
- **Sidebar + main**: Fixed sidebar (240-280px), fluid main content.
- **Card grids**: Use CSS Grid with `auto-fill` / `minmax()` for responsive cards.
- **Sticky headers**: Navigation and toolbars stick on scroll.

## Form Patterns

- **Labels above inputs** — Always visible, not just placeholders.
- **Inline validation** — Validate on blur, show errors below the field.
- **Required fields** — Mark optional fields, not required ones (most fields are required).
- **Submit button state** — Disabled while submitting, show loading indicator.
- **Error summary** — For complex forms, show error summary at top linking to each field.
- **Autosave** — For long forms, autosave drafts. Show "Saved" indicator.

## Loading States

- **Skeleton screens** — Prefer over spinners for content areas.
- **Spinners** — Use for actions (button clicks, form submissions).
- **Progress bars** — Use for operations with known duration.
- **Optimistic updates** — Update UI immediately, revert on failure.

## Empty States

- **Descriptive** — Explain what will appear here and how to add it.
- **Actionable** — Include a primary CTA to create/add the first item.
- **Illustrated** — Use an icon or illustration, not just text.

## Error States

- **Inline errors** — Below the relevant field, red text with error icon.
- **Toast notifications** — For transient errors (network, server).
- **Error pages** — Full-page for 404, 500. Include "go back" and "go home" links.
- **Retry** — Offer retry for network/server errors.

## Confirmation Patterns

- **Destructive actions** — Always confirm deletes with modal. Show what will be deleted.
- **Irreversible actions** — Require typing confirmation (e.g., "delete my-project").
- **Bulk actions** — Show count of affected items in confirmation.

## Notification Patterns

- **Toast**: Auto-dismiss after 5s. Top-right or bottom-right.
- **Banner**: Persistent, dismissible. For system-wide messages.
- **Badge**: Numeric badge on icons for unread counts.

## Keyboard & Navigation

- **Tab order**: Logical, follows visual layout.
- **Escape**: Closes modals, popovers, and dropdowns.
- **Enter**: Submits forms, confirms dialogs.
- **Shortcuts**: Document and make discoverable (tooltip on hover).
