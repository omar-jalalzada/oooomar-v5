# Omar's personal site

Personal site for Omar Jalalzada: design leadership writing, reflections, interactive
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
  canvas, `view=/writing/<slug>/` for a detail page, or `prototype=<name>` for an experiment). It returns
  a PNG. **Always use it after building or changing UI to confirm the page actually renders
  correctly** — don't guess from the code. Save and inspect it, e.g.
  `curl -s "http://localhost:4321/api/screenshot?view=/" -o /tmp/shot.png` then read the image.
  Params: `w`/`h` (viewport, default 1440×900), `full=1` (full page), `animate=1` (play the canvas
  entrance instead of the default settled capture), `wait=<ms>` (extra settle time). Implemented in
  `scripts/vite-screenshot-plugin.js`, registered via `vite.plugins` in `astro.config.mjs`; dev-only
  (`apply: 'serve'`), so it never ships in the production build. Chrome launches with
  `--enable-unsafe-webgpu` so WebGPU prototypes capture their real output rather than their
  no-support fallback.
- **Tokens only**: pages and components reference CSS custom properties from `tokens.css`, never
  raw px/hex values. Spacing stays on the 4px grid.
- **Drafts**: content with `status: draft` renders in dev, is excluded from production builds.
  Use `getVisible()` from `src/lib/content.ts` for all collection queries — never raw
  `getCollection()` in pages (the RSS feed is the one exception, it filters explicitly).
- **Soft presence**: while `SOFT_PRESENCE_ENABLED` is true in `src/lib/soft-presence.ts`,
  production builds (omar.build) show only the OMAR mark + tagline. `npm run dev` always shows
  the full site so you can keep iterating. Reopen by setting the flag to `false` and publishing
  the content you want live.
- **Experiments**: an experiment = self-contained static folder `public/prototypes/<slug>/index.html`
  (no build step, no external deps) + a metadata entry `src/content/experiments/<slug>.md` whose
  `prototype` field names the folder.
- **Versions inside an experiment**: when a shipped experiment forks into variants, each one gets
  `public/prototypes/<slug>/vN/index.html` and `<slug>/index.html` becomes a redirect — to the
  settled version, not necessarily the newest. Never overwrite a version, same rule as `explore/`.
  A vendored dep stays at `<slug>/` and the versions import it as `../three.module.js`, so it isn't
  duplicated per version. Give each version its own `localStorage` key so their dial sets don't
  overwrite each other (`farsh-v1-dials`, `farsh-v2-dials`).
- **Dial panels**: key the dial state by group (`dial.light.spread`), never one flat map. Two
  groups both wanting a name like `spread` is normal, and a flat map silently fuses them into one
  value and one duplicated DOM id.
- **Shaders in template literals**: shader source lives in template literals (WGSL in the vgpu
  sketches, GLSL in the three.js ones), so a backtick anywhere inside — including markdown-style
  `code quotes` in a shader comment — silently terminates the string. The only symptom is a JS
  parse error naming a shader identifier (`Unexpected identifier 'agit'`), which points nowhere
  useful. Never use backticks in shader comments, and run
  `node scripts/check-wgsl-literals.mjs <file>` after editing one. It reports how many literals
  it checked — if that count looks low for the file, it is skipping literals and its "clean" means
  nothing. (It only matches literals whose *name* contains shader/wgsl/glsl, or a `/* wgsl */` tag.)
- **Ribbon geometry needs `side: THREE.DoubleSide`**: a triangle strip whose instances run down the
  screen is wound clockwise, so with the default `FrontSide` every triangle is culled as a back
  face and the layer draws nothing at all — no error, and `renderer.info.render.triangles` still
  counts them, which is what makes it so confusing. Any ribbon that curves flips its winding
  partway along regardless, so DoubleSide is the correct answer, not reversed indices.
- **Point-field sketches (p5)**: p5 ships `lib/p5.esm.min.js` with a clean default export, so a
  sketch vendors that as `<slug>/p5.module.js` and needs no esbuild step (`npm i -D p5`, then
  copy). Two findings from `naughty-narwal` that decide how one of these performs and how it
  looks: **draw each dot as its own composite** (`point()` per point) — batching every dot into
  one path is far faster and flattens the drawing, because a union fills once, so where the field
  folds over itself nothing accumulates and the accumulation *is* the flesh. And **run the canvas
  at `pixelDensity(1)`** — each point is an arc to be filled, and double density fills four times
  the pixels for the same drawing, which is 60fps vs 30 at 20,000 points. `fillRect` keeps the
  accumulation and is faster still, but the corners show. These sketches are a 400px space scaled
  up, so a softer dot is the house style, not a compromise.
- **Promoting an `explore/` sketch into `src/`**: the sketches keep their state in the dial
  panel's `<input>` elements — `P` is read out of the DOM and gestures write back into it — so
  the panel is load-bearing and can't just be deleted on the way in. Extract the dial spec to a
  module (`{ id, min, max, step, value }` as data) with `setDial()` doing the clamping and
  step-snapping the range input used to do for free, plus a change subscription. The panel then
  becomes an optional dev-only *view* over that module. See `src/components/barfield/dials.ts`.
- **Lift the sketch's source, don't retype it**: 2,000 lines of ported JS is too much to
  transcribe by hand. Slice the original by line range with a throwaway script, apply the
  renames as counted regex substitutions, and assert each one matched the number of times you
  expected — a substitution that silently matched zero times is the bug you'll spend an hour on.
  Then diff the result back against the source to prove nothing drifted.
- **A `let` can't be shared across modules**: an ES import is a live *read-only* view, so a
  value one module writes and another reads has to live on an exported object, not as a bare
  `let`. Splitting a single-script sketch is mostly this. `state.ts`'s `M` is that object.
- **Type the port even with no `astro check`**: TypeScript isn't installed and nothing type-checks
  in CI, so a broken reference ships silently. Running `npx -y -p typescript tsc --noEmit --strict`
  over the new modules caught a genuine one the browser would only have thrown on hover (`grab`
  and `grabIn` referenced but never imported). Worth doing once per port.
- **Astro bundles a component's `<script>` if it's *imported*, not if it renders**: `{dev &&
  <DialPanel />}` keeps the markup out of the build but the panel's client JS is still emitted as
  an orphan chunk in `dist/_astro/`. No page references it so nobody downloads it, and making the
  import dynamic doesn't help — a dynamic import is in the same graph. Accept it, don't hack it.
- **Homepage is dark, the rest of the site is light.** The bar field is a lit object in a dark
  room and every other page is `#ffffff`. Deliberate contrast, not an inconsistency. The dark
  ground is a `<style is:global>` scoped to `body.immersive`, which Astro only emits on pages
  that use the component — verified: no other page loads it.
- **A homepage never shows a browser-support notice.** No WebGPU means render
  `<Logotype />` at the same coordinates and say nothing. Note it renders *static* there: the
  entrance measures each bar with `getBBox()`, which returns zeroes inside a `display:none`
  container, so an animated fallback computes all its delays from `NaN`.
- **`prefers-reduced-motion` maps onto the Animate switch** these sketches already have: idle
  drift and the musical clock stop, interaction still responds because that motion was asked for.
- **Touch on a pointer-driven sketch**: `pointerdown` can't trust a hover index that only
  `pointermove` sets — on touch there is no move before the finger lands, so the first tap-drag
  does nothing. Hit-test at the pointer position inside `pointerdown`. Also needs
  `touch-action: none` *and* a non-passive `touchstart` `preventDefault()`, or iOS starts its
  overscroll before the first move arrives.
- **A second layout for the same mark is a layout change, not a shader change.** The field's
  shader derives each letter's position from the viewBox itself and adds a *displacement* the CPU
  sends it, scaling each glyph about its own centre. So an alternative arrangement — the letters
  stacked down a phone screen instead of set as a word — is expressed as a large settled
  displacement per letter, and the shader, the HUD boxes and hit-testing all follow for free
  because they already read those same numbers. Write the accordion and the fit solve against an
  *axis index* rather than against x, or you end up maintaining two copies of both.
- **Per-letter rest positions must default to the letter's own slot**, not to the composition
  centre. Defaulting them to one shared x collapsed all four settled boxes onto each other, and
  the visible symptom was nothing to do with layout: the tagline's dimension rule came out exactly
  one letter wide. If a derived measurement is suspiciously equal to a single element's size, the
  set it was measured over has collapsed.
- **A focus multiplier can't be shared between layouts.** `focusScale` 2.46 makes a letter the
  subject when it's an eighth of the screen; applied to a stacked glyph that's already half the
  width, it goes off both edges and over the space its own gauge needs. In the stack it's 1 — the
  glyph is the subject already, so the gesture's feedback is the gauge and the field's reaction.
  The accordion then stands still too, which is correct for the same reason.
- **HUD chrome placed "beside" an element needs a clamp, not just a side choice.** The gauge
  flipped inboard when the right margin was short, which silently assumes the *other* margin is
  long. A centred, half-width glyph has neither, so it ran off the edge: pick the roomier side,
  then clamp the gauge into the window and let its own backing panel carry it over the bars.
- **Type that scales with the mark goes illegible when the mark is height-bound.** Set as a word
  the mark is sized by viewport *width*, so a proportional tagline stays readable. Stacked, a
  glyph is about a thousandth of the viewport height, so under ~600px tall the same ratio gives
  8px type. Floor the size and drop the flanking rules when they'd collapse — a 2px tick either
  side reads as a rendering fault, not as a dimension line. Measure that with a cached
  `offsetWidth`, since it's a synchronous reflow and this runs per frame.
- **The stacking breakpoint is duplicated** in `field.ts` (`STACK_MAX_WIDTH`) and one media query
  in `BarField.astro` that centres the sound pill under the column. Keep them in step.
- **Screenshot API needs the dev server outside the sandbox**: it launches Chrome, and a dev
  server started under sandboxing can't, failing with "Target page, context or browser has been
  closed". Also note `view=/explore/<c>/vN/` 404s in dev — pass `…/index.html` (see `docs/ideas.md`).
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
  shipped Experiments).
- **Never overwrite an iteration.** Each pass is a new `vN/` folder; `explore/<concept>/index.html`
  redirects to the latest. The journey is the point.
- These are throwaway-style static HTML (fast motion prototypes). The *winning* concept gets
  rebuilt properly in `src/` as the real site — explore is the sketch, `src/` is the painting.
- **Vendored deps**: `public/` isn't processed by Vite, so a sketch that needs an npm library
  vendors a bundle into its own version folder rather than importing from a CDN — the folder
  stays self-contained and offline. Install the package as a *devDependency* (it never ships
  from `src/`) and record the exact esbuild command in a comment at the top of the sketch, e.g.
  `public/explore/vert-bars/v3/` bundles `vgpu` this way.

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
