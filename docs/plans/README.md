# Accepted plans

A reverse-chronological timeline of every implementation plan accepted for this project —
kept for learning and future reference. Each entry is the plan verbatim as approved.

| Date | Plan | Outcome |
| --- | --- | --- |
| 2026-09-23 | [Atlas as a COBE globe](2026-09-23-atlas-cobe.md) | Replace Atlas's flat canvas map with a vendored COBE WebGL globe: day-ordered travel arcs rebuilt from the raw Swarm export, scrubber-driven markers, photo stacks at chosen moments, and a local city + photo review list to decide the cleanup next |
| 2026-09-23 | [Frontend-design skill audit](2026-09-23-frontend-design-audit.md) | Critique the full site (chrome + all prototypes) against Anthropic's `frontend-design` skill; deliver a Canvas findings report — evaluate only, no redesign |
| 2026-09-23 | [Bar field: homepage to lab](2026-09-23-barfield-to-lab.md) | Take the WebGPU field off the landing page and ship it as the tenth Experiment: port `src/components/barfield/` to a self-contained `public/prototypes/bar-field/`, reduce the homepage to centered "work in progress" text, and delete the component |
| 2026-09-13 | [Bar field as the homepage](2026-09-13-barfield-homepage.md) | Promote the vert-bars v6 WebGPU sketch out of `explore/` into `src/components/barfield/`: extract the load-bearing dial state out of the DOM panel, split the 2,944-line sketch into modules, lazy-load the audio engine, and make it the whole homepage with the SVG logotype as its WebGPU fallback |
| 2026-09-13 | [Naughty Narwal — a p5.js branding tool](2026-09-13-naughty-narwal.md) | First tool-shaped Lab: p5 point-field engine decoded from @yuruyurau tweet code, with a shape library (jelly, cell, spine, blob, type), a live stage, and grouped shape/field dials |
| 2026-06-23 | [Atlas — Swarm check-ins world map](2026-06-23-atlas-swarm-map.md) | First data-driven Lab: self-contained world map of a decade of Foursquare/Swarm check-ins (city-level coarsened) with a time scrubber and stats layer; built on sample data, real export swapped in later |
| 2026-06-21 | [Design system + React component library](2026-06-21-design-system.md) | Add shadow/easing/duration/z-index tokens, install `motion`, build React card library with AnimatePresence filter, design system reference page at `/design-system/` |
| 2026-06-21 | [About cards collection](2026-06-21-about-cards-collection.md) | Add `about` content collection so About cards on the Constellation canvas are data-driven (like Writing/Lab); add `about/[slug].astro` detail pages; 6 placeholder draft entries |
| 2026-06-21 | [Constellation → main site](2026-06-21-constellation-to-main-site.md) | Promote Constellation v4 into `src/`: canvas home + brand identity (electric blue, custom fonts, OMAR logotype) across the shared shell; nav filters in place; list/detail re-skin via tokens |
| 2026-06-19 | [Constellation explore concept (v1)](2026-06-19-constellation-explore-concept.md) | Concept 02: card-based feels-endless canvas, cinematic ripple load, hover-come-alive — static motion prototype in `explore/` |
| 2026-06-11 | [Personal site MVP](2026-06-11-personal-site-mvp.md) | Astro 6 + Vercel scaffold: content collections, all MVP pages, sample content, publishing pipeline |
