/**
 * Card Tricks, stage 5: the composite. The four layer modules, with no bench around
 * them: a card is a slug and an element, and this file is the only glue.
 *
 * Every card on the page shares one background renderer and one line-work renderer.
 * Each frame, a card is drawn on those two offscreen canvases and copied into its own 2D
 * canvas, so the page holds a single WebGL context however many cards it shows (Chrome
 * drops the oldest context past ~16). Cards that are off screen don't draw at all.
 */
import { FORMATS, createBackground, presetState } from './background.js';
import { createVisuals, visPresetState } from './visuals.js';
import { createType, typePresetState } from './type.js';
import { cardAt, createInteraction, defaultMotion, groundAt, linesAt, rates, typeAt } from './motion.js';

const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const depth = reduced ? 0 : 1;
const dpr = Math.min(2, window.devicePixelRatio || 1);
const motion = defaultMotion();
const t0 = Number(params.get('t') || 0);

const bgLayer = createBackground(document.createElement('canvas'));
const visLayer = createVisuals(document.createElement('canvas'));

const cards = [];

function mountCard(root, id) {
  const bg = presetState(id);
  const vis = visPresetState(id);
  const type = typePresetState(id);
  const f = FORMATS[bg.format.shape];

  const canvas = document.createElement('canvas');
  const typeEl = document.createElement('div');
  const face = document.createElement('div');
  face.className = 'face';
  face.append(canvas, typeEl);
  root.append(face);
  root.style.aspectRatio = `${f.w} / ${f.h}`;
  root.setAttribute('aria-label', type.content.title);

  const card = {
    root, typeEl, bg, vis, type, f,
    surface: canvas.getContext('2d'),
    canvas,
    typeLayer: createType(typeEl),
    interaction: createInteraction(root),
    view: { w: 0, h: 0, pxScale: 1 },
    groundClock: t0,
    linesClock: t0,
    visible: true,
  };

  const layout = () => {
    const w = root.clientWidth;
    const h = (w * f.h) / f.w;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    card.view = { w, h, pxScale: (w / f.w) * dpr };
    root.style.setProperty('--r', (bg.format.corner * w) / f.w + 'px');
    card.typeLayer.render(type, f.w, f.h, w / f.w);
  };
  new ResizeObserver(layout).observe(root);
  new IntersectionObserver(([e]) => { card.visible = e.isIntersecting; }).observe(root);
  layout();
  cards.push(card);
  return card;
}

function draw(card) {
  const { f, view, interaction } = card;
  const s = interaction.state;
  const { width: cw, height: ch } = card.canvas;
  bgLayer.setSize(cw, ch);
  bgLayer.render(groundAt(card.bg, motion, s, f.w, f.h, depth), card.groundClock, view.pxScale);
  visLayer.setSize(cw, ch);
  visLayer.render(linesAt(card.vis, motion, s, f.w, f.h, depth), card.linesClock, view.pxScale, f.w, f.h);
  card.surface.clearRect(0, 0, cw, ch);
  card.surface.drawImage(bgLayer.canvas, 0, 0);
  card.surface.drawImage(visLayer.canvas, 0, 0);

  for (const [k, v] of Object.entries(typeAt(motion, s, depth))) card.typeEl.style.setProperty(k, v);
  const c = cardAt(motion, s, depth);
  card.root.style.transform = c.transform;
  card.root.style.boxShadow = c.shadow;
}

// ── loop, with a readout of what it costs ─────────────────────────────────

const readout = document.getElementById('readout');
let last = performance.now();
let acc = 0;
let frames = 0;
let cost = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const start = performance.now();
  let drawn = 0;
  for (const card of cards) {
    if (!card.visible || !card.view.w) continue;
    const s = card.interaction.update(dt, motion);
    if (!reduced) {
      const r = rates(motion, s);
      card.groundClock += dt * r.ground;
      card.linesClock += dt * r.lines;
    }
    draw(card);
    drawn++;
  }
  cost += performance.now() - start;
  acc += dt;
  frames++;
  if (acc > 0.5) {
    readout.textContent = `${Math.round(frames / acc)} fps · ${(cost / frames).toFixed(1)} ms/frame · ${drawn} of ${cards.length} drawing`;
    acc = 0;
    frames = 0;
    cost = 0;
  }
  requestAnimationFrame(frame);
}

for (const el of document.querySelectorAll('[data-card]')) {
  const card = mountCard(el, el.dataset.card);
  if (params.get('hover') === '1') {
    motion.response.preview = 'held';
    card.interaction.snap(1, Number(params.get('px') ?? 0.5), Number(params.get('py') ?? -0.3));
  }
}
requestAnimationFrame(frame);
