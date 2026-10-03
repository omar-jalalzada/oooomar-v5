/**
 * The workbench around layer 1. Everything the background *is* lives in background.js;
 * this file is the bench: palettes, dials, on-card handles, and a reference image to
 * sample colours from. The later layers get their own benches in later versions, and the
 * composite imports the layer modules rather than any of this.
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

const KEY = 'card-tricks-v1-bg';
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

function load() {
  const fromUrl = params.get('preset');
  if (fromUrl && PRESETS.some((p) => p.id === fromUrl)) return { preset: fromUrl, bg: presetState(fromUrl) };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.bg) return { preset: saved.preset, bg: mergeState(presetState(saved.preset), saved.bg) };
  } catch (_) { /* private mode or stale shape */ }
  return { preset: PRESETS[0].id, bg: presetState(PRESETS[0].id) };
}

let state = load();
let sel = Math.min(0, state.bg.fields.length - 1);
let playing = !reduced && params.get('still') !== '1';
let clock = Number(params.get('t') || 0);
let dirty = true;

let saveTimer = 0;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* private mode */ }
  }, 150);
}

function changed({ layout: relayout = false } = {}) {
  dirty = true;
  if (relayout) layout();
  drawHandles();
  if (backdrop === 'tint') setBackdrop('tint');
  save();
}

// ── renderers ─────────────────────────────────────────────────────────────

const canvas = $('bg');
const bgLayer = createBackground(canvas);
const thumbLayer = createBackground(document.createElement('canvas'));
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
  canvas.style.borderRadius = (state.bg.format.corner * w) / f.w + 'px';
  bgLayer.setSize(Math.round(w * dpr), Math.round(h * dpr));
  view = { w, h, pxScale: (w / f.w) * dpr };

  const r = $('ref');
  if (refOn) {
    r.style.height = h + 'px';
    r.style.width = Math.round(h * refRatio) + 'px';
  }
  $('handles').setAttribute('viewBox', `0 0 ${w} ${h}`);
  dirty = true;
  drawHandles();
}

function renderThumbs() {
  for (const p of PRESETS) {
    const c = document.querySelector(`canvas[data-thumb='${p.id}']`);
    if (!c) continue;
    const bg = presetState(p.id);
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
    thumbLayer.setSize(c.width, c.height);
    thumbLayer.render(bg, 0, (cw / f.w) * dpr);
    c.getContext('2d').drawImage(thumbLayer.canvas, 0, 0);
  }
}

// ── left panel ────────────────────────────────────────────────────────────

const LAYERS = [
  ['01', 'Background', 'gradients · colour · texture', 'now'],
  ['02', 'Visuals', 'line drawings as concept', 'next'],
  ['03', 'Type', 'numerals · labels · placement', 'next'],
  ['04', 'Motion', 'across all three layers', 'next'],
  ['05', 'Composite', 'the finished card', 'next'],
];

function buildLeft() {
  $('layers').replaceChildren(
    ...LAYERS.map(([n, name, note, tag], i) =>
      el('div', { className: 'layer', ariaCurrent: String(i === 0) },
        el('span', { className: 'n', textContent: n }),
        el('div', {}, el('b', { textContent: name }), el('span', { textContent: note })),
        el('span', { className: 'tag', textContent: tag }))),
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
  markPreset();
  renderThumbs();
}

function markPreset() {
  for (const b of $('presets').children) b.setAttribute('aria-current', String(b.dataset.id === state.preset));
}

function loadPreset(id) {
  state = { preset: id, bg: presetState(id) };
  sel = state.bg.fields.length ? 0 : -1;
  markPreset();
  buildDials();
  changed({ layout: true });
}

// ── right panel ───────────────────────────────────────────────────────────

const openGroups = new Set(['format', 'fields', 'texture']);
let fieldSync = [];

function decimals(step) {
  return (String(step).split('.')[1] || '').length;
}

function rangeDial(spec, obj, onChange) {
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
    obj()[spec.id] = snapDial(spec, raw);
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
  const sw = el('div', { className: 'switch', role: 'group', ariaLabel: spec.label });
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

function fieldsGroup() {
  const bg = state.bg;
  const kids = [];

  const groundHex = el('span', { className: 'hex', textContent: bg.ground });
  const setGround = (hex) => {
    bg.ground = hex;
    buildDials();
    changed();
  };
  kids.push(el('div', { className: 'frow' },
    colourSwatch(() => bg.ground, (hex) => { bg.ground = hex; groundHex.textContent = hex; changed(); }),
    el('span', { className: 'name', textContent: 'Ground' }), groundHex, ...pipette(setGround)));

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

  fieldSync = [];
  const f = bg.fields[sel];
  if (f) {
    kids.push(el('p', { className: 'sub', textContent: `Field ${sel + 1} · ${bg.blend.mode === 'layer' ? 'paints over ' + (sel ? 'field ' + sel : 'ground') : 'mixed by weight'}` }));
    kids.push(el('div', { className: 'frow' },
      el('span', { className: 'name', textContent: 'Colour' }),
      ...pipette((hex) => { f.color = hex; buildDials(); changed(); })));
    for (const d of FIELD_DIALS) {
      const dial = rangeDial(d, () => state.bg.fields[sel], () => changed());
      fieldSync.push(dial.sync);
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

function buildDials() {
  const root = $('dials');
  const scroll = root.scrollTop;
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
  root.replaceChildren(...groups);
  root.scrollTop = scroll;
}

// ── handles ───────────────────────────────────────────────────────────────

const handles = $('handles');

/** Handles sit where each field is *now*; a drag still edits the rest pose by the same delta. */
function drawHandles() {
  const { w, h } = view;
  const nodes = [];
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
  handles.replaceChildren(...nodes);
}

let drag = null;

handles.addEventListener('pointerdown', (e) => {
  const t = e.target.closest('[data-kind]');
  if (!t) return;
  e.preventDefault();
  const i = Number(t.dataset.i);
  if (i !== sel) select(i);
  const f = state.bg.fields[i];
  drag = { i, kind: t.dataset.kind, x0: e.clientX, y0: e.clientY, f0: { ...f } };
  handles.setPointerCapture(e.pointerId);
});

handles.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const f = state.bg.fields[drag.i];
  const dx = (e.clientX - drag.x0) / view.w;
  const dy = (e.clientY - drag.y0) / view.h;
  const spec = Object.fromEntries(FIELD_DIALS.map((d) => [d.id, d]));
  if (drag.kind === 'move') {
    f.x = snapDial(spec.x, drag.f0.x + dx);
    f.y = snapDial(spec.y, drag.f0.y + dy);
  } else if (drag.kind === 'rx') {
    f.rx = snapDial(spec.rx, drag.f0.rx + dx);
  } else {
    f.ry = snapDial(spec.ry, drag.f0.ry + dy);
  }
  fieldSync.forEach((s) => s());
  changed();
});

const endDrag = () => { drag = null; };
handles.addEventListener('pointerup', endDrag);
handles.addEventListener('pointercancel', endDrag);

// ── reference image ───────────────────────────────────────────────────────

const ref = { img: $('ref').querySelector('img'), ctx: null };

function setReference(src) {
  ref.img.onload = () => {
    const c = document.createElement('canvas');
    c.width = ref.img.naturalWidth;
    c.height = ref.img.naturalHeight;
    ref.ctx = c.getContext('2d', { willReadFrequently: true });
    ref.ctx.drawImage(ref.img, 0, 0);
    $('ref').classList.add('on');
    $('hint').textContent = 'click the reference to sample into the selected field · alt-click samples the ground';
    layout();
  };
  ref.img.src = src;
}

function clearReference() {
  $('ref').classList.remove('on');
  ref.img.removeAttribute('src');
  ref.ctx = null;
  layout();
}

$('ref').querySelector('button').addEventListener('click', clearReference);

ref.img.addEventListener('click', (e) => {
  if (!ref.ctx) return;
  const r = ref.img.getBoundingClientRect();
  const x = Math.round(((e.clientX - r.left) / r.width) * ref.img.naturalWidth);
  const y = Math.round(((e.clientY - r.top) / r.height) * ref.img.naturalHeight);
  const R = 3;
  const d = ref.ctx.getImageData(Math.max(0, x - R), Math.max(0, y - R), R * 2 + 1, R * 2 + 1).data;
  const sum = [0, 0, 0];
  for (let k = 0; k < d.length; k += 4) for (let c = 0; c < 3; c++) sum[c] += d[k + c];
  const n = d.length / 4;
  const hex = rgbToHex(sum.map((s) => s / n / 255));
  if (e.altKey || sel < 0) state.bg.ground = hex;
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

let backdrop = 'page';
function setBackdrop(v) {
  backdrop = v;
  const stage = $('stage');
  stage.dataset.backdrop = v;
  stage.style.setProperty('--backdrop', v === 'tint' ? `color-mix(in oklab, ${state.bg.ground} 28%, #ffffff)` : '');
  for (const b of $('backdrop').children) b.setAttribute('aria-pressed', String(b.dataset.v === v));
}
for (const b of $('backdrop').children) b.addEventListener('click', () => setBackdrop(b.dataset.v));

$('resetBtn').addEventListener('click', () => loadPreset(state.preset));

$('copyBtn').addEventListener('click', async () => {
  const text = JSON.stringify(state.bg, null, 2);
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
    state.bg = mergeState(state.bg, over);
    sel = state.bg.fields.length ? 0 : -1;
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
  }
});

// ── loop ──────────────────────────────────────────────────────────────────

let last = performance.now();
let fpsAcc = 0;
let fpsN = 0;
let fps = 0;

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
  if (dirty) {
    bgLayer.render(state.bg, clock, view.pxScale);
    if (playing) drawHandles();
    const f = FORMATS[state.bg.format.shape];
    $('readout').textContent = `${f.w}×${f.h} · ${state.bg.fields.length} fields · ${clock.toFixed(1)}s${playing ? ' · ' + fps + 'fps' : ''}`;
    dirty = false;
  }
  requestAnimationFrame(frame);
}

if (params.get('bare') === '1') document.body.classList.add('bare');
if (params.get('handles') === '0') setHandles(false);
setPlaying(playing);
buildLeft();
buildDials();
layout();
new ResizeObserver(layout).observe($('pit'));
requestAnimationFrame(frame);
