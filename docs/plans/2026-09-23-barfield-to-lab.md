> **Date:** 2026-09-23
> **What prompted it:** Omar asked to take the WebGPU bar field off the landing page and make it
> "one of the labs on my site", with the landing page reduced to "just a simple plain text stating
> 'work in progress' that is aligned center to view". Three follow-up decisions shaped the plan: the
> field is ported to a static `public/prototypes/` folder matching the other nine experiments rather
> than given its own Astro route; soft presence stays on, so production shows only the holding page
> and the lab is reachable in dev; and the prototype folder becomes the source of truth, so
> `src/components/barfield/` is deleted rather than kept as a parallel copy.

# Bar field: homepage to lab

Two moves: the homepage becomes a holding page, and the bar field becomes the tenth entry in Experiments as a self-contained static prototype.

## Decisions locked

- Port to a static `public/prototypes/bar-field/` folder, matching the other nine.
- Soft presence stays on, so production shows only the landing page. The lab is reachable in `npm run dev`.
- The prototype folder becomes the source of truth. [src/components/barfield/](src/components/barfield/) is deleted.

## 1. Landing page

[src/pages/index.astro](src/pages/index.astro) drops the `BarField` import and keeps `immersive`, which renders a bare page with no nav and no `.calm-bg`. The existing `sr-only` header already contains exactly the right copy, so this is mostly unhiding it:

```astro
<Base title="Omar Jalalzada" description="..." immersive>
  <h1 class="sr-only">Omar Jalalzada</h1>
  <p class="wip">work in progress</p>
</Base>
```

`.wip` centers with `min-height: 100dvh` and `display: grid; place-items: center`, styled from tokens only (`--font-mono`, `--text-sm`, `--color-ink-secondary`).

The page goes light automatically: the dark ground was a `<style is:global>` for `body.immersive` living inside `BarField.astro`, and grep confirms no other source defines it, so it leaves with the component. The `h1` stays screen-reader-only so the page keeps one real heading for search engines.

## 2. The prototype

Target layout, mirroring `public/explore/vert-bars/v6/`:

- `public/prototypes/bar-field/index.html` — markup, all CSS, the inlined fallback SVG, and the dial panel
- `public/prototypes/bar-field/vgpu.js` — copied verbatim from [public/explore/vert-bars/v6/vgpu.js](public/explore/vert-bars/v6/vgpu.js), with the esbuild command recorded in a comment at the top of `index.html` per the vendoring convention
- `dials.js`, `state.js`, `letters.js`, `input.js`, `field.js`, `hud.js`, `audio.js`, `shaders.js`, `main.js`

### Modules: transpile, don't retype

4,100 lines is far too much to convert by hand, and the folder is now the source, so it must stay readable — a minified bundle is the wrong artifact. Transform each file in place with esbuild (no `--bundle`, so module structure and comments survive):

```
npx esbuild src/components/barfield/{dials,state,letters,input,field,hud,audio,shaders}.ts \
  --outdir=public/prototypes/bar-field --format=esm --target=es2022
```

esbuild leaves import specifiers exactly as written, and the browser needs extensions. Two counted substitutions follow, each asserted against an expected match count:

- `from './x'` becomes `from './x.js'` across the eight files
- `from 'vgpu'` becomes `from './vgpu.js'`, one occurrence, in `field.js`

Then run `node scripts/check-wgsl-literals.mjs public/prototypes/bar-field/shaders.js` and confirm the count of literals it reports is plausible for the file.

### index.html and main.js

`index.html` carries the markup and the ~150 lines of scoped CSS from [src/components/barfield/BarField.astro](src/components/barfield/BarField.astro), plus the `body.immersive` rules rewritten as plain `body`. The no-WebGPU fallback inlines the SVG from [src/components/constellation/Logotype.astro](src/components/constellation/Logotype.astro) as raw markup — that component stays in `src/` because `Constellation.astro` still imports it.

`main.js` is the `<script>` block from `BarField.astro`: the `startField` call, the fallback swap, and the lazy `import('./audio.js')` behind the sound button.

The dial panel ships visible rather than dev-gated. Inside a static prototype there is no dev/prod split, and the other labs expose their dials. `field.js` already accepts `panel`, `mode` and `fps` as optional, so passing them always is what the code expects.

## 3. Content entry

New [src/content/experiments/bar-field.md](src/content/experiments/bar-field.md) with `prototype: bar-field` and `status: draft`, so it lists in dev and stays out of production. The detail page iframes it through the existing `/prototypes/bar-field/` path with no page changes needed.

## 4. Cleanup

Delete [src/components/barfield/](src/components/barfield/) — all eight modules plus `BarField.astro` and `DialPanel.astro`. Grep confirms `index.astro` was the only importer.

Then fix the conventions in [CLAUDE.md](CLAUDE.md) that now point at the wrong place: "Homepage is dark, the rest of the site is light" is no longer true, the stacking-breakpoint note names `BarField.astro`, and the HUD hairline, dial panel, and promotion notes all reference `src/components/barfield/`.

## 5. Verification

- Screenshot `/` and confirm the text is centered with no nav and a light ground
- Screenshot `/experiments/` and confirm the tenth card appears
- Screenshot the prototype via `?prototype=bar-field`, then exercise hover, grab, the O and A dials, and the sound toggle
- `npm run build` and confirm production emits only the landing page, with `/experiments/` redirecting

## Risk

The one real risk is the port silently losing behavior. The mitigation is the counted substitutions above plus a diff of each transpiled module against its TypeScript original, so the only differences are stripped types and rewritten specifiers.
