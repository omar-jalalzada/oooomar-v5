const ERA_ORDER = [
  {
    id: 'origins',
    title: 'Origins',
    start: -40000,
    end: -1501,
    note: 'The scale opens wide here. Surviving objects are fragments of much longer living traditions.',
  },
  {
    id: 'antiquity',
    title: 'Antiquity',
    start: -1500,
    end: 599,
    note: 'Cities, courts, trade routes, and ritual centers made images durable carriers of authority and memory.',
  },
  {
    id: 'sacred-courts',
    title: 'Sacred worlds and courts',
    start: 600,
    end: 1399,
    note: 'Sacred practice and court patronage supported long, overlapping visual systems across regions.',
  },
  {
    id: 'early-modern',
    title: 'Early modern worlds',
    start: 1400,
    end: 1749,
    note: 'Workshops, print, maritime exchange, and expanding empires moved forms between distant centers.',
  },
  {
    id: 'revolutions',
    title: 'Revolutions of seeing',
    start: 1750,
    end: 1899,
    note: 'Industrial life, political upheaval, photography, and new publics changed what art could picture.',
  },
  {
    id: 'modern',
    title: 'Modernisms',
    start: 1900,
    end: 1939,
    note: 'Many modernisms developed at once. The familiar European sequence is only one lane through them.',
  },
  {
    id: 'postwar',
    title: 'After the war',
    start: 1940,
    end: 1979,
    note: 'Matter, action, media, site, identity, and language each became material for art.',
  },
  {
    id: 'contemporary',
    title: 'Contemporary currents',
    start: 1980,
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
const regionLegendItems = document.querySelector('#region-legend-items');
const movementDialog = document.querySelector('#movement-dialog');
const movementDialogContent = document.querySelector('#movement-modal-content');
const viewer = document.querySelector('#viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerNoImage = document.querySelector('#viewer-no-image');
const viewerTitle = document.querySelector('#viewer-title');
const viewerPosition = document.querySelector('#viewer-position');
const viewerMeta = document.querySelector('#viewer-meta');
const viewerSource = document.querySelector('#viewer-source');
const viewerRights = document.querySelector('#viewer-rights');

let movements = [];
let activeRegion = 'All';
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

function formatRange(start, end, ongoing = false) {
  return `${formatYear(start)} – ${ongoing ? 'present' : formatYear(end)}`;
}

function layoutContinuousTimeline(items) {
  let offset = 0;
  const segments = ERA_ORDER.map((era) => {
    const count = items.filter((movement) => movement.start <= era.end && movement.end >= era.start).length;
    const height = Math.max(700, Math.min(1120, count * 72));
    const segment = { ...era, top: offset, height };
    offset += height;
    return segment;
  });
  const totalHeight = offset;
  const yFor = (year) => {
    const segment =
      segments.find((item) => year >= item.start && year <= item.end) ||
      (year < segments[0].start ? segments[0] : segments[segments.length - 1]);
    const clamped = Math.max(segment.start, Math.min(segment.end, year));
    return segment.top + ((clamped - segment.start) / (segment.end - segment.start)) * segment.height;
  };

  const placements = new Map();
  const laneEnds = [];
  const intervals = items
    .map((movement) => {
      const top = yFor(movement.start);
      const naturalHeight = yFor(movement.end) - top;
      const height = Math.max(70, naturalHeight);
      return { movement, top: Math.min(totalHeight - Math.min(height, totalHeight), top), height };
    })
    .sort((a, b) => a.top - b.top || b.height - a.height);

  for (const item of intervals) {
    let lane = laneEnds.findIndex((end) => item.top >= end + 8);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.top + item.height;
    placements.set(item.movement.id, { top: item.top, height: item.height, lane });
  }

  for (const placement of placements.values()) {
    placement.left = (placement.lane / laneEnds.length) * 100;
    placement.width = (1 / laneEnds.length) * 100;
  }

  return { placements, segments, totalHeight, yFor };
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

function renderLegend() {
  regionLegendItems.innerHTML = REGION_ORDER.map(
    (region) => `
      <span class="legend-item" style="--region-color:${REGION_COLORS[region]}">
        <i aria-hidden="true"></i>${esc(region)}
      </span>
    `,
  ).join('');
}

function renderTimeline() {
  const layout = layoutContinuousTimeline(movements);
  const chapterBands = layout.segments
    .map(
      (segment, index) => `
        <div
          class="chapter-band"
          id="era-${esc(segment.id)}"
          style="--chapter-top:${segment.top}px;--chapter-height:${segment.height}px"
        >
          <div>
            <p>Chapter ${String(index + 1).padStart(2, '0')}</p>
            <h2>${esc(segment.title)}</h2>
            <p>${esc(formatRange(segment.start, segment.end))}</p>
          </div>
        </div>
      `,
    )
    .join('');
  const ticks = layout.segments.flatMap((segment, segmentIndex) =>
    Array.from({ length: 5 }, (_, index) => {
      if (segmentIndex > 0 && index === 0) return null;
      const year = Math.round(segment.start + ((segment.end - segment.start) * index) / 4);
      return { year, top: layout.yFor(year) };
    }).filter(Boolean),
  );
  ticks.push({ year: ERA_ORDER.at(-1).end, top: layout.totalHeight });
  const tickMarks = ticks
    .map(
      (tick) => `
        <span class="time-tick" style="--tick-top:${tick.top}px">
          <span>${esc(formatYear(tick.year))}</span>
        </span>
      `,
    )
    .join('');
  const cards = movements
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
          style="--region-color:${REGION_COLORS[movement.region]};--card-top:${place.top}px;--card-height:${place.height}px;--card-left:${place.left}%;--card-width:${place.width}%"
        >
          <span class="movement__date">${esc(formatRange(movement.start, movement.end, movement.ongoing))}</span>
          <span class="movement__body">
            <span class="movement__title">${esc(movement.title)}</span>
            <span class="movement__region">${esc(movement.region)}</span>
          </span>
        </button>
      `;
    })
    .join('');

  timeline.innerHTML = `
    <section class="continuous-timeline" aria-label="Continuous art history timeline">
      <aside class="chapter-rail">${chapterBands}</aside>
      <div class="era__chart-scroll" tabindex="0" aria-label="Parallel movement tracks from 40,000 BCE to the present">
        <div class="era__chart" style="--plot-height:${layout.totalHeight}px">
          <div class="era__time-axis" aria-hidden="true">${tickMarks}</div>
          <div class="era__plot">${cards}</div>
        </div>
      </div>
    </section>
  `;

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
  movementDialog.style.setProperty('--region-color', REGION_COLORS[movement.region]);
  movementDialogContent.innerHTML = `
    <p class="movement-modal__geography"><i aria-hidden="true"></i>${esc(movement.region)}</p>
    <div class="movement-modal__head">
      <div>
        <p class="movement-modal__kicker">Six examples</p>
        <h2 id="movement-modal-title">${esc(movement.title)}</h2>
        <p class="movement-modal__date">${esc(formatRange(movement.start, movement.end, movement.ongoing))}</p>
      </div>
      <div>
        <p class="movement-modal__summary">${esc(movement.summary)}</p>
        <a class="movement-modal__source" href="${esc(movement.source)}" target="_blank" rel="noreferrer">
          Read the source overview
        </a>
      </div>
    </div>
    <ol class="examples">${movement.examples.map((example, index) => exampleMarkup(example, index, movement)).join('')}</ol>
  `;
  movementDialogContent.querySelector('.examples')?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-example]');
    if (button) openViewer(movement, Number(button.dataset.example));
  });
  movementDialog.showModal();
}

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  const visibleIds = new Set();
  for (const button of document.querySelectorAll('.movement')) {
    const regionMatch = activeRegion === 'All' || button.dataset.region === activeRegion;
    const searchMatch = !query || button.dataset.search.includes(query);
    button.hidden = !(regionMatch && searchMatch);
    if (!button.hidden) visibleIds.add(button.dataset.movement);
  }
  resultCount.textContent = `${visibleIds.size} of ${movements.length} movements and traditions shown`;
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
movementDialog.querySelector('.movement-modal__close').addEventListener('click', () => movementDialog.close());
movementDialog.addEventListener('click', (event) => {
  if (event.target === movementDialog) movementDialog.close();
});

search.addEventListener('input', applyFilters);

async function init() {
  try {
    const response = await fetch('./data/movements.json');
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    movements = await response.json();
    renderFilters();
    renderEraNav();
    renderLegend();
    renderTimeline();
    applyFilters();
  } catch (error) {
    timeline.innerHTML = `<p class="load-error">The timeline data could not be loaded. ${esc(error.message)}</p>`;
  }
}

init();
