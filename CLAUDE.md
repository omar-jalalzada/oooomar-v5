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

- **Screenshot API (dev — verify your UI)**: a screenshot endpoint is available while
  `npm run dev` is running at `GET /api/screenshot?view=<path>` (e.g. `view=/` for the home
  canvas, `view=/writing/<slug>/` for a detail page, or `prototype=<name>` for a Lab). It returns
  a PNG. **Always use it after building or changing UI to confirm the page actually renders
  correctly** — don't guess from the code. Save and inspect it, e.g.
  `curl -s "http://localhost:4321/api/screenshot?view=/" -o /tmp/shot.png` then read the image.
  Params: `w`/`h` (viewport, default 1440×900), `full=1` (full page), `animate=1` (play the canvas
  entrance instead of the default settled capture), `wait=<ms>` (extra settle time). Implemented in
  `scripts/vite-screenshot-plugin.js`, registered via `vite.plugins` in `astro.config.mjs`; dev-only
  (`apply: 'serve'`), so it never ships in the production build.
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
- **Identity & ethos**: `docs/omar.md` is the baseline reference for who Omar is, how he sees, and
  his aesthetic loyalties — read it before any brand/visual/copy direction so work stays rooted in
  him, not category clichés.
- Append new conventions to this file as they're decided during builds.

## Site direction (locked)

- **Home leads with craft, not a statement.** No grandiose hero headline ("Design that makes…").
  The work — writing and experiments — comes first.
- **Omar/bio content lives on the About page**, not the home.
- **Writing and experiments carry equal weight** to the portfolio (per `docs/omar.md`).

## explore/ — the public iteration archive

- `public/explore/<concept>/<version>/` is the deliberately-public "making of" record — the
  design sketchbook, showing the iteration behind the site. It ships (this is intentional; Omar
  wants it browsable) and is **separate from `public/prototypes/`** (which is the finished,
  shipped Labs).
- **Never overwrite an iteration.** Each pass is a new `vN/` folder; `explore/<concept>/index.html`
  redirects to the latest. The journey is the point.
- These are throwaway-style static HTML (fast motion prototypes). The *winning* concept gets
  rebuilt properly in `src/` as the real site — explore is the sketch, `src/` is the painting.

### Exploring concepts in parallel

- Each distinct design concept gets its **own branch** (and its own Conductor workspace), and its
  own folder `public/explore/<concept>/`. Branches run in parallel — they don't collide because
  each concept is a separate folder.
- The current locked direction is `explore/stage/` (the "Living Stage" — OMAR logotype that
  self-constructs, floating dock, asymmetric work cards). New concepts start fresh, e.g.
  `explore/<new-concept>/v1/`.
- The only shared file is `public/explore/index.html` (the archive landing). When a concept
  branch lands, add its section there — expect a trivial merge if several land together.
- Same rules apply per concept: never overwrite a version (`vN/`), `index.html` redirects to the
  latest.
