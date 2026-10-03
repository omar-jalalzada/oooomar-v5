# Design history wiki: research spec

The shared contract for every research slice. The wiki is the long-form source for the course
material (one movement or figure at a time, later); the JSON fragments merge into
`public/prototypes/design-history/data.json`, which drives the timeline.

Audience: very senior designers. The goal is to understand each movement's *principles* well
enough to remix them today, so every principle needs a concrete, nameable example (a specific
poster, book, product, identity, typeface, with a year) — never a vague description.

## Files per slice

- `docs/design-history/<slice>.md` — the wiki prose.
- `docs/design-history/fragments/<slice>.json` — the structured data.

## Wiki prose, per movement and per figure

Each movement and figure gets a heading whose anchor is its id, written as
`## Swiss Style {#swiss-style}` (movement) or `### Josef Müller-Brockmann {#josef-muller-brockmann}`
(figure). Under each:

- **Context** — when, where, why it happened; what it reacted against; what technology enabled it.
- **Principles** — 3 to 6, each: a short name, the idea in one or two sentences, and a specific
  example with year that demonstrates it. Write them so a teacher could draw them.
- **Key works** — titled, dated, attributed.
- **Visual vocabulary** — type, colour, grid, imagery, composition, in concrete terms
  (e.g. "flush-left ragged-right Akzidenz-Grotesk, asymmetric layout on a modular grid,
  objective photography instead of illustration").
- **Lineage** — what it came from, what it fed into.
- **Quotes** — only real, attributable quotes with their source. No invented quotes. If unsure,
  leave it out.
- **Remix today** — one short paragraph: what a designer in 2026 can take from it.

End the file with a **Sources** list (books, museum pages, archives, articles with URLs).

## JSON fragment schema

```json
{
  "movements": [{
    "id": "swiss-style",
    "name": "Swiss Style",
    "aka": ["International Typographic Style"],
    "start": 1950, "end": 1975, "ongoing": false,
    "peak": [1957, 1968],
    "region": "europe",
    "places": ["Zurich", "Basel"],
    "lineage": "modernism",
    "summary": "One sentence, max ~25 words.",
    "influences": ["bauhaus", "new-typography"],
    "principles": [{ "name": "The grid", "idea": "One or two sentences.", "example": "Müller-Brockmann, Der Film poster, 1960" }],
    "keyWorks": [{ "title": "Der Film", "year": 1960, "figure": "josef-muller-brockmann", "kind": "poster" }]
  }],
  "figures": [{
    "id": "josef-muller-brockmann",
    "name": "Josef Müller-Brockmann",
    "born": 1914, "died": 1996,
    "activeFrom": 1936, "activeTo": 1990,
    "signatureYear": 1960,
    "region": "europe",
    "nationality": "Swiss",
    "role": "Graphic designer, educator",
    "movements": ["swiss-style"],
    "summary": "One sentence, max ~25 words.",
    "principles": [{ "name": "...", "idea": "...", "example": "..." }],
    "keyWorks": [{ "title": "...", "year": 1960, "kind": "poster" }]
  }],
  "events": [{ "year": 1984, "label": "Apple Macintosh", "kind": "technology", "note": "One sentence on why it matters to design." }],
  "sources": ["Philip B. Meggs & Alston W. Purvis, Meggs' History of Graphic Design, 6th ed., 2016", "https://..."]
}
```

Rules:

- Years are integers. `died` is `null` for the living. `end` of an ongoing movement is `2026`
  with `"ongoing": true`.
- `signatureYear` is the year of the figure's single most defining work — where their circle sits.
- `kind` for key works: `poster`, `book`, `typeface`, `identity`, `product`, `magazine`,
  `interface`, `system`, `film`, `building`, `manifesto`, `exhibition`, `other`.
- `principles`: 3 to 5 per movement, 2 to 4 per figure. Figures' principles are *their own*
  (Rams' ten principles condensed, Vignelli's "semantics, syntactics, pragmatics", Rand's
  "the idea"), not a repeat of their movement's.
- Every `figure.movements` entry and every `influences` entry must be a movement id — from your
  slice or from the canonical registry below. Need a movement that isn't in the registry and
  isn't in your slice? Add it to your slice.
- ids are lowercase ASCII kebab-case, diacritics dropped (`muller-brockmann`, not `müller`).
  Figures are `firstname-lastname`. Studios/duos are allowed as figures (`pentagram`,
  `chermayeff-geismar`) with `born` = founding year and `died` = closing year or `null`.

### Lineages (the timeline's colour code — use exactly these)

| id | name | covers |
| --- | --- | --- |
| `ornament` | Ornament & Reform | Victorian print, Arts & Crafts, Art Nouveau, Secession, Jugendstil |
| `avant-garde` | Avant-garde | Futurism, Dada, Suprematism, Constructivism, De Stijl, concretism |
| `modernism` | Modernism | Bauhaus, New Typography, Swiss/International, Ulm, functionalist product design |
| `commerce` | Commerce & Identity | Plakatstil, Art Deco, American modernism, corporate identity, Push Pin, editorial |
| `expression` | Expression & Rupture | psychedelia, Polish/Cuban poster schools, punk, New Wave, postmodernism, Emigre, grunge |
| `screen` | Screen & System | GUI, skeuomorphism, flat, Material, design systems, generative/AI |

### Regions (use exactly these)

`europe` (Western and Central Europe), `eastern-europe` (incl. Russia/USSR), `north-america`,
`latin-america`, `east-asia`, `middle-east` (incl. Iran, Arab world, North Africa), `global`
(e.g. web-era styles with no single home).

### Canonical movement registry (for cross-references)

Each slice owns its own; these ids are fixed so slices can point at each other.

- Slice `1850-1914`: `victorian-print`, `arts-and-crafts`, `private-press`, `art-nouveau`,
  `glasgow-school`, `vienna-secession`, `jugendstil`, `plakatstil`
- Slice `avant-garde`: `futurism`, `dada`, `de-stijl`, `suprematism`, `constructivism`,
  `bauhaus`, `new-typography`, `art-deco`, `isotype`
- Slice `swiss-international`: `swiss-style`, `ulm-school`, `functionalist-product-design`,
  `dutch-modernism`
- Slice `american-modernism`: `american-modernism`, `new-york-school`, `corporate-identity`,
  `push-pin`, `expressive-typography-us`
- Slice `postmodern`: `psychedelic`, `punk`, `new-wave`, `memphis`, `postmodern-typography`,
  `emigre-digital-type`, `grunge-deconstruction`, `new-swiss-revival`
- Slice `screen`: `gui-desktop-metaphor`, `skeuomorphism`, `flat-design`, `material-design`,
  `design-systems`, `neubrutalism`, `liquid-glass`, `generative-ai-design`
- Slice `east-asia`: `japanese-modernism`, `japanese-poster-avant-garde`, `chinese-modern-design`,
  `korean-modern-design`
- Slice `eastern-europe-middle-east`: `polish-poster-school`, `czech-avant-garde`,
  `iranian-graphic-design`, `arabic-modernism`
- Slice `latin-america`: `brazilian-concretism`, `cuban-poster`, `mexico-68`,
  `argentine-modernism`

Events (technology and context turning points) are welcome from any slice; the merge
de-duplicates them by year and label.
