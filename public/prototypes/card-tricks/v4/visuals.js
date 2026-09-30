/**
 * Layer 2 of Card Tricks: the line work.
 *
 * Every figure is one sentence — *a mark, repeated, with its properties swept, around one
 * invariant, telling one story* — and this module is that sentence as a generator:
 *
 *   mark     the one shape being repeated: ellipse, line, sine, polygon, spiral,
 *            lissajous, contour
 *   repeat   how many copies, how the sweep is spaced across them (curve), and how much
 *            per-copy randomness (jitter)
 *   sweep    from → to for position, scale, rotation, phase and squash; copy i gets the
 *            value at u = i/(n-1)
 *   pin      the invariant — which point of the mark every copy shares (centre, start,
 *            end, top, bottom) — plus mirroring and space: flat, or "turn", where rotation
 *            becomes a 3D turn about the vertical axis
 *   anchor   where the single accent dot lands, and whether copy ends get markers
 *
 * The pin is what makes twenty separate strokes read as one form, so it's the part to
 * reach for first when a figure looks like noise. Motion follows the same logic: animate
 * the sweep and hold the pin — copies flow along it, the phase travels, or the whole
 * figure spins about the pin.
 *
 * The named figures (lobes, ripple, rays…) are just presets of these dials. The bench is
 * where new ones get found.
 *
 * Geometry is in figure units: the figure's box is two units across, centred on
 * `place.x/y` (card fractions) and `place.size` card-widths wide. Stroke widths and dot
 * sizes are card pixels, so a figure scales without its lines thickening.
 */

const range = (id, label, min, max, step, value) => ({ kind: 'range', id, label, min, max, step, value });
const choice = (id, label, options, value) => ({ kind: 'choice', id, label, options, value });

// ── the five parts, as dials ──────────────────────────────────────────────

export const MARKS = {
  ellipse: {
    label: 'Ellipse',
    dials: [range('extent', 'Extent', 0.05, 1, 0.01, 1), range('start', 'Start angle', -180, 180, 1, 0)],
  },
  line: {
    label: 'Line',
    dials: [range('bump', 'Bump', -1, 1, 0.01, 0), range('width', 'Bump width', 0.05, 1, 0.01, 0.25), range('noise', 'Bump noise', 0, 1, 0.01, 0)],
  },
  sine: {
    label: 'Sine',
    dials: [range('amp', 'Amplitude', 0, 1, 0.01, 0.3), range('cycles', 'Cycles', 0.1, 8, 0.05, 2.5), range('pinch', 'Pinch ends', 0, 3, 0.01, 1)],
  },
  polygon: { label: 'Polygon', dials: [range('sides', 'Sides', 3, 12, 1, 4)] },
  spiral: { label: 'Spiral', dials: [range('turns', 'Turns', 0.25, 6, 0.05, 1.6)] },
  lissajous: { label: 'Lissajous', dials: [range('a', 'Frequency A', 1, 7, 1, 3), range('b', 'Frequency B', 1, 7, 1, 2)] },
  contour: { label: 'Contour', dials: [range('scale', 'Noise scale', 0.3, 4, 0.05, 0.8), range('seed', 'Seed', 0, 50, 1, 7)] },
};

export const MARK_IDS = Object.keys(MARKS);

/** Engine groups, keyed like the rest of the bench: `vis.sweep.rot1`. */
export const ENGINE_GROUPS = [
  {
    id: 'repeat',
    title: 'Repeat',
    dials: [
      range('count', 'Copies', 1, 48, 1, 12),
      range('curve', 'Spacing curve', 0.2, 3, 0.01, 1),
      range('jitter', 'Jitter (scale)', 0, 1, 0.01, 0),
    ],
  },
  {
    id: 'sweep',
    title: 'Sweep',
    dials: [
      range('x0', 'X from', -1.5, 1.5, 0.01, 0), range('x1', 'X to', -1.5, 1.5, 0.01, 0),
      range('y0', 'Y from', -1.5, 1.5, 0.01, 0), range('y1', 'Y to', -1.5, 1.5, 0.01, 0),
      range('scale0', 'Scale from', 0, 1.5, 0.01, 1), range('scale1', 'Scale to', 0, 1.5, 0.01, 1),
      range('rot0', 'Rotation from', -360, 360, 1, 0), range('rot1', 'Rotation to', -360, 360, 1, 0),
      range('phase0', 'Phase from', -2, 2, 0.01, 0), range('phase1', 'Phase to', -2, 2, 0.01, 0),
      range('squash0', 'Squash from', 0, 1.5, 0.01, 1), range('squash1', 'Squash to', 0, 1.5, 0.01, 1),
    ],
  },
  {
    id: 'pin',
    title: 'Pin & space',
    dials: [
      choice('pin', 'Pin', [['centre', 'Centre'], ['start', 'Start'], ['end', 'End'], ['top', 'Top'], ['bottom', 'Bottom']], 'centre'),
      choice('mirror', 'Mirror', [['none', 'None'], ['x', 'Across X'], ['y', 'Across Y']], 'none'),
      choice('space', 'Space', [['flat', 'Flat'], ['turn', 'Turn (3D)']], 'flat'),
      choice('anchor', 'Accent at', [['origin', 'Origin'], ['pin', 'First pin'], ['tip', 'Last pin'], ['end', 'Path end'], ['none', 'None']], 'origin'),
      choice('markers', 'Markers', [['none', 'None'], ['starts', 'Starts'], ['ends', 'Ends']], 'none'),
    ],
  },
];

export const VIS_GROUPS = [
  {
    id: 'place',
    title: 'Place',
    dials: [
      range('x', 'X', 0, 1, 0.005, 0.5),
      range('y', 'Y', 0, 1, 0.005, 0.55),
      range('size', 'Size', 0.1, 1.5, 0.005, 0.54),
      range('tilt', 'Tilt', -180, 180, 1, 0),
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke',
    dials: [
      range('opacity', 'Opacity', 0, 1, 0.01, 0.7),
      range('width', 'Width', 0.25, 3, 0.05, 0.75),
      range('fade', 'Fade across copies', 0, 1, 0.01, 0.3),
    ],
  },
  {
    id: 'accent',
    title: 'Accent',
    dials: [
      range('size', 'Dot size', 0, 10, 0.1, 4),
      range('ring', 'Halo', 0, 6, 0.1, 2),
      range('glow', 'Glow', 0, 3, 0.01, 1),
    ],
  },
  {
    id: 'motion',
    title: 'Motion',
    dials: [
      choice('mode', 'Moves', [['flow', 'Flow'], ['phase', 'Phase'], ['spin', 'Spin'], ['none', 'Still']], 'flow'),
      range('speed', 'Speed', 0, 3, 0.01, 0.6),
      range('amount', 'Amount', 0, 1, 0.01, 0.5),
    ],
  },
];

// ── named figures: presets of the engine ─────────────────────────────────

/**
 * Each entry names its sentence in the note. Only what differs from the engine defaults
 * is written down, so reading one tells you exactly which parts make the figure.
 */
export const FIGURES = {
  lobes: {
    label: 'Lobes', note: 'ellipses · squash swept · pinned at a shared tangent, mirrored',
    mark: 'ellipse', repeat: { count: 14, curve: 1.4 }, sweep: { squash0: 0.07, squash1: 1 },
    pin: { pin: 'bottom', mirror: 'y' }, motion: { mode: 'flow' },
  },
  waves: {
    label: 'Waves', note: 'sines · phase swept · pinned at both ends',
    mark: 'sine', repeat: { count: 4 }, sweep: { phase0: 0, phase1: 0.38 },
    pin: { anchor: 'end', markers: 'starts' }, motion: { mode: 'phase' },
  },
  arcs: {
    label: 'Arcs', note: 'half-circles · scale swept · pinned at a shared start',
    mark: 'ellipse', marks: { ellipse: { extent: 0.5, start: 180 } }, repeat: { count: 6, curve: 1.3 },
    sweep: { x0: -1, x1: -1, scale0: 0.17, scale1: 1 }, pin: { pin: 'start', anchor: 'pin', markers: 'ends' },
    motion: { mode: 'flow' },
  },
  orbit: {
    label: 'Orbit', note: 'ellipses · rotation swept · turned about a shared axis',
    mark: 'ellipse', repeat: { count: 7 }, sweep: { rot0: 0, rot1: 154 },
    pin: { space: 'turn' }, motion: { mode: 'spin', speed: 0.5 },
  },
  funnel: {
    label: 'Funnel', note: 'ellipses · scale and height swept · narrowing to a shared apex',
    mark: 'ellipse', repeat: { count: 14, curve: 0.6 },
    sweep: { y0: -1, y1: 1, scale0: 1, scale1: 0.02, squash0: 0.22, squash1: 0.22 },
    pin: { anchor: 'tip' }, motion: { mode: 'flow' },
  },
  ripple: {
    label: 'Ripple', note: 'circles · scale swept · pinned at a shared centre',
    mark: 'ellipse', repeat: { count: 9 }, sweep: { scale0: 0.08, scale1: 1 }, motion: { mode: 'flow' },
  },
  ridgeline: {
    label: 'Ridgeline', note: 'lines with a bump · height and phase swept · stacked on one axis',
    mark: 'line', marks: { line: { bump: 0.55, width: 0.22, noise: 0.7 } }, repeat: { count: 16 },
    sweep: { y0: -0.9, y1: 0.9, phase0: 0, phase1: 0.6 }, pin: { anchor: 'tip' }, motion: { mode: 'phase' },
  },
  rays: {
    label: 'Rays', note: 'lines · rotation swept, length jittered · pinned at a shared start',
    mark: 'line', repeat: { count: 36, jitter: 0.6 }, sweep: { rot0: 0, rot1: 350, scale0: 0.5, scale1: 0.5 },
    pin: { pin: 'start' }, motion: { mode: 'spin', speed: 0.25 },
  },
  twist: {
    label: 'Twist', note: 'squares · scale and rotation swept · nested on a shared centre',
    mark: 'polygon', repeat: { count: 14 }, sweep: { scale0: 1, scale1: 0.1, rot0: 0, rot1: 90 }, motion: { mode: 'flow' },
  },
  spiral: {
    label: 'Spiral', note: 'spiral arms · rotation swept · growing from a shared centre',
    mark: 'spiral', repeat: { count: 5 }, sweep: { rot0: 0, rot1: 288 }, motion: { mode: 'spin', speed: 0.4 },
  },
  lissajous: {
    label: 'Lissajous', note: 'lissajous loops · phase and scale swept · on a shared centre',
    mark: 'lissajous', repeat: { count: 5 }, sweep: { phase0: 0, phase1: 0.2, scale0: 1, scale1: 0.8 },
    pin: { anchor: 'end' }, motion: { mode: 'phase' },
  },
  contours: {
    label: 'Contours', note: 'isolines of one noise field · level swept',
    mark: 'contour', marks: { contour: { scale: 0.85 } }, repeat: { count: 10 }, pin: { anchor: 'none' }, motion: { mode: 'flow' },
  },
  bars: {
    label: 'Bars', note: 'vertical lines · position swept, length jittered · a sequencer',
    mark: 'line', repeat: { count: 36, jitter: 0.75 },
    sweep: { x0: -1, x1: 1, scale0: 0.55, scale1: 0.55, rot0: 90, rot1: 90 }, motion: { mode: 'flow', speed: 0.4 },
  },
  tentacles: {
    label: 'Tentacles', note: 'sines hung from one line · position and phase swept',
    mark: 'sine', marks: { sine: { amp: 0.12, cycles: 1.5, pinch: 0.6 } }, repeat: { count: 9 },
    sweep: { x0: -0.55, x1: 0.55, y0: -0.7, y1: -0.7, scale0: 0.85, scale1: 0.85, rot0: 90, rot1: 90, phase0: 0, phase1: 0.8 },
    pin: { pin: 'start', anchor: 'none', markers: 'ends' }, motion: { mode: 'phase' },
  },
  fan: {
    label: 'Fan', note: 'quarter-sines · squash swept · pinned at one source, mirrored',
    mark: 'sine', marks: { sine: { amp: 1, cycles: 0.25, pinch: 0 } }, repeat: { count: 5 },
    sweep: { x0: -1, x1: -1, squash0: 0.06, squash1: 0.4 },
    pin: { pin: 'start', mirror: 'y', anchor: 'pin', markers: 'ends' }, motion: { mode: 'flow', speed: 0.4 },
  },
};

export const FIGURE_IDS = Object.keys(FIGURES);

// ── state ─────────────────────────────────────────────────────────────────

export function snapDial(spec, v) {
  if (spec.kind !== 'range') return v;
  const n = Math.min(spec.max, Math.max(spec.min, Number(v)));
  const snapped = Math.round((n - spec.min) / spec.step) * spec.step + spec.min;
  const decimals = (String(spec.step).split('.')[1] || '').length;
  return Number(snapped.toFixed(decimals));
}

const groupDefaults = (dials) => Object.fromEntries(dials.map((d) => [d.id, d.value]));
const ALL_GROUPS = [...ENGINE_GROUPS, ...VIS_GROUPS];

export function defaultVis() {
  const vis = { figure: 'lobes', mark: 'ellipse', lineColor: '#ffffff', accentColor: '#dcef3c' };
  for (const g of ALL_GROUPS) vis[g.id] = groupDefaults(g.dials);
  vis.marks = Object.fromEntries(MARK_IDS.map((id) => [id, groupDefaults(MARKS[id].dials)]));
  return vis;
}

export function mergeVis(base, over = {}) {
  const out = structuredClone(base);
  if (FIGURES[over.figure] || over.figure === 'custom') out.figure = over.figure;
  if (MARKS[over.mark]) out.mark = over.mark;
  if (typeof over.lineColor === 'string') out.lineColor = over.lineColor;
  if (typeof over.accentColor === 'string') out.accentColor = over.accentColor;
  for (const g of ALL_GROUPS) {
    for (const d of g.dials) {
      const v = over[g.id]?.[d.id];
      if (v !== undefined) out[g.id][d.id] = snapDial(d, v);
    }
  }
  for (const id of MARK_IDS) {
    for (const d of MARKS[id].dials) {
      const v = over.marks?.[id]?.[d.id];
      if (v !== undefined) out.marks[id][d.id] = snapDial(d, v);
    }
  }
  return out;
}

/**
 * Swap the figure but keep where it sits and how it's inked: the engine groups reset to
 * the figure's sentence, place/stroke/accent stay as they were.
 */
export function applyFigure(vis, id) {
  const fresh = defaultVis();
  const keep = { place: vis.place, stroke: vis.stroke, accent: vis.accent, lineColor: vis.lineColor, accentColor: vis.accentColor };
  const f = FIGURES[id];
  const next = mergeVis({ ...fresh, ...structuredClone(keep) }, { ...f, figure: id });
  next.motion = { ...fresh.motion, speed: vis.motion.speed, amount: vis.motion.amount, ...f.motion };
  return next;
}

// ── drawing ───────────────────────────────────────────────────────────────

function rgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}

const TAU = Math.PI * 2;
const fract = (x) => x - Math.floor(x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const hash = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (i, j) => hash(i * 57 + j * 131);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}

function fbm(x, y) {
  let s = 0;
  let a = 0.5;
  for (let o = 0; o < 3; o++) {
    s += a * vnoise(x, y);
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.3;
    a *= 0.5;
  }
  return s / 0.875;
}

/** A contour field is the same for every copy, so it's sampled once per (scale, seed). */
const G = 48;
let fieldKey = '';
let field = null;
function contourField(scale, seed) {
  const key = scale + ':' + seed;
  if (key !== fieldKey) {
    field = new Float32Array((G + 1) * (G + 1));
    for (let j = 0; j <= G; j++) {
      for (let i = 0; i <= G; i++) {
        field[j * (G + 1) + i] = fbm((i / G) * 2 * scale + seed * 3.7, (j / G) * 2 * scale + seed * 1.3);
      }
    }
    fieldKey = key;
  }
  return field;
}

/** Marching squares at one level, clipped to the unit circle. Returns 2-point paths. */
function contourPaths(scale, seed, level) {
  const f = contourField(scale, seed);
  const paths = [];
  const P = (i, j) => [(i / G) * 2 - 1, (j / G) * 2 - 1];
  const at = (i, j) => f[j * (G + 1) + i];
  const edge = (a, b, va, vb) => {
    const t = (level - va) / (vb - va);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  for (let j = 0; j < G; j++) {
    for (let i = 0; i < G; i++) {
      const v = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      const c = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
      const cross = [];
      for (let k = 0; k < 4; k++) {
        const a = v[k];
        const b = v[(k + 1) % 4];
        if ((a < level) !== (b < level)) cross.push(edge(c[k], c[(k + 1) % 4], a, b));
      }
      for (let k = 0; k + 1 < cross.length; k += 2) {
        const [p, q] = [cross[k], cross[k + 1]];
        if (Math.hypot(p[0], p[1]) < 1 && Math.hypot(q[0], q[1]) < 1) paths.push({ pts: [p, q], closed: false });
      }
    }
  }
  return paths;
}

/** Each mark, in its own unit space: roughly [-1, 1], with y down. */
function markPaths(kind, p, phase, rnd, u) {
  const pts = [];
  if (kind === 'ellipse') {
    const n = Math.max(8, Math.round(120 * p.extent));
    const a0 = (p.start * Math.PI) / 180;
    for (let j = 0; j <= n; j++) {
      const a = a0 + (j / n) * p.extent * TAU;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return [{ pts, closed: p.extent >= 1 }];
  }
  if (kind === 'line') {
    const c = 0.3 * Math.sin(TAU * phase);
    const amp = p.bump * lerp(1, rnd, p.noise);
    for (let j = 0; j <= 80; j++) {
      const x = (j / 80) * 2 - 1;
      pts.push([x, -amp * Math.exp(-(((x - c) / p.width) ** 2))]);
    }
    return [{ pts, closed: false }];
  }
  if (kind === 'sine') {
    for (let j = 0; j <= 160; j++) {
      const t = j / 160;
      const env = Math.sin(Math.PI * t) ** p.pinch;
      pts.push([t * 2 - 1, p.amp * env * Math.sin(TAU * (p.cycles * t + phase))]);
    }
    return [{ pts, closed: false }];
  }
  if (kind === 'polygon') {
    for (let j = 0; j <= p.sides; j++) {
      const a = -Math.PI / 2 + (j / p.sides) * TAU;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return [{ pts, closed: true }];
  }
  if (kind === 'spiral') {
    const n = Math.round(60 * p.turns) + 20;
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      const a = TAU * (p.turns * t + phase);
      pts.push([t * Math.cos(a), t * Math.sin(a)]);
    }
    return [{ pts, closed: false }];
  }
  if (kind === 'lissajous') {
    for (let j = 0; j <= 360; j++) {
      const t = (j / 360) * TAU;
      pts.push([Math.sin(p.a * t + TAU * phase), Math.sin(p.b * t)]);
    }
    return [{ pts, closed: true }];
  }
  if (kind === 'contour') return contourPaths(p.scale, p.seed, 0.22 + 0.56 * u);
  return [];
}

const PINS = { centre: [0, 0], start: [-1, 0], end: [1, 0], top: [0, -1], bottom: [0, 1] };

/**
 * One copy's transform at sweep position u. Returns the point mapper plus where the
 * pin landed, which is where anchors and markers look.
 */
function copyTransform(vis, u, rnd, extra) {
  const s = vis.sweep;
  const cu = u ** vis.repeat.curve;
  const x = lerp(s.x0, s.x1, cu);
  const y = lerp(s.y0, s.y1, cu);
  const squash = lerp(s.squash0, s.squash1, cu);
  const scale = lerp(s.scale0, s.scale1, cu) * lerp(1, 0.35 + 0.65 * rnd, vis.repeat.jitter);
  const rot = ((lerp(s.rot0, s.rot1, cu) + extra.spin) * Math.PI) / 180;
  const phase = lerp(s.phase0, s.phase1, cu) + extra.phase;
  const [px, py] = PINS[vis.pin.pin];
  const turn = vis.pin.space === 'turn';
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const map = ([mx, my]) => {
    let a = (mx - px) * scale;
    let b = (my - py) * squash * scale;
    if (turn) a *= cr;
    else [a, b] = [a * cr - b * sr, a * sr + b * cr];
    return [a + x, b + y];
  };
  return { map, phase, pin: [x, y] };
}

export function createVisuals(canvas) {
  const ctx = canvas.getContext('2d');

  return {
    canvas,
    setSize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    },
    /** `W`/`H` is the card in card pixels; `pxScale` is device pixels per card pixel. */
    render(vis, t, pxScale, W, H) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(pxScale, 0, 0, pxScale, 0, 0);

      const n = vis.repeat.count;
      const m = vis.motion;
      const live = m.mode !== 'none' ? t * m.speed * m.amount : 0;
      const extra = {
        phase: m.mode === 'phase' ? live * 0.2 : 0,
        spin: m.mode === 'spin' ? live * 20 : 0,
      };
      const flow = m.mode === 'flow' && live !== 0;
      const markP = vis.marks[vis.mark];

      const tilt = (vis.place.tilt * Math.PI) / 180;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const cx = vis.place.x * W;
      const cy = vis.place.y * H;
      const k = (vis.place.size * W) / 2;
      const mirrors = vis.pin.mirror === 'x' ? [[1, 1], [-1, 1]] : vis.pin.mirror === 'y' ? [[1, 1], [1, -1]] : [[1, 1]];
      const toCard = ([a, b], [mx, my]) => {
        const u = a * mx;
        const v = b * my;
        return [cx + (u * ct - v * st) * k, cy + (u * st + v * ct) * k];
      };

      ctx.lineWidth = vis.stroke.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const markerPts = [];

      for (let i = 0; i < n; i++) {
        let u = n > 1 ? i / (n - 1) : 0;
        let alpha = 1;
        if (flow) {
          // Flowing copies are spaced cyclically so the one leaving and the one arriving
          // never coincide, and fade at both ends of the sweep so nothing pops.
          u = fract(i / n + live * 0.1);
          alpha = smooth(0, 0.08, u) * smooth(1, 0.85, u);
        }
        const a = vis.stroke.opacity * alpha * (1 - vis.stroke.fade * u);
        if (a <= 0.002) continue;
        const tr = copyTransform(vis, u, hash(i + 1), extra);
        const paths = markPaths(vis.mark, markP, tr.phase, hash(i + 7.3), u);
        ctx.strokeStyle = rgba(vis.lineColor, a);
        ctx.beginPath();
        for (const mir of mirrors) {
          for (const path of paths) {
            path.pts.forEach((pt, j) => {
              const [X, Y] = toCard(tr.map(pt), mir);
              if (j) ctx.lineTo(X, Y);
              else ctx.moveTo(X, Y);
            });
            if (path.closed) ctx.closePath();
          }
        }
        ctx.stroke();
        if (vis.pin.markers !== 'none' && paths[0]) {
          const pts = paths[0].pts;
          const end = tr.map(vis.pin.markers === 'starts' ? pts[0] : pts[pts.length - 1]);
          for (const mir of mirrors) markerPts.push(toCard(end, mir));
        }
      }

      ctx.fillStyle = rgba(vis.lineColor, Math.min(1, vis.stroke.opacity + 0.2));
      for (const [X, Y] of markerPts) {
        ctx.beginPath();
        ctx.arc(X, Y, 1.6, 0, TAU);
        ctx.fill();
      }

      // The accent reads off the rest pose, so it stays put while the copies move.
      const still = { phase: 0, spin: 0 };
      let anchor = null;
      if (vis.pin.anchor === 'origin') anchor = [0, 0];
      else if (vis.pin.anchor === 'pin') anchor = copyTransform(vis, 0, hash(1), still).pin;
      else if (vis.pin.anchor === 'tip') anchor = copyTransform(vis, 1, hash(n), still).pin;
      else if (vis.pin.anchor === 'end') {
        const tr = copyTransform(vis, 0, hash(1), still);
        const pts = markPaths(vis.mark, markP, tr.phase, hash(7.3), 0)[0]?.pts;
        if (pts) anchor = tr.map(pts[pts.length - 1]);
      }

      const ac = vis.accent;
      if (anchor && ac.size > 0) {
        const [x, y] = toCard(anchor, [1, 1]);
        const pulse = 1 + 0.35 * m.amount * Math.sin(t * m.speed * 3);
        const glowR = (ac.size + ac.ring) * (1 + 2.5 * ac.glow) * pulse;
        if (ac.glow > 0) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          g.addColorStop(0, rgba(vis.accentColor, 0.55 * Math.min(1, ac.glow)));
          g.addColorStop(1, rgba(vis.accentColor, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, TAU);
          ctx.fill();
        }
        if (ac.ring > 0) {
          ctx.fillStyle = 'rgba(255, 255, 240, 0.85)';
          ctx.beginPath();
          ctx.arc(x, y, ac.size + ac.ring, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = vis.accentColor;
        ctx.beginPath();
        ctx.arc(x, y, ac.size, 0, TAU);
        ctx.fill();
      }
    },
  };
}

// ── the cards ─────────────────────────────────────────────────────────────

/**
 * Line work per card, keyed by the background palette ids. Each figure is the experiment's
 * own structure drawn as one sentence, and the accent borrows the experiment's own
 * highlight colour where it has one.
 */
export const VIS_PRESETS = {
  'card-tricks': { figure: 'lobes', place: { x: 0.5, y: 0.56, size: 0.53 } },
  atlas: {
    figure: 'orbit', place: { x: 0.74, y: 0.58, size: 0.42, tilt: -18 },
    accentColor: '#ffc86b',
  },
  'bar-field': {
    figure: 'bars', place: { x: 0.5, y: 0.62, size: 0.82 },
    lineColor: '#ffd9ef', accentColor: '#f0d24a', stroke: { opacity: 0.75 },
  },
  farsh: {
    figure: 'twist', place: { x: 0.5, y: 0.63, size: 0.6 },
    repeat: { count: 12 }, sweep: { scale0: 1, scale1: 0.12, rot0: 0, rot1: 45 },
    lineColor: '#efe4cc', accentColor: '#e8b04a',
  },
  'naughty-narwal': {
    figure: 'tentacles', place: { x: 0.5, y: 0.6, size: 0.7 },
    stroke: { opacity: 0.6, fade: 0 },
  },
  sankey: {
    figure: 'fan', place: { x: 0.5, y: 0.62, size: 0.84 },
    accentColor: '#e15c93', stroke: { fade: 0.15 },
  },
};

export function visPresetState(id) {
  const p = VIS_PRESETS[id] || VIS_PRESETS['card-tricks'];
  const base = applyFigure(defaultVis(), p.figure);
  return mergeVis(base, { ...p, figure: p.figure });
}
