# .dev/ — Project Intelligence Framework

> This directory maintains structured project knowledge for Claude Code across sessions.
> It is the source of truth for architecture, decisions, patterns, and learnings.

## File Index

| File                                                 | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| [Architecture.md](Architecture.md)                   | System design, component map, data flow, tech stack      |
| [CodingStandards.md](CodingStandards.md)             | Project-specific coding patterns and conventions         |
| [Stack.md](Stack.md)                                 | Full dependency inventory with versions                  |
| [Decisions.md](Decisions.md)                         | Architecture Decision Records (ADRs) — append-only       |
| [Learnings.md](Learnings.md)                         | Bugs, gotchas, and hard-won knowledge — append-only      |
| [Proposals.md](Proposals.md)                         | Ideas and explorations — brainstorm to decision pipeline |
| [Changelog.md](Changelog.md)                         | Session-by-session log of what changed                   |
| [DesignSystem.md](DesignSystem.md)                   | Project design tokens and component library              |
| [DesignStandards.md](DesignStandards.md)             | Project UX conventions                                   |
| [CONTRIBUTING.md](CONTRIBUTING.md)                   | Doc update protocol and entry formats                    |
| [.summary.md](.summary.md)                           | Condensed snapshot for quick context loading             |
| [features/FeatureIndex.md](features/FeatureIndex.md) | Master index of all features, systems, and utilities     |

### Universal Templates (`.dev/universal/`)

| File                                               | Purpose                                        |
| -------------------------------------------------- | ---------------------------------------------- |
| [CodingStandards.md](universal/CodingStandards.md) | Baseline coding conventions (React/TS/Web/Git) |
| [DesignSystem.md](universal/DesignSystem.md)       | Baseline design tokens                         |
| [DesignStandards.md](universal/DesignStandards.md) | Baseline UX conventions                        |
| [FeatureDoc.md](universal/FeatureDoc.md)           | Template for new feature documentation         |
| [FeatureIndex.md](universal/FeatureIndex.md)       | Template for feature index format              |

### Team (`.dev/team/`)

| File                                | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| [TEAM_GUIDE.md](team/TEAM_GUIDE.md) | Collaboration conventions and onboarding |

## How-To

### Adding a Feature Doc

1. Copy `.dev/universal/FeatureDoc.md` to `.dev/features/<FeatureName>.md`
2. Fill in all sections
3. Add a row to `.dev/features/FeatureIndex.md`

### Recording a Decision

1. Open `.dev/Decisions.md`
2. Copy the template at the top
3. Use the next sequential `DEC-###` number
4. Fill in all fields — especially Options Considered and Consequences

### Recording a Learning

1. Open `.dev/Learnings.md`
2. Copy the template at the top
3. Use the next sequential `L-###` number
4. Be specific about root cause and prevention

### Updating Standards

1. Check if the change is project-specific or universal
2. Edit the appropriate `CodingStandards.md` (`.dev/` or `.dev/universal/`)
3. If overriding a universal standard, log the deviation in `Decisions.md`
