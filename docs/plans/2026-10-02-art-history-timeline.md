# Art History timeline

**Date:** 2026-10-02  
**Prompted by:** Create a comprehensive global art-history timeline experiment with six expandable examples for every movement or tradition.

---

# Art History timeline

## Scope and content
- Curate 64 historically significant movements and traditions across Africa, the Americas, Asia, Europe, the Middle East, and Oceania, from prehistoric image-making through contemporary practice. Describe it in the UI as a broad global survey, not a claim to a universally complete canon.
- Store 384 work records (six per entry) in [`public/prototypes/art-history/data/movements.json`](/Users/omar/omarai/oooomar-v5/public/prototypes/art-history/data/movements.json), including dates, region, summary, work title, maker/culture, year, institution/source, URL, rights status, alt text, and optional local image path.
- Add [`scripts/build-art-history-assets.mjs`](/Users/omar/omarai/oooomar-v5/scripts/build-art-history-assets.mjs) to validate records and download only verified public-domain/Creative Commons derivatives into `public/prototypes/art-history/images/`. Canonical works with unclear rights remain citation cards with an outbound source link and no copied image.

## Timeline experience
- Build a dependency-free prototype in [`public/prototypes/art-history/`](/Users/omar/omarai/oooomar-v5/public/prototypes/art-history/) with separate `index.html`, `styles.css`, and `app.js` files.
- Use a segmented chronological axis with explicit scale breaks so prehistory remains visible without compressing modern movements into a few pixels. Regional lanes, era jump controls, region filters, and search make the 64 entries navigable.
- Expanding a movement reveals its six-work gallery in context. Selecting an available image opens a native-dialog lightbox with caption, provenance, rights, previous/next controls, Escape close, focus restoration, and touch-friendly controls. Citation-only works retain the same metadata hierarchy without pretending an image is available.
- On narrow screens, switch to a chronological vertical sequence rather than squeezing the desktop map. Respect reduced motion, provide semantic buttons/headings and a readable non-visual content order, keep targets at least 40px, and avoid hover-only behavior.
- Visual direction: a restrained white chronological field with each era acting as a measured chapter; richness appears only inside the expanded six-work mosaic. Use the site’s established type roles and a region palette, avoiding generic museum cream/serif styling and ornamental timeline chrome.

## Site integration
- Add the draft content entry [`src/content/experiments/art-history.md`](/Users/omar/omarai/oooomar-v5/src/content/experiments/art-history.md) with concise frontmatter, a factual description, techniques, and reflective learnings.
- Register an `art-history` card look in [`src/lib/experiment-card/background.js`](/Users/omar/omarai/oooomar-v5/src/lib/experiment-card/background.js), [`src/lib/experiment-card/visuals.js`](/Users/omar/omarai/oooomar-v5/src/lib/experiment-card/visuals.js), and [`src/lib/experiment-card/type.js`](/Users/omar/omarai/oooomar-v5/src/lib/experiment-card/type.js), using a timeline-like repeated mark and the experiment’s own palette.
- Preserve the existing uncommitted Calder work and avoid unrelated homepage/package changes.

## Verification and handoff
- Add data checks for exactly six unique examples per movement, valid date ranges, required citations/rights metadata, existing local files, unique IDs, and no remote runtime image dependencies.
- Run the asset/data validator and `npm run build`; test keyboard, dialog, filtering, search, era navigation, and reduced-motion behavior.
- Start the dev server and inspect screenshots of the prototype and experiment detail page at desktop and mobile widths. Share the local URL for live review; do not commit or push before approval.
- Before implementation, archive this accepted plan verbatim in [`docs/plans/`](/Users/omar/omarai/oooomar-v5/docs/plans/) and update its index, per the repository process.
