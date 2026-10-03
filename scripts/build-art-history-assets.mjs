#!/usr/bin/env node

/**
 * Builds the Art History experiment's offline data and image set from Wikipedia and
 * Wikimedia Commons. The page media list preserves editorial order; Commons metadata
 * decides whether an image can be copied. Files without clear reuse metadata stay as
 * citation-only examples.
 *
 * Usage:
 *   node scripts/build-art-history-assets.mjs
 *   node scripts/build-art-history-assets.mjs --validate
 */

import { mkdir, readFile, writeFile, access, unlink } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const SEEDS = join(ROOT, 'scripts/art-history-movements.json');
const PROTOTYPE = join(ROOT, 'public/prototypes/art-history');
const DATA = join(PROTOTYPE, 'data/movements.json');
const IMAGES = join(PROTOTYPE, 'images');
const USER_AGENT = 'ArtHistoryPrototype/1.0 (https://omar.build; educational timeline)';
const SKIP_FILE = /(logo|icon|map|flag|signature|diagram|scheme|location|wordmark|coat.of.arms)/i;
const run = promisify(execFile);

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const normalizeFile = (value = '') => decodeURIComponent(String(value)).replaceAll('_', ' ').trim().toLowerCase();
const text = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\[(?:\d+|[a-z])\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchJson(url, tries = 3) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if ((response.status === 429 || response.status >= 500) && tries > 1) {
    await sleep((4 - tries) * 700);
    return fetchJson(url, tries - 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function pageMedia(page) {
  try {
    const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`);
    return data.items
      .filter((item) => item.type === 'image' && item.showInGallery !== false)
      .filter((item) => !item.title.toLowerCase().endsWith('.svg'))
      .filter((item) => !SKIP_FILE.test(item.title))
      .map((item) => ({
        file: item.title,
        caption: text(item.caption?.text || item.caption?.html),
        articleSource: `https://en.wikipedia.org/wiki/${page}`,
      }));
  } catch (error) {
    console.warn(`  article media unavailable: ${error.message}`);
    return [];
  }
}

async function commonsInfo(files) {
  const found = new Map();
  for (let i = 0; i < files.length; i += 40) {
    const titles = files.slice(i, i + 40).join('|');
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '640',
      redirects: '1',
      titles,
      origin: '*',
    });
    const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
    for (const page of data.query?.pages || []) {
      const info = page.imageinfo?.[0];
      if (info) found.set(normalizeFile(page.title), { ...info, pageTitle: page.title });
    }
  }
  return found;
}

async function commonsSearch(query, limit = 18) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: String(limit),
    gsrsearch: `${query} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|mime|extmetadata',
    iiurlwidth: '640',
    origin: '*',
  });
  const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
  return (data.query?.pages || [])
    .filter((page) => page.imageinfo?.[0] && !SKIP_FILE.test(page.title))
    .map((page) => ({ ...page.imageinfo[0], pageTitle: page.title }));
}

function metadata(info) {
  const ext = info?.extmetadata || {};
  const license = text(ext.LicenseShortName?.value);
  const licenseUrl = text(ext.LicenseUrl?.value);
  const reusable = Boolean(info?.thumburl && license && !/fair use|non-free|copyrighted/i.test(license));
  return {
    reusable,
    license,
    licenseUrl,
    title: text(ext.ObjectName?.value),
    creator: text(ext.Artist?.value) || 'Unknown maker',
    date: text(ext.DateTimeOriginal?.value || ext.DateTime?.value) || 'Date not recorded',
    institution: text(ext.Institution?.value || ext.Credit?.value) || 'Wikimedia Commons',
    description: text(ext.ImageDescription?.value),
  };
}

function fileTitle(file) {
  return file
    .replace(/^File:/, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayTitle(value, file = '') {
  const cleaned = text(value);
  if (cleaned.length <= 110) return cleaned;
  const firstSentence = cleaned.match(/^.{18,110}?(?=[.!?](?:\s|$))/)?.[0];
  return firstSentence || fileTitle(file).slice(0, 110);
}

function extensionFor(mime, url) {
  const byMime = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
  return byMime[mime] || extname(new URL(url).pathname).toLowerCase() || '.jpg';
}

async function download(info, movementId, index) {
  const extension = extensionFor(info.mime, info.thumburl);
  const stem = `${movementId}-${String(index + 1).padStart(2, '0')}`;
  const name = `${stem}${extension}`;
  const destination = join(IMAGES, name);
  const response = await fetch(info.thumburl, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} downloading ${info.thumburl}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  try {
    const webpName = `${stem}.webp`;
    await convertToWebp(destination, join(IMAGES, webpName));
    if (extension !== '.webp') await unlink(destination);
    return `images/${webpName}`;
  } catch {
    return `images/${name}`;
  }
}

async function convertToWebp(source, destination) {
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    source,
    '-vf',
    'scale=min(720\\,iw):-2',
    '-frames:v',
    '1',
    '-c:v',
    'libwebp',
    '-quality',
    '72',
    '-compression_level',
    '6',
    destination,
  ]);
}

async function compressExisting() {
  const data = JSON.parse(await readFile(DATA, 'utf8'));
  let converted = 0;
  for (const movement of data) {
    for (const example of movement.examples) {
      if (!example.image || example.image.endsWith('.webp')) continue;
      const source = join(PROTOTYPE, example.image);
      const destination = source.replace(/\.[^.]+$/, '.webp');
      await convertToWebp(source, destination);
      await unlink(source);
      example.image = example.image.replace(/\.[^.]+$/, '.webp');
      converted++;
    }
  }
  await writeFile(DATA, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Compressed ${converted} images to WebP.`);
  await validate();
}

async function cleanExisting() {
  const data = JSON.parse(await readFile(DATA, 'utf8'));
  for (const movement of data) {
    for (const example of movement.examples) {
      let sourceFile = example.title;
      try {
        sourceFile = decodeURIComponent(new URL(example.source).pathname.split('/').pop() || '');
      } catch {
        // Citation sources are allowed to be non-URL identifiers in future source sets.
      }
      example.title = displayTitle(example.title, sourceFile);
      example.alt = text(example.alt);
      example.creator = text(example.creator) || 'Unknown image maker';
      example.institution = text(example.institution) || 'Wikimedia Commons';
    }
  }
  await writeFile(DATA, `${JSON.stringify(data, null, 2)}\n`);
  console.log('Normalized example titles and source metadata.');
  await validate();
}

function toExample(item, info, index) {
  if (item.explicit) {
    return {
      id: `${String(index + 1).padStart(2, '0')}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54)}`,
      title: item.title,
      creator: item.creator,
      year: item.year,
      institution: item.institution,
      source: item.source,
      rights: 'Citation only · reuse status unclear',
      rightsUrl: item.source,
      alt: item.alt,
      image: null,
    };
  }
  const meta = metadata(info);
  const sourceFile = info?.pageTitle || item.file;
  const title = displayTitle(meta.title || item.caption || fileTitle(sourceFile || `Example ${index + 1}`), sourceFile);
  const source = sourceFile
    ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(sourceFile.replace(/ /g, '_'))}`
    : item.articleSource;
  return {
    id: `${String(index + 1).padStart(2, '0')}-${fileTitle(sourceFile || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54)}`,
    title,
    creator: meta.creator,
    year: meta.date,
    institution: meta.institution,
    source: source || item.articleSource,
    rights: meta.reusable ? meta.license : 'Citation only · reuse status unclear',
    rightsUrl: meta.reusable ? meta.licenseUrl || source : item.articleSource,
    alt: item.caption || meta.description || `${title}, an example associated with ${item.movementTitle}`,
    image: null,
  };
}

async function buildMovement(seed) {
  console.log(`${seed.title}`);
  const article = await pageMedia(seed.wiki);
  const infoByTitle = await commonsInfo(article.map((item) => item.file));
  const selected = [];
  const used = new Set();

  for (const item of article) {
    if (selected.length === 6) break;
    if (used.has(item.file)) continue;
    used.add(item.file);
    const info = infoByTitle.get(normalizeFile(item.file));
    selected.push({ ...item, movementTitle: seed.title, info });
  }

  if (selected.length < 6) {
    const search = await commonsSearch(seed.title);
    for (const info of search) {
      if (selected.length === 6) break;
      if (used.has(info.pageTitle)) continue;
      used.add(info.pageTitle);
      selected.push({
        file: info.pageTitle,
        caption: metadata(info).title || metadata(info).description,
        articleSource: `https://en.wikipedia.org/wiki/${seed.wiki}`,
        movementTitle: seed.title,
        info,
      });
    }
  }

  for (const fallback of seed.fallbacks || []) {
    if (selected.length === 6) break;
    selected.push({ ...fallback, explicit: true, movementTitle: seed.title });
  }

  if (selected.length < 6) throw new Error(`${seed.title} yielded only ${selected.length} examples`);

  const examples = [];
  for (let index = 0; index < 6; index++) {
    const item = selected[index];
    const example = toExample(item, item.info, index);
    if (metadata(item.info).reusable) {
      try {
        example.image = await download(item.info, seed.id, index);
      } catch (error) {
        console.warn(`  keeping citation only: ${error.message}`);
      }
    }
    examples.push(example);
  }

  return { ...seed, source: `https://en.wikipedia.org/wiki/${seed.wiki}`, examples };
}

async function validate() {
  const raw = JSON.parse(await readFile(DATA, 'utf8'));
  const errors = [];
  if (!Array.isArray(raw) || raw.length !== 64) errors.push(`expected 64 movements, found ${raw.length}`);
  const movementIds = new Set();
  const exampleIds = new Set();
  for (const movement of raw) {
    if (movementIds.has(movement.id)) errors.push(`duplicate movement id ${movement.id}`);
    movementIds.add(movement.id);
    if (!movement.title || !movement.summary || !movement.region || !movement.era) errors.push(`${movement.id}: missing metadata`);
    if (!Number.isFinite(movement.start) || !Number.isFinite(movement.end) || movement.start > movement.end) {
      errors.push(`${movement.id}: invalid date range`);
    }
    if (!Array.isArray(movement.examples) || movement.examples.length !== 6) {
      errors.push(`${movement.id}: expected six examples`);
      continue;
    }
    for (const example of movement.examples) {
      const key = `${movement.id}:${example.id}`;
      if (exampleIds.has(key)) errors.push(`duplicate example id ${key}`);
      exampleIds.add(key);
      for (const field of ['title', 'creator', 'year', 'institution', 'source', 'rights', 'rightsUrl', 'alt']) {
        if (!example[field]) errors.push(`${key}: missing ${field}`);
      }
      if (example.image) {
        if (/^https?:/i.test(example.image)) errors.push(`${key}: remote runtime image`);
        try {
          await access(join(PROTOTYPE, example.image));
        } catch {
          errors.push(`${key}: missing ${example.image}`);
        }
      }
    }
  }
  if (errors.length) throw new Error(`Art History data failed validation:\n- ${errors.join('\n- ')}`);
  const imageCount = raw.flatMap((movement) => movement.examples).filter((example) => example.image).length;
  console.log(`Validated 64 movements, 384 examples, ${imageCount} local rights-safe images.`);
}

async function main() {
  if (process.argv.includes('--clean-data')) {
    await cleanExisting();
    return;
  }
  if (process.argv.includes('--compress-existing')) {
    await compressExisting();
    return;
  }
  if (process.argv.includes('--validate')) {
    await validate();
    return;
  }
  await mkdir(join(PROTOTYPE, 'data'), { recursive: true });
  await mkdir(IMAGES, { recursive: true });
  const seeds = JSON.parse(await readFile(SEEDS, 'utf8'));
  const movements = [];
  for (const seed of seeds) movements.push(await buildMovement(seed));
  await writeFile(DATA, `${JSON.stringify(movements, null, 2)}\n`);
  await validate();
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
