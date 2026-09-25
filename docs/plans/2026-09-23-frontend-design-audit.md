# Frontend-design skill audit (everything)

**Date:** 2026-09-23  
**Prompted by:** Evaluate the full site (chrome + prototypes) against Anthropic's `frontend-design` skill and produce a findings report.

---

# Frontend-design skill audit (everything)

## Goal

Produce a **critique report** of the entire frontend against [Anthropic's `frontend-design` skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design). Scope is **everything**: site chrome *and* prototype internals. This pass is **evaluate + report only** — no redesign or code fixes unless you ask after reviewing findings.

## Setup

1. Install the skill locally as you specified:
   `npx skills add https://github.com/anthropics/skills --skill frontend-design`
2. Read the installed `SKILL.md` as the active rubric (already fetched; re-read after install to confirm path).
3. Ground the critique in project canon so “distinctive” is judged against *Omar*, not against a generic portfolio template:
   - [docs/omar.md](docs/omar.md)
   - [docs/brief.md](docs/brief.md)
   - Locked site direction in [CLAUDE.md](CLAUDE.md) (craft-first home, About holds bio, writing ≈ experiments weight)
   - [src/styles/tokens.css](src/styles/tokens.css) (Constellation tokens)

## Rubric (from the skill)

Score each surface against these lenses:

- **Subject-matter grounding** — does the UI feel like this person's craft/instrument world, or like a generic personal-site kit?
- **Hero / first-viewport** — characteristic thing first; no default “big number + stats + gradient” hero
- **Typography** — deliberate faces/scale; avoid single-word accent tricks, ALL-CAPS label chrome, unnecessary eyebrows
- **Structure as information** — borders/dividers/numbers only when content warrants them
- **Motion** — one orchestrated moment beats scatter; action-triggered motion preferred
- **Copy** — plain, active, one job per string; not decorative filler
- **Restraint** — one memorable element; quality floor (mobile, focus, reduced motion, contrast)
- **AI-default cluster check** — flag hits on the skill's five known clusters (cream/serif/terracotta; black+acid accent; broadsheet hairlines; SaaS identical cards+soft shadow; template chrome like `A · B · C`, near-black `#0B0B0B`, mono meta labels, trailing `→`/`↗`)

Important calibration: a hit on a “cluster” trait is only a finding if it reads as *default for any brief*, not if [docs/omar.md](docs/omar.md) / Constellation intentionally chose it. Call that distinction out explicitly in the report.

## Surfaces to review

**Site chrome (`src/`)**

- Home — [src/pages/index.astro](src/pages/index.astro)
- Writing index + detail — [src/pages/writing/](src/pages/writing/)
- Experiments index + detail (iframe card frame) — [src/pages/experiments/](src/pages/experiments/), [src/components/ui/ExperimentsGrid.tsx](src/components/ui/ExperimentsGrid.tsx), [src/components/ui/Card.tsx](src/components/ui/Card.tsx)
- About — [src/pages/about.astro](src/pages/about.astro)
- Shared layout / logotype — [src/layouts/](src/layouts/), [src/components/constellation/](src/components/constellation/)
- Design-system page if it reveals token/component habits — [src/pages/design-system.astro](src/pages/design-system.astro)

**Prototypes (`public/prototypes/*/`) — each as its own craft surface**

bar-field, farsh, naughty-narwal, girih, grain, atlas, cursor-field, sankey, spring, type-weight (and any versioned forks under those folders)

## Method

1. Code pass: layout, tokens usage, type, motion, copy patterns, card/shadow/radius habits.
2. Visual pass: with `npm run dev` running outside the sandbox, capture screenshots via `GET /api/screenshot?view=…` (and `prototype=<slug>` where needed) for first-viewport reads — per CLAUDE.md, don't guess from code alone.
3. Soft-presence note: production may hide most of the site; critique the **dev full site** (what you're iterating on), and briefly note what production currently shows.

## Deliverable

A **Cursor Canvas report** (analytical artifact, not a new `docs/` file) with:

1. **Executive verdict** — overall distinctiveness vs templated risk
2. **Strengths** — where the site already spends boldness well (esp. instruments / craft-first direction)
3. **Findings** — prioritized list (High / Med / Low), each with surface, skill principle violated or upheld, evidence (file + screenshot note), and whether it's intentional Constellation vs accidental AI-default
4. **Per-area scorecard** — Home, Writing, Experiments chrome, About, Prototypes (as a group with callouts for standouts/weak links)
5. **Recommended next moves** — ranked, optional follow-ups only (no implementation in this pass)

## Out of scope

- Installing unrelated skills from the Anthropics repo
- Implementing redesigns, token changes, or copy rewrites
- Auditing `explore/` sketch archive (making-of), unless a prototype redirects there and the shipped experience depends on it
