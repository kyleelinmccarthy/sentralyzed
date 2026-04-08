# Universal Design System

> Baseline design tokens and patterns. Project-specific overrides go in `.dev/DesignSystem.md`.

## Color Palette

```css
:root {
  /* Neutral */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Semantic — override per project */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;
}
```

## Typography Scale

| Name    | Size            | Weight | Line Height | Use                      |
| ------- | --------------- | ------ | ----------- | ------------------------ |
| Display | 2.25rem (36px)  | 700    | 1.2         | Hero headings            |
| H1      | 1.875rem (30px) | 700    | 1.3         | Page titles              |
| H2      | 1.5rem (24px)   | 600    | 1.35        | Section headings         |
| H3      | 1.25rem (20px)  | 600    | 1.4         | Subsection headings      |
| Body    | 1rem (16px)     | 400    | 1.5         | Default text             |
| Small   | 0.875rem (14px) | 400    | 1.5         | Secondary text, captions |
| XSmall  | 0.75rem (12px)  | 400    | 1.5         | Labels, badges           |

## Spacing System

Base unit: `0.25rem` (4px). Use multiples:

| Token        | Value          | Use                      |
| ------------ | -------------- | ------------------------ |
| `--space-1`  | 0.25rem (4px)  | Tight spacing, icon gaps |
| `--space-2`  | 0.5rem (8px)   | Compact elements         |
| `--space-3`  | 0.75rem (12px) | Default padding          |
| `--space-4`  | 1rem (16px)    | Standard spacing         |
| `--space-6`  | 1.5rem (24px)  | Section padding          |
| `--space-8`  | 2rem (32px)    | Card padding, large gaps |
| `--space-12` | 3rem (48px)    | Section margins          |
| `--space-16` | 4rem (64px)    | Page-level spacing       |

## Responsive Breakpoints

| Name  | Min Width | Target        |
| ----- | --------- | ------------- |
| `sm`  | 640px     | Large phones  |
| `md`  | 768px     | Tablets       |
| `lg`  | 1024px    | Small laptops |
| `xl`  | 1280px    | Desktops      |
| `2xl` | 1536px    | Large screens |

## Border Radius

| Token           | Value    | Use             |
| --------------- | -------- | --------------- |
| `--radius-sm`   | 0.25rem  | Badges, chips   |
| `--radius-md`   | 0.375rem | Buttons, inputs |
| `--radius-lg`   | 0.5rem   | Cards, modals   |
| `--radius-xl`   | 0.75rem  | Large cards     |
| `--radius-full` | 9999px   | Avatars, pills  |

## Shadow System

| Token         | Value                         | Use              |
| ------------- | ----------------------------- | ---------------- |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)`  | Subtle elevation |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)`   | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |

## Motion

- **Duration**: 150ms for micro-interactions, 300ms for transitions, 500ms for page-level
- **Easing**: `ease-out` for entrances, `ease-in` for exits, `ease-in-out` for state changes
- **Respect `prefers-reduced-motion`**: Always wrap animations in media query check
