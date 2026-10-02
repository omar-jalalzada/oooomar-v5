const ERA_ORDER = [
  {
    id: 'origins',
    title: 'Origins',
    start: -40000,
    end: -500,
    note: 'The scale opens wide here. Surviving objects are fragments of much longer living traditions.',
  },
  {
    id: 'antiquity',
    title: 'Antiquity',
    start: -1600,
    end: 600,
    note: 'Cities, courts, trade routes, and ritual centers made images durable carriers of authority and memory.',
  },
  {
    id: 'sacred-courts',
    title: 'Sacred worlds and courts',
    start: 300,
    end: 1900,
    note: 'Sacred practice and court patronage supported long, overlapping visual systems across regions.',
  },
  {
    id: 'early-modern',
    title: 'Early modern worlds',
    start: 1200,
    end: 1900,
    note: 'Workshops, print, maritime exchange, and expanding empires moved forms between distant centers.',
  },
  {
    id: 'revolutions',
    title: 'Revolutions of seeing',
    start: 1750,
    end: 1920,
    note: 'Industrial life, political upheaval, photography, and new publics changed what art could picture.',
  },
  {
    id: 'modern',
    title: 'Modernisms',
    start: 1900,
    end: 1975,
    note: 'Many modernisms developed at once. The familiar European sequence is only one lane through them.',
  },
  {
    id: 'postwar',
    title: 'After the war',
    start: 1940,
    end: 2000,
    note: 'Matter, action, media, site, identity, and language each became material for art.',
  },
  {
    id: 'contemporary',
    title: 'Contemporary currents',
    start: 1960,
    end: 2026,
    note: 'Public space, networks, code, and renewed Indigenous practice unsettle any single center.',
  },
];

const REGION_ORDER = [
  'Global',
  'Africa',
  'Americas',
  'West Asia',
  'South Asia',
  'Southeast Asia',
  'East Asia',
  'Oceania',
  'Europe',
];

const REGION_COLORS = {
  Global: 'var(--global)',
  Africa: 'var(--africa)',
  Americas: 'var(--americas)',
  'East Asia': 'var(--east-asia)',
  Europe: 'var(--europe)',
  Oceania: 'var(--oceania)',
  'South Asia': 'var(--south-asia)',
  'Southeast Asia': 'var(--southeast-asia)',
  'West Asia': 'var(--west-asia)',
};

const timeline = document.querySelector('#timeline');
const regionFilters = document.querySelector('#region-filters');
const eraNav = document.querySelector('#era-nav');
const search = document.querySelector('#search');
const resultCount = document.querySelector('#result-count');
const viewer = document.querySelector('#viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerNoImage = document.querySelector('#viewer-no-image');
const viewerTitle = document.querySelector('#viewer-title');
const viewerPosition = document.querySelector('#viewer-position');
const viewerMeta = document.querySelector('#viewer-meta');
const viewerSource = document.querySelector('#viewer-source');
const viewerRights = document.querySelector('#viewer-rights');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let movements = [];
let activeRegion = 'All';
let openMovementId = null;
let viewerMovement = null;
let viewerIndex = 0;

const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function formatYear(year) {
  if (year < 0) return `${Math.abs(year).toLocaleString()} BCE`;
  if (year === 2026) return 'present';
  return `${year.toLocaleString()} CE`;
}

function formatRange(start, end) {
  return `${formatYear(start)} – ${formatYear(end)}`;
}

function positionFor(movement, era) {
  const span = era.end - era.start;
  const left = ((Math.max(era.start, Math.min(era.end, movement.start)) - era.start) / span) * 100;
  const rightDate = Math.max(movement.start, Math.min(era.end, movement.end));
  const rawWidth = ((rightDate - Math.max(era.start, movement.start)) / span) * 100;
  return {
    left: Math.max(0, Math.min(94, left)),
    width: Math.max(10.5, Math.min(38, rawWidth || 10.5)),
  };
}

function layoutEra(items, era) {
  const placements = new Map();
  const bands = [];
  let top = 44;

  for (const region of REGION_ORDER) {
    const regional = items
      .filter((movement) => movement.region === region)
      .map((movement) => ({ movement, ...positionFor(movement, era) }))
      .sort((a, b) => a.left - b.left || b.width - a.width);
    if (!regional.length) continue;

    const rowEnds = [];
    for (const item of regional) {
      let row = rowEnds.findIndex((right) => item.left >= right + 0.75);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = Math.min(100, item.left + item.width);
      placements.set(item.movement.id, { ...item, top: top + 30 + row * 86 });
    }

    const height = 30 + rowEnds.length * 86 + 8;
    bands.push({ region, top, height });
    top += height;
  }

  return { placements, bands, height: top };
}

function renderFilters() {
  const regions = ['All', ...REGION_ORDER.filter((region) => movements.some((movement) => movement.region === region))];
  regionFilters.innerHTML = regions
    .map(
      (region) =>
        `<button type="button" data-region="${esc(region)}" aria-pressed="${region === activeRegion}">${esc(region)}</button>`,
    )
    .join('');
  regionFilters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-region]');
    if (!button) return;
    activeRegion = button.dataset.region;
    for (const item of regionFilters.querySelectorAll('button')) {
      item.setAttribute('aria-pressed', String(item === button));
    }
    applyFilters();
  });
}

function renderEraNav() {
  eraNav.innerHTML = ERA_ORDER.map(
    (era, index) => `<a href="#era-${era.id}" aria-label="Jump to ${esc(era.title)}">${String(index + 1).padStart(2, '0')}</a>`,
  ).join('');
}

function renderTimeline() {
  timeline.innerHTML = ERA_ORDER.map((era, eraIndex) => {
    const items = movements.filter((movement) => movement.era === era.id).sort((a, b) => a.start - b.start);
    const layout = layoutEra(items, era);
    const ticks = Array.from({ length: 5 }, (_, index) =>
      Math.round(era.start + ((era.end - era.start) * index) / 4),
    );
    const lanes = layout.bands
      .map(
        (band) =>
          `<div class="lane" style="--lane-top:${band.top}px;--lane-height:${band.height}px"><span>${esc(band.region)}</span></div>`,
      )
      .join('');
    const cards = items
      .map((movement) => {
        const place = layout.placements.get(movement.id);
        const searchText = [
          movement.title,
          movement.region,
          movement.summary,
          ...movement.examples.map((example) => example.title),
        ]
          .join(' ')
          .toLowerCase();
        return `
          <button
            class="movement"
            type="button"
            data-movement="${esc(movement.id)}"
            data-region="${esc(movement.region)}"
            data-search="${esc(searchText)}"
            aria-expanded="false"
            aria-controls="panel-${esc(era.id)}"
            style="--left:${place.left}%;--width:${place.width}%;--top:${place.top}px;--region-color:${REGION_COLORS[movement.region]}"
          >
            <span class="movement__date">${esc(formatRange(movement.start, movement.end))}</span>
            <span class="movement__title">${esc(movement.title)}</span>
          </button>
        `;
      })
      .join('');

    return `
      <section class="era" id="era-${esc(era.id)}" aria-labelledby="heading-${esc(era.id)}">
        <header class="era__heading">
          <p class="era__index">Chapter ${String(eraIndex + 1).padStart(2, '0')} · ${items.length} entries</p>
          <h2 id="heading-${esc(era.id)}">${esc(era.title)}</h2>
          <p>${esc(era.note)}</p>
        </header>
        <div class="era__viewport" tabindex="0" aria-label="${esc(era.title)} timeline, scroll horizontally">
          <div class="era__canvas" style="--canvas-height:${layout.height}px">
            <div class="era__axis" aria-hidden="true">
              ${ticks.map((tick) => `<span>${esc(formatYear(tick))}</span>`).join('')}
            </div>
            ${lanes}
            <div class="movement-layer">${cards}</div>
          </div>
        </div>
        <div id="panel-${esc(era.id)}" class="movement-panel" hidden></div>
      </section>
    `;
  }).join('');

  timeline.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-movement]');
    if (button) openMovement(button.dataset.movement);
  });
}

function exampleMarkup(example, index, movement) {
  const caption = `
    <span class="example__caption">
      <span class="example__number">${String(index + 1).padStart(2, '0')}</span>
      <span class="example__title">${esc(example.title)}</span>
      <span class="example__rights">${esc(example.image ? example.rights : 'Citation only')}</span>
    </span>
  `;
  if (example.image) {
    return `
      <li class="example" style="--region-color:${REGION_COLORS[movement.region]}">
        <button type="button" data-example="${index}" aria-label="View ${esc(example.title)}">
          <span class="example__image"><img src="./${esc(example.image)}" alt="${esc(example.alt)}" loading="lazy" /></span>
          ${caption}
        </button>
      </li>
    `;
  }
  return `
    <li class="example" style="--region-color:${REGION_COLORS[movement.region]}">
      <a href="${esc(example.source)}" target="_blank" rel="noreferrer" aria-label="Open source record for ${esc(example.title)}">
        <span class="example__citation">Image not reproduced</span>
        ${caption}
      </a>
    </li>
  `;
}

function openMovement(id) {
  const movement = movements.find((item) => item.id === id);
  if (!movement) return;
  const era = ERA_ORDER.find((item) => item.id === movement.era);
  const panel = document.querySelector(`#panel-${era.id}`);
  const wasOpen = openMovementId === id;

  for (const button of document.querySelectorAll('.movement[aria-expanded="true"]')) {
    button.setAttribute('aria-expanded', 'false');
  }
  for (const item of document.querySelectorAll('.movement-panel')) item.hidden = true;

  if (wasOpen) {
    openMovementId = null;
    return;
  }

  openMovementId = id;
  document.querySelector(`[data-movement="${CSS.escape(id)}"]`)?.setAttribute('aria-expanded', 'true');
  panel.style.setProperty('--region-color', REGION_COLORS[movement.region]);
  panel.innerHTML = `
    <div class="movement-panel__head">
      <div>
        <p class="movement-panel__kicker">${esc(movement.region)} · six examples</p>
        <h3>${esc(movement.title)}</h3>
        <p class="movement-panel__date">${esc(formatRange(movement.start, movement.end))}</p>
      </div>
      <div>
        <p class="movement-panel__summary">${esc(movement.summary)}</p>
        <a class="movement-panel__source" href="${esc(movement.source)}" target="_blank" rel="noreferrer">
          Read the source overview
        </a>
      </div>
    </div>
    <ol class="examples">${movement.examples.map((example, index) => exampleMarkup(example, index, movement)).join('')}</ol>
  `;
  panel.hidden = false;
  panel.querySelector('.examples')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-example]');
    if (button) openViewer(movement, Number(button.dataset.example));
  });
  if (innerWidth <= 720) {
    panel.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }
}

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  for (const button of document.querySelectorAll('.movement')) {
    const regionMatch = activeRegion === 'All' || button.dataset.region === activeRegion;
    const searchMatch = !query || button.dataset.search.includes(query);
    button.hidden = !(regionMatch && searchMatch);
    if (!button.hidden) count++;
  }
  resultCount.textContent = `${count} of ${movements.length} movements and traditions shown`;
  if (openMovementId) {
    const current = document.querySelector(`[data-movement="${CSS.escape(openMovementId)}"]`);
    if (current?.hidden) {
      document.querySelector(`#panel-${movements.find((item) => item.id === openMovementId)?.era}`)?.setAttribute('hidden', '');
      openMovementId = null;
    }
  }
}

function renderViewer() {
  const example = viewerMovement.examples[viewerIndex];
  viewerPosition.textContent = `${viewerMovement.title} · ${String(viewerIndex + 1).padStart(2, '0')} of 06`;
  viewerTitle.textContent = example.title;
  viewerImage.hidden = !example.image;
  viewerNoImage.hidden = Boolean(example.image);
  if (example.image) {
    viewerImage.src = `./${example.image}`;
    viewerImage.alt = example.alt;
  } else {
    viewerImage.removeAttribute('src');
    viewerImage.alt = '';
  }
  viewerMeta.innerHTML = [
    ['Image credit', example.creator],
    ['Date', example.year],
    ['Collection', example.institution],
    ['Reuse', example.rights],
  ]
    .map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
    .join('');
  viewerSource.href = example.source;
  viewerRights.href = example.rightsUrl;
}

function openViewer(movement, index) {
  viewerMovement = movement;
  viewerIndex = index;
  renderViewer();
  viewer.showModal();
}

function stepViewer(amount) {
  if (!viewerMovement) return;
  viewerIndex = (viewerIndex + amount + viewerMovement.examples.length) % viewerMovement.examples.length;
  renderViewer();
}

viewer.querySelector('.viewer__close').addEventListener('click', () => viewer.close());
viewer.querySelector('.viewer__step--previous').addEventListener('click', () => stepViewer(-1));
viewer.querySelector('.viewer__step--next').addEventListener('click', () => stepViewer(1));
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) viewer.close();
});
viewer.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') stepViewer(-1);
  if (event.key === 'ArrowRight') stepViewer(1);
});

search.addEventListener('input', applyFilters);

async function init() {
  try {
    const response = await fetch('./data/movements.json');
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    movements = await response.json();
    renderFilters();
    renderEraNav();
    renderTimeline();
    applyFilters();
  } catch (error) {
    timeline.innerHTML = `<p class="load-error">The timeline data could not be loaded. ${esc(error.message)}</p>`;
  }
}

init();
