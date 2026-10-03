# Design history wiki

A research wiki on the history of graphic design from 1850 to 2026, written for very senior
designers who want to understand each movement's principles well enough to remix them today.
Nine research agents each wrote one slice in parallel, to the shared contract in `SPEC.md`: long
prose per movement and figure (context, principles with a dated example, key works, visual
vocabulary, lineage, sourced quotes, and a "remix today" note), plus a structured JSON fragment
of the same material. The fragments merge into the dataset that drives the design-history
timeline prototype. A verification pass then spot-checked the facts, reconciled the two figures
that two slices both researched, and compiled the disputed and missing material below.

## File layout

- `SPEC.md` — the contract every slice follows: the prose structure, the JSON schema, the six
  lineages (the timeline's colour code), the seven regions, and the canonical movement ids that
  slices use to point at each other.
- `<slice>.md` — the wiki prose for one slice. Headings carry the movement or figure id as an
  anchor (`{#swiss-style}`), and each file ends with a Sources list. Five of the nine also end
  with a list of disputed dates.
- `fragments/<slice>.json` — the structured data for the same slice: movements, figures, events
  and sources. **The fragments are the source of truth for the timeline.**
- `scripts/design-history-merge.mjs` (at the repo root) — merges every fragment into
  `public/prototypes/design-history/data.json`. It fails on a dangling movement id, an unknown
  lineage or region, or a non-integer year. It removes duplicate events by year and label, and
  marks the 21 major turning points. It warns when a signature year falls outside a figure's
  active years, or when two slices disagree about a figure they share. For a shared figure, the
  first slice alphabetically supplies the facts; movements and key works from both are combined.
  Rerun it after editing any fragment: `node scripts/design-history-merge.mjs`.
- `public/prototypes/design-history/data.json` — the generated output. Never edit it by hand.

## Slices

| Slice | Covers | Movements | Figures | Events |
| --- | --- | ---: | ---: | ---: |
| `1850-1914` | Victorian print to Plakatstil | 9 | 20 | 23 |
| `avant-garde` | Expressionism, Futurism, Dada, De Stijl, Constructivism, Bauhaus, New Typography, Art Deco, Isotype | 11 | 28 | 28 |
| `swiss-international` | Swiss Style, Ulm, Braun-era product design, Dutch and Italian modernism | 5 | 21 | 16 |
| `american-modernism` | Émigré modernism, New York School, corporate identity, Push Pin, expressive typography | 7 | 23 | 22 |
| `postmodern` | Psychedelia, punk, New Wave, Memphis, Emigre, grunge, the neo-modernist revival | 8 | 26 | 17 |
| `screen` | GUI, early web, Flash, skeuomorphism, flat, Material, design systems, generative AI | 13 | 21 | 45 |
| `east-asia` | Japanese modernism and poster avant-garde, Chinese, Hong Kong, Taiwanese and Korean design | 6 | 22 | 21 |
| `eastern-europe-middle-east` | Czech avant-garde, Polish and Czechoslovak posters, Iran, hurufiyya, Arabic type | 7 | 22 | 23 |
| `latin-america` | TGP, Argentine and Venezuelan modernism, Brazilian concretism, Cuban posters, Mexico 68, Tropicália, Chile, Latin American type | 9 | 22 | 11 |
| **Total** | | **75** | **205** | **206** |

After merging there are 203 unique figures, because Ladislav Sutnar and Tomás Maldonado each
appear in two slices, and 201 unique events.

## How sources were verified

Web search was blocked for the research agents. They worked from the Wikipedia REST API (English,
plus Japanese, Spanish, Portuguese, Polish and Persian editions where the subject was local),
Wikidata, the V&A collections API, and museum and archive pages they could fetch directly
(culture.pl, the Met, MoMA and others listed in each slice's Sources). Philip B. Meggs and
Alston W. Purvis, *Meggs' History of Graphic Design*, is cited throughout as the backbone of the
canon, but no agent consulted it directly. Treat it as the framing reference, not as a checked
source for any particular date.

The verification pass compared every figure's birth and death years with Wikidata, using each
person's English Wikipedia page to find the right record (151 matched exactly). Most of the rest
have no English Wikipedia page, or hit Wikipedia's rate limit, and were checked against Japanese,
Spanish or Portuguese Wikipedia instead, or left as the slice had them. Signature years and
movement spans for the best-known figures and movements were reviewed against their key works
and the slices' own prose. Every death recorded in 2026 was checked against a newspaper source.

## Corrections made in verification

- **Ladislav Sutnar, signature year 1944 → 1950** in `eastern-europe-middle-east`, to match
  `american-modernism`. *Catalog Design Progress* (1950, with Knud Lönberg-Holm) is the book most
  often named as his landmark; *Catalog Design* (1944) was the first step towards it. Added
  *Catalog Design Progress* to that slice's key works so the signature year points at a listed
  work.
- **Tomás Maldonado, signature year 1946 → 1970** in `latin-america`, to match
  `swiss-international`. *La speranza progettuale* (1970; in English *Design, Nature, and
  Revolution*, 1972) is his single most cited work and is listed in both slices. The 1946
  *Manifiesto Invencionista* was a collective document with many signatories.
- **Tomás Maldonado, active 1945–2010 → 1944–2018** in `swiss-international`, to match
  `latin-america`. His work in Buenos Aires begins with the magazine *Arturo* (1944), and he kept
  publishing almost until his death in 2018.
- **Neo-modernist Revival (`new-swiss-revival`), lineage `expression` → `modernism`** in
  `postmodern`. The slice's own prose describes a return to grids, grotesques and black and white
  (Experimental Jetset, Norm, Lineto). Coloured as Expression & Rupture, it would read on the
  timeline as a continuation of grunge rather than a revival of Swiss modernism.

No other birth, death or signature-year errors were found among the canonical figures checked.
These included Morris, Mucha, Toulouse-Lautrec, Behrens, Lissitzky, Rodchenko, Moholy-Nagy,
Bayer, Tschichold, Cassandre, Müller-Brockmann, Hofmann, Ruder, Gerstner, Frutiger, Aicher,
Rams, Crouwel, Rand, Bass, both Vignellis, Glaser, Chwast, Lubalin, Brodovitch, Lustig, Scher,
Weingart, Greiman, Carson, Brody, Saville, Licko, VanderLans, Sagmeister, Kare, Ive, Kamekura,
Tanaka, Yokoo, both Haras, Tomaszewski, Momayez, Wollner and Wyman.

### Deaths in 2026

All three are confirmed by a second, independent source, so they stay as recorded.

- **Peter Max** died on 14 September 2026, aged 88 (English Wikipedia and Wikidata). Obituaries
  from AP, Reuters, the New York Times, the Washington Post, The Guardian and the Los Angeles Times
  appeared on 16 and 17 September 2026.
- **Kazumasa Nagai** died on 23 February 2026, aged 96, of acute respiratory failure (Japanese and
  English Wikipedia, Wikidata). Confirmed directly by the Mainichi Shimbun, 2 March 2026.
- **Juan Carlos Distéfano** died on 25 July 2026, aged 92 (Spanish Wikipedia, Wikidata).
  Confirmed directly by La Nación, 25 July 2026.

## Disputed dates

Compiled from the lists at the end of five slices, with a few conflicts the verification pass
found added. The `american-modernism`, `postmodern`, `screen` and `swiss-international` slices
have no disputed-dates section of their own.

### 1850-1914

- Mucha's *Gismonda* was printed in late December 1894 and posted from about 1 January 1895; 1894 is used.
- Bernhard's *Priester* is dated 1905 (the competition) or 1906 (publication); 1906 is used.
- The Beggarstaffs' partnership is given as 1893–1899 or 1893–1898; the slice uses 1894–1899, from their first posters.
- The Doves Press Bible is dated 1902–1904 or 1903–1905; 1903 is used.
- Mucha's *Job* is dated 1896 in most poster histories and 1898 in one Wikipedia listing; 1896 is used.
- Mucha's *Slav Epic* is given as 1910–1928 or 1912–1926.
- Behrens's *Der Kuss* is usually dated "c. 1898".
- Morris's Golden Type was begun by 1889, completed in 1890 and first used in 1891; 1890 is used.
- Monotype was founded in 1887 and its caster patented in 1896; 1887 is used for the event.
- The Grasset typeface was patented in 1897 and issued in 1898.
- Behrens's AEG honeycomb mark is usually dated 1908, out of several marks made between 1907 and 1914.
- Hohlwein's *Hermann Scherrer* poster exists in several versions; 1911 is the usual date.
- Eugène Grasset's birth year is 1845 on Wikipedia and 1841 on Wikidata; 1845 is kept (found in verification).

### Avant-garde

- Malevich was born in 1879 by current consensus, though older sources and Wikidata give 1878; he also backdated Suprematist works to 1913.
- The Futurist manifesto first appeared on 5 February 1909 in Bologna; 20 February 1909 (*Le Figaro*) is the conventional date.
- *Zang Tumb Tuuum* has excerpts from 1912 and was published as a book in 1914.
- Lissitzky's *Beat the Whites with the Red Wedge* is dated 1919 on Wikipedia and 1920 in some museum records.
- Lissitzky's *About Two Squares* was designed in 1920 and published in 1922.
- Constructivism's start is put at 1915 (Tatlin's counter-reliefs) or 1921 (the First Working Group).
- The Bauhaus ended in 1932 (Dessau closed) or 1933 (Berlin sealed in April, dissolved in July).
- Gerd Arntz joined Neurath's museum in 1928 or early 1929.
- Cassandre's *Acier Noir* is dated 1930, 1935 or 1936 in different sources.
- Kauffer's *Soaring to Success!* is dated 1918–1919 by the V&A.
- Beck's Underground map was drawn in 1931 and issued in January 1933.
- The Stenberg brothers' posters start in 1923 or 1924; their OBMOKhU founding (1919) is used as the duo's start.
- "Isotype" as a name dates from around 1935.

### American modernism

- Unimark International was founded in 1965 according to Wikipedia and 1964 according to Wikidata; 1965 is kept (found in verification).

### Screen

- Scott Forstall was born in 1969 according to Wikipedia and 1968 according to Wikidata; 1969 is kept (found in verification).

### East Asia

- The Nippon Design Center was registered in December 1959 and opened in March 1960; 1960 is used.
- The Tokyo 1964 emblem was chosen in 1960 or designed in 1961; the sprinter poster is 1962.
- Henry Steiner's HSBC hexagon is usually dated 1983; English Wikipedia gives 1984.
- Superflat: the Parco show was in April 2000 and the MOCA show in January 2001.
- Eiko Ishioka opened her own studio in 1970 according to Japanese sources; English Wikipedia makes her Parco's art director from 1971.
- Kamekura worked on *Nippon* from 1937 (English Wikipedia) or joined Nippon Kōbō in 1938 (Japanese sources).
- Kenya Hara's *Designing Design* was published in Japanese in 2003 and in English in 2007.

### Eastern Europe and Middle East

- Tomaszewski's honorary RDI is dated 1975 or 1976.
- Lenica's *Labirynt* is dated 1962 or 1963.
- Górka's *Kabaret* poster is dated 1972 or 1973; 1973 is used.
- Starowieyski's MoMA solo show is dated 1985 or 1986.
- Świerzy's birth is "c. 1931" on English Wikipedia and 9 September 1931 on culture.pl.
- Momayez died on 25 October or 26 November 2005; the year is not in doubt.
- Ghobad Shiva was born on 23 or 24 January 1941.
- Madiha Omar's *Arabic Calligraphy* is dated 1949 or 1950.
- Cieślewicz died in Paris or in Antony, a Paris suburb.
- Iranian solar-year dates span two Gregorian years; the earlier one is used throughout.

### Latin America

- Mexico 68's authorship is disputed between Lance Wyman and Pedro Ramírez Vázquez, with Eduardo Terrazas also credited.
- Maldonado's Ulm years are given as 1954–1966 and 1954–1967 in the same Wikipedia article.
- Guillermo González Ruiz was born in 1937 (Spanish Wikipedia, Wikidata) or 1938 (some lists).
- Leopoldo Méndez's *Río Escondido* prints are dated 1947; the film was released in 1948.
- Rostgaard's *Hanoi martes 13* is dated 1967 and 1968 on different V&A impressions.

## Unconfirmed

These rest on a single source, or on an agent's memory rather than a fetched source.

- **Six living figures in the screen slice have no birth year**: Matías Duarte, Albert Shum,
  Ethan Marcotte, Brad Frost, Alan Dye and Bret Victor. Wikidata gives Duarte 1973, but nothing
  corroborates it, so it isn't used.
- ***tipoGráfica*'s founding year (1987)** comes from secondary knowledge, not a fetched source.
- **Lu Jingren's *Zhu Xi Bangshu Qianziwen*** (commonly 1999), **Choi Jeong-ho's myeongjo** (the
  1960s are verified, the exact year isn't), **Qian Juntao's individual cover titles** and
  **Henry Steiner's Jockey Club redesign** (before 1997) have unverified years.
- **Parviz Tanavoli's signature year (1965)** stands for the *Heech* series, which the slice dates
  only to "the 1960s"; no key work carries that exact year.
- **Lesser-known figures without English Wikipedia pages** were checked only against the source
  the slice cited, or not at all. These include Zhang Guangyu, Qian Juntao, Kan Tai-keung, Alan
  Chan, Aaron Nieh, Choi Jeong-ho, Cho Young-jae, Wiktor Górka, Madiha Omar, Mohieddine Ellabbad,
  Helmi El-Touni, Rubén Fontana, Rogério Duarte, Nedo Mion Ferrario, Félix Beltrán, René Azcuy,
  Eduardo Terrazas, Siegfried Odermatt and Ernst Keller.
- **Every date attributed to Meggs** is attributed from memory of the book, not from a
  consultation of it.
- **The four slices without a disputed-dates section** (`american-modernism`, `postmodern`,
  `screen`, `swiss-international`) didn't record where their sources disagreed. Their silence
  doesn't mean there were no conflicts.

## Gaps

- **Regions missing entirely**: South Asia (for example India's National Institute of Design,
  founded 1961, after the Eameses' 1958 *India Report*), Africa (sub-Saharan and South African
  design), Turkey, Israel, Southeast Asia and Australia. North Africa appears only through the
  Egyptian figures in the Arabic modernism material.
- **Eastern Europe beyond Poland and Czechoslovakia**: no Soviet late modernism or Thaw-era
  graphics (Soviet coverage stops with Constructivism in the 1930s), and nothing on Yugoslavia,
  Hungary, the GDR or the Baltic states.
- **Western Europe is thin outside the canon**: no British post-war modernism (Abram Games,
  F.H.K. Henrion, Kinneir and Calvert's road signs, Fletcher/Forbes/Gill), no French post-war
  design (Excoffon, Grapus beyond a passing mention), no German post-war posters (Fleckhaus,
  Hillmann, Rambow), and nothing from Scandinavia, Spain or Portugal.
- **Women are underrepresented**: 17 of the 203 figures are women, plus Ray Eames as half of a duo.
  The Latin America slice has none, and East Asia and Swiss/International have one each. Absent figures include Elaine Lustig Cohen, Bea Feitler, Deborah
  Sussman, Sheila Levrant de Bretteville, Corita Kent, Margaret Calvert, Ethel Reed, Lucia Moholy,
  Grete Stern and Lina Bo Bardi.
- **Movements and practices missing**: record-sleeve design as its own lineage (Blue Note and
  Reid Miles are absent), paperback design (Penguin appears only through Tschichold), graffiti
  and hip-hop graphics, Soviet and Chinese propaganda posters after 1930, and the post-2010
  independent-publishing and riso scene.
- **Long catch-all spans**: `chinese-modern-design` runs from 1920 to the present as one bar, and
  `korean-modern-design` and `iranian-graphic-design` are similar. Each covers several distinct
  phases that a later pass should split.
- **A debatable lineage**: `latin-american-type` (type design from 1987) is coloured Screen &
  System because it rests on digital distribution. Modernism would be equally defensible. It was
  left as the slice had it.
