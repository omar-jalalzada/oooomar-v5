> **Accepted 2026-06-19.** New explore concept (Concept 02), prompted by Omar describing a card-based
> infinite-canvas idea: everything (writing, labs, about/bio/work/travel) is a card on a feels-endless
> canvas; minimal default state, hyper-expressive in motion; cinematic ripple load from a center card;
> backs seen only during the shuffle; hover floods each card with life; a circle nav (filter/rearrange)
> deferred to v2. Decisions locked via AskUserQuestion this session (name, canvas behavior, front/back
> rule, v1 scope). This is the verbatim approved plan.
>
> **v2–v4 iteration note (appended 2026-06-21).** Built and reviewed live with Omar in sequence,
> each a new preserved version (never overwritten): **v2** — organized columns, a protagonist hero
> card, two-beat deal→flip entrance. **v3** — one typeface (serif reserved for the hero), fixed
> hero spacing, per-column width variation, metadata hidden until hover, hover flood echoing each
> card's back motif. **v4** (mockup-driven, Paper nodes `YU-0`/`V9-0`) — the hero card became a
> graphical centre (the self-constructing OMAR logotype + "Always a work in progress"); cards became
> simple near-square thumb+title; hover reveals description/meta and grows a soft category-tinted
> glow; back-pattern motifs removed (plain backs, flip kept). Decisions locked via AskUserQuestion:
> keep deal-then-flip with a plain back; logotype self-constructs then cards ripple in; hover glow
> subtly per-category tinted.

# Plan — "Constellation" explore concept (v1)

## Context

Omar wants a new design concept for the site, explored as a public motion prototype under
`public/explore/`. This is **Concept 02**, structurally distinct from the locked `explore/stage/`
direction (which is about a kinetic *identity* — the self-constructing OMAR logotype).

**Constellation is about a kinetic *space*.** Everything Omar makes — writings, experiments, and
even "about me" (bio, work history, travel photos) — is a **card**. The cards live on a large,
feels-endless canvas you pan in any direction. Default card state is minimal; motion and the
interactive state are hyper-expressive. The thesis is the productive tension from `docs/omar.md`:
*clean minimalism that breaks into richness somewhere intentional* — here, on hover and in motion.

This is a throwaway-style static-HTML motion prototype (the "sketch"), per `CLAUDE.md` →
`explore/` rules. If it wins, it gets rebuilt properly in `src/` later.

### Decisions locked with Omar (this session)
1. **Name/slug:** `constellation` → `public/explore/constellation/v1/`
2. **Canvas:** *feels-endless* — large bounded canvas, momentum/inertia pan, soft rubber-band edges
   (not true infinite tiling/wrapping).
3. **Front/back:** the expressive **back is seen only during load/shuffle motion**. Cards arrive
   face-down (textured backs), flip to face-up as they settle. Once settled it's **all minimal
   fronts + hover-come-alive**. (No click-to-flip in v1.)
4. **v1 scope:** nail **cinematic entrance → ripple-out → buttery inertial pan → hover-come-alive**.
   **Defer** click-to-flip and the circle-nav category **filter/rearrange** to v2.

### Facets to design against (interfacecraft)
- **Alive** — motion is organic, breathing; never mechanical or linear.
- **Endless** — the field rewards exploration; edges resist gently, never hard-stop.
- **Restraint → explosion** — the gap between the minimal default and the maximalist hover lands.
- **Effortless** — pan/inertia is buttery at 60fps; no jank.
- **Ownable / Omar** — the backs + hover palettes reference his aesthetic (Islamic-tile geometry,
  calligraphic gesture, travel photography), not generic SaaS gradients.

---

## Approach

Single self-contained file: `public/explore/constellation/v1/index.html` — vanilla HTML/CSS/JS,
Google Fonts only, **no external deps** (matches the `explore/stage/` house style and the
no-build-step rule). House type pairing kept for archive coherence: **Instrument Serif** (voice),
**Hanken Grotesk** (UI), **JetBrains Mono** (labels).

### 1. Layout — the constellation
- A `.canvas` div translated via `transform: translate3d(...)`; cards absolutely positioned inside.
- **Center card at (0,0)** = a minimal identity card ("Omar Jalalzada — craftsman first" / a short
  manifesto fragment). It anchors the field and is the cinematic first reveal (no nav/logo/title at
  load, so the center card carries identity once settled).
- Other cards placed by **phyllotaxis / golden-angle spiral**: `angle = i * 137.5°`,
  `radius = SPACING * sqrt(i)`. Organic, constellation-like, non-grid; `SPACING` tuned so cards
  don't overlap (card ≈ 260×340). Slight per-card rotation jitter for life.

### 2. Cinematic entrance + ripple
- Background: white/optimistic, with a **faint radial color wash + subtle grain** (SVG
  `feTurbulence` data-URI at low opacity), pushed back (`z-index:0`, low opacity).
- **Stage A:** only the center card, scaling from ~0.85 + fading in (~1.2s, eased).
- **Stage B (ripple):** remaining cards animate to their spots ordered by distance from center
  (= index `i`, since radius grows with `i`). Per-card stagger `delay ∝ sqrt(i)`. Each travels from
  near-center → its position while **flipping back→front** (the shuffle reveal), settling with a
  gentle spring. This is the "ripples out all around it" moment.
- `prefers-reduced-motion`: skip ripple/flip, render settled fronts directly.

### 3. Inertial pan (the "endless" feel)
- Pointer drag (`pointerdown/move/up`) updates canvas offset; track recent velocity.
- On release, **inertia**: decay velocity per frame in a `requestAnimationFrame` loop.
- Trackpad/`wheel` also pans (x & y).
- **Rubber-band edges:** compute content bounds from card extents + viewport; beyond bounds apply
  resistance while dragging and **spring back** on release. Soft, never a hard wall.
- All transform writes batched in the single rAF loop (GPU-friendly `translate3d`).

### 4. Minimal fronts + hover-come-alive
- **Front (default):** near-white, hairline border, clean 4px-grid type — title (Hanken),
  type/category label (Mono), date. Three-level hierarchy, restrained.
- **Hover (explosion):** a category-specific **gradient/color floods in** (pseudo-element opacity
  0→1), card lifts with a layered shadow tinted toward its accent, content inverts to read on color.
  Subtle scale. **Travel cards reveal their photo on hover** (the photo *is* the life).
- Per-category palettes so cards feel **ownable**: Writing, Lab, About-bio, About-work, Travel.

### 5. Card backs (load/shuffle only)
- Each back = an expressive texture built from CSS gradients + a small SVG tile pattern
  (Islamic-geometry-inspired) — performant, no images required. A few back variants cycled.
- Seen only mid-flip during the ripple; never the resting state.

### 6. Sample content (~16–22 cards)
Representative, drawn from `docs/brief.md` pillars + `docs/omar.md`:
- **Center:** identity card.
- **Writing** (3): a Design Leadership piece, a Reflection/Meditation, one more.
- **Lab** (3): interactive experiment teasers.
- **About** (3): bio + links card, work-history card (Sublime/Kin/Alto/Coatue), and 2–3 **travel
  photo** cards (placeholder gradient blocks now; real photos later).
Copy stays in Omar's voice: first-person, measured, low-ego, no grandiosity.

### 7. Nav circle (visual only in v1)
- After load, a small **circle appears bottom-center**; hover reveals "Writing · Lab · About".
- **v1 = appearance + label reveal only** (cheap, completes the frame). The **filter + rearrange**
  on click is **v2**. Clearly stubbed, not wired.

---

## Files

- **New:** `public/explore/constellation/v1/index.html` — the prototype (all of the above).
- **New:** `public/explore/constellation/index.html` — redirect to `./v1/index.html` (copy the
  exact pattern from `public/explore/stage/index.html`: `<meta http-equiv="refresh">` + canonical
  link + the small centered fallback link).
- **Edit:** `public/explore/index.html` — add a new `<section class="concept">` for
  **`CONCEPT 02 · CONSTELLATION`** with a `v1` row (same `.row` markup as the Stage rows: version,
  title, description, date `19 JUN 2026`, arrow → `./constellation/v1/index.html`).
- **Process (do FIRST, per `CLAUDE.md`):** copy this accepted plan verbatim into
  `docs/plans/2026-06-19-constellation-explore-concept.md` (with header: date + what prompted it)
  and add an index line to `docs/plans/README.md`.

No `src/`, content-collection, or token changes — `explore/` prototypes are intentionally
standalone static HTML and separate from the real site build.

---

## Verification

- Start `npm run dev` (background) and share the local URL for **live review before any push**
  (per `CLAUDE.md` process rule + the saved memory). Prototype URL:
  `http://localhost:4321/explore/constellation/v1/index.html`; archive landing:
  `http://localhost:4321/explore/`.
- Manually verify against the facets:
  - Entrance: center card lands cinematically; cards ripple out from center with back→front flip.
  - Pan: drag + trackpad in all directions; inertia coasts and decays; edges rubber-band, no hard
    stop; sustained 60fps (no jank).
  - Hover: minimal front floods to maximalist life; travel cards reveal photo; each category reads
    distinct.
  - Nav circle appears post-load; hover reveals labels (click intentionally inert in v1).
  - `prefers-reduced-motion`: settled fronts render without the ripple.
- Confirm `public/explore/` landing shows the new Constellation section and the redirect resolves
  to v1.
- Do **not** commit or push until Omar has reviewed in-browser and says go.
