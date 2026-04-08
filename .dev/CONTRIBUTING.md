# Contributing — Doc Update Protocol

> Claude Code: Read this when you need to **write to** or **update** any `.dev/` doc.
> You don't need to read this for every task — CLAUDE.md will tell you when.

## Self-Update Protocol

After completing work, update the relevant docs:

### Always Update

- **Changelog.md** — One entry per session summarizing what was accomplished.
- **context.md** (team mode) — Update `.dev/team/<username>/context.md` at the end of every session with: what was done, what's in progress, blockers, and next steps. This is how the next session picks up where you left off.

### Update When Relevant

- **Learnings.md** — When you hit a bug, discovered a gotcha, found a better approach, or something was harder than expected. **Bias toward writing learnings — if in doubt, write it down.**
- **Decisions.md** — When a meaningful choice was made (library, pattern, data model, API design). Include what was chosen, what was rejected, and why.
- **Architecture.md** — When new components, services, or integrations are added or relationships change.
- **CodingStandards.md** (project) — When a new project-specific pattern is established or deprecated.
- **DesignSystem.md** (project) — When new UI components, tokens, or patterns are created.
- **DesignStandards.md** (project) — When UX conventions are established or changed.
- **Stack.md** — When dependencies are added, removed, or upgraded.
- **Proposals.md** — When brainstorming, exploring ideas, or designing new features. **Create a proposal first before implementing speculative features.** Graduate to a Decision (DEC-xxx) when accepted, or archive with rationale when shelved.
- **Feature docs** (.dev/features/\*.md) — When adding, modifying, or removing a feature, system, or utility. Update the relevant doc and FeatureIndex.md. Use `.dev/universal/FeatureDoc.md` as the template for new feature docs.

### Promote to Universal

When a pattern proves useful across multiple tasks and seems project-agnostic, add a comment in the relevant doc: `<!-- PROMOTE TO UNIVERSAL: [description] -->`.

### Update CLAUDE.md When

- The project stack changes
- New critical rules emerge
- New `.dev/` docs are added
- The project status changes

## Entry Formats

### Learnings (Learnings.md)

```
## L-[NUMBER] — [Short descriptive title]
- **Date:** YYYY-MM-DD
- **Category:** Bug | Gotcha | Performance | Pattern | Tool | Integration | Security
- **Severity:** Low | Medium | High | Critical
- **What happened:** Brief description.
- **Root cause:** Why it happened.
- **Solution/Workaround:** How it was resolved.
- **Prevention:** How to avoid this in the future.
- **Time lost:** Rough estimate.
- **Related:** Links to code, decisions, other learnings.
```

### Decisions (Decisions.md)

```
## DEC-[NUMBER] — [Title]
- **Date:** YYYY-MM-DD
- **Status:** Accepted | Superseded by DEC-XXX | Deprecated
- **Context:** What prompted this decision?
- **Options Considered:**
  1. **[Option A]** — Pros: ... / Cons: ...
  2. **[Option B]** — Pros: ... / Cons: ...
- **Decision:** What was chosen and why.
- **Consequences:** Trade-offs accepted.
- **Related:** Links to learnings, architecture, other decisions.
```

### Proposals (Proposals.md)

```
## PRO-[NUMBER] — [Title]
- **Date:** YYYY-MM-DD
- **Status:** Draft | Exploring | Accepted | Archived
- **Type:** Feature | Architecture | Process | Tool
- **Summary:** One paragraph — what is this idea?
- **Motivation:** Why does this matter?
- **Approach:** High-level how
- **POC:** Link to branch, design doc, or inline notes
- **Outcome:** (filled when resolved) What happened, why accepted/archived
- **Related:** DEC-xxx if accepted, L-xxx for relevant learnings
```

#### Proposal Workflow

1. **When brainstorming or exploring ideas** → create a PRO-xxx entry in Draft status
2. **Before implementing a speculative feature** → check Proposals.md for an existing proposal
3. **When investigating a proposal** → move to Exploring status, add POC notes
4. **When a proposal is accepted** → move to Accepted, create a corresponding DEC-xxx in Decisions.md, link them
5. **When a proposal is rejected/shelved** → move to Archived with rationale in the Outcome field

### Changelog (Changelog.md)

```
## YYYY-MM-DD — [Session Summary]
**Focus:** [What this session was about]
- Key accomplishment 1
- Key accomplishment 2
- Issues encountered (link to Learnings if logged)
```

## Team Mode Updates

When `.dev/.team` exists, these additional rules apply:

### context.md — Always update at session end

```
# Current Context — @<username>

## Active Task
Building the payment retry logic for failed subscriptions.

## Blocked On
Waiting on Stripe webhook secret from DevOps.

## Next Up
Add email notification on final retry failure.

## Notes
The retry delay constants are in config/billing.ts — don't hardcode them.
```

Replace placeholders with real content. This is the handoff doc — the next session (yours or a teammate's) reads this first.

### preferences.md — User updates manually

Do NOT auto-modify `preferences.md`. This is the developer's personal file. Only update it when the developer explicitly asks.

### Attribution

In team mode, all shared doc entries get username prefixes and `@username` tags:

- Learnings: `L-<username>-001`, with `**Author:** @<username>`
- Decisions: `DEC-<username>-001`, with `**Author:** @<username>`
- Changelog: `## YYYY-MM-DD — @<username> — [Session Summary]`

## Rules

- **Never delete existing entries** in Learnings.md or Decisions.md — append only.
- Mark superseded decisions as `Superseded by DEC-XXX`, don't delete them.
- Always include the date on new entries.
- Use the next sequential number for L-### and DEC-### entries.
- Consolidation happens during human review, not during development sessions.

## Merge & Collaboration

- After resolving merge conflicts in `.dev/` files, run `dev condense` to regenerate `.summary.md`.
- If you see `<!-- MERGE NOTE: ... -->` comments in `.dev/` files, review and resolve them, then remove the comment.
- `.dev/` files use custom merge drivers when `dev hooks install` has been run. If merges produce unexpected results, check `.gitattributes`.

## Context Loading Strategy

Claude Code should scale doc reading to task size:

- **Small tasks** (bug fix, minor tweak): CLAUDE.md + Learnings.md + most relevant doc.
- **Medium tasks** (feature, refactor): CLAUDE.md + Architecture.md + CodingStandards.md (both levels) + Learnings.md + Decisions.md.
- **Large tasks** (new module, major refactor): Read ALL `.dev/` docs including universals.
