/**
 * Layer 4 of Card Tricks: motion as interaction.
 *
 * The three visual layers already move; this layer decides *when* and *how much*, in
 * answer to a pointer. A card has two states — rest and hover — and one eased value `h`
 * slides between them. Everything reads off `h` and the smoothed pointer position:
 *
 *   card      lifts and tilts toward the pointer
 *   ground    drifts faster, brightens, and its brightest spot follows the cursor
 *   line work wakes up — its clock runs faster — grows a little and blooms its accent
 *   type      the name stays put; the stat and a link arrow arrive, staggered
 *
 * and each layer shifts with the pointer by a different amount *and a different lag*:
 * ground least (and the other way), line work more, type most — and within the type, the
 * title leads while the stat and the margins trail. Distance alone moves everything as one
 * plane; it's the lag that makes the layers read as separate depths. Hover is the moment
 * the card is revealed to be built in planes.
 *
 * Unlike layers 1–3 these dials are shared by every card. The cards differ in what they
 * are; they should agree on how they respond.
 *
 * One rule matters more than any dial: motion speed changes by *integrating a clock at a
 * different rate*, never by multiplying time. The layer renderers compute positions from
 * `t × speed`, so scaling either one on hover would make every figure jump. `rates()`
 * returns clock rates; the bench advances each layer's own clock by `dt × rate`.
 */

const range = (id, label, min, max, step, value) => ({ kind: 'range', id, label, min, max, step, value });
const choice = (id, label, options, value) => ({ kind: 'choice', id, label, options, value });

export const MOTION_GROUPS = [
  {
    id: 'response',
    title: 'Response',
    dials: [
      choice('preview', 'Preview', [['pointer', 'Pointer'], ['loop', 'Loop'], ['held', 'Held']], 'pointer'),
      range('attack', 'Ease in (s)', 0.05, 1.5, 0.01, 0.35),
      range('release', 'Ease out (s)', 0.05, 2, 0.01, 0.7),
      range('follow', 'Tilt follow (s)', 0.02, 0.6, 0.01, 0.16),
    ],
  },
  {
    id: 'card',
    title: 'Card',
    dials: [
      range('lift', 'Lift', 0, 0.08, 0.005, 0.02),
      range('tilt', 'Tilt (°)', 0, 12, 0.1, 3.5),
      range('shadow', 'Shadow', 0, 1, 0.01, 0.6),
    ],
  },
  {
    id: 'ground',
    title: 'Ground',
    dials: [
      range('parallax', 'Parallax (px)', 0, 24, 0.5, 5),
      range('lag', 'Lag (s)', 0.02, 1.5, 0.01, 0.6),
      range('rest', 'Drift at rest', 0, 1, 0.01, 0.3),
      range('boost', 'Drift on hover', 0, 6, 0.05, 2.5),
      range('chase', 'Bright spot follows', 0, 1, 0.01, 0.85),
      range('brighten', 'Brighten', 0, 0.5, 0.01, 0.1),
    ],
  },
  {
    id: 'lines',
    title: 'Line work',
    dials: [
      range('parallax', 'Parallax (px)', 0, 30, 0.5, 12),
      range('lag', 'Lag (s)', 0.02, 1.5, 0.01, 0.32),
      range('rest', 'Energy at rest', 0, 1, 0.01, 0),
      range('energy', 'Energy on hover', 0, 5, 0.01, 2.5),
      range('grow', 'Grow', 0, 0.2, 0.005, 0.04),
      range('lean', 'Lean (°)', 0, 20, 0.5, 4),
      range('brighten', 'Brighten', 0, 0.5, 0.01, 0.15),
      range('bloom', 'Accent bloom', 0, 2, 0.01, 0.8),
    ],
  },
  {
    id: 'type',
    title: 'Type',
    dials: [
      range('parallax', 'Title parallax (px)', 0, 30, 0.5, 18),
      range('lag', 'Title lag (s)', 0.02, 1.5, 0.01, 0.12),
      range('statDepth', 'Stat depth', 0, 1.5, 0.01, 0.7),
      range('edgeDepth', 'Margin depth', 0, 1.5, 0.01, 0.35),
      range('edgeLag', 'Margin lag (s)', 0.02, 1.5, 0.01, 0.45),
      choice('stat', 'Stat', [['reveal', 'Reveal'], ['always', 'Always']], 'reveal'),
      choice('arrow', 'Link arrow', [['reveal', 'Reveal'], ['off', 'Off']], 'reveal'),
      range('rise', 'Reveal rise (px)', 0, 20, 0.5, 6),
      range('titleLift', 'Title lift (px)', 0, 16, 0.5, 2),
      range('stagger', 'Stagger', 0, 0.4, 0.01, 0.18),
    ],
  },
];

export function snapDial(spec, v) {
  if (spec.kind !== 'range') return v;
  const n = Math.min(spec.max, Math.max(spec.min, Number(v)));
  const snapped = Math.round((n - spec.min) / spec.step) * spec.step + spec.min;
  const decimals = (String(spec.step).split('.')[1] || '').length;
  return Number(snapped.toFixed(decimals));
}

export function defaultMotion() {
  const m = {};
  for (const g of MOTION_GROUPS) m[g.id] = Object.fromEntries(g.dials.map((d) => [d.id, d.value]));
  return m;
}

export function mergeMotion(base, over = {}) {
  const out = structuredClone(base);
  for (const g of MOTION_GROUPS) {
    for (const d of g.dials) {
      const v = over[g.id]?.[d.id];
      if (v !== undefined) out[g.id][d.id] = snapDial(d, v);
    }
  }
  return out;
}

// ── the interaction ───────────────────────────────────────────────────────

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
/** Exponential approach that lands ~95% of the way in `seconds`. */
const approach = (from, to, dt, seconds) => from + (to - from) * (1 - Math.exp((-3 * dt) / Math.max(0.001, seconds)));

/**
 * Tracks one card element: hover (pointer or keyboard focus) and the pointer's position
 * in card space, -1..1 on both axes. `update()` eases both and returns the live values.
 */
export function createInteraction(el) {
  // One smoothed pointer per plane, each with its own lag — that's where the depth comes from.
  const planes = () => ({ ground: [0, 0], lines: [0, 0], title: [0, 0], edge: [0, 0] });
  const s = { h: 0, px: 0, py: 0, target: 0, tx: 0, ty: 0, inside: false, focused: false, loop: 0, p: planes() };
  if (!el.hasAttribute('tabindex')) el.tabIndex = 0;

  const aim = (e) => {
    const r = el.getBoundingClientRect();
    s.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    s.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  el.addEventListener('pointerenter', (e) => { s.inside = true; aim(e); });
  el.addEventListener('pointermove', aim);
  el.addEventListener('pointerleave', () => { s.inside = false; s.tx = 0; s.ty = 0; });
  el.addEventListener('focus', () => { s.focused = true; });
  el.addEventListener('blur', () => { s.focused = false; });

  return {
    state: s,
    /** Jump straight to a pose — for screenshots and for `prefers-reduced-motion`. */
    snap(h, px = 0, py = 0) {
      Object.assign(s, { h, target: h, px, py, tx: px, ty: py });
      for (const k of Object.keys(s.p)) s.p[k] = [px, py];
    },
    update(dt, m) {
      const mode = m.response.preview;
      if (mode === 'loop') {
        // Hover in, hold, hover out, rest — with the "pointer" drifting across the card.
        s.loop += dt;
        s.target = (s.loop % 4.5) < 2.6 ? 1 : 0;
        s.tx = 0.7 * Math.cos(s.loop * 1.1);
        s.ty = 0.5 * Math.sin(s.loop * 0.8);
      } else if (mode === 'held') {
        s.target = 1;
      } else {
        s.target = s.inside || s.focused ? 1 : 0;
      }
      s.h = approach(s.h, s.target, dt, s.target > s.h ? m.response.attack : m.response.release);
      s.px = approach(s.px, s.tx, dt, m.response.follow);
      s.py = approach(s.py, s.ty, dt, m.response.follow);
      const lags = { ground: m.ground.lag, lines: m.lines.lag, title: m.type.lag, edge: m.type.edgeLag };
      for (const [k, lag] of Object.entries(lags)) {
        s.p[k] = [approach(s.p[k][0], s.tx, dt, lag), approach(s.p[k][1], s.ty, dt, lag)];
      }
      if (Math.abs(s.h - s.target) < 1e-4) s.h = s.target;
      return s;
    },
  };
}

// ── what each layer does with it ──────────────────────────────────────────

const lerp = (a, b, t) => a + (b - a) * t;

/** Clock rates for the ground and the line work at this hover level. */
export function rates(m, s) {
  return {
    ground: lerp(m.ground.rest, m.ground.boost, s.h),
    lines: lerp(m.lines.rest, m.lines.energy, s.h),
  };
}

/**
 * The background state to render this frame. `depth` is 0 with reduced motion, which
 * keeps the brightening and the light but drops everything that travels.
 */
const luma = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};

/**
 * The field that follows the cursor: the card's own brightest *spot*. Fields wider than
 * the card are bands, not spots — the Sankey's graymail band is the brightest thing on its
 * card, and dragging a full-width band around reads as the whole ground sliding.
 */
export function brightestSpot(fields) {
  let best = -1;
  let score = -1;
  fields.forEach((f, i) => {
    if (f.rx >= 0.8) return;
    const v = luma(f.color) * (0.5 + 0.5 * f.opacity);
    if (v > score) {
      score = v;
      best = i;
    }
  });
  return best;
}

export function groundAt(bg, m, s, W, H, depth = 1) {
  const g = m.ground;
  const [gx, gy] = s.p.ground;
  const dx = (-gx * g.parallax * depth) / W;
  const dy = (-gy * g.parallax * depth) / H;
  const spot = brightestSpot(bg.fields);
  const chase = g.chase * s.h;
  const fields = bg.fields.map((f, i) => {
    if (i !== spot) return { ...f, x: f.x + dx, y: f.y + dy };
    // The spot travels on the ground's own lag, so it trails the cursor like a light
    // being carried rather than a sticker stuck to it.
    return { ...f, x: lerp(f.x, (gx + 1) / 2, chase), y: lerp(f.y, (gy + 1) / 2, chase) };
  });
  return { ...bg, fields, tone: { ...bg.tone, exposure: bg.tone.exposure + g.brighten * s.h } };
}

export function linesAt(vis, m, s, W, H, depth = 1) {
  const l = m.lines;
  const [lx, ly] = s.p.lines;
  return {
    ...vis,
    place: {
      ...vis.place,
      x: vis.place.x + (lx * l.parallax * depth) / W,
      y: vis.place.y + (ly * l.parallax * depth) / H,
      size: vis.place.size * (1 + l.grow * s.h),
      tilt: vis.place.tilt + lx * l.lean * s.h * depth,
    },
    stroke: { ...vis.stroke, opacity: Math.min(1, vis.stroke.opacity + l.brighten * s.h) },
    accent: { ...vis.accent, glow: vis.accent.glow * (1 + l.bloom * s.h) },
  };
}

/**
 * CSS custom properties for the type layer's slots (see the `ct-*` hooks in type.js), in
 * card pixels. Slots arrive in reading order — title, stat, arrow — each on its own slice
 * of `h`, and sit at their own depths: the title on its own lag, the stat a fraction of
 * the way behind it, the header and footer on the margin further back still.
 */
export function typeAt(m, s, depth = 1) {
  const t = m.type;
  const st = t.stagger;
  const slot = (i) => ease(clamp01((s.h - i * st) / Math.max(0.05, 1 - 2 * st)));
  const stat = t.stat === 'reveal' ? slot(1) : 1;
  const arrow = t.arrow === 'reveal' ? slot(2) : 0;
  const [tx, ty] = s.p.title;
  const [ex, ey] = s.p.edge;
  const P = t.parallax * depth;
  const px = (v) => `${v.toFixed(2)}px`;
  return {
    '--ct-title-x': px(tx * P),
    '--ct-title-y': px(ty * P - t.titleLift * slot(0) * depth),
    '--ct-stat': String(stat),
    '--ct-stat-x': px(lerp(ex, tx, 0.5) * P * t.statDepth),
    '--ct-stat-y': px(lerp(ey, ty, 0.5) * P * t.statDepth + (1 - stat) * t.rise * depth),
    '--ct-edge-x': px(ex * P * t.edgeDepth),
    '--ct-edge-y': px(ey * P * t.edgeDepth),
    '--ct-arrow': String(arrow),
    '--ct-arrow-x': px((1 - arrow) * -4 * depth),
  };
}

/** The card's own transform and shadow. */
export function cardAt(m, s, depth = 1) {
  const c = m.card;
  const tilt = c.tilt * s.h * depth;
  const lift = c.shadow * s.h;
  return {
    transform: `perspective(900px) rotateX(${(-s.py * tilt).toFixed(3)}deg) rotateY(${(s.px * tilt).toFixed(3)}deg) scale(${(1 + c.lift * s.h * depth).toFixed(4)})`,
    shadow: `0 1px 2px rgba(9, 9, 11, 0.06), 0 ${20 + 22 * lift}px ${40 + 40 * lift}px -24px rgba(9, 9, 11, ${(0.45 + 0.2 * lift).toFixed(3)})`,
  };
}
