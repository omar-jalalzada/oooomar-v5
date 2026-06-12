# Omar's personal site

Personal site for Omar Jalalzada: design leadership writing, reflections, interactive Lab
experiments, and a head-of-design portfolio. Wireframe-level MVP first; brand/visual identity
comes later as its own phase.

## Stack

- Astro 6 (static output) + `@astrojs/react` for interactive islands
- Content collections with zod schemas in `src/content.config.ts` — the build fails on malformed
  frontmatter, which is the guardrail when agents write content
- Vercel hosting via `@astrojs/vercel` (web analytics enabled in `astro.config.mjs`)
- Vanilla CSS with design tokens in `src/styles/tokens.css` — no Tailwind/CSS frameworks

## Conventions

- **Tokens only**: pages and components reference CSS custom properties from `tokens.css`, never
  raw px/hex values. Spacing stays on the 4px grid.
- **Drafts**: content with `status: draft` renders in dev, is excluded from production builds.
  Use `getVisible()` from `src/lib/content.ts` for all collection queries — never raw
  `getCollection()` in pages (the RSS feed is the one exception, it filters explicitly).
- **Labs**: a lab = self-contained static folder `public/prototypes/<slug>/index.html` (no build
  step, no external deps) + a metadata entry `src/content/labs/<slug>.md` whose `prototype` field
  names the folder.
- **Tools**: prefer well-known tools with deep community and AI training data (Astro, React)
  over niche ones.
- `site` in `astro.config.mjs` is a placeholder until the real domain is connected in Vercel.

## Deployment

- Production deploys from `main` on Vercel: https://omar.build (project URL: omar-neon.vercel.app)
- Workflow: feature branch → push (Vercel builds a preview URL) → PR → Omar merges to `main` →
  production deploy. Never push directly to `main`.

## Process rules

- **Live review before push**: Omar always reviews changes in his browser before they go to
  GitHub. After web-facing changes, start `npm run dev` (background) and share the local URL;
  don't commit or push until he's seen it and says go.
- **Plan archive**: when the user accepts a plan in plan mode, copy it verbatim into
  `docs/plans/YYYY-MM-DD-<slug>.md` (with a short header: date, what prompted it) and add an
  index line to `docs/plans/README.md` — before starting implementation. This is Omar's
  learning timeline; never skip it.
- **Parking lot**: deferred "while I'm at it" ideas go to `docs/ideas.md`, not into the build.
- The original project brief lives at `docs/brief.md` — read it before proposing structural
  changes.
- Append new conventions to this file as they're decided during builds.
