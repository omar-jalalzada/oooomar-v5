// Work images for the design history timeline, from Wikipedia and Wikimedia Commons.
//
//   node scripts/design-history-images.mjs candidates <slice>        what each entry's article shows
//   node scripts/design-history-images.mjs candidates --title "Der Film" --title "..."
//   node scripts/design-history-images.mjs fetch                      download the curated picks
//
// The picks are curated by hand into docs/design-history/images/<slice>.json:
//   { "<movement or figure id>": [{ "file": "File:...", "title": "Der Film", "year": 1960, "figure": "<id>" }] }
// `fetch` downloads a small thumbnail of each into public/prototypes/design-history/img/ and
// writes images.json beside data.json with the credit, licence and source page for every one.
// Free files keep 480px on the long edge; non-free (fair-use) files are capped at 400px, the
// size Wikipedia's own non-free policy allows. The merge script attaches them to data.json.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FRAGMENTS = join(ROOT, 'docs/design-history/fragments');
const PICKS = join(ROOT, 'docs/design-history/images');
const OUT_DIR = join(ROOT, 'public/prototypes/design-history/img');
const MANIFEST = join(ROOT, 'public/prototypes/design-history/images.json');
const API = 'https://en.wikipedia.org/w/api.php';
const UA = { 'User-Agent': 'omar.build design-history research (https://omar.build)' };

const FREE_EDGE = 480;
const FAIR_EDGE = 400;
const QUALITY = '66';

// interface chrome that every article carries, never a work
const CHROME = /OOjs|Commons-logo|Wiki(source|quote|data|media|books|news|versity|voyage|species)|Question_book|Edit-clear|Ambox|Padlock|Symbol_|Flag_of|Crystal_Clear|Nuvola|Portal-puzzle|Folder_Hexagonal|Text_document|Red_pog|Increase2|Decrease|Steady|P_vip|Lock-|Disambig|Sound-icon|Speakerlink|Info_Simple|Emblem-|Office-book|People_icon|Video_camera|Merge-arrow|Gnome-|Searchtool|Logo_Wiktionary|Open_Access/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let i = 0; i < 8; i++) {
    await sleep(200);
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    const wait = Number(r.headers.get('retry-after')) * 1000 || 2000 * 2 ** i;
    await sleep(Math.min(wait, 30000));
  }
  throw new Error(`API failed: ${url}`);
}

/** An article by title, following redirects; falls back to a search when the title misses. */
async function article(title, hint) {
  let d = await api({ action: 'query', titles: title, redirects: '1', prop: 'images|pageprops', imlimit: '80' });
  let page = d.query.pages[0];
  if (page.missing || page.pageprops?.disambiguation !== undefined) {
    const s = await api({ action: 'query', list: 'search', srsearch: `${title} ${hint}`, srlimit: '1' });
    const hit = s.query.search[0];
    if (!hit) return null;
    d = await api({ action: 'query', titles: hit.title, redirects: '1', prop: 'images', imlimit: '80' });
    page = d.query.pages[0];
  }
  return page.missing ? null : page;
}

/** Licence, author, description and size for up to 50 files at once. */
async function fileInfo(files, width = 0) {
  const out = new Map();
  for (let i = 0; i < files.length; i += 50) {
    const d = await api({
      action: 'query', titles: files.slice(i, i + 50).join('|'), prop: 'imageinfo',
      iiprop: 'url|size|extmetadata|mime', ...(width ? { iiurlwidth: String(width) } : {}),
    });
    for (const p of d.query.pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const m = ii.extmetadata ?? {};
      out.set(p.title, {
        file: p.title,
        w: ii.width, h: ii.height, mime: ii.mime,
        url: ii.url, thumb: ii.thumburl, page: ii.descriptionurl,
        desc: strip(m.ImageDescription?.value).slice(0, 200),
        date: strip(m.DateTimeOriginal?.value).slice(0, 40),
        artist: strip(m.Artist?.value).slice(0, 80),
        license: strip(m.LicenseShortName?.value) || (m.NonFree ? 'Non-free' : ''),
        nonfree: m.NonFree?.value === 'true' || /non-free|fair use/i.test(m.LicenseShortName?.value ?? ''),
      });
    }
  }
  return out;
}

async function candidatesFor(title, hint) {
  try {
    return await lookup(title, hint);
  } catch (e) {
    return { title, article: null, images: [], error: e.message };
  }
}

async function lookup(title, hint) {
  const page = await article(title, hint);
  if (!page) return { title, article: null, images: [] };
  const files = (page.images ?? []).map((i) => i.title).filter((f) => !CHROME.test(f));
  const info = await fileInfo(files);
  const images = files.map((f) => info.get(f)).filter((i) => i && i.w >= 120)
    .map(({ url, thumb, page: _p, mime, ...rest }) => rest);
  return { title, article: page.title, images };
}

async function candidates(args) {
  const titles = [];
  for (let i = 0; i < args.length; i++) if (args[i] === '--title') titles.push(args[++i]);
  if (titles.length) {
    const out = [];
    for (const t of titles) out.push(await candidatesFor(t, ''));
    console.log(JSON.stringify(out, null, 1));
    return;
  }
  const slice = args[0];
  const frag = JSON.parse(readFileSync(join(FRAGMENTS, `${slice}.json`), 'utf8'));
  const out = {};
  for (const m of frag.movements) out[m.id] = await candidatesFor(m.name, 'art movement design');
  for (const f of frag.figures) out[f.id] = await candidatesFor(f.name.replace(/\s*\(.*\)$/, ''), 'designer');
  console.log(JSON.stringify(out, null, 1));
}

async function fetchAll() {
  mkdirSync(OUT_DIR, { recursive: true });
  const picks = {};
  for (const f of readdirSync(PICKS).filter((x) => x.endsWith('.json')).sort()) {
    Object.assign(picks, JSON.parse(readFileSync(join(PICKS, f), 'utf8')));
  }
  const files = [...new Set(Object.values(picks).flat().map((p) => p.file))];
  const info = await fileInfo(files, FREE_EDGE);
  const manifest = {};
  let got = 0, missing = 0;
  for (const [id, list] of Object.entries(picks)) {
    manifest[id] = [];
    for (const [n, p] of list.entries()) {
      const i = info.get(p.file);
      if (!i) { console.log(`missing  ${id}: ${p.file}`); missing++; continue; }
      const edge = i.nonfree ? FAIR_EDGE : FREE_EDGE;
      // named by source file, so a work shown under a movement and its maker is stored once
      const name = `${createHash('sha1').update(p.file).digest('hex').slice(0, 12)}.jpg`;
      const dest = join(OUT_DIR, name);
      if (!existsSync(dest)) {
        // svg and small originals come back as a rendered thumbnail; anything else, the thumb url
        const src = i.thumb ?? i.url;
        const r = await fetch(src, { headers: UA });
        if (!r.ok) { console.log(`http ${r.status}  ${id}: ${p.file}`); missing++; continue; }
        const tmp = `${dest}.src`;
        writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
        execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', QUALITY, '-Z', String(edge), tmp, '--out', dest], { stdio: 'ignore' });
        execFileSync('rm', [tmp]);
        await sleep(120);
      }
      const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', dest]).toString();
      const w = +dims.match(/pixelWidth: (\d+)/)[1];
      const h = +dims.match(/pixelHeight: (\d+)/)[1];
      manifest[id].push({
        src: `img/${name}`, w, h,
        title: p.title, year: p.year ?? null, figure: p.figure ?? null,
        credit: i.artist || null, license: i.license || null, fairUse: i.nonfree, source: i.page,
      });
      got++;
    }
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
  console.log(`wrote images.json: ${got} images for ${Object.keys(manifest).length} entries, ${missing} missing`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'candidates') await candidates(rest);
else if (cmd === 'fetch') await fetchAll();
else console.log('usage: candidates <slice> | candidates --title "..." | fetch');
