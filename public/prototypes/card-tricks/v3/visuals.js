/**
 * Layer 2 of the card study: the line drawing that carries each card's concept.
 *
 * Every reference card speaks the same small language — hairline white strokes, built
 * from one primitive repeated with a single parameter swept across the copies, and one
 * glowing accent dot where the reading lands. So a figure here is a *generator*: a
 * primitive, a count, and the rule that varies it.
 *
 *   lobes   heart age      ellipses of one width, each tangent to the centre, heights swept
 *   waves   blood oxygen   sine strands pinned at both ends, phase swept
 *   arcs    inflammation   semicircles sharing a start point, radius swept — a scale
 *   orbit   measurement    meridians of a sphere, rotation swept
 *   funnel  rhythm         stacked rings, width swept down to a point
 *
 * Geometry is in figure units: the figure's box is two units across, centred on
 * `place.x/y` (card fractions) and `place.size` card-widths wide. Stroke widths and dot
 * sizes are in card pixels, so a figure scales without its lines thickening.
 *
 * Motion is each figure's natural one — lobes and funnel emit rings, waves travel, the
 * orbit turns, the arcs pulse along the scale — scaled by one Amount dial. Like the
 * background, motion only ever offsets the rest pose.
 */

const range = (id, label, min, max, step, value) => ({ kind: 'range', id, label, min, max, step, value });
const choice = (id, label, options, value) => ({ kind: 'choice', id, label, options, value });

export const FIGURES = {
  lobes: {
    label: 'Lobes',
    dials: [
      range('rings', 'Rings', 2, 40, 1, 14),
      range('height', 'Lobe height', 0.2, 1.5, 0.01, 1),
      range('curve', 'Spacing curve', 0.3, 3, 0.01, 1.4),
      choice('lobes', 'Lobes', [['both', 'Both'], ['top', 'Top'], ['bottom', 'Bottom']], 'both'),
    ],
  },
  waves: {
    label: 'Waves',
    dials: [
      range('strands', 'Strands', 1, 12, 1, 4),
      range('amplitude', 'Amplitude', 0, 1, 0.01, 0.32),
      range('cycles', 'Cycles', 0.5, 6, 0.05, 2.5),
      range('spread', 'Phase spread', 0, 3.14, 0.01, 0.8),
      range('envelope', 'Pinch', 0, 3, 0.01, 1),
    ],
  },
  arcs: {
    label: 'Arcs',
    dials: [
      range('count', 'Arcs', 2, 12, 1, 6),
      range('growth', 'Growth', 0.3, 3, 0.01, 1.3),
      range('height', 'Height', 0.2, 1.5, 0.01, 1),
    ],
  },
  orbit: {
    label: 'Orbit',
    dials: [
      range('rings', 'Meridians', 1, 24, 1, 7),
      range('latitudes', 'Latitudes', 0, 8, 1, 1),
      range('depth', 'Latitude depth', 0, 1, 0.01, 0.28),
      range('tilt', 'Tilt', -90, 90, 1, -18),
    ],
  },
  funnel: {
    label: 'Funnel',
    dials: [
      range('rings', 'Rings', 3, 40, 1, 14),
      range('top', 'Top width', 0.1, 1.2, 0.01, 1),
      range('bottom', 'Bottom width', 0, 1, 0.01, 0.02),
      range('length', 'Length', 0.2, 2, 0.01, 1),
      range('perspective', 'Perspective', 0, 0.8, 0.01, 0.22),
      range('curve', 'Taper curve', 0.3, 3, 0.01, 1.6),
    ],
  },
};

export const FIGURE_IDS = Object.keys(FIGURES);

/** Shared dials, keyed by group like the background's: `vis.stroke.width`. */
export const VIS_GROUPS = [
  {
    id: 'place',
    title: 'Place',
    dials: [
      range('x', 'X', 0, 1, 0.005, 0.5),
      range('y', 'Y', 0, 1, 0.005, 0.55),
      range('size', 'Size', 0.1, 1.5, 0.005, 0.54),
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke',
    dials: [
      range('opacity', 'Opacity', 0, 1, 0.01, 0.7),
      range('width', 'Width', 0.25, 3, 0.05, 0.75),
      range('fade', 'Fade across lines', 0, 1, 0.01, 0.3),
    ],
  },
  {
    id: 'accent',
    title: 'Accent',
    dials: [
      range('size', 'Dot size', 0, 10, 0.1, 4),
      range('ring', 'Halo', 0, 6, 0.1, 2),
      range('glow', 'Glow', 0, 3, 0.01, 1),
      choice('markers', 'Markers', [['on', 'On'], ['off', 'Off']], 'on'),
    ],
  },
  {
    id: 'motion',
    title: 'Motion',
    dials: [
      range('speed', 'Speed', 0, 3, 0.01, 0.6),
      range('amount', 'Amount', 0, 1, 0.01, 0.5),
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

const groupDefaults = (dials) => Object.fromEntries(dials.map((d) => [d.id, d.value]));

export function defaultVis() {
  const vis = { figure: 'lobes', lineColor: '#ffffff', accentColor: '#dcef3c' };
  for (const g of VIS_GROUPS) vis[g.id] = groupDefaults(g.dials);
  vis.shape = Object.fromEntries(FIGURE_IDS.map((id) => [id, groupDefaults(FIGURES[id].dials)]));
  return vis;
}

/** Visuals per card, keyed by the background palette ids. Anything omitted is default. */
export const VIS_PRESETS = {
  'heart-age': {
    figure: 'lobes',
    place: { x: 0.5, y: 0.555, size: 0.53 },
  },
  'blood-oxygen': {
    figure: 'waves',
    place: { x: 0.5, y: 0.62, size: 0.8 },
    shape: { waves: { strands: 4, amplitude: 0.3, cycles: 2.5, spread: 0.8 } },
  },
  inflammation: {
    figure: 'arcs',
    place: { x: 0.5, y: 0.78, size: 0.86 },
    shape: { arcs: { count: 6, growth: 1.25, height: 1 } },
  },
  measurement: {
    figure: 'orbit',
    place: { x: 0.5, y: 0.58, size: 0.5 },
  },
  rhythm: {
    figure: 'funnel',
    place: { x: 0.5, y: 0.56, size: 0.56 },
  },
};

export function mergeVis(base, over = {}) {
  const out = structuredClone(base);
  if (FIGURES[over.figure]) out.figure = over.figure;
  if (typeof over.lineColor === 'string') out.lineColor = over.lineColor;
  if (typeof over.accentColor === 'string') out.accentColor = over.accentColor;
  for (const g of VIS_GROUPS) {
    for (const d of g.dials) {
      const v = over[g.id]?.[d.id];
      if (v !== undefined) out[g.id][d.id] = snapDial(d, v);
    }
  }
  for (const id of FIGURE_IDS) {
    for (const d of FIGURES[id].dials) {
      const v = over.shape?.[id]?.[d.id];
      if (v !== undefined) out.shape[id][d.id] = snapDial(d, v);
    }
  }
  return out;
}

export const visPresetState = (id) => mergeVis(defaultVis(), VIS_PRESETS[id]);

// ── drawing ───────────────────────────────────────────────────────────────

function rgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}

const fract = (x) => x - Math.floor(x);
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Each generator returns strokes in figure units plus where the accent and markers sit.
 * A stroke is `{ kind: 'ellipse', cx, cy, rx, ry, rot, a0, a1, alpha, depth }` or
 * `{ kind: 'path', pts, alpha, depth }`, where depth (0..1) is what Fade works across.
 */
const GENERATORS = {
  lobes(p, m) {
    const strokes = [];
    const flow = m.phase * 0.1 * m.amount;
    for (let i = 0; i < p.rings; i++) {
      let u = (i + 1) / p.rings;
      let alpha = 1;
      if (flow) {
        u = fract(u + flow);
        alpha = smooth(0, 0.08, u) * smooth(1, 0.85, u);
      }
      const c = p.height * u ** p.curve;
      const ring = { kind: 'ellipse', cx: 0, rx: 1, ry: c, rot: 0, a0: 0, a1: Math.PI * 2, alpha, depth: u };
      if (p.lobes !== 'bottom') strokes.push({ ...ring, cy: -c });
      if (p.lobes !== 'top') strokes.push({ ...ring, cy: c });
    }
    return { strokes, accent: [0, 0], markers: [] };
  },

  waves(p, m) {
    const strokes = [];
    const N = 160;
    const travel = m.phase * 1.2 * m.amount;
    for (let k = 0; k < p.strands; k++) {
      const pts = [];
      for (let j = 0; j <= N; j++) {
        const u = j / N;
        const env = Math.sin(Math.PI * u) ** p.envelope;
        pts.push([u * 2 - 1, p.amplitude * env * Math.sin(Math.PI * 2 * p.cycles * u + k * p.spread + travel)]);
      }
      strokes.push({ kind: 'path', pts, alpha: 1, depth: p.strands > 1 ? k / (p.strands - 1) : 0 });
    }
    return { strokes, accent: [1, 0], markers: [[-1, 0]] };
  },

  arcs(p, m) {
    const strokes = [];
    const markers = [];
    for (let i = 0; i < p.count; i++) {
      const r = ((i + 1) / p.count) ** p.growth;
      const pulse = 1 - m.amount * 0.75 * (0.5 + 0.5 * Math.sin(m.phase * 2 - i * 0.9));
      strokes.push({ kind: 'ellipse', cx: -1 + r, cy: 0, rx: r, ry: r * p.height, rot: 0, a0: Math.PI, a1: Math.PI * 2, alpha: pulse, depth: i / Math.max(1, p.count - 1) });
      markers.push([-1 + 2 * r, 0]);
    }
    return { strokes, accent: [-1, 0], markers };
  },

  orbit(p, m) {
    const strokes = [];
    const rot = m.phase * 0.4 * m.amount;
    const tilt = (p.tilt * Math.PI) / 180;
    for (let i = 0; i < p.rings; i++) {
      const th = (Math.PI * i) / p.rings + rot;
      strokes.push({ kind: 'ellipse', cx: 0, cy: 0, rx: Math.abs(Math.cos(th)), ry: 1, rot: tilt, a0: 0, a1: Math.PI * 2, alpha: 1, depth: Math.abs(Math.sin(th)) });
    }
    for (let j = 0; j < p.latitudes; j++) {
      const ph = p.latitudes > 1 ? (j / (p.latitudes - 1) - 0.5) * 1.6 : 0;
      const r = Math.cos(ph);
      const off = Math.sin(ph);
      strokes.push({ kind: 'ellipse', cx: -off * Math.sin(tilt), cy: off * Math.cos(tilt), rx: r, ry: r * p.depth, rot: tilt, a0: 0, a1: Math.PI * 2, alpha: 1, depth: 0 });
    }
    return { strokes, accent: [0, 0], markers: [] };
  },

  funnel(p, m) {
    const strokes = [];
    const flow = m.phase * 0.1 * m.amount;
    for (let i = 0; i < p.rings; i++) {
      let t = i / (p.rings - 1);
      let alpha = 1;
      if (flow) {
        t = fract(t + flow);
        alpha = smooth(0, 0.1, t) * smooth(1, 0.9, t);
      }
      const rx = p.bottom + (p.top - p.bottom) * (1 - t) ** p.curve;
      const y = -p.length + 2 * p.length * t;
      strokes.push({ kind: 'ellipse', cx: 0, cy: y, rx, ry: rx * p.perspective, rot: 0, a0: 0, a1: Math.PI * 2, alpha, depth: t });
    }
    return { strokes, accent: [0, p.length + p.bottom * p.perspective], markers: [] };
  },
};

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

      const m = { phase: t * vis.motion.speed, amount: vis.motion.amount };
      const fig = GENERATORS[vis.figure](vis.shape[vis.figure], m);
      const cx = vis.place.x * W;
      const cy = vis.place.y * H;
      const s = (vis.place.size * W) / 2;
      const X = (u) => cx + u * s;
      const Y = (v) => cy + v * s;

      ctx.lineWidth = vis.stroke.width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const st of fig.strokes) {
        const a = vis.stroke.opacity * st.alpha * (1 - vis.stroke.fade * st.depth);
        if (a <= 0.002) continue;
        ctx.strokeStyle = rgba(vis.lineColor, a);
        ctx.beginPath();
        if (st.kind === 'ellipse') {
          if (st.rx * s < 0.05 || st.ry * s < 0.05) {
            // A ring seen exactly edge-on is a line, and ellipse() draws nothing for it.
            const c = Math.cos(st.rot);
            const sn = Math.sin(st.rot);
            const rx = Math.max(st.rx, st.ry);
            const horiz = st.rx >= st.ry;
            const dx = horiz ? c * rx : -sn * rx;
            const dy = horiz ? sn * rx : c * rx;
            ctx.moveTo(X(st.cx - dx), Y(st.cy - dy));
            ctx.lineTo(X(st.cx + dx), Y(st.cy + dy));
          } else {
            ctx.ellipse(X(st.cx), Y(st.cy), st.rx * s, st.ry * s, st.rot, st.a0, st.a1);
          }
        } else {
          st.pts.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v))));
        }
        ctx.stroke();
      }

      if (vis.accent.markers === 'on') {
        ctx.fillStyle = rgba(vis.lineColor, Math.min(1, vis.stroke.opacity + 0.2));
        for (const [u, v] of fig.markers) {
          ctx.beginPath();
          ctx.arc(X(u), Y(v), 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const ac = vis.accent;
      if (ac.size > 0) {
        const [u, v] = fig.accent;
        const x = X(u);
        const y = Y(v);
        const pulse = 1 + 0.35 * m.amount * Math.sin(m.phase * 3);
        const glowR = (ac.size + ac.ring) * (1 + 2.5 * ac.glow) * pulse;
        if (ac.glow > 0) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
          g.addColorStop(0, rgba(vis.accentColor, 0.55 * Math.min(1, ac.glow)));
          g.addColorStop(1, rgba(vis.accentColor, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
        if (ac.ring > 0) {
          ctx.fillStyle = 'rgba(255, 255, 240, 0.85)';
          ctx.beginPath();
          ctx.arc(x, y, ac.size + ac.ring, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = vis.accentColor;
        ctx.beginPath();
        ctx.arc(x, y, ac.size, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };
}
