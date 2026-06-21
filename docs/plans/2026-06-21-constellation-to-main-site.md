> **Accepted 2026-06-21.** Prompted by Omar: "directionally I like this exploration and I want to
> apply this to the main website." Promotes the Constellation v4 explore prototype into the real
> `src/` Astro site (the "sketch → painting" step), and brings the brand identity (electric blue,
> Hanken Grotesk / Instrument Serif / JetBrains Mono, the self-constructing OMAR logotype) into the
> token system. Decisions locked via AskUserQuestion: scope = home + shared shell; nav circle filters
> in place AND the real pages still exist; drop travel. This is the verbatim approved plan section.

# Applying Constellation to the main site

## Context

Omar likes the Constellation v4 direction and wants to promote it from the `explore/` sketch into
the real `src/` Astro site — the "sketch → painting" step the `CLAUDE.md` explore rules describe.
This is also the moment the **brand identity arrives**: the neutral wireframe tokens give way to the
Constellation brand (electric blue `#195CFF`, Hanken Grotesk / Instrument Serif / JetBrains Mono, the
self-constructing OMAR logotype). The `explore/constellation/*` versions stay untouched as the archive.

### Decisions locked with Omar (via AskUserQuestion)
1. **Scope = home + shared shell.** Constellation replaces the home page, AND the brand
   (colours, fonts, logotype) is adopted across the shared header/footer/type so the whole site feels
   coherent. **Deep restyle of the list/detail pages is deferred** — they inherit the new tokens
   (so they re-skin coherently) without layout rework.
2. **Nav circle = both.** On the home canvas the floating circle filters the cards in place
   (hide/rearrange by category) AND the real `/writing`, `/labs`, `/about` pages still exist for
   direct links + SEO (and as the no-JS fallback for the circle's links).
3. **Drop travel.** Cards = all `writing` + all `labs` + an **About** card (→ `/about`). No
   travel/photos collection for now.

## Architecture

**Progressive-enhancement Astro component, not a React rewrite.** Reuse the proven vanilla engine.
Cards are **server-rendered from the content collections** as real `<a>` links (crawlable, accessible,
work with no JS); a bundled client `<script>` then positions them on the canvas and runs the
entrance / pan / flip / filter (hover is pure CSS). This keeps SEO + a clean no-JS fallback and
reuses the v4 code.

- **No-JS / `prefers-reduced-motion` fallback:** by default the cards render as a static, readable
  grid (normal flow). The script adds a `ready` class that switches to canvas mode (fixed viewport +
  absolute cards + pan). Reduced-motion → canvas layout but no ripple/flip (instant). No-JS → grid.
- **DialKit is not shipped** — the values Omar dialled in are baked as constants
  (`RX 380, RY 380, bandV 360, bandH 360, card radius 2, rest glow .20, hover glow .5`, v4 timing).

## Files
- **New `src/components/constellation/Constellation.astro`** — canvas markup (bg wash, grain,
  viewport/canvas, centre logotype + subline, server-rendered cards, floating nav circle, hint),
  scoped CSS (tokens for ink/hairline/accent/fonts/radius/spacing; decorative gradients local), and
  the bundled engine `<script>` (frame-slot layout, inertial pan + rubber-band, deal→flip entrance,
  category filter, drag-click guard, static/reduced-motion fallbacks). Per-category hover glow set in
  CSS via `[data-cat]`.
- **New `src/components/constellation/Logotype.astro`** — OMAR SVG + `assemble` self-construct
  animation (from `explore/constellation/v4`).
- **Rewrite `src/pages/index.astro`** — `getVisible('writing')` + `getVisible('labs')` (`byDateDesc`)
  → card list (+ static About card); render `<Constellation>` in the immersive layout; include an
  `sr-only` `<h1>` + one-line intro for SEO/a11y.
- **`src/layouts/Base.astro`** — `immersive` prop (omit header/footer + container for the home); add
  the Google Fonts `<link>`; light brand on the shared header/footer.
- **`src/styles/tokens.css`** — brand tokens: `--color-accent:#195CFF`, `--color-hairline:#E4DEF6`,
  `--color-bg:#FCFCFD`, brand inks (`#0B0B0C/#5C5C66/#8A8A92`), cooler `--color-border`; fonts
  (`--font-sans` Hanken, `--font-serif` Instrument Serif, `--font-mono` JetBrains Mono); `--radius-card:2px`.
- **`src/styles/global.css`** — pick up new fonts; minor tuning. (List/detail inherit → intended re-skin.)

Keep `public/explore/constellation/*` untouched. No new npm dependencies.

## Verification
- `npm run dev` → `/`: logotype self-constructs, real writing/labs/About cards ripple in; hover reveals
  desc + meta + category glow; pan + inertia + rubber-band; nav-circle category filters in place; cards
  link to real detail pages; `/writing` `/labs` `/about` still load in the brand fonts/colours.
- Fallbacks: no JS → readable grid of links; reduced-motion → canvas without ripple/flip; `npm run build`
  → no DialKit, no console errors, links crawlable. Tokens-only in new components; 4px grid holds.
- **Live review before any commit/push** — feature branch → preview → Omar reviews → he merges to main.
