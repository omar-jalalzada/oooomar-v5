/**
 * The browser half of the experiment cards: finds every `[data-experiment-card]` on the
 * page and brings it to life. The server already rendered each card's type and a gradient
 * poster of its ground, so this adds the shader ground, the line work and the hover.
 *
 * Every card shares one background renderer, so a page holds a single WebGL context
 * however many cards it shows (Chrome drops the oldest past ~16). A card's ground is drawn
 * into the top-left of that shared canvas and copied into the card's own 2D canvas. The
 * shared canvas only ever grows: resizing it per card reallocates its buffer every time.
 * The ground renders at one pixel per CSS pixel even on a 2x screen — it's soft gradients
 * with no grain, so a quarter of the pixels looks identical and costs a quarter as much.
 *
 * The line work gets a 2D canvas per card (2D contexts have no such limit) and is kept
 * between frames: at rest a figure doesn't move, so it redraws only while hover is still
 * changing it, judged at a precision a pixel can show. Off-screen cards draw nothing.
 */
import { FORMATS, createBackground, presetState } from './background.js';
import { createVisuals, visPresetState } from './visuals.js';
import { cardAt, createInteraction, defaultMotion, groundAt, linesAt, rates, typeAt } from './motion.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const depth = reduced ? 0 : 1;
const dpr = Math.min(2, window.devicePixelRatio || 1);
const motion = defaultMotion();

let ground = null;
try {
  ground = createBackground(document.createElement('canvas'));
} catch {
  // No WebGL: the server-rendered poster stays as the ground.
}

const cards = [];

function fitGround(w, h) {
  const c = ground.canvas;
  if (w > c.width || h > c.height) ground.setSize(Math.max(w, c.width), Math.max(h, c.height));
}

function mount(root) {
  const look = root.dataset.experimentCard;
  const bg = presetState(look);
  const vis = visPresetState(look);
  const f = FORMATS[bg.format.shape];
  const canvas = root.querySelector('canvas');
  const typeEl = root.querySelector('[data-type]');

  const card = {
    root, typeEl, bg, vis, f, canvas,
    surface: canvas.getContext('2d'),
    lines: createVisuals(document.createElement('canvas')),
    linesKey: '',
    interaction: createInteraction(root),
    size: { cw: 0, ch: 0, gw: 0, gh: 0 },
    groundClock: 0,
    linesClock: 0,
    visible: false,
  };

  const layout = () => {
    const w = root.clientWidth;
    if (!w) return;
    const h = (w * f.h) / f.w;
    const cw = Math.round(w * dpr);
    const ch = Math.round(h * dpr);
    canvas.width = cw;
    canvas.height = ch;
    card.lines.setSize(cw, ch);
    card.linesKey = '';
    card.size = { cw, ch, gw: Math.round(w), gh: Math.round(h) };
    if (ground) fitGround(card.size.gw, card.size.gh);
    typeEl.style.setProperty('--ct-k', String(w / f.w));
  };
  new ResizeObserver(layout).observe(root);
  new IntersectionObserver(([e]) => { card.visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(root);
  layout();
  cards.push(card);
}

function draw(card) {
  const { f, interaction, size } = card;
  const s = interaction.state;
  const { cw, ch, gw, gh } = size;

  const p = s.p.lines;
  const key = `${card.linesClock.toFixed(4)},${s.h.toFixed(3)},${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  if (key !== card.linesKey) {
    card.lines.render(linesAt(card.vis, motion, s, f.w, f.h, depth), card.linesClock, cw / f.w, f.w, f.h);
    card.linesKey = key;
  }

  card.surface.clearRect(0, 0, cw, ch);
  if (ground) {
    ground.viewport(gw, gh);
    ground.render(groundAt(card.bg, motion, s, f.w, f.h, depth), card.groundClock, gw / f.w);
    card.surface.drawImage(ground.canvas, 0, 0, gw, gh, 0, 0, cw, ch);
  }
  card.surface.drawImage(card.lines.canvas, 0, 0);

  for (const [k, v] of Object.entries(typeAt(motion, s, depth))) card.typeEl.style.setProperty(k, v);
  const c = cardAt(motion, s, depth);
  card.root.style.transform = c.transform;
  card.root.style.boxShadow = c.shadow;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  for (const card of cards) {
    if (!card.visible || !card.size.cw) continue;
    const s = card.interaction.update(dt, motion);
    if (!reduced) {
      const r = rates(motion, s);
      card.groundClock += dt * r.ground;
      card.linesClock += dt * r.lines;
    }
    draw(card);
  }
  requestAnimationFrame(frame);
}

document.querySelectorAll('[data-experiment-card]').forEach(mount);
if (cards.length) requestAnimationFrame(frame);
