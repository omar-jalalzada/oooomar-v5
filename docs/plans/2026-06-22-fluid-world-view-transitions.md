# Unify the site into one fluid world — View Transitions + canvas-native re-skin

**Date:** 2026-06-22
**Prompted by:** Clicking a card jumps to a detail page that feels like a different, dated website — hard page reload, flat surface, none of the canvas fluidity. Goal: make navigation feel continuous and motion-first while keeping real, shareable URLs.

---

## Context

The home page is the fluid Constellation canvas; detail/list pages are plain full-reload documents. Two things create the gap: **(a)** a hard cut with no motion between card and detail, and **(b)** the detail surface doesn't share the canvas's visual language. We fix both.

**Decisions (locked with Omar):**
1. **Path A** — Astro View Transitions (`<ClientRouter />`) with a shared-element morph from card → detail. Real routes stay (shareable/copyable URLs, SEO, back/forward). **Structured so a future Path B** (single-page overlay where the canvas never unmounts) can reuse the same per-item transition names.
2. **Calm reading surface** — detail/list pages match the palette, type, and floating dock, but keep a quiet, readable background (no animated grain/wash).
3. **Full consistency** — detail pages + list/index pages + about overview all get the treatment.

URLs change either way; Path A does it via real client-side navigation (no white flash). The morph + shared dock make it read as "never left the canvas."

---

## Approach

### 1. Enable View Transitions site-wide — `src/layouts/Base.astro`
- Import `{ ClientRouter }` from `astro:transitions`; render `<ClientRouter />` in `<head>`. This makes all same-origin nav client-side with a default cross-fade and respects `prefers-reduced-motion` automatically.
- Give the floating dock `transition:name="dock"` so it morphs in place across navigations (stays put, content cross-fades, active state still updates because it re-renders per page). Applies on non-immersive pages.
- Add a **calm static background**: a single low-opacity, *non-animated* gradient tint fixed behind `main` (tied to the canvas palette: faint peach/lavender/blue), so detail pages feel related to the canvas without the grain/animation. Subtle — readability first.

### 2. Shared-element morph — per-item transition names
- **`src/components/constellation/Constellation.astro`** (card anchor, ~line 31): add `transition:name={`item-${card.cat}-${card.slug}`}`. The `cards` prop needs a `slug` field — add it in `src/pages/index.astro` where cards are built (`p.id`, `l.id`, `a.id`). External about cards (mailto/read.cv) get a name too; harmless since there's no match target.
- **Detail pages** — wrap the hero (`<header>` block) in each of `src/pages/writing/[slug].astro`, `src/pages/labs/[slug].astro`, `src/pages/about/[slug].astro` with the matching `transition:name`:
  - writing → `item-writing-${post.id}`
  - labs → `item-lab-${lab.id}`
  - about → `item-about-${entry.id}`
- Result: the clicked card visually expands into the detail header.

### 3. Make the Constellation survive client-side navigation — `Constellation.astro` `<script>`
Currently `init()` runs once on module execution; with ClientRouter, scripts don't re-run on swap, and the RAF loop would leak when leaving home.
- Wrap the bootstrap (`if (root && vp && canvas && field) init(...)`) in a `document.addEventListener('astro:page-load', ...)` so it runs on first load **and** every return to home. The existing element-existence guard makes it a no-op on detail pages.
- **Entrance guard:** read `sessionStorage.getItem('cnst-entered')`. First visit → play the full deal/flip entrance and set the flag. Return visits → jump straight to final state (add `in`/`up` immediately, show chrome immediately) so the 2.5s entrance never replays.
- **Cleanup:** track the RAF id in module scope; cancel it on `astro:before-swap` to stop the old loop before the canvas DOM is torn down.

### 4. Unify the flat card treatment — `src/components/Card.astro`
List/grid pages use a plainer card (8px radius, border-color hover) than the canvas cards. Align it to the canvas card language: `--radius-card`, hairline border, layered shadow tinted toward accent, hover lift (`translateY(-4px)`) + soft glow. This makes list pages read as the same cards laid flat. (Reduction: keep it to border + shadow + lift; no flip on flat pages.)

### 5. Re-skin list + overview pages for the calm-canvas surface
- `src/pages/writing/index.astro`, `src/pages/labs/index.astro`: keep structure (`getVisible` + `CardGrid` + `Card`), inherit the new calm background and unified `Card`. Light restyle of the writing topic-filter buttons to match the dock pill style.
- `src/pages/about.astro` (overview): align headings/`.cv` list spacing to tokens and the calm surface.
- These reuse existing helpers: `getVisible`/`byDateDesc` (`src/lib/content.ts`), `formatDate`/`topicLabels` (`src/lib/format.ts`).

---

## Designed for a Path B upgrade later
- Per-item `transition:name` (`item-<cat>-<slug>`) is exactly the key a future FLIP overlay keys off — no rework.
- Detail content stays in real routes, so a later overlay can fetch the route HTML (or we embed content JSON) without restructuring.
- The dock already behaves as a persistent element; Path B would just swap "navigate" for "expand in place."

---

## Critical files
- `src/layouts/Base.astro` — ClientRouter, dock transition name, calm background
- `src/components/constellation/Constellation.astro` — `transition:name` on cards; `astro:page-load` init + sessionStorage entrance guard + RAF cleanup
- `src/pages/index.astro` — add `slug` to card objects
- `src/pages/writing/[slug].astro`, `src/pages/labs/[slug].astro`, `src/pages/about/[slug].astro` — hero `transition:name`
- `src/components/Card.astro` — unified card treatment
- `src/pages/writing/index.astro`, `src/pages/labs/index.astro`, `src/pages/about.astro` — calm re-skin
- `src/styles/global.css` — calm background utility + shared card shadow

---

## Verification
1. `npm run dev` (already running on :4321). Hard-refresh home.
2. **Morph:** click a writing/lab/about card → no white flash; the card expands into the detail header; URL is the real `/writing/<slug>/` etc. Copy the URL, open in a new tab → standalone page loads correctly.
3. **Return:** browser back / dock → home; canvas does **not** replay the full entrance (sessionStorage guard); no console errors; pan still works (no leaked RAF — check that only one loop runs).
4. **Dock continuity:** navigating between detail/list pages keeps the dock visually stable; active item reflects the current section.
5. **Reduced motion:** with `prefers-reduced-motion`, transitions degrade to instant; entrance is already skipped.
6. **Consistency:** list pages + about overview share the calm background and unified cards; nothing looks like the old flat-white document.
7. `npm run build` succeeds; drafts excluded in prod.
8. Omar reviews in-browser before any commit/push (review-before-push rule).

## Risks / edge cases
- **Morph fidelity:** canvas cards are 3D-flipped + absolutely positioned; the snapshot morph may look slightly off vs a top-left header. If awkward, fall back to morphing only the title element (or accept the clean cross-fade) — decide live during review.
- **Double-binding:** ensure `astro:page-load` init doesn't attach listeners twice if home DOM ever persists (it's swapped fresh, but the RAF-cancel on `astro:before-swap` is the safety net).
- **`cnst-nav` vs Base dock:** both can share `transition:name="dock"` for whole-site continuity; if the home dock's entrance animation causes a snapshot glitch, drop the shared name on the canvas side only.
