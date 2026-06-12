# Omar Jalalzada — personal site

Design leadership writing, reflections, interactive Lab experiments, and selected work.
Built with [Astro](https://astro.build), deployed on Vercel.

## Commands

```sh
npm install      # install dependencies
npm run dev      # dev server at localhost:4321 (drafts visible)
npm run build    # production build (drafts excluded)
npm run preview  # preview the production build
```

## Publishing

Everything publishes by adding files and pushing — Vercel deploys on push.

**To publish a post**: add a markdown file to `src/content/writing/`:

```markdown
---
title: My Post
description: One-sentence summary shown on cards and in meta tags.
topic: design-leadership   # or: reflections
tags: [cybersecurity, craft]
date: 2026-06-11
status: published          # or: draft (visible in dev only)
format: article            # or: note
---

Post body in markdown.
```

The file name becomes the URL: `my-post.md` → `/writing/my-post/`.

**To publish a lab**: two pieces —

1. A self-contained prototype at `public/prototypes/<slug>/index.html` (no build step — plain
   HTML/CSS/JS, AI-generated pages drop in as-is). Served raw at `/prototypes/<slug>/`.
2. A metadata entry at `src/content/labs/<slug>.md` with `prototype: <slug>` in the frontmatter.
   This drives the card grid and the framed page at `/labs/<slug>/`.

**Frontmatter is schema-validated** (`src/content.config.ts`) — the build fails loudly if
metadata is malformed, so a bad push can't silently break the site.

## Project docs

- `docs/brief.md` — the original project brief
- `docs/plans/` — timeline of every accepted implementation plan
- `docs/ideas.md` — parking lot for deferred ideas
- `CLAUDE.md` — conventions for agent sessions
