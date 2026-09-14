> **Date:** 2026-09-13
> **What prompted it:** Omar wants another Lab piece, this time with p5.js as the base, built as a
> *branding tool* rather than a single sketch — a shape library he can pick from, a live stage, and
> dials for attributes and filters. Reference: two @yuruyurau `#つぶやきProcessing` sketches (tweet
> code + videos) for the drawing engine, and a screenshot of a parameter-tool UI for the chrome.
> Converged over three brief passes in chat; this is the accepted version.

# Lab: "Naughty Narwal" — a p5.js branding tool

## Context

An experiment that is a **tool**, not a single animation. You pick a drawing on the left, it
renders live in a dark well in the centre, and the right panel dials in its attributes and the
way it's inked. The engine is a point field in the @yuruyurau idiom: one function, tens of
thousands of points, density-as-flesh, filaments-as-hair, time as a phase.

"Naughty Narwal" is the name of the tool, **not the mascot** — decided in chat. There is no
narwhal in v1.

### Decoding the reference (what the tweet code actually is)

Omar supplied two tweet-code snippets and two videos. They are crossed — plotting both formulas
established which is which:

- Snippet 1 (`y<59 ? i%9 : i*4`, 20k points) draws the **pair of jellyfish** (second video).
- Snippet 2 (`k=5*cos(y*9)`, 10k points) draws a **single ribbed swimmer** — body, snout, tail.
- The first video is a **third sketch** (four small ringed cell-creatures), not either snippet.

Every one of these is the same four moves:

1. **Walk an index.** `for (i = 2e4; i--;)` — each `i` is one point. No objects, no sprites.
2. **Turn `i` into a few named quantities**, hidden as default arguments: `y` (how far along the
   body), `k` (a wave across it — the wriggle), `e` (a shift), `d` (`mag(k,e)` — a distance, so
   the form has a centre and a falloff).
3. **Place the point in polar space** — radius `q`, angle `c`, then
   `(q*sin(c)+200, q*cos(c)+200)`. This is why they read as bodies rather than graphs: everything
   orbits a gut.
4. **Nudge `t`.** `t += PI/60` (fast) or `PI/240` (slow). `t` only enters the angle and a couple of
   sines, so the silhouette is stable and the swim is a phase.

`background(9)` wipes each frame (no trails), white stroke at low alpha (`96`, `66`). The "lines"
are points so dense they fuse.

What the magic numbers do, in the jellyfish:

- `i % 2 * 3` on the angle splits 20k points into two groups ~172° apart — **that's why there are
  two animals**. One formula, a pair.
- `y < 59 ? i%9 : i*4` is **two materials**: below the cut only 9 values of `k`, so points wrap a
  dense bell; above it `i*4` is high-frequency, so the same maths thins into tentacles. Body vs
  hair is a branch on the index, not a second mesh.
- `+70` in the radius keeps it off the origin, so it has volume.

And in the swimmer: no `i%2` split, so one animal; `cos(y*9)` ribs the flank; `k*k` in the radius
fattens the middle and pinches the ends; `t*9` is a fast shimmer over a slow whole-body swim.

**The insight the tool is built on:** yuruyurau isn't drawing creatures, he's *tuning a point field
until it reads as one*. The branding move is to stop hiding those constants in a tweet and put
them on a panel.

## Layout

Omar's reference tool puts modes on a top rail; he wants the picker on the **left**, because
assets are a library, not a mode bar.

```
┌──────────┬─────────────────────────┬──────────────┐
│ SHAPES   │                         │ DIALS        │
│          │         STAGE           │  Shape       │
│ jelly    │      (black well)       │  Field       │
│ cell     │                         │              │
│ spine    │                         │              │
│ blob     │                         │              │
└──────────┴─────────────────────────┴──────────────┘
```

- **Left — library.** Shapes with tiny rendered thumbnails, so you see the silhouette before you
  commit. Designed to grow; it doesn't have to be full.
- **Centre — stage.** A dark well on light chrome, like the reference. The field only, no HUD on
  the drawing. A quiet footer holds play/pause and an fps readout.
- **Right — dials.** Grouped, labelled, with live editable numbers.
  1. **Shape** — attributes of the selected drawing (its own group per shape).
  2. **Field** — how it's inked (density, ink, weight, speed, trail, glow).
  Switching shapes swaps the Shape group; the Field group persists, so a treatment travels from
  one drawing to the next.

Dial state is keyed by group (`field.ink`, `shape.jelly.school`) — never one flat map, per the
Farsh lesson. `localStorage` key `narwal-v1-dials`.

## v1 contents (locked in chat)

**Four drawings**, all in the reference's family:

| Shape | What it is |
| --- | --- |
| **Jelly** | Bell + tentacles, from snippet 1. Default. `School` dial gives 1/2/4 of them. |
| **Cell** | Dotted membrane ring with a scribble inside — the four-cell video, re-authored. |
| **Spine** | Tapered ribbed swimmer, from snippet 2. |
| **Blob** | One soft body, no limbs — the control, so you can see the ink itself. |

**One ink** for the first cut (the Organism look: points, density-as-flesh, filaments). Named
treatments (Spine/School inks, the orbit-glow of Omar's screenshot) come once the shelf feels
right — the dial groups are structured so they can slot in without a rewrite.

**Motion idles on its own** — time plus dials, no cursor dependency, like both references.

**White on black** in the well, light chrome around it, electric-blue slider fills.

**No custom SVG, no export** in v1 (explicitly deferred). The asset slot is designed for SVG
sampling later: an asset is not a sprite stamped on canvas, it's a silhouette the field is allowed
to occupy.

### Type (added the same day, locked in chat)

A fifth drawing. The word is the silhouette; the field is still the ink.

- **Submit**, not live-as-you-type. Default word `Omar`. Case preserved. One line, cap 24.
- **Fill / Outline** switch. Fill samples the ink (counters in O, A, R stay empty). Outline is
  the edge of that ink, including inner counters.
- **Escape** dial: 0 = points stay on the stamp (a little idle shimmer so it still lives);
  up = they may leave, some farther than others, like hair.
- **Face:** Outfit 700, vendored as `outfit-latin-700.woff2` (geometric sans). Fallback stack
  `Avenir Next, Futura, Century Gothic` if the file fails to load.

## Implementation

### 0. Archive this plan (process rule)
Copy verbatim to `docs/plans/2026-09-13-naughty-narwal.md`, add an index line to
`docs/plans/README.md`. Before writing code.

### 1. Vendor p5
`npm i -D p5` (devDependency — it never ships from `src/`), then copy the ESM bundle to
`public/prototypes/naughty-narwal/p5.module.js`, shared by every version the way Farsh shares
`three.module.js`. No esbuild step needed: p5 ships `lib/p5.esm.min.js` with a clean default
export. The exact copy command goes in a comment at the top of the sketch.

### 2. The prototype
`public/prototypes/naughty-narwal/v1/index.html` — self-contained, inline `<style>` and
`<script type="module">`, imports `../p5.module.js`. p5 in **instance mode** (the panel code lives
alongside it); the point maths uses plain `Math.*` for speed, p5 owns the canvas, loop and drawing.

**Coordinate space.** The maths stays in the tweets' 400×400 space with centre `(200,200)` and is
scaled to the canvas, so borrowed constants keep meaning at any size.

**Density is decoupled from form.** In the tweets `y = i/99`, so changing the point count changes
the silhouette. Here `y = (i/(n-1)) * span` — density then controls how many strands, and `span`
is a dial. Raw `i` is kept for the rib/filament phases, which is what gives the texture.

**Per-shape rate.** Each drawing carries its natural time step (jelly is `PI/60` fast, the swimmer
`PI/240` slow) so one global Speed dial reads the same across all of them.

**Glow** is one full-frame composite (`filter: blur()` + `lighter`, drawing the canvas onto
itself), not a per-point shadow — which would be unusably slow at 20k points.

**Guards.** Terms like `7/d` blow up when `d → 0`; clamp and skip non-finite points rather than
letting them fly off-canvas.

### 3. Verify
`?shape=<id>` selects the initial drawing and `?bare=1` hides the panels, so the screenshot API
can capture each shape's field on its own. Check all four, plus the fps readout at default
density.

### 4. Metadata
`src/content/experiments/naughty-narwal.md` with `prototype: naughty-narwal`, `status: draft`, and
`public/prototypes/naughty-narwal/index.html` redirecting to `v1/` (never overwrite a version).

### 5. Live review
`npm run dev`, share the local URL, no commit or push until Omar has seen it.
