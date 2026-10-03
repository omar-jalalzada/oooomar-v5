// The timeline: builds the DOM from layout.js's geometry and drives it from the scroll position.
//
// One number runs everything: `now`, the timeline-local y of the red line, eased toward the
// scroll target every frame. A bar's drawn length is how far `now` has travelled into it, so a
// movement grows exactly as long as time has passed in it. Everything else (people, heads,
// influence curves, turning points) switches on as `now` crosses its y, and back off going up.

import { layout, FIRST, LAST, shortName } from './layout.js';

const NOW = 0.62;                       // the now line, as a fraction of viewport height
const REGION_KEY = 'design-history-v1-region';
const EASE = 0.11;                      // seconds for `now` to close ~63% of the gap

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const dpr = () => window.devicePixelRatio || 1;
const HW = () => (dpr() >= 2 ? 0.5 : 1);
/** Snap a hairline's centre onto a device pixel, whatever the ratio. */
const hair = (v) => (Math.floor(v * dpr()) + 0.5) / dpr();
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const span = (a, b, ongoing) => (ongoing ? `${a} to now` : a === b ? `${a}` : `${a} to ${b}`);
const SVG = 'http://www.w3.org/2000/svg';

const data = await (await fetch('./data.json')).json();
await Promise.all(['450 12px "Inter Tight"', '640 12px "Inter Tight"'].map((f) => document.fonts.load(f)));

const mById = new Map(data.movements.map((m) => [m.id, m]));
const fById = new Map(data.figures.map((f) => [f.id, f]));
const lineage = new Map(data.lineages.map((l, i) => [l.id, { ...l, i }]));
const regionName = new Map(data.regions.map((r) => [r.id, r.name]));
const childrenOf = new Map(data.movements.map((m) => [m.id, []]));
for (const m of data.movements) for (const p of m.influences) childrenOf.get(p)?.push(m.id);
const figuresOf = new Map(data.movements.map((m) => [m.id, []]));
for (const f of data.figures) for (const id of f.movements) figuresOf.get(id)?.push(f.id);
const color = (lineageId) => `var(--${lineageId})`;

const BLURB = {
  ornament: 'Victorian print to Art Nouveau. Craft, nature, the decorated page.',
  'avant-garde': 'Futurism to Constructivism. Type as provocation, the page as a machine.',
  modernism: 'Bauhaus to Swiss Style. Grids, sans serifs, objective clarity.',
  commerce: 'The poster to the corporate identity. The idea that sells.',
  expression: 'Psychedelia to grunge. Rules broken on purpose.',
  screen: 'The desktop to AI. Interfaces, systems, the pixel.',
};

const tl = document.getElementById('tl');
const colhead = document.getElementById('colhead');
const nowEl = document.getElementById('now');
const nowYear = document.getElementById('nowYear');
const nowCount = document.getElementById('nowCount');
const mini = document.getElementById('mini');
const panel = document.getElementById('panel');

// ---------- the hero's score: every movement as a bar on a linear year axis, one band per lineage,
// interval-packed into lanes. Each bar's draw is delayed to the moment the sweep line reaches its
// start, so the sweep's duration and easing here have to match the CSS one.
{
  const YEARS = LAST - FIRST;
  const SWEEP = 2200;
  // the sweep's cubic-bezier(0.45, 0, 0.25, 1): bisect for the curve parameter at which its
  // position reaches the year, then read the time off the same parameter
  const bez = (p1, p2, s) => 3 * p1 * s * (1 - s) ** 2 + 3 * p2 * s * s * (1 - s) + s ** 3;
  const at = (year) => {
    const p = (year - FIRST) / YEARS;
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; bez(0, 1, m) < p ? (lo = m) : (hi = m); }
    return Math.round(bez(0.45, 0.25, lo) * SWEEP);
  };
  const pct = (y) => `${(((y - FIRST) / YEARS) * 100).toFixed(3)}%`;
  const bands = data.lineages.map((l, i) => {
    const lanes = [];
    const bars = data.movements
      .filter((m) => m.lineage === l.id)
      .sort((a, b) => a.start - b.start)
      .map((m) => {
        const start = Math.max(m.start, FIRST);
        const end = m.ongoing ? LAST : Math.max(m.end ?? start, start + 1);
        let lane = lanes.findIndex((e) => e + 2 <= start);
        if (lane < 0) lane = lanes.push(0) - 1;
        lanes[lane] = end;
        return `<button class="sb" data-k="m:${m.id}" aria-label="${esc(m.name)}, ${span(m.start, m.end, m.ongoing)}"
          style="--x:${pct(start)};--w:${(((end - start) / YEARS) * 100).toFixed(3)}%;--l:${lane};--d:${at(start)}ms"></button>`;
      })
      .join('');
    return `<div class="band" style="--c:${color(l.id)};--r:${i + 1}"><div class="bl"><b>${esc(l.name)}</b><span>${esc(BLURB[l.id])}</span></div>
      <div class="lanes" style="--lanes:${lanes.length}">${bars}</div></div>`;
  });
  const ticks = [];
  for (let y = 1900; y < LAST; y += 25) ticks.push(`<i class="tick" style="--x:${pct(y)}"><span>${y}</span></i>`);
  document.getElementById('score').innerHTML = `${bands.join('')}
    <div class="axis" aria-hidden="true">${ticks.join('')}<span class="end a">${FIRST}</span><span class="end b">${LAST}</span></div>
    <div class="sweep" aria-hidden="true"></div>`;
  const major = data.events.filter((e) => e.major).length;
  document.getElementById('heroCount').innerHTML =
    `${data.movements.length} movements<span>${data.figures.length} designers, ${major} turning points</span>`;
}

const ctx = document.createElement('canvas').getContext('2d');
const measure = (text, font) => {
  ctx.font = font;
  return ctx.measureText(text).width;
};

let region = localStorage.getItem(REGION_KEY) || 'europe';
let L;                       // current layout
let tlTop = 0;               // page y of the timeline's top
let target = -1e4, now = -1e4, last = 0, raf = 0;
let reveal = [];             // [{ y, el }] sorted by y
let revealIdx = 0;
let barEls = [];             // [{ el, y0, len, p }]
let registry = new Map();    // 'm:id' | 'f:id' | 'i:a>b' -> elements
let lit = [];
let pinned = null;
let miniWin, miniMark, miniCanvas;

function reg(key, el) {
  if (!registry.has(key)) registry.set(key, []);
  registry.get(key).push(el);
}

function svg(tag, attrs, parent) {
  const n = document.createElementNS(SVG, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent?.appendChild(n);
  return n;
}

function div(cls, style, parent, html) {
  const n = document.createElement('div');
  if (cls) n.className = cls;
  if (style) Object.assign(n.style, style);
  if (html != null) n.innerHTML = html;
  parent?.appendChild(n);
  return n;
}

// ---------- build
function render() {
  const width = document.documentElement.clientWidth;
  L = layout(data, { width, height: innerHeight, region, measure });
  const { K, axisX, total } = L;
  const right = width - K.right;
  registry = new Map();
  lit = [];
  reveal = [];
  barEls = [];
  tl.textContent = '';
  tl.style.height = `${total + innerHeight * (1 - NOW) + 40}px`;
  document.documentElement.style.setProperty('--pad-l', `${L.small ? 16 : 24}px`);

  // column heads
  colhead.textContent = '';
  if (L.small) {
    const bar = div('regions', null, colhead);
    for (const r of data.regions) {
      const b = document.createElement('button');
      b.textContent = r.name;
      b.setAttribute('aria-pressed', String(r.id === region));
      b.onclick = () => setRegion(r.id);
      bar.appendChild(b);
    }
    requestAnimationFrame(() => bar.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
  } else {
    div('axis-label', { left: '16px' }, colhead, 'Year');
    for (const c of L.cols) {
      div('col', { left: `${c.x}px` }, colhead, `${esc(c.region.name)}<span>${c.movements.length}</span>`);
    }
  }

  // grid: decade rules and column rules
  const grid = div('grid layer', null, tl);
  for (let y = FIRST; y <= LAST; y += 10) {
    div('', { left: `${axisX}px`, width: `${right - axisX}px`, top: `${hair(L.yOf(y))}px` }, grid);
  }
  if (!L.small) {
    for (const c of L.cols.slice(1)) {
      div('vcol', { left: `${hair(c.x - K.colGap / 2)}px`, top: '0px', height: `${total}px` }, grid);
    }
  }

  // axis
  const ax = svg('svg', { class: 'axis layer', width: K.gutter, height: total }, tl);
  const sw = HW();
  svg('line', { x1: hair(axisX), x2: hair(axisX), y1: 0, y2: total, stroke: '#111', 'stroke-width': sw }, ax);
  for (let y = FIRST; y <= LAST; y++) {
    const yy = hair(L.yOf(y));
    const decade = y % 10 === 0;
    const five = y % 5 === 0;
    const len = decade ? 12 : five ? 6 : 3;
    const g = svg('g', decade && y % 50 === 0 ? { class: 'major' } : {}, ax);
    svg('line', { x1: axisX - len, x2: axisX, y1: yy, y2: yy, stroke: decade ? '#111' : '#a3a3a3', 'stroke-width': sw }, g);
    if (decade) {
      const t = svg('text', { x: L.small ? 8 : 16, y: yy + 4 }, g);
      t.textContent = y;
    }
  }

  // links: leaders under everything else, influence curves under the leaders
  const links = svg('svg', { class: 'links layer', width, height: total }, tl);
  const inflG = svg('g', {}, links);
  const leadG = svg('g', {}, links);

  // bars
  const barsLayer = div('layer', null, tl);
  for (const b of L.bars) {
    const track = div(`track${b.m.ongoing ? ' ongoing' : ''}`, { left: `${b.x}px`, top: `${b.y0}px`, width: `${b.w}px`, height: `${b.y1 - b.y0}px` }, barsLayer);
    track.style.setProperty('--c', color(b.m.lineage));
    reg(`m:${b.m.id}`, track);
  }
  for (const b of L.bars) {
    const el = div(`bar${b.m.ongoing ? ' ongoing' : ''}`, {
      left: `${b.x}px`, top: `${b.y0}px`, width: `${b.w}px`, height: `${b.y1 - b.y0}px`,
    }, barsLayer);
    el.style.setProperty('--c', color(b.m.lineage));
    el.dataset.k = `m:${b.m.id}`;
    el.title = b.m.name;
    reg(`m:${b.m.id}`, el);
    barEls.push({ el, y0: b.y0, len: b.y1 - b.y0, p: -1 });
  }

  // influence curves: parent bar to child head
  for (const inf of L.influences) {
    const { x0, y0, x1, y1 } = inf;
    const my = (y0 + y1) / 2;
    const p = svg('path', { class: 'infl', d: `M${x0},${y0} C${x0},${my} ${x1},${my} ${x1},${y1}` }, inflG);
    p.style.setProperty('--c', color(inf.to.m.lineage));
    const key = `i:${inf.from.m.id}>${inf.to.m.id}`;
    reg(key, p);
    reveal.push({ y: y1, el: p, len: true });
  }

  // movement heads
  const stream = div('layer', null, tl);
  for (const h of L.headers) {
    const m = mById.get(h.id);
    const c = h.col;
    const b = document.createElement('button');
    b.className = 'item head';
    Object.assign(b.style, { left: `${c.streamX}px`, top: `${h.y}px`, width: `${c.streamW}px`, fontSize: `${K.head.size}px`, lineHeight: `${K.head.line}px` });
    b.style.setProperty('--c', color(m.lineage));
    b.innerHTML = h.lines.map((l) => `<span class="l">${esc(l)}</span>`).join('') +
      `<span class="meta" style="font-size:${K.meta.size}px;line-height:${K.meta.line}px">${span(m.start, m.end, m.ongoing)}</span>`;
    b.dataset.k = `m:${m.id}`;
    stream.appendChild(b);
    reg(`m:${m.id}`, b);
    reveal.push({ y: h.bar.y0, el: b });

    const ly = hair(h.y + h.anchor);
    const lead = svg('path', { class: 'lead', d: `M${h.bar.x + h.bar.w},${hair(h.bar.y0)} H${c.streamX - 7} L${c.streamX - 3},${ly}`, 'stroke-width': sw }, leadG);
    reg(`m:${m.id}`, lead);
    reveal.push({ y: h.bar.y0, el: lead });
  }

  // people: circle on the bar, name in the stream
  const dots = div('layer', null, tl);
  for (const it of L.figures) {
    const f = it.f;
    const c = it.col;
    const lc = color(it.m.lineage);
    const dot = div('dot', { left: `${it.cx}px`, top: `${it.cy}px` }, dots);
    dot.style.setProperty('--c', lc);
    dot.dataset.k = `f:${f.id}`;
    dot.title = f.name;
    reg(`f:${f.id}`, dot);

    const b = document.createElement('button');
    b.className = 'item fig';
    Object.assign(b.style, { left: `${c.streamX + 2}px`, top: `${it.y}px`, fontSize: `${K.name.size}px`, lineHeight: `${K.name.line}px`, fontWeight: K.name.weight });
    b.style.setProperty('--c', lc);
    b.innerHTML = it.lines.map((l) => `<span class="l">${esc(l)}</span>`).join('');
    b.dataset.k = `f:${f.id}`;
    stream.appendChild(b);
    reg(`f:${f.id}`, b);

    const ly = hair(it.y + it.anchor);
    const lead = svg('path', { class: 'lead', d: `M${it.cx + 5},${hair(it.cy)} H${c.streamX - 6} L${c.streamX - 1},${ly}`, 'stroke-width': sw }, leadG);
    reg(`f:${f.id}`, lead);
    for (const el of [dot, b, lead]) reveal.push({ y: it.cy, el });
  }

  // turning points
  const evLayer = div('layer', null, tl);
  for (const ev of L.events) {
    const d = div(`ev-dot${ev.e.major ? ' major' : ''}`, { left: `${hair(axisX)}px`, top: `${ev.y}px` }, evLayer);
    d.dataset.label = `${ev.e.year}  ${ev.e.label}`;
    reveal.push({ y: ev.y, el: d });
    if (ev.e.major && !L.small) {
      const line = div('ev-line', { left: `${axisX}px`, width: `${right - axisX}px`, top: `${hair(ev.y)}px` }, evLayer);
      reveal.push({ y: ev.y, el: line });
    }
  }
  for (const n of L.notes) {
    const note = div('ev-note', { left: `${n.x - n.w}px`, top: `${n.y}px`, width: `${n.w}px` }, evLayer,
      n.lines.map((l, i) => `<span class="l">${i === 0 ? `<span class="yr">${n.e.year}</span>` : ''}${esc(l)}</span>`).join(''));
    reveal.push({ y: n.e.year === LAST ? n.y : L.yOf(n.e.year + 0.5), el: note });
  }
  for (const it of L.stream) {
    const c = it.col;
    const e = div('ev-item', { left: `${c.streamX}px`, top: `${it.y}px`, width: `${c.streamW}px` }, evLayer,
      `<span class="tnum">${it.e.year}</span> ${esc(it.e.label)}`);
    reveal.push({ y: L.yOf(it.e.year + 0.5), el: e });
  }

  // influence curves need their length for the draw-in
  for (const r of reveal) if (r.len) r.el.style.setProperty('--len', r.el.getTotalLength().toFixed(1));

  reveal.sort((a, b) => a.y - b.y);
  revealIdx = 0;

  // the now line spans from the axis to the rail
  nowEl.querySelector('.line').style.cssText = `left:${axisX}px;width:${right - axisX}px`;
  nowEl.querySelector('.read').style.left = `${L.small ? 6 : 16}px`;

  buildMini();
  measureTop();
  now = target;
  for (const b of barEls) b.p = -1;
  update(true);
}

function measureTop() {
  tlTop = tl.getBoundingClientRect().top + scrollY;
  nowEl.style.top = `${Math.round(innerHeight * NOW)}px`;
}

// ---------- minimap: the whole span at once, one hairline per movement by lineage
function buildMini() {
  mini.querySelectorAll('.lab').forEach((n) => n.remove());
  miniCanvas = mini.querySelector('canvas');
  miniWin = mini.querySelector('.win');
  miniMark = mini.querySelector('.mark');
  mini.hidden = L.small;
  if (L.small) return;
  const r = mini.getBoundingClientRect();
  const H = r.height, W = r.width;
  miniCanvas.width = Math.round(W * dpr());
  miniCanvas.height = Math.round(H * dpr());
  const g = miniCanvas.getContext('2d');
  g.scale(dpr(), dpr());
  const sy = H / L.total;
  const css = getComputedStyle(document.documentElement);
  g.fillStyle = '#111';
  g.fillRect(Math.floor(W / 2), 0, 1 / dpr(), H);
  for (const ev of L.events.filter((v) => v.e.major)) {
    g.fillStyle = '#a3a3a3';
    g.fillRect(0, Math.round(ev.y * sy * dpr()) / dpr(), W, 1 / dpr());
  }
  const n = data.lineages.length;
  for (const b of L.bars) {
    const li = lineage.get(b.m.lineage).i;
    g.fillStyle = css.getPropertyValue(`--${b.m.lineage}`).trim();
    const x = 2 + (li * (W - 4)) / n + ((b.col.laneOf.get(b.m.id) % 3) * 1.4);
    g.fillRect(x, b.y0 * sy, 1.5, Math.max(1, (b.y1 - b.y0) * sy));
  }
  for (const y of [1850, 1900, 1950, 2000]) {
    div('lab', { top: `${L.yOf(y) * sy}px` }, mini, String(y));
  }
}

function scrubTo(clientY) {
  const r = mini.getBoundingClientRect();
  const t = Math.min(Math.max((clientY - r.top) / r.height, 0), 1);
  window.scrollTo({ top: tlTop + t * L.total - innerHeight * NOW, behavior: 'instant' });
}

mini.addEventListener('pointerdown', (e) => {
  mini.setPointerCapture(e.pointerId);
  scrubTo(e.clientY);
});
mini.addEventListener('pointermove', (e) => {
  if (mini.hasPointerCapture(e.pointerId)) scrubTo(e.clientY);
});
mini.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

// ---------- the loop
function readTarget() {
  target = scrollY + innerHeight * NOW - tlTop;
}

function kick() {
  readTarget();
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
}

function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.1);
  last = t;
  const gap = target - now;
  if (reduce.matches || Math.abs(gap) < 0.3) now = target;
  else now += gap * (1 - Math.exp(-dt / EASE));
  update(false);
  raf = now === target ? 0 : requestAnimationFrame(frame);
}

function update(force) {
  // with reduced motion everything is drawn; the line and readout still track the scroll
  const at = reduce.matches ? Infinity : now;

  for (const b of barEls) {
    const p = Math.min(Math.max((at - b.y0) / b.len, 0), 1);
    if (!force && Math.abs(p - b.p) < 0.0005) continue;
    b.p = p;
    b.el.style.transform = `scaleY(${p})`;
  }
  while (revealIdx < reveal.length && reveal[revealIdx].y <= at) reveal[revealIdx++].el.classList.add('on');
  while (revealIdx > 0 && reveal[revealIdx - 1].y > at) reveal[--revealIdx].el.classList.remove('on');

  const yr = Math.min(Math.floor(L.yearAt(target)), LAST);
  const live = target > -innerHeight * 0.15;
  nowEl.classList.toggle('live', live);
  mini.classList.toggle('live', live || scrollY > innerHeight * 0.3);
  if (nowYear.textContent !== String(yr)) {
    nowYear.textContent = yr;
    const active = data.movements.filter((m) => m.start <= yr && m.end >= yr).length;
    const turn = data.events.filter((e) => e.major && e.year <= yr).at(-1);
    nowCount.innerHTML = `<b>${active}</b> movements under way` + (turn ? `<br>Last turning point: ${esc(turn.label)}` : '');
  }

  if (!L.small && miniWin) {
    const H = mini.clientHeight;
    const sy = H / L.total;
    const top = scrollY - tlTop;
    miniWin.style.top = `${Math.max(0, top * sy)}px`;
    miniWin.style.height = `${Math.max(6, innerHeight * sy)}px`;
    miniMark.style.top = `${Math.min(Math.max(target, 0), L.total) * sy}px`;
  }
}

addEventListener('scroll', kick, { passive: true });

// ---------- focus: what does this touch?
function keysFor(k) {
  const [kind, id] = [k.slice(0, 1), k.slice(2)];
  const keys = new Set([k]);
  if (kind === 'm') {
    const m = mById.get(id);
    for (const p of m.influences) { keys.add(`m:${p}`); keys.add(`i:${p}>${id}`); }
    for (const c of childrenOf.get(id)) { keys.add(`m:${c}`); keys.add(`i:${id}>${c}`); }
    for (const f of figuresOf.get(id)) keys.add(`f:${f}`);
  } else if (kind === 'f') {
    const f = fById.get(id);
    for (const mid of f.movements) keys.add(`m:${mid}`);
    for (const a of f.movements) for (const b of f.movements) keys.add(`i:${a}>${b}`);
  }
  return keys;
}

// a person's working life, drawn beside the bar they sit on while they're in focus
let stem = null;
function showStem(id) {
  stem?.remove();
  stem = null;
  const it = id && L.figures.find((f) => f.id === id);
  if (!it) return;
  const { activeFrom: a, activeTo: b } = it.f;
  const y0 = L.yOf(a), y1 = L.yOf(b + 1);
  stem = div('stem', { left: `${it.bar.x - 5}px`, top: `${y0}px`, height: `${y1 - y0}px` }, tl,
    `<span class="a">${a}</span><span class="b">${b}</span>`);
}

function focus(k) {
  for (const el of lit) el.classList.remove('lit', 'self');
  lit = [];
  document.body.classList.toggle('focus', !!k);
  showStem(k?.[0] === 'f' ? k.slice(2) : null);
  if (!k) return;
  for (const key of keysFor(k)) {
    for (const el of registry.get(key) ?? []) {
      el.classList.add('lit');
      if (key === k && el.classList.contains('item')) el.classList.add('self');
      lit.push(el);
    }
  }
}

let hoverTimer = 0;
tl.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse' || pinned) return;
  const t = e.target.closest('[data-k]');
  clearTimeout(hoverTimer);
  if (t) focus(t.dataset.k);
  else hoverTimer = setTimeout(() => !pinned && focus(null), 90);
});
tl.addEventListener('pointerleave', () => !pinned && focus(null));
tl.addEventListener('click', (e) => {
  const t = e.target.closest('[data-k]');
  if (t) open(t.dataset.k);
  else close();
});
addEventListener('keydown', (e) => e.key === 'Escape' && close());

// ---------- panel
function chips(keys) {
  return `<div class="chips">${keys.map((k) => {
    const id = k.slice(2);
    if (k[0] === 'm') { const m = mById.get(id); return `<button data-k="${k}" style="--c:${color(m.lineage)}"><i></i>${esc(m.name)}</button>`; }
    const f = fById.get(id); return `<button data-k="${k}">${esc(shortName(f.name))}</button>`;
  }).join('')}</div>`;
}

function principles(list) {
  return `<ol class="pr">${list.map((p) => `<li><div><b>${esc(p.name)}</b><p>${esc(p.idea)}</p>${p.example ? `<em>${esc(p.example)}</em>` : ''}</div></li>`).join('')}</ol>`;
}

function works(list) {
  return `<ul class="works">${[...list].sort((a, b) => (a.year ?? 0) - (b.year ?? 0)).map((w) => {
    const by = w.figure && fById.get(w.figure) ? ` <span class="by">· ${esc(shortName(fById.get(w.figure).name))}</span>` : '';
    return `<li><span class="y">${w.year ?? ''}</span><span>${esc(w.title)}${by}</span></li>`;
  }).join('')}</ul>`;
}

// ---------- work images
const entryOf = (k) => (k[0] === 'm' ? mById.get(k.slice(2)) : fById.get(k.slice(2)));
const workLine = (im) => `${esc(im.title)}${im.year ? `, ${im.year}` : ''}`;

/** The credit a reused image owes: its author and licence, or the fair-use basis it's shown under. */
function credit(im) {
  if (im.fairUse) return 'Fair use, via Wikipedia';
  const lic = im.license || 'Wikimedia Commons';
  return im.credit && !/^public domain$/i.test(lic) ? `${esc(im.credit)} · ${esc(lic)}` : esc(lic);
}

function gallery(entry, isMovement) {
  if (!entry.images?.length) return '';
  return `<h3>Work</h3><div class="works-grid">${entry.images.map((im) => {
    const by = isMovement && im.figure && fById.get(im.figure) ? `<span class="by">${esc(shortName(fById.get(im.figure).name))}</span>` : '';
    return `<figure><a href="${esc(im.source)}" target="_blank" rel="noopener" title="Source and licence">
      <img src="${im.src}" width="${im.w}" height="${im.h}" alt="${esc(im.title)}" loading="lazy" decoding="async" onload="this.classList.add('ok')"></a>
      <figcaption><span class="t">${workLine(im)}</span>${by}<span class="cr">${credit(im)}</span></figcaption></figure>`;
  }).join('')}</div>`;
}

// the hover card: the entry's work laid out as one justified row, sized from the manifest's
// dimensions so it can be placed before a single image has loaded
const preview = div('preview', null, document.body);
preview.setAttribute('aria-hidden', 'true');
let previewKey = null;
let previewHide = 0;

function showPreview(k, target) {
  clearTimeout(previewHide);
  const entry = entryOf(k);
  const imgs = (entry?.images ?? []).slice(0, 3);
  if (!imgs.length) return hidePreview();
  if (previewKey !== k) {
    previewKey = k;
    // a wordmark is ten times wider than it's tall and would flatten the whole row, so each
    // cell's proportion is clamped and the work sits whole inside it
    const MAXW = 420, GAP = 4;
    const ratio = (im) => Math.min(Math.max(im.w / im.h, 0.7), 1.5);
    let H = imgs.length === 1 ? 220 : 150;
    const total = imgs.reduce((s, im) => s + ratio(im) * H, 0) + GAP * (imgs.length - 1);
    if (total > MAXW) H *= (MAXW - GAP * (imgs.length - 1)) / (total - GAP * (imgs.length - 1));
    const name = k[0] === 'm' ? entry.name : shortName(entry.name);
    preview.innerHTML = `<div class="row">${imgs.map((im) =>
      `<img src="${im.src}" alt="" style="width:${Math.round(ratio(im) * H)}px;height:${Math.round(H)}px" onload="this.classList.add('ok')">`).join('')}</div>
      <div class="cap"><b>${esc(name)}</b><span>${imgs.map(workLine).join(' · ')}</span></div>`;
    preview.style.setProperty('--c', color(k[0] === 'm' ? entry.lineage : mById.get(entry.movements[0]).lineage));
  }
  const r = target.getBoundingClientRect();
  const w = preview.offsetWidth, h = preview.offsetHeight;
  let x = r.right + 16;
  if (x + w > innerWidth - 56) x = r.left - 16 - w;
  if (x < 8) x = Math.min(innerWidth - w - 8, r.left);
  const head = colhead.getBoundingClientRect();
  const headH = head.top <= 1 ? head.bottom : 0;
  const y = Math.min(Math.max(r.top + r.height / 2 - h / 2, headH + 8), innerHeight - h - 8);
  preview.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  preview.classList.add('on');
}

function hidePreview() {
  clearTimeout(previewHide);
  previewHide = setTimeout(() => {
    preview.classList.remove('on');
    previewKey = null;
  }, 80);
}

tl.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const t = e.target.closest('[data-k]');
  if (t && !t.matches('.item:not(.on), .dot:not(.on)')) showPreview(t.dataset.k, t);
  else hidePreview();
});
tl.addEventListener('pointerleave', hidePreview);

const score = document.getElementById('score');
score.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const t = e.target.closest('.sb');
  t ? showPreview(t.dataset.k, t) : hidePreview();
});
score.addEventListener('pointerleave', hidePreview);
score.addEventListener('click', (e) => {
  const t = e.target.closest('.sb');
  if (t) open(t.dataset.k);
});
addEventListener('scroll', () => preview.classList.contains('on') && hidePreview(), { passive: true });

const GOOGLE_G = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
</svg>`;

/** The panel title with a Google search beside it, the name quoted so a common word can't drift. */
function title(name) {
  const q = `"${name.replace(/\s*\(.*\)\s*/g, ' ').trim()}" graphic design`;
  return `<div class="title"><h2>${esc(name)}</h2>
    <a class="search" href="https://www.google.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener"
      title="Search Google for ${esc(q)}" aria-label="Search Google for ${esc(name)}">
      ${GOOGLE_G}</a></div>`;
}

function open(k) {
  hidePreview();
  pinned = k;
  focus(k);
  const id = k.slice(2);
  let html = `<button class="close" data-close>Close</button>`;
  if (k[0] === 'm') {
    const m = mById.get(id);
    const lin = lineage.get(m.lineage);
    panel.style.setProperty('--c', color(m.lineage));
    html += `<div class="tag"><i></i>${esc(lin.name)} · ${esc(regionName.get(m.region))}</div>
      ${title(m.name)}
      ${m.aka?.length ? `<div class="aka">Also ${esc(m.aka.join(', '))}</div>` : ''}
      <div class="span">${span(m.start, m.end, m.ongoing)}${m.places?.length ? ` · ${esc(m.places.join(', '))}` : ''}</div>
      <p class="sum">${esc(m.summary)}</p>
      ${gallery(m, true)}
      <h3>Principles</h3>${principles(m.principles)}
      ${m.keyWorks?.length ? `<h3>Key works</h3>${works(m.keyWorks)}` : ''}
      ${figuresOf.get(id).length ? `<h3>People</h3>${chips(figuresOf.get(id).map((f) => `f:${f}`))}` : ''}
      ${m.influences.length ? `<h3>Came from</h3>${chips(m.influences.filter((p) => mById.has(p)).map((p) => `m:${p}`))}` : ''}
      ${childrenOf.get(id).length ? `<h3>Led to</h3>${chips(childrenOf.get(id).map((c) => `m:${c}`))}` : ''}`;
  } else {
    const f = fById.get(id);
    const m = mById.get(f.movements[0]);
    panel.style.setProperty('--c', color(m.lineage));
    const life = f.born ? (f.died ? `${f.born} to ${f.died}` : `Born ${f.born}`) : `Active from ${f.activeFrom}`;
    html += `<div class="tag"><i></i>${esc(f.role ?? '')}</div>
      ${title(f.name)}
      <div class="span">${life}${f.nationality ? ` · ${esc(f.nationality)}` : ''}</div>
      <p class="sum">${esc(f.summary)}</p>
      ${gallery(f, false)}
      <h3>Principles</h3>${principles(f.principles)}
      ${f.keyWorks?.length ? `<h3>Key works</h3>${works(f.keyWorks)}` : ''}
      <h3>Part of</h3>${chips(f.movements.filter((x) => mById.has(x)).map((x) => `m:${x}`))}`;
  }
  panel.innerHTML = html;
  panel.scrollTop = 0;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
}

function close() {
  pinned = null;
  focus(null);
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

panel.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return close();
  const t = e.target.closest('[data-k]');
  if (!t) return;
  const k = t.dataset.k;
  const id = k.slice(2);
  // a person or movement in another region: on a phone, switch to its column first
  if (L.small) {
    const reg2 = k[0] === 'm' ? mById.get(id).region : mById.get(fById.get(id).movements[0]).region;
    const shown = L.figures.some((f) => f.id === id) || L.bars.some((b) => b.m.id === id);
    if (!shown && reg2 !== region) setRegion(reg2);
  }
  open(k);
  const y = k[0] === 'm' ? L.barOf.get(id)?.y0 : L.figures.find((f) => f.id === id)?.cy;
  if (y != null) window.scrollTo({ top: tlTop + y - innerHeight * 0.45, behavior: reduce.matches ? 'instant' : 'smooth' });
});

// ---------- region (phones) and resize
function setRegion(id) {
  const yr = L.yearAt(target);
  region = id;
  localStorage.setItem(REGION_KEY, id);
  render();
  window.scrollTo({ top: tlTop + L.yOf(yr) - innerHeight * NOW, behavior: 'instant' });
  kick();
}

let lastW = document.documentElement.clientWidth;
let resizeTimer = 0;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const w = document.documentElement.clientWidth;
    measureTop();
    if (w === lastW) { buildMini(); kick(); return; }
    lastW = w;
    const yr = L.yearAt(target);
    render();
    if (target > 0) window.scrollTo({ top: tlTop + L.yOf(yr) - innerHeight * NOW, behavior: 'instant' });
    kick();
  }, 150);
});

render();
readTarget();
now = target;
update(true);

// deep links: ?year=1960 scrolls straight to a year, ?open=m:swiss-style opens an entry
const params = new URLSearchParams(location.search);
const jump = params.get('year');
if (jump) {
  window.scrollTo({ top: tlTop + L.yOf(+jump) - innerHeight * NOW, behavior: 'instant' });
  readTarget();
  now = target;
  update(true);
}
const openKey = params.get('open');
if (openKey && (mById.has(openKey.slice(2)) || fById.has(openKey.slice(2)))) open(openKey);
