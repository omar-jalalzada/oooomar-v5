/**
 * The Card Tricks workbench: four layer benches over one card. What each layer *is* lives
 * in its own module (background.js, visuals.js, type.js); this file is the bench around
 * them: the experiment cards,
 * dials, on-card handles, and a reference image to sample colours from.
 *
 * A bench shows the stack up to its own layer — Background alone, Visuals over the ground,
 * Type over both — so each layer is judged in the place it'll actually sit. The composite will
 * import the layer modules, not any of this.
 */
import {
  BG_GROUPS,
  FIELD_DIALS,
  FORMATS,
  MAX_FIELDS,
  PRESETS,
  animatedFields,
  createBackground,
  mergeState,
  presetState,
  rgbToHex,
  snapDial,
} from './background.js';
import {
  ENGINE_GROUPS,
  FIGURES,
  FIGURE_IDS,
  MARKS,
  MARK_IDS,
  VIS_GROUPS,
  applyFigure,
  createVisuals,
  mergeVis,
  snapDial as snapVis,
  visPresetState,
} from './visuals.js';
import { TYPE_GROUPS, createType, mergeType, snapDial as snapType, typePresetState } from './type.js';
import {
  MOTION_GROUPS,
  cardAt,
  createInteraction,
  defaultMotion,
  groundAt,
  linesAt,
  mergeMotion,
  rates,
  snapDial as snapMotion,
  typeAt,
} from './motion.js';

const KEY = 'card-tricks-v13';
const MOTION_KEY = 'card-tricks-v13-motion';
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('aria')) n.setAttribute('aria-' + k.slice(4).toLowerCase(), v);
    else n[k] = v;
  }
  n.append(...kids);
  return n;
};
const SVG = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

// ── state ─────────────────────────────────────────────────────────────────

const LAYER_IDS = ['background', 'visuals', 'type', 'motion'];
const TITLES = { background: '01 Background', visuals: '02 Line work', type: '03 Type', motion: '04 Motion' };

function fresh(id) {
  return { preset: id, layer: 'motion', bg: presetState(id), vis: visPresetState(id), type: typePresetState(id) };
}

function load() {
  const fromUrl = params.get('preset');
  const layer = LAYER_IDS.includes(params.get('layer')) ? params.get('layer') : null;
  if (fromUrl && PRESETS.some((p) => p.id === fromUrl)) return { ...fresh(fromUrl), layer: layer || 'motion' };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.bg && PRESETS.some((p) => p.id === saved.preset)) {
      return {
        preset: saved.preset,
        layer: layer || (LAYER_IDS.includes(saved.layer) ? saved.layer : 'motion'),
        bg: mergeState(presetState(saved.preset), saved.bg),
        vis: mergeVis(visPresetState(saved.preset), saved.vis),
        type: mergeType(typePresetState(saved.preset), saved.type),
      };
    }
  } catch (_) { /* private mode or stale shape */ }
  return { ...fresh(PRESETS[0].id), layer: layer || 'motion' };
}

let state = load();
if (FIGURES[params.get('fig')]) state.vis = applyFigure(state.vis, params.get('fig'));
let sel = Math.min(0, state.bg.fields.length - 1);
let playing = !reduced && params.get('still') !== '1';
let clock = Number(params.get('t') || 0);
let dirty = true;
let showGround = params.get('ground') !== '0';
let showFigure = params.get('figure') !== '0';

// Motion is one set of dials for every card, so it's kept apart from the per-card state.
let motion = (() => {
  try { return mergeMotion(defaultMotion(), JSON.parse(localStorage.getItem(MOTION_KEY) || '{}')); } catch (_) { return defaultMotion(); }
})();
let groundClock = clock;
let linesClock = clock;

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      localStorage.setItem(MOTION_KEY, JSON.stringify(motion));
    } catch (_) { /* private mode */ }
  }, 150);
}

function changed({ layout: relayout = false } = {}) {
  dirty = true;
  if (relayout) layout();
  else renderType();
  drawHandles();
  if (backdrop === 'tint') setBackdrop('tint');
  save();
}

// ── renderers ─────────────────────────────────────────────────────────────

const canvas = $('bg');
const visCanvas = $('vis');
const bgLayer = createBackground(canvas);
const visLayer = createVisuals(visCanvas);
const typeLayer = createType($('type'));
const thumbBg = createBackground(document.createElement('canvas'));
const thumbVis = createVisuals(document.createElement('canvas'));
const dpr = Math.min(2, window.devicePixelRatio || 1);

let view = { w: 0, h: 0, pxScale: 1 };

function layout() {
  const f = FORMATS[state.bg.format.shape];
  const pit = $('pit');
  const refOn = ref.img.naturalWidth > 0 && $('ref').classList.contains('on');
  const availW = pit.clientWidth - 64;
  const availH = pit.clientHeight - 64;
  const refRatio = refOn ? ref.img.naturalWidth / ref.img.naturalHeight : 0;
  const cardRatio = f.w / f.h;
  const gap = refOn ? 24 : 0;
  let h = Math.min(availH, f.h * 1.3);
  if (h * (cardRatio + refRatio) + gap > availW) h = (availW - gap) / (cardRatio + refRatio);
  h = Math.max(120, Math.floor(h));
  const w = Math.round(h * cardRatio);

  const card = $('card');
  card.style.width = w + 'px';
  card.style.height = h + 'px';
  card.style.setProperty('--r', (state.bg.format.corner * w) / f.w + 'px');
  bgLayer.setSize(Math.round(w * dpr), Math.round(h * dpr));
  visLayer.setSize(Math.round(w * dpr), Math.round(h * dpr));
  view = { w, h, pxScale: (w / f.w) * dpr, k: w / f.w };

  const r = $('ref');
  if (refOn) {
    r.style.height = h + 'px';
    r.style.width = Math.round(h * refRatio) + 'px';
  }
  $('handles').setAttribute('viewBox', `0 0 ${w} ${h}`);
  dirty = true;
  renderType();
  drawHandles();
}

function renderType() {
  const on = state.layer === 'type' || state.layer === 'motion';
  $('type').style.display = on ? 'block' : 'none';
  if (!on || !view.w) return;
  const f = FORMATS[state.bg.format.shape];
  typeLayer.render(state.type, f.w, f.h, view.k);
}

function renderThumbs() {
  for (const p of PRESETS) {
    const c = document.querySelector(`canvas[data-thumb='${p.id}']`);
    if (!c) continue;
    const bg = presetState(p.id);
    const vis = visPresetState(p.id);
    const f = FORMATS[bg.format.shape];
    const h = 52;
    const w = Math.round((h * f.w) / f.h);
    const scale = Math.min(1, 44 / w);
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    c.width = cw * dpr;
    c.height = ch * dpr;
    c.style.width = cw + 'px';
    c.style.height = ch + 'px';
    const px = (cw / f.w) * dpr;
    thumbBg.setSize(c.width, c.height);
    thumbBg.render(bg, 0, px);
    thumbVis.setSize(c.width, c.height);
    // Thumbnails are tiny, so the hairlines would vanish — draw them a touch heavier.
    thumbVis.render({ ...vis, stroke: { ...vis.stroke, width: vis.stroke.width * 2.2 } }, 0, px, f.w, f.h);
    const g = c.getContext('2d');
    g.drawImage(thumbBg.canvas, 0, 0);
    g.drawImage(thumbVis.canvas, 0, 0);
  }
}

// ── left panel ────────────────────────────────────────────────────────────

const LAYERS = [
  ['background', '01', 'Background', 'gradients · colour · texture'],
  ['visuals', '02', 'Line work', 'mark × sweep × pin'],
  ['type', '03', 'Type', 'name first · stat · techniques'],
  ['motion', '04', 'Motion', 'hover · depth · reveal'],
  [null, '05', 'Composite', 'the finished card'],
];

function buildLeft() {
  $('layers').replaceChildren(
    ...LAYERS.map(([id, n, name, note]) => {
      const node = el(id ? 'button' : 'div', { className: 'layer', type: id ? 'button' : undefined },
        el('span', { className: 'n', textContent: n }),
        el('div', {}, el('b', { textContent: name }), el('span', { textContent: note })),
        el('span', { className: 'tag', textContent: id ? '' : 'next' }));
      if (id) {
        node.dataset.id = id;
        node.addEventListener('click', () => setLayer(id));
      }
      return node;
    }),
  );

  $('presets').replaceChildren(
    ...PRESETS.map((p) => {
      const b = el('button', { type: 'button', className: 'item' },
        el('span', { className: 'thumb' }, el('canvas', { dataset: { thumb: p.id } })),
        el('div', {}, el('b', { textContent: p.name }), el('span', { textContent: p.note })));
      b.dataset.id = p.id;
      b.addEventListener('click', () => loadPreset(p.id));
      return b;
    }),
  );
  markLeft();
  renderThumbs();
}

function markLeft() {
  for (const b of $('presets').children) b.setAttribute('aria-current', String(b.dataset.id === state.preset));
  for (const b of $('layers').children) {
    if (b.dataset.id) b.setAttribute('aria-current', String(b.dataset.id === state.layer));
  }
}

const HINTS = {
  background: 'drag a dot to move a field · white knobs resize · drop or paste a reference image to sample colours',
  visuals: 'drag on the card to place the figure · scroll to resize · drop a reference to sample line and accent colours',
  type: 'guides show the margin, the hero line and a 4px baseline grid · drop a reference beside the card to compare',
  motion: 'hover the card, or tab to it · Preview: Loop plays hover in and out on its own · motion is shared by every card',
};

function setLayer(id) {
  state.layer = id;
  if (id !== 'motion') clearMotion();
  document.body.dataset.layer = id;
  $('panelTitle').textContent = TITLES[id];
  $('hint').textContent = ref.ctx ? refHint() : HINTS[id];
  markLeft();
  buildDials();
  changed();
}

function loadPreset(id) {
  state = { ...fresh(id), layer: state.layer };
  sel = state.bg.fields.length ? 0 : -1;
  markLeft();
  buildDials();
  changed({ layout: true });
}

// ── right panel ───────────────────────────────────────────────────────────

const openGroups = new Set(['format', 'fields', 'texture', 'figure', 'mark', 'repeat', 'sweep', 'pin', 'place', 'content', 'scale', 'font', 'response', 'card', 'ground', 'lines', 'type']);
let dialSync = [];

function decimals(step) {
  return (String(step).split('.')[1] || '').length;
}

function rangeDial(spec, obj, onChange, snap = snapDial) {
  const id = 'd-' + Math.random().toString(36).slice(2, 8);
  const num = el('input', { type: 'number', id, min: spec.min, max: spec.max, step: spec.step });
  const rng = el('input', { type: 'range', min: spec.min, max: spec.max, step: spec.step, ariaLabel: spec.label });
  const sync = () => {
    const v = obj()[spec.id];
    num.value = Number(v).toFixed(decimals(spec.step));
    rng.value = v;
  };
  const set = (raw) => {
    if (raw === '' || Number.isNaN(Number(raw))) return;
    obj()[spec.id] = snap(spec, raw);
    sync();
    onChange();
  };
  rng.addEventListener('input', () => set(rng.value));
  num.addEventListener('change', () => set(num.value));
  sync();
  const node = el('div', { className: 'dial' },
    el('div', { className: 'top' }, el('label', { htmlFor: id, textContent: spec.label }), num), rng);
  return { node, sync };
}

function choiceDial(spec, obj, onChange) {
  const sw = el('div', { className: spec.options.length > 5 ? 'switch wrap' : 'switch', role: 'group', ariaLabel: spec.label });
  const sync = () => {
    for (const b of sw.children) b.setAttribute('aria-pressed', String(b.dataset.v === obj()[spec.id]));
  };
  for (const [v, label] of spec.options) {
    const b = el('button', { type: 'button', textContent: label });
    b.dataset.v = v;
    b.addEventListener('click', () => {
      obj()[spec.id] = v;
      sync();
      onChange();
    });
    sw.append(b);
  }
  sync();
  const node = el('div', { className: 'dial' }, el('div', { className: 'top' }, el('label', { textContent: spec.label })), sw);
  return { node, sync };
}

function group(id, title, meta, kids) {
  const d = el('details', { className: 'group', open: openGroups.has(id) },
    el('summary', {}, el('span', { textContent: title }), el('span', { className: 'meta', textContent: meta })), ...kids);
  d.addEventListener('toggle', () => (d.open ? openGroups.add(id) : openGroups.delete(id)));
  return d;
}

function colourSwatch(get, set) {
  const input = el('input', { type: 'color', value: get() });
  input.addEventListener('input', () => {
    set(input.value);
    wrap.style.background = input.value;
  });
  input.addEventListener('click', (e) => e.stopPropagation());
  const wrap = el('label', { className: 'swatch' }, input);
  wrap.style.background = get();
  wrap.addEventListener('click', (e) => e.stopPropagation());
  return wrap;
}

function pipette(set) {
  if (!('EyeDropper' in window)) return [];
  const b = el('button', { type: 'button', className: 'mini', textContent: 'pick', title: 'Pick a colour from anywhere on screen' });
  b.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const { sRGBHex } = await new window.EyeDropper().open();
      set(sRGBHex);
    } catch (_) { /* cancelled */ }
  });
  return [b];
}

/** A colour row: swatch, name, hex, eyedropper. */
function colourRow(name, get, set) {
  const hex = el('span', { className: 'hex', textContent: get() });
  return el('div', { className: 'frow' },
    colourSwatch(get, (h) => { set(h); hex.textContent = h; changed(); }),
    el('span', { className: 'name', textContent: name }), hex,
    ...pipette((h) => { set(h); buildDials(); changed(); }));
}

function fieldsGroup() {
  const bg = state.bg;
  const kids = [colourRow('Ground', () => bg.ground, (h) => (bg.ground = h))];

  bg.fields.forEach((f, i) => {
    const hex = el('span', { className: 'hex', textContent: f.color });
    const row = el('div', { className: 'frow', ariaCurrent: String(i === sel) },
      colourSwatch(() => f.color, (h) => { f.color = h; hex.textContent = h; changed(); }),
      el('span', { className: 'name', textContent: `Field ${i + 1}` }), hex);
    row.addEventListener('click', () => select(i));
    kids.push(row);
  });

  const tools = el('div', { className: 'ftools' });
  const btn = (label, fn, disabled = false) => {
    const b = el('button', { type: 'button', className: 'mini', textContent: label, disabled });
    b.addEventListener('click', fn);
    tools.append(b);
  };
  btn('+ field', () => {
    const src = bg.fields[sel] || { color: '#ffffff', x: 0.5, y: 0.5, rx: 0.4, ry: 0.2, opacity: 1, feather: 1 };
    bg.fields.splice(sel + 1, 0, { ...src, x: Math.min(1, src.x + 0.08), y: Math.min(1, src.y + 0.06) });
    sel += 1;
    buildDials();
    changed();
  }, bg.fields.length >= MAX_FIELDS);
  btn('duplicate', () => {
    bg.fields.splice(sel + 1, 0, { ...bg.fields[sel] });
    sel += 1;
    buildDials();
    changed();
  }, sel < 0 || bg.fields.length >= MAX_FIELDS);
  btn('↓ lower', () => move(-1), sel <= 0);
  btn('↑ raise', () => move(1), sel < 0 || sel >= bg.fields.length - 1);
  btn('delete', () => {
    bg.fields.splice(sel, 1);
    sel = Math.min(sel, bg.fields.length - 1);
    buildDials();
    changed();
  }, sel < 0);
  kids.push(tools);

  const f = bg.fields[sel];
  if (f) {
    kids.push(el('p', { className: 'sub', textContent: `Field ${sel + 1} · ${bg.blend.mode === 'layer' ? 'paints over ' + (sel ? 'field ' + sel : 'ground') : 'mixed by weight'}` }));
    kids.push(el('div', { className: 'frow' },
      el('span', { className: 'name', textContent: 'Colour' }),
      ...pipette((hex) => { f.color = hex; buildDials(); changed(); })));
    for (const d of FIELD_DIALS) {
      const dial = rangeDial(d, () => state.bg.fields[sel], () => changed());
      dialSync.push(dial.sync);
      kids.push(dial.node);
    }
  }
  return group('fields', 'Fields', `${bg.fields.length}/${MAX_FIELDS}`, kids);
}

function move(dir) {
  const fs = state.bg.fields;
  const j = sel + dir;
  if (j < 0 || j >= fs.length) return;
  [fs[sel], fs[j]] = [fs[j], fs[sel]];
  sel = j;
  buildDials();
  changed();
}

function select(i) {
  sel = i;
  buildDials();
  drawHandles();
}

function backgroundDials() {
  const groups = [];
  for (const g of BG_GROUPS) {
    const kids = g.dials.map((d) => {
      const obj = () => state.bg[g.id];
      const make = d.kind === 'choice' ? choiceDial : rangeDial;
      const relayout = g.id === 'format';
      const refreshFields = g.id === 'blend' && d.id === 'mode';
      return make(d, obj, () => {
        if (refreshFields) buildDials();
        changed({ layout: relayout });
      }).node;
    });
    groups.push(group(g.id, g.title, '', kids));
    if (g.id === 'format') groups.push(fieldsGroup());
  }
  return groups;
}

function visualDials() {
  const vis = state.vis;
  // Any engine dial takes the figure off its preset — the bench is where new ones are found.
  const edited = () => {
    if (state.vis.figure !== 'custom') {
      state.vis.figure = 'custom';
      figSwitch.sync();
      $('figNote').textContent = 'custom — copy settings to keep it';
    }
    changed();
  };
  const figSwitch = choiceDial(
    { id: 'figure', label: 'Preset', options: FIGURE_IDS.map((id) => [id, FIGURES[id].label]) },
    () => state.vis,
    () => {
      state.vis = applyFigure(state.vis, state.vis.figure);
      buildDials();
      changed();
    },
  );
  const note = el('p', { className: 'sub', id: 'figNote', textContent: FIGURES[vis.figure]?.note || 'custom — copy settings to keep it' });
  const groups = [group('figure', 'Figure', '', [figSwitch.node, note])];

  const markSwitch = choiceDial(
    { id: 'mark', label: 'Mark', options: MARK_IDS.map((id) => [id, MARKS[id].label]) },
    () => state.vis,
    () => { buildDials(); edited(); },
  );
  groups.push(group('mark', 'Mark', MARKS[vis.mark].label.toLowerCase(), [
    markSwitch.node,
    ...MARKS[vis.mark].dials.map((d) => rangeDial(d, () => state.vis.marks[state.vis.mark], edited, snapVis).node),
  ]));

  for (const g of ENGINE_GROUPS) {
    groups.push(group(g.id, g.title, '', g.dials.map((d) => {
      const obj = () => state.vis[g.id];
      return (d.kind === 'choice' ? choiceDial(d, obj, edited) : rangeDial(d, obj, edited, snapVis)).node;
    })));
  }

  for (const g of VIS_GROUPS) {
    const kids = [];
    if (g.id === 'stroke') kids.push(colourRow('Line', () => state.vis.lineColor, (h) => (state.vis.lineColor = h)));
    if (g.id === 'accent') kids.push(colourRow('Dot', () => state.vis.accentColor, (h) => (state.vis.accentColor = h)));
    for (const d of g.dials) {
      const obj = () => state.vis[g.id];
      const dial = d.kind === 'choice' ? choiceDial(d, obj, () => changed()) : rangeDial(d, obj, () => changed(), snapVis);
      if (g.id === 'place') dialSync.push(dial.sync);
      kids.push(dial.node);
    }
    groups.push(group(g.id, g.title, '', kids));
  }
  return groups;
}

function textDial(spec, obj, onChange) {
  const id = 'd-' + Math.random().toString(36).slice(2, 8);
  const input = el('input', { type: 'text', id, value: obj()[spec.id], spellcheck: false });
  input.addEventListener('input', () => {
    obj()[spec.id] = input.value;
    onChange();
  });
  const node = el('div', { className: 'dial' },
    el('div', { className: 'top' }, el('label', { htmlFor: id, textContent: spec.label })), input);
  return { node, sync: () => (input.value = obj()[spec.id]) };
}

function typeDials() {
  const groups = [];
  for (const g of TYPE_GROUPS) {
    const kids = [];
    if (g.id === 'ink') kids.push(colourRow('Ink', () => state.type.inkColor, (h) => (state.type.inkColor = h)));
    for (const d of g.dials) {
      const obj = () => state.type[g.id];
      const make = d.kind === 'choice' ? choiceDial : d.kind === 'text' ? textDial : (sp, o, fn) => rangeDial(sp, o, fn, snapType);
      kids.push(make(d, obj, () => changed()).node);
    }
    groups.push(group(g.id, g.title, '', kids));
  }
  // Content first: the words are what you change most while judging the hierarchy.
  const i = groups.findIndex((n) => n.querySelector('summary span').textContent === 'Content');
  groups.unshift(...groups.splice(i, 1));
  return groups;
}

function motionDials() {
  return MOTION_GROUPS.map((g) => group(g.id, g.title, g.id === 'response' ? 'all cards' : '', g.dials.map((d) => {
    const obj = () => motion[g.id];
    return (d.kind === 'choice' ? choiceDial(d, obj, () => changed()) : rangeDial(d, obj, () => changed(), snapMotion)).node;
  })));
}

const BENCHES = { background: backgroundDials, visuals: visualDials, type: typeDials, motion: motionDials };

function buildDials() {
  const root = $('dials');
  const scroll = root.scrollTop;
  dialSync = [];
  root.replaceChildren(...BENCHES[state.layer]());
  root.scrollTop = scroll;
}

// ── handles ───────────────────────────────────────────────────────────────

const handles = $('handles');

function drawHandles() {
  const { w, h } = view;
  const nodes = [];
  if (state.layer === 'background') {
    // Handles sit where each field is *now*; a drag still edits the rest pose by the same delta.
    const fields = animatedFields(state.bg, clock);
    fields.forEach((f, i) => {
      nodes.push(svg('ellipse', { cx: f.x * w, cy: f.y * h, rx: f.rx * w, ry: f.ry * h, class: i === sel ? 'sel' : '' }));
    });
    fields.forEach((f, i) => {
      nodes.push(svg('circle', { cx: f.x * w, cy: f.y * h, r: i === sel ? 7 : 6, fill: f.color, class: 'dot' + (i === sel ? ' sel' : ''), 'data-i': i, 'data-kind': 'move' }));
    });
    const f = fields[sel];
    if (f) {
      nodes.push(svg('rect', { x: (f.x + f.rx) * w - 4, y: f.y * h - 4, width: 8, height: 8, rx: 2, class: 'knob', 'data-i': sel, 'data-kind': 'rx' }));
      nodes.push(svg('rect', { x: f.x * w - 4, y: (f.y + f.ry) * h - 4, width: 8, height: 8, rx: 2, class: 'knob', 'data-i': sel, 'data-kind': 'ry' }));
    }
  } else if (state.layer === 'type') {
    const k = view.k;
    const l = state.type.layout;
    for (let y = 4; y < h / k; y += 4) {
      nodes.push(svg('line', { x1: 0, x2: w, y1: y * k, y2: y * k, class: y % 16 ? 'grid' : 'grid major' }));
    }
    nodes.push(svg('rect', { x: l.pad * k, y: l.pad * k, width: w - 2 * l.pad * k, height: h - 2 * l.pad * k, class: 'margin' }));
    if (l.titleAt === 'top') nodes.push(svg('line', { x1: 0, x2: w, y1: l.titleTop * k, y2: l.titleTop * k, class: 'rule' }));
    nodes.push(svg('line', { x1: l.pad * k + l.titleWidth * k, x2: l.pad * k + l.titleWidth * k, y1: 0, y2: h, class: 'rule' }));
    nodes.push(svg('line', { x1: 0, x2: w, y1: h - l.footer * k, y2: h - l.footer * k, class: 'rule' }));
  } else {
    const p = state.vis.place;
    const half = (p.size * w) / 2;
    nodes.push(svg('rect', { x: 0, y: 0, width: w, height: h, class: 'catch', 'data-kind': 'place' }));
    nodes.push(svg('rect', { x: p.x * w - half, y: p.y * h - half, width: half * 2, height: half * 2, class: 'box' }));
    nodes.push(svg('path', { d: `M${p.x * w - 6} ${p.y * h}h12M${p.x * w} ${p.y * h - 6}v12`, class: 'cross' }));
  }
  handles.replaceChildren(...nodes);
}

let drag = null;

handles.addEventListener('pointerdown', (e) => {
  const t = e.target.closest('[data-kind]');
  if (!t) return;
  e.preventDefault();
  if (t.dataset.kind === 'place') {
    drag = { kind: 'place', x0: e.clientX, y0: e.clientY, p0: { ...state.vis.place } };
  } else {
    const i = Number(t.dataset.i);
    if (i !== sel) select(i);
    drag = { i, kind: t.dataset.kind, x0: e.clientX, y0: e.clientY, f0: { ...state.bg.fields[i] } };
  }
  handles.setPointerCapture(e.pointerId);
});

const placeSpec = Object.fromEntries(VIS_GROUPS.find((g) => g.id === 'place').dials.map((d) => [d.id, d]));
const fieldSpec = Object.fromEntries(FIELD_DIALS.map((d) => [d.id, d]));

handles.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = (e.clientX - drag.x0) / view.w;
  const dy = (e.clientY - drag.y0) / view.h;
  if (drag.kind === 'place') {
    const p = state.vis.place;
    p.x = snapVis(placeSpec.x, drag.p0.x + dx);
    p.y = snapVis(placeSpec.y, drag.p0.y + dy);
  } else {
    const f = state.bg.fields[drag.i];
    if (drag.kind === 'move') {
      f.x = snapDial(fieldSpec.x, drag.f0.x + dx);
      f.y = snapDial(fieldSpec.y, drag.f0.y + dy);
    } else if (drag.kind === 'rx') {
      f.rx = snapDial(fieldSpec.rx, drag.f0.rx + dx);
    } else {
      f.ry = snapDial(fieldSpec.ry, drag.f0.ry + dy);
    }
  }
  dialSync.forEach((s) => s());
  changed();
});

const endDrag = () => { drag = null; };
handles.addEventListener('pointerup', endDrag);
handles.addEventListener('pointercancel', endDrag);

handles.addEventListener('wheel', (e) => {
  if (state.layer !== 'visuals') return;
  e.preventDefault();
  const p = state.vis.place;
  p.size = snapVis(placeSpec.size, p.size * Math.exp(-e.deltaY * 0.002));
  dialSync.forEach((s) => s());
  changed();
}, { passive: false });

// ── reference image ───────────────────────────────────────────────────────

const ref = { img: $('ref').querySelector('img'), ctx: null };

const REF_HINTS = {
  background: 'click the reference to sample into the selected field · alt-click samples the ground',
  visuals: 'click the reference to sample the line colour · alt-click samples the accent dot',
  type: 'click the reference to sample the ink colour',
};
const refHint = () => REF_HINTS[state.layer];

function setReference(src) {
  ref.img.onload = () => {
    const c = document.createElement('canvas');
    c.width = ref.img.naturalWidth;
    c.height = ref.img.naturalHeight;
    ref.ctx = c.getContext('2d', { willReadFrequently: true });
    ref.ctx.drawImage(ref.img, 0, 0);
    $('ref').classList.add('on');
    $('hint').textContent = refHint();
    layout();
  };
  ref.img.src = src;
}

function clearReference() {
  $('ref').classList.remove('on');
  ref.img.removeAttribute('src');
  ref.ctx = null;
  $('hint').textContent = HINTS[state.layer];
  layout();
}

$('ref').querySelector('button').addEventListener('click', clearReference);

ref.img.addEventListener('click', (e) => {
  if (!ref.ctx) return;
  const r = ref.img.getBoundingClientRect();
  const x = Math.round(((e.clientX - r.left) / r.width) * ref.img.naturalWidth);
  const y = Math.round(((e.clientY - r.top) / r.height) * ref.img.naturalHeight);
  const R = state.layer === 'visuals' ? 1 : 3;
  const d = ref.ctx.getImageData(Math.max(0, x - R), Math.max(0, y - R), R * 2 + 1, R * 2 + 1).data;
  const sum = [0, 0, 0];
  for (let k = 0; k < d.length; k += 4) for (let c = 0; c < 3; c++) sum[c] += d[k + c];
  const n = d.length / 4;
  const hex = rgbToHex(sum.map((s) => s / n / 255));
  if (state.layer === 'type') {
    state.type.inkColor = hex;
  } else if (state.layer === 'visuals') {
    if (e.altKey) state.vis.accentColor = hex;
    else state.vis.lineColor = hex;
  } else if (e.altKey || sel < 0) state.bg.ground = hex;
  else state.bg.fields[sel].color = hex;
  buildDials();
  changed();
});

function imageFrom(list) {
  for (const item of list || []) {
    const file = item.getAsFile ? item.getAsFile() : item;
    if (file && file.type.startsWith('image/')) return file;
  }
  return null;
}

let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
  dragDepth += 1;
  document.body.classList.add('dragging');
});
window.addEventListener('dragleave', () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) document.body.classList.remove('dragging');
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const file = imageFrom(e.dataTransfer?.files);
  if (file) setReference(URL.createObjectURL(file));
});
window.addEventListener('paste', (e) => {
  const file = imageFrom(e.clipboardData?.items);
  if (file) {
    e.preventDefault();
    setReference(URL.createObjectURL(file));
  }
});

// ── bar + actions ─────────────────────────────────────────────────────────

function setPlaying(on) {
  playing = on;
  $('playBtn').textContent = on ? 'Pause' : 'Play';
  document.body.classList.toggle('paused', !on);
}

$('playBtn').addEventListener('click', () => setPlaying(!playing));

function setHandles(on) {
  document.body.classList.toggle('no-handles', !on);
  $('handlesBtn').setAttribute('aria-pressed', String(on));
}
$('handlesBtn').addEventListener('click', () => setHandles(document.body.classList.contains('no-handles')));

function setGround(on) {
  showGround = on;
  $('groundBtn').setAttribute('aria-pressed', String(on));
  document.body.classList.toggle('no-ground', !on);
  dirty = true;
}
$('groundBtn').addEventListener('click', () => setGround(!showGround));

function setFigure(on) {
  showFigure = on;
  $('figureBtn').setAttribute('aria-pressed', String(on));
  dirty = true;
}
$('figureBtn').addEventListener('click', () => setFigure(!showFigure));

let backdrop = 'page';
function setBackdrop(v) {
  backdrop = v;
  const stage = $('stage');
  stage.dataset.backdrop = v;
  stage.style.setProperty('--backdrop', v === 'tint' ? `color-mix(in oklab, ${state.bg.ground} 28%, #ffffff)` : '');
  for (const b of $('backdrop').children) b.setAttribute('aria-pressed', String(b.dataset.v === v));
}
for (const b of $('backdrop').children) b.addEventListener('click', () => setBackdrop(b.dataset.v));

$('resetBtn').addEventListener('click', () => {
  if (state.layer === 'background') {
    state.bg = presetState(state.preset);
    sel = state.bg.fields.length ? 0 : -1;
  } else if (state.layer === 'visuals') {
    state.vis = visPresetState(state.preset);
  } else if (state.layer === 'type') {
    state.type = typePresetState(state.preset);
  } else {
    motion = defaultMotion();
  }
  buildDials();
  changed({ layout: true });
});

$('copyBtn').addEventListener('click', async () => {
  const text = JSON.stringify({ background: state.bg, visuals: state.vis, type: state.type, motion }[state.layer], null, 2);
  try {
    await navigator.clipboard.writeText(text);
    flash($('copyBtn'), 'Copied');
  } catch (_) {
    console.log(text);
    flash($('copyBtn'), 'See console');
  }
});

$('pasteBtn').addEventListener('click', async () => {
  try {
    const over = JSON.parse(await navigator.clipboard.readText());
    if (state.layer === 'background') {
      state.bg = mergeState(state.bg, over);
      sel = state.bg.fields.length ? 0 : -1;
    } else if (state.layer === 'visuals') {
      state.vis = mergeVis(state.vis, over);
    } else if (state.layer === 'type') {
      state.type = mergeType(state.type, over);
    } else {
      motion = mergeMotion(motion, over);
    }
    buildDials();
    changed({ layout: true });
    flash($('pasteBtn'), 'Pasted');
  } catch (_) {
    flash($('pasteBtn'), 'Not JSON');
  }
});

function flash(b, text) {
  const was = b.textContent;
  b.textContent = text;
  setTimeout(() => (b.textContent = was), 1100);
}

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if (e.code === 'Space') {
    e.preventDefault();
    setPlaying(!playing);
  } else if (e.key === 'h') {
    setHandles(document.body.classList.contains('no-handles'));
  } else if (e.key === 'g') {
    setGround(!showGround);
  } else if (e.key === '1') {
    setLayer('background');
  } else if (e.key === '2') {
    setLayer('visuals');
  } else if (e.key === '3') {
    setLayer('type');
  } else if (e.key === '4') {
    setLayer('motion');
  } else if (e.key === 'f') {
    setFigure(!showFigure);
  }
});

// ── loop ──────────────────────────────────────────────────────────────────

let last = performance.now();
let fpsAcc = 0;
let fpsN = 0;
let fps = 0;

// ── motion ────────────────────────────────────────────────────────────────

const interaction = createInteraction($('card'));
const depth = reduced ? 0 : 1;
let motionApplied = false;

/** One frame of the full stack, read through the interaction. */
function renderMotion(f) {
  const s = interaction.state;
  bgLayer.render(groundAt(state.bg, motion, s, f.w, f.h, depth), groundClock, view.pxScale);
  visLayer.render(linesAt(state.vis, motion, s, f.w, f.h, depth), linesClock, view.pxScale, f.w, f.h);
  const root = $('type');
  for (const [k, v] of Object.entries(typeAt(motion, s, depth))) root.style.setProperty(k, v);
  const c = cardAt(motion, s, depth);
  $('card').style.transform = c.transform;
  $('card').style.boxShadow = c.shadow;
  motionApplied = true;
}

/** Leaving the motion bench puts the card back exactly as the other benches expect it. */
function clearMotion() {
  if (!motionApplied) return;
  const root = $('type');
  for (const k of Object.keys(typeAt(motion, interaction.state))) root.style.removeProperty(k);
  $('card').style.transform = '';
  $('card').style.boxShadow = '';
  motionApplied = false;
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (playing) {
    clock += dt;
    dirty = true;
    fpsAcc += dt;
    fpsN += 1;
    if (fpsAcc > 0.5) {
      fps = Math.round(fpsN / fpsAcc);
      fpsAcc = 0;
      fpsN = 0;
    }
  }
  const onMotion = state.layer === 'motion';
  if (onMotion) {
    const s = interaction.update(dt, motion);
    const r = rates(motion, s);
    if (playing) {
      groundClock += dt * r.ground;
      linesClock += dt * r.lines;
    }
    dirty = true;
  }
  if (dirty) {
    const f = FORMATS[state.bg.format.shape];
    const stacked = state.layer !== 'background';
    const figure = state.layer === 'visuals' || onMotion || (state.layer === 'type' && showFigure);
    canvas.style.visibility = !stacked || showGround ? 'visible' : 'hidden';
    if (onMotion) {
      renderMotion(f);
    } else {
      bgLayer.render(state.bg, clock, view.pxScale);
      if (figure) visLayer.render(state.vis, clock, view.pxScale, f.w, f.h);
    }
    visCanvas.style.display = figure ? 'block' : 'none';
    if (playing && state.layer === 'background') drawHandles();
    const what = {
      background: `${state.bg.fields.length} fields`,
      visuals: (FIGURES[state.vis.figure]?.label || 'custom').toLowerCase(),
      type: state.type.font.family,
      motion: `hover ${interaction.state.h.toFixed(2)}`,
    }[state.layer];
    $('readout').textContent = `${f.w}×${f.h} · ${what} · ${clock.toFixed(1)}s${playing ? ' · ' + fps + 'fps' : ''}`;
    dirty = false;
  }
  requestAnimationFrame(frame);
}

if (params.get('bare') === '1') document.body.classList.add('bare');
if (params.get('handles') === '0') setHandles(false);
if (params.get('hover') === '1') {
  motion.response.preview = 'held';
  interaction.snap(1, Number(params.get('px') ?? 0.5), Number(params.get('py') ?? -0.3));
}
setPlaying(playing);
setGround(showGround);
setFigure(showFigure);
buildLeft();
setLayer(state.layer);
layout();
new ResizeObserver(layout).observe($('pit'));
requestAnimationFrame(frame);
