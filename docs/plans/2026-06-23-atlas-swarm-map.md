> **Date:** 2026-06-23
> **What prompted it:** Omar wants to turn ~10 years of Foursquare/Swarm check-ins into an
> interactive world map — the first official, data-driven Lab on omar.build. This plan covers
> getting the data out of Swarm and building a self-contained map + scrubber + stats experiment.
> Built first on sample data (real export in progress), with city-level coarsening for privacy.

# Lab: "Atlas" — a decade of Swarm check-ins as a self-contained world map

## Context

Omar has ~10 years of Foursquare/Swarm check-ins. He wants to turn them into an
interactive world map and "a few fun things" — the first **official** Lab experiment on
omar.build (prior prototypes were craft/generative studies; this is the first data-driven one).

Decisions locked with Omar:
- **Data source:** Omar will use Swarm's official in-app/web self-service export (Settings →
  Privacy) and hand over a JSON/CSV file. The developer API (`/users/self/checkins`) is a
  fallback only — Foursquare's legacy API hit its May 15, 2026 deprecation cutoff and is
  unstable. **No API keys, no network at runtime.**
- **Privacy:** omar.build is public and this is a decade of his movements. The published
  experiment shows **city-level only** — points snap to city centroids, never raw venue
  coordinates. Home/work never appear as precise pins because nothing does.
- **Scope (v1):** go big — **map + time scrubber + stats layer**.
- **Rendering:** **custom self-contained map** — a baked-in world land outline (GeoJSON)
  rendered to canvas/SVG, check-in cities as glowing dots. No Leaflet/Mapbox/tiles. Matches the
  existing Labs' no-external-deps convention and the minimal Constellation aesthetic.

Fit with conventions (verified): a Lab = self-contained `public/prototypes/<slug>/index.html`
(no build step, no external deps) + metadata `src/content/labs/<slug>.md`. The labs collection
zod schema (`src/content.config.ts`) requires: `title`, `description`, `date`, `status`
(`draft|published`), `prototype`; `tags` optional. Detail page `src/pages/labs/[slug].astro`
embeds the prototype in an iframe and links "open full screen". Prototypes are standalone — they
hardcode their own colors/fonts, they do **not** import `tokens.css` — but should echo the
Constellation palette (`--color-ink #0b0b0c`, `--color-accent #195cff`, mono = JetBrains Mono).

**Build now with sample data, swap later.** Omar's real export is in progress. We build the
entire prototype against a hand-authored **sample `data.json`** in the exact normalized output
shape (§1) — a believable spread of world cities with counts, date ranges, and categories. When
the real export arrives, we run the §1 adapter to overwrite `data.json` and nothing else changes.
The adapter's field-mapping is still finalized against the real file (Swarm's export shape isn't
documented), but the prototype, map, scrubber, and stats are all built and reviewable today.

## Slug / name

Proposed slug + title: **`atlas`** (one-word, fits `grain` / `girih` / `spring` / `cursor-field`).
Omar can rename before build.

## Implementation

### 0. Archive this plan (process rule)
Copy this plan verbatim to `docs/plans/2026-06-23-atlas-swarm-map.md` with a short header, and add
an index line to `docs/plans/README.md`. Do this before writing code.

### 1. Data pipeline → a single static, coarsened JSON

**Step 1a (now): sample data.** Hand-author `public/prototypes/atlas/data.json` in the normalized
output shape below — ~25–40 cities across continents with plausible `count`, `firstVisit`/
`lastVisit`, `categories`, and `visitsByMonth`, plus the `meta` totals. This unblocks the full
build and review today.

**Step 1b (when export arrives): the adapter.**
Omar drops the raw export somewhere local (e.g. `/.context/swarm-export.json`, **not** committed).
A one-off Node script (kept in `scripts/`, e.g. `scripts/build-atlas-data.mjs`, run manually —
not part of the Astro build) transforms it into the committed prototype data file:

- **Inspect & adapt:** read the real export, map its fields to a normalized check-in shape
  `{ lat, lng, city, region, country, countryCode, category, date }`. (Adapter is written once we
  see the file — Swarm export ≈ raw API objects with `venue.location.{lat,lng,city,state,cc}`,
  `venue.categories`, and a `createdAt` epoch, but confirm against the actual file.)
- **Coarsen to city-level (privacy):** group by `(city, countryCode)`; assign each group one
  representative coordinate (the city centroid = mean of its venue lat/lngs, rounded to ~2 decimal
  places so it can't be reversed to a venue). Drop raw venue lat/lngs from output entirely.
- **Output** `public/prototypes/atlas/data.json`: an array of cities
  `{ city, country, countryCode, lat, lng, count, firstVisit, lastVisit, categories: {coffee: n, airport: n, …}, visitsByMonth: [...] }`
  plus a small `meta` block (totals: cities, countries, check-ins, date range). This is the only
  data that ships — small, anonymized, no per-venue rows.

### 2. The prototype — `public/prototypes/atlas/index.html`
Self-contained: inline `<style>` + `<script>`, fetches its sibling `data.json` and
`world.geojson`. Three layers:

- **Map (spine):** ship a compact world land outline as `public/prototypes/atlas/world.geojson`
  (simplified world-110m land polygons, committed static asset — no network). Render with an
  **equirectangular projection** computed inline (`x=(lng+180)/360*W`, `y=(90-lat)/180*H` — no
  d3 needed) to a `<canvas>` (or SVG). Draw landmasses as quiet ink-on-paper shapes; draw each
  city as a glowing accent dot whose radius scales with `count`. Hover/tap a dot → small label
  (city, count, date range, top category). On-brand: paper `#fcfcfd` bg, ink land, `#195cff`
  accent dots, JetBrains Mono labels.
- **Time scrubber:** a bottom timeline spanning first→last check-in. Dragging it filters dots to
  cities active up to that month (or within a window); "play" animates the decade so the map
  fills in chronologically. Reuse the minimal bottom-center monospace UI idiom from existing labs.
- **Stats layer:** a quiet panel (corner or toggled) — countries visited, cities, total
  check-ins, top venues/cities by count, category breakdown (coffee vs airport vs …), and a
  couple of "fun" derived stats (furthest-from-home, longest streak/gap). Driven entirely from the
  precomputed `data.json` aggregates.

Apply interfacecraft discipline: 3-level type hierarchy, 4px spacing grid, layered/tinted
shadows, reduction passes, and at least 3 depth iterations on the chosen direction before
calling it done.

### 3. Lab metadata — `src/content/labs/atlas.md`
Frontmatter per schema: `title: Atlas`, `description`, `tags: [data, map, travel]`,
`date: 2026-06-23`, `status: draft` (publish only after Omar reviews live), `prototype: atlas`.
Body: a short note on what it is (a decade of movement, city-level). It auto-appears on
`/labs/` (published) and gets its own `/labs/atlas/` detail page via existing routing — no page
code to write.

## Privacy checklist (gate before `status: published`)
- Output JSON contains **no** raw venue coordinates or names — only city centroids + aggregates.
- Centroids rounded to ~2 decimals.
- Raw export stays out of git (`.context/` is gitignored; confirm before any commit).
- Omar eyeballs the final city list for anything he'd rather not surface.

## Verification
- `npm run dev` (background). Screenshot the prototype:
  `curl -s "http://localhost:4321/api/screenshot?prototype=atlas&w=1440&h=900" -o /tmp/atlas.png`
  then read it. Use `animate=1` / `wait=` to capture the scrubber mid-play. Iterate against the
  facets until the map reads clearly and the dots/stats land in <2s.
- Confirm `/labs/atlas/` detail page renders the iframe and the stats/scrubber work inside it.
- **Live review before push** (process rule): share the local URL, get Omar's go, *then* commit
  on a feature branch → PR → he merges to `main`. Never push to `main`.

## Critical files
- `public/prototypes/atlas/index.html` — the experiment (new)
- `public/prototypes/atlas/data.json` — coarsened, committed data (new, generated)
- `public/prototypes/atlas/world.geojson` — baked land outline (new, static)
- `scripts/build-atlas-data.mjs` — one-off export→data transformer (new, manual; not in Astro build)
- `src/content/labs/atlas.md` — Lab metadata (new)
- `docs/plans/2026-06-23-atlas-swarm-map.md` + `docs/plans/README.md` — plan archive (new/edit)
- Reference only (no edits): `src/content.config.ts` (schema), `src/pages/labs/[slug].astro`
  (iframe embed), `src/styles/tokens.css` (palette to echo)

## Open items
- v1 ships/reviews on **sample data**. When Omar's real export arrives, finalize the §1b adapter
  against its actual shape and regenerate `data.json` (no other changes).
- If the official export turns out unusable, fall back to the API/script route (OAuth token from
  Omar) — same normalized output, just a different ingest.
