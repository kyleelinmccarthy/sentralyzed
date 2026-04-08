# Team Guide — Sentral

> Collaboration conventions for multi-developer workflows with Claude Code.

## Getting Started

1. Claude Code detects your username from `git config user.name` (lowercased, spaces → hyphens)
2. If `.dev/team/<username>/` doesn't exist, Claude Code will offer to create it
3. Each developer gets their own directory with:
   - `context.md` — Current task state, blockers, next steps (updated each session)
   - `preferences.md` — Communication style, coding preferences, expertise areas

## Team Directory Structure

```
.dev/team/
├── TEAM_GUIDE.md           # This file
├── <username>/
│   ├── context.md          # Session handoff state
│   └── preferences.md      # Personal preferences
└── <username>/
    ├── context.md
    └── preferences.md
```

## Session Flow

### Start of Session

1. Claude Code reads `.dev/team/<username>/context.md` to resume where you left off
2. Claude Code reads `.dev/team/<username>/preferences.md` to tailor its approach
3. If preferences.md has no real content, Claude Code will walk you through setup

### End of Session

1. Claude Code updates `context.md` with:
   - What was accomplished
   - What's in progress
   - Any blockers
   - Suggested next steps

## Attribution

In team mode, shared doc entries include attribution:

- **Learnings**: `L-<username>-001` with `**Author:** @<username>`
- **Decisions**: `DEC-<username>-001` with `**Author:** @<username>`
- **Changelog**: `## YYYY-MM-DD — @<username> — [Session Summary]`

## Collaboration Rules

1. **Don't modify another developer's `context.md` or `preferences.md`** unless asked
2. **Shared docs are shared** — Decisions.md, Learnings.md, Architecture.md, etc. are team property
3. **Append, don't edit** — Never modify another developer's existing entries in Learnings or Decisions
4. **Communicate via docs** — If you discover something that affects a teammate's work, log it in Learnings.md with a note

## Onboarding a New Developer

1. Have them read `CLAUDE.md` (root) for quick reference
2. Then `.dev/Architecture.md` for system understanding
3. Then `.dev/CodingStandards.md` for project patterns
4. Claude Code will create their team directory on first session
5. Walk through preferences setup when prompted

## Code Review Expectations

When reviewing PRs, check:

- [ ] New patterns documented in CodingStandards.md if applicable
- [ ] New decisions logged in Decisions.md if applicable
- [ ] Changelog.md updated
- [ ] Feature docs updated if a feature was modified
