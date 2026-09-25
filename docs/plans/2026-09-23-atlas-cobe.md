> **Date:** 2026-09-23
> **What prompted it:** Omar wants Atlas redone as a WebGL globe using [COBE](https://github.com/shuding/cobe): replace the flat map in place, keep the time scrubber, add travel arcs, and show photo stacks as the playhead reaches chosen moments. City cleanup (the years spent in one city) is a follow-up driven by a review list.


# Atlas -> COBE globe rewrite

## Locked decisions
- Replace in place: rewrite [public/prototypes/atlas/index.html](public/prototypes/atlas/index.html), no `v1/` fork.
- Keep the bottom time scrubber; add travel arcs that draw as the playhead passes them.
- Photo stacks appear when the playhead reaches a moment you picked. Photos come from your Swarm export (see below); nothing is published until you choose it.
- Day-level dates may ship publicly (your call). Coordinates stay at city centroids.
- City cleanup is its own next step, driven by a review list. This pass doesn't filter cities.

## What the re-check found
- **Arcs need the raw export.** `data.json` only has per-month counts per city, so the order of cities within a month (April 2017: Santiago, Valparaiso, Puerto Natales, Mexico City) is lost. The raw export at `~/Downloads/data-export-11996879/` has all 4,969 check-ins with timestamps, so the script can rebuild the order. The export stays in Downloads; the script reads it from there.
- **The export has photos.** `photos1.json` lists 408 photos; every one has a local file in `pix/` (matched by the `suffix` filename), and 400 link back to a check-in through `relatedItemUrl`. That gives each photo a city and a day, so photo stacks can be chosen from your own photos.
- **`.context/` isn't gitignored**, even though the June plan assumed it was. It gets added before anything is written there.
- **COBE 2.0.1 has zero dependencies** and ships `dist/index.esm.js`, so it's copied like `p5.module.js`, not bundled with esbuild. v2 is required; arcs and `update()` don't exist in v1.

## 1. Data: stays and legs
Extend [scripts/build-atlas-data.py](scripts/build-atlas-data.py) (existing reverse-geocode + city grouping stays as is) to also emit:
- `stays`: consecutive check-ins in the same city collapsed into `{ city, start: "YYYY-MM-DD", end, count }`, where `city` is an index into `cities`.
- `legs`: one per change of city between stays, `{ from, to, date, km }`, with `km` from haversine on the centroids.

Regenerate `data.json` with `python3 scripts/build-atlas-data.py ~/Downloads/data-export-11996879 public/prototypes/atlas/data.json`. The existing `cities` fields stay, so marker code keeps working.

## 2. Vendor COBE
`npm i -D cobe`, then `cp node_modules/cobe/dist/index.esm.js public/prototypes/atlas/cobe.module.js`, with the command recorded in an HTML comment at the top of `index.html`. Delete [public/prototypes/atlas/world.json](public/prototypes/atlas/world.json), because COBE draws the land.

## 3. The globe
- Centred COBE canvas on the paper ground (`#fcfcfd`), `dark: 0`, markers and arcs in accent `#195cff`. The scrubber stays at the bottom; the month/day label and running totals (check-ins, cities, countries) sit above it. The highlights panel is removed: its category stat is empty and the photo stacks take that space.
- **Markers:** every city visited up to the playhead, sized by `log` of its cumulative count, so San Francisco reads largest without swamping everything else.
- **Arcs:** legs with `date <= playhead` and `km >= 150`. That rule hides hops like SF -> Oakland without deciding the real cleanup, and it's a single constant (`MIN_ARC_KM`) the review step can replace. Only the latest 12 arcs are shown, and the oldest fades out.
- **Camera:** during playback, `phi`/`theta` ease toward the newest leg's destination. Dragging rotates the globe and pauses the easing until you let go.
- **Playback:** the playhead moves in days, and the scrubber keeps its year ticks. `?p=0..1` stays for screenshots.
- **House rules:** `prefers-reduced-motion` stops the auto-spin and camera easing but not dragging. Dragging is hit-tested in `pointerdown`, with `touch-action: none` and a non-passive `touchstart` `preventDefault()`.

## 4. Photo stacks
- [public/prototypes/atlas/moments.json](public/prototypes/atlas/moments.json): `{ "moments": [{ "id", "date", "city", "photos": ["photos/<file>.jpg"], "caption" }] }`.
- DOM overlay in a fixed slot to the right of the globe (it moves under the globe on narrow screens). When the playhead reaches `date`, the stack deals in (staggered cards with a slight rotation and offset). It stays until the next moment, and scrubbing backwards past it removes it.
- Photos you pick are copied from `pix/` into `public/prototypes/atlas/photos/` and resized with `sips -Z 1200`. Only picked photos enter the repo.
- This pass ships one placeholder moment (Buenos Aires, May 2017, one of your own photos from that trip) so you can review the motion; the rest come from the review list.

## 5. Metadata and archive
- On accept, copy this plan to `docs/plans/2026-09-23-atlas-cobe.md` and add an index line to [docs/plans/README.md](docs/plans/README.md) before coding.
- Update [src/content/experiments/atlas.md](src/content/experiments/atlas.md): remove the stale "sample data" sentence and describe the globe. It stays `status: draft`.

## 6. Next step: city + photo review list
Generated by the script into `.context/atlas/review.html` (gitignored, local only, never shipped). For each city it shows count, first and last visit, number of stays, longest stay, and thumbnails of the photos from that city linked to their dates. You go through it, pick photo moments and choose a cleanup rule. The theories it will lay out for the "years in one city" problem:
- **Count threshold:** keep cities over N visits. Simple, but SF still dominates.
- **Trip detection:** short, dense stays away from home are trips; long continuous presence is home. SF becomes the background and Kyoto or Buenos Aires become events.
- **Distance from home:** arcs and emphasis only beyond a radius of your home base(s).
- **Metro collapse:** merge the Bay Area towns and the NYC boroughs into one node each. Fewer dots, but SF is still the biggest.
- **Home as ground:** home cities render as a soft, persistent glow with no arcs; travel gets arcs and photos.
- **Hand-picked chapters:** a curated trip list drives the arcs and photos.

The review list will recommend "home as ground" plus trip detection as the default, with hand-picked chapters for photo moments.

## Verification
- `npm run dev` (outside the sandbox so the screenshot API can launch Chrome).
- Screenshots at `?p=0`, `?p=0.4` (South America 2017) and `?p=1`: `curl -s "http://localhost:4321/api/screenshot?prototype=atlas&wait=1500" -o /tmp/atlas.png`.
- Check that `/experiments/atlas/` still embeds it.
- Share the local URL for your review before any commit.
