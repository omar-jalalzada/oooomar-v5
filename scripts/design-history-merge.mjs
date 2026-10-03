// Merges the research fragments in docs/design-history/fragments/ into the timeline's dataset,
// public/prototypes/design-history/data.json, and fails loudly on anything the view would
// trip over: a dangling movement id, an unknown lineage or region, a non-integer year.
//
//   node scripts/design-history-merge.mjs
//
// The fragments stay the source; rerun this after editing one.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FRAGMENTS = join(ROOT, 'docs/design-history/fragments');
const OUT = join(ROOT, 'public/prototypes/design-history/data.json');

const LINEAGES = [
  { id: 'ornament', name: 'Ornament & Reform' },
  { id: 'avant-garde', name: 'Avant-garde' },
  { id: 'modernism', name: 'Modernism' },
  { id: 'commerce', name: 'Commerce & Identity' },
  { id: 'expression', name: 'Expression & Rupture' },
  { id: 'screen', name: 'Screen & System' },
];

const REGIONS = [
  { id: 'europe', name: 'Europe' },
  { id: 'eastern-europe', name: 'Eastern Europe' },
  { id: 'north-america', name: 'North America' },
  { id: 'latin-america', name: 'Latin America' },
  { id: 'east-asia', name: 'East Asia' },
  { id: 'middle-east', name: 'Middle East' },
  { id: 'global', name: 'Global' },
];

// The turning points drawn across the whole timeline; every other event is an axis tick.
// Matched against the merged labels, so each pattern must hit exactly one event.
const MAJOR = [
  [1851, /great exhibition/i],
  [1886, /linotype/i],
  [1891, /kelmscott/i],
  [1897, /secession/i],
  [1909, /futurist manifesto|manifesto of futurism/i],
  [1919, /bauhaus/i],
  [1928, /neue typographie/i],
  [1933, /beck|underground/i],
  [1957, /helvetica/i],
  [1958, /neue grafik/i],
  [1964, /tokyo/i],
  [1968, /mother of all demos|engelbart/i],
  [1972, /munich/i],
  [1984, /macintosh/i],
  [1985, /postscript/i],
  [1991, /world wide web|web/i],
  [2007, /iphone/i],
  [2013, /ios 7/i],
  [2014, /material/i],
  [2022, /chatgpt/i],
  [2025, /liquid glass/i],
];

// the same event reported by two slices under labels too different for the word match below
const SAME_EVENT = [
  [1938, /bauhaus/i],
  [1974, /dot|symbol signs/i],
];

const fail = [];
const warn = [];
const isYear = (v) => Number.isInteger(v) && v > 1700 && v <= 2026;
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();

const movements = new Map();
const figures = new Map();
const events = [];
const sources = {};

for (const file of readdirSync(FRAGMENTS).filter((f) => f.endsWith('.json')).sort()) {
  const slice = file.replace(/\.json$/, '');
  const data = JSON.parse(readFileSync(join(FRAGMENTS, file), 'utf8'));
  sources[slice] = data.sources ?? [];

  for (const m of data.movements) movements.set(m.id, { ...m, wiki: `${slice}.md#${m.id}` });

  for (const p of data.figures) {
    const prior = figures.get(p.id);
    if (!prior) {
      figures.set(p.id, { ...p, wiki: `${slice}.md#${p.id}`, alsoIn: [] });
      continue;
    }
    // the same person researched by two slices: keep the first entry's facts, union what they
    // were part of and what they made, and report any fact the two disagree on
    for (const k of ['born', 'died', 'activeFrom', 'activeTo', 'signatureYear']) {
      if (prior[k] !== p[k]) warn.push(`${p.id}: ${k} ${prior[k]} (${prior.wiki}) vs ${p[k]} (${slice})`);
    }
    prior.movements = [...new Set([...prior.movements, ...p.movements])];
    const titles = new Set(prior.keyWorks.map((w) => norm(w.title)));
    prior.keyWorks.push(...p.keyWorks.filter((w) => !titles.has(norm(w.title))));
    prior.alsoIn.push(`${slice}.md#${p.id}`);
  }

  for (const e of data.events) {
    const kind = /technolog|product/.test(e.kind) ? 'technology' : 'context';
    events.push({ ...e, kind, slice });
  }
}

// one event per year and label, where "the same" means one label's words contain the other's
const merged = [];
for (const e of events.sort((a, b) => a.year - b.year)) {
  const twin = merged.find((m) => {
    if (m.year !== e.year) return false;
    const a = norm(m.label), b = norm(e.label);
    if (a.includes(b) || b.includes(a)) return true;
    return SAME_EVENT.some(([y, re]) => y === e.year && re.test(m.label) && re.test(e.label));
  });
  if (twin) continue;
  merged.push(e);
}

for (const [year, re] of MAJOR) {
  const hits = merged.filter((e) => e.year === year && re.test(e.label));
  if (hits.length === 0) warn.push(`major turning point ${year} ${re} matched nothing`);
  else hits[0].major = true;
  if (hits.length > 1) warn.push(`major ${year} ${re} matched ${hits.length}: ${hits.map((h) => h.label).join(' | ')}`);
}

const lineageIds = new Set(LINEAGES.map((l) => l.id));
const regionIds = new Set(REGIONS.map((r) => r.id));

for (const m of movements.values()) {
  if (!lineageIds.has(m.lineage)) fail.push(`${m.id}: unknown lineage ${m.lineage}`);
  if (!regionIds.has(m.region)) fail.push(`${m.id}: unknown region ${m.region}`);
  if (!isYear(m.start) || !isYear(m.end) || m.start > m.end) fail.push(`${m.id}: bad span ${m.start}-${m.end}`);
  for (const i of m.influences) if (!movements.has(i)) fail.push(`${m.id}: influence ${i} doesn't resolve`);
  // a long movement can absorb a later one, but not one that only began after it ended
  for (const i of m.influences) {
    const parent = movements.get(i);
    if (parent && parent.start > m.end) warn.push(`${m.id} (${m.start}-${m.end}) lists ${i} (${parent.start}) as an influence`);
  }
}

for (const p of figures.values()) {
  if (!regionIds.has(p.region)) fail.push(`${p.id}: unknown region ${p.region}`);
  if (p.movements.length === 0) fail.push(`${p.id}: no movement`);
  for (const id of p.movements) if (!movements.has(id)) fail.push(`${p.id}: movement ${id} doesn't resolve`);
  if (!isYear(p.signatureYear)) fail.push(`${p.id}: signatureYear ${p.signatureYear}`);
  if (!isYear(p.activeFrom) || !isYear(p.activeTo)) fail.push(`${p.id}: active ${p.activeFrom}-${p.activeTo}`);
  if (p.born !== null && !isYear(p.born)) fail.push(`${p.id}: born ${p.born}`);
  if (p.died !== null && p.died !== undefined && !isYear(p.died)) fail.push(`${p.id}: died ${p.died}`);
  if (p.signatureYear < p.activeFrom || p.signatureYear > p.activeTo) {
    warn.push(`${p.id}: signatureYear ${p.signatureYear} outside active ${p.activeFrom}-${p.activeTo}`);
  }
}

// work images, curated in docs/design-history/images/ and downloaded by design-history-images.mjs
const IMAGES = join(ROOT, 'public/prototypes/design-history/images.json');
if (existsSync(IMAGES)) {
  const images = JSON.parse(readFileSync(IMAGES, 'utf8'));
  for (const [id, list] of Object.entries(images)) {
    const entry = movements.get(id) ?? figures.get(id);
    if (!entry) { warn.push(`images for unknown entry ${id}`); continue; }
    entry.images = list;
  }
}

for (const w of warn) console.log('warn ', w);
for (const f of fail) console.log('FAIL ', f);
if (fail.length) process.exit(1);

const byStart = (a, b) => a.start - b.start || a.end - b.end;
const out = {
  generated: 'scripts/design-history-merge.mjs from docs/design-history/fragments/',
  span: [1850, 2026],
  lineages: LINEAGES,
  regions: REGIONS,
  movements: [...movements.values()].sort(byStart),
  figures: [...figures.values()].sort((a, b) => a.signatureYear - b.signatureYear),
  events: merged,
  sources,
};
writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(
  `wrote ${OUT.replace(ROOT, '')}: ${out.movements.length} movements, ${out.figures.length} figures, ` +
    `${merged.length} events (${merged.filter((e) => e.major).length} major), ${warn.length} warnings`,
);
