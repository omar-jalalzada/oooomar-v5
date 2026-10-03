// Geometry for the timeline: a pure function from the dataset and the viewport to positions.
// Nothing here touches the DOM except through the `measure` callback, so the whole layout
// can be rerun on resize and the renderer just reads the numbers.
//
// The year scale is not linear. Each year gets as much height as its busiest column needs to
// set its names without collision, with a floor, so the 1960s open up and the 1870s close in.
// The axis ticks are drawn from the same scale, so the stretch is visible, not hidden.

export const FIRST = 1850;
export const LAST = 2026;

export const DESK = {
  gutter: 164,      // year labels and turning-point notes, left of the axis
  axisInset: 16,    // axis rule sits this far inside the gutter's right edge
  right: 56,        // minimap rail
  lane: 9,          // one movement bar plus its gap
  bar: 5,
  colGap: 18,
  laneGap: 10,      // between the last bar and the text stream
  base: 14,         // minimum px per year
  name: { size: 11.5, line: 14, weight: 450 },
  head: { size: 12.5, line: 15, weight: 640 },
  meta: { size: 10, line: 13 },
  itemGap: 4,
};

export const MOBILE = {
  ...DESK,
  gutter: 64,
  axisInset: 10,
  right: 14,
  lane: 10,
  bar: 6,
  colGap: 0,
  laneGap: 12,
  base: 12,
};

const SMALL = 820;

/** Words into lines no wider than `w`, using the supplied text measure. */
function wrap(text, w, font, measure) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, font) > w) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Display name: studios and duos carry a parenthetical gloss that belongs in the panel. */
export const shortName = (name) => name.replace(/\s*\(.*\)\s*$/, '');

/** The movement a figure is drawn on: the first one whose span holds their defining year. */
export function primaryMovement(f, byId) {
  const ms = f.movements.map((id) => byId.get(id)).filter(Boolean);
  return ms.find((m) => f.signatureYear >= m.start && f.signatureYear <= m.end) ?? ms[0];
}

export function layout(data, { width, height, region, measure }) {
  const small = width < SMALL;
  const K = small ? MOBILE : DESK;
  const byId = new Map(data.movements.map((m) => [m.id, m]));
  const years = LAST - FIRST + 1;
  const font = (t) => `${t.weight ?? 400} ${t.size}px "Inter Tight", system-ui, sans-serif`;

  // --- columns: one per region on desktop, the chosen region alone on a phone
  const regions = small ? data.regions.filter((r) => r.id === region) : data.regions;
  const cols = regions.map((r) => {
    const ms = data.movements.filter((m) => m.region === r.id).sort((a, b) => a.start - b.start || b.end - a.end);
    const lanes = [];
    const laneOf = new Map();
    for (const m of ms) {
      let i = lanes.findIndex((end) => end + 2 <= m.start);
      if (i < 0) i = lanes.push(0) - 1;
      lanes[i] = m.end;
      laneOf.set(m.id, i);
    }
    return { region: r, movements: ms, laneOf, laneCount: lanes.length };
  });

  // figures go in the column of the movement they're drawn on, which can differ from their
  // own region (Lance Wyman is American; his circle sits on Mexico 68)
  const figs = data.figures
    .map((f) => ({ f, m: primaryMovement(f, byId) }))
    .filter(({ m }) => m && cols.some((c) => c.region.id === m.region));

  const axisX = K.gutter - K.axisInset;
  const lanesTotal = cols.reduce((s, c) => s + c.laneCount * K.lane, 0);
  const avail = width - K.gutter - K.right - lanesTotal - K.colGap * (cols.length - 1) - K.laneGap * cols.length;
  const weight = (c) => (c.region.id === 'global' ? 0.72 : 1);
  const wsum = cols.reduce((s, c) => s + weight(c), 0);
  let x = K.gutter;
  for (const c of cols) {
    c.x = x;
    c.lanesX = x;
    c.streamX = x + c.laneCount * K.lane + K.laneGap;
    c.streamW = Math.max(72, (avail * weight(c)) / wsum);
    c.w = c.streamX + c.streamW - x;
    x += c.w + K.colGap;
  }
  const colOf = new Map(cols.map((c) => [c.region.id, c]));

  // --- stream items, measured once; their year decides where they want to sit
  const items = [];
  for (const c of cols) {
    for (const m of c.movements) {
      const lines = wrap(m.name, c.streamW, font(K.head), measure);
      items.push({
        kind: 'movement', id: m.id, col: c, year: m.start, lines,
        h: lines.length * K.head.line + K.meta.line, anchor: K.head.line / 2,
      });
    }
  }
  for (const { f, m } of figs) {
    const c = colOf.get(m.region);
    const lines = wrap(shortName(f.name), c.streamW - 12, font(K.name), measure);
    const year = Math.min(Math.max(f.signatureYear, m.start), m.end);
    items.push({ kind: 'figure', id: f.id, col: c, m, year, lines, h: lines.length * K.name.line, anchor: K.name.line / 2 });
  }
  // on a phone the turning points share the single text stream
  const eventsIn = small ? data.events.filter((e) => e.major) : [];
  for (const e of eventsIn) {
    const c = cols[0];
    const lines = wrap(e.label, c.streamW - 8, font(K.meta), measure);
    items.push({ kind: 'event', id: `${e.year}-${e.label}`, e, col: c, year: e.year, lines, h: lines.length * K.meta.line + 6, anchor: 3 });
  }

  // --- the scale: how much height does each year need in its busiest column?
  const need = new Float64Array(years);
  for (const c of cols) {
    const perYear = new Float64Array(years);
    for (const it of items) if (it.col === c) perYear[it.year - FIRST] += it.h + K.itemGap;
    for (let i = 0; i < years; i++) need[i] = Math.max(need[i], perYear[i]);
  }
  // spread each year's need over its neighbours: a cluster then opens a smooth valley in the
  // scale rather than one tall step, which reads as time slowing down rather than a glitch
  const ppy = new Float64Array(years);
  for (let i = 0; i < years; i++) {
    let s = 0, wsum2 = 0;
    for (let j = -3; j <= 3; j++) {
      const k = i + j;
      if (k < 0 || k >= years) continue;
      const w = 1 - Math.abs(j) / 4;
      s += need[k] * w;
      wsum2 += w;
    }
    ppy[i] = Math.max(K.base, s / wsum2);
  }
  const Y = new Float64Array(years + 1);
  for (let i = 0; i < years; i++) Y[i + 1] = Y[i] + ppy[i];

  const yOf = (year) => {
    const t = Math.min(Math.max(year - FIRST, 0), years);
    const i = Math.min(Math.floor(t), years - 1);
    return Y[i] + (t - i) * ppy[i];
  };
  const yearAt = (y) => {
    if (y <= 0) return FIRST;
    if (y >= Y[years]) return LAST + 1;
    let lo = 0, hi = years;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (Y[mid] <= y) lo = mid; else hi = mid;
    }
    return FIRST + lo + (y - Y[lo]) / ppy[lo];
  };

  // --- bars
  const bars = [];
  const barOf = new Map();
  for (const c of cols) {
    for (const m of c.movements) {
      const lane = c.laneOf.get(m.id);
      const bx = c.streamX - K.laneGap - (lane + 1) * K.lane + (K.lane - K.bar);
      const bar = { m, col: c, x: bx, cx: bx + K.bar / 2, y0: yOf(m.start), y1: yOf(m.end + 1), w: K.bar };
      bars.push(bar);
      barOf.set(m.id, bar);
    }
  }

  // --- resolve the stream top-down: each item wants its anchor on its year, and is pushed
  // down by the one above it. Within a year, the movement header goes first.
  for (const it of items) {
    if (it.kind === 'figure') it.cy = yOf(it.year + 0.5);
    else it.cy = yOf(it.year);
    if (it.kind === 'movement') it.cy = barOf.get(it.id).y0;
  }
  const order = { movement: 0, event: 1, figure: 2 };
  for (const c of cols) {
    const col = items.filter((it) => it.col === c).sort((a, b) => a.cy - b.cy || order[a.kind] - order[b.kind]);
    let floor = -Infinity;
    for (const it of col) {
      it.y = Math.max(it.cy - it.anchor, floor);
      floor = it.y + it.h + K.itemGap;
    }
  }

  // --- figures: circle on the bar at the defining year, label in the stream
  const figures = items.filter((it) => it.kind === 'figure').map((it) => {
    const bar = barOf.get(it.m.id);
    return { ...it, f: data.figures.find((f) => f.id === it.id), bar, cx: bar.cx };
  });
  const headers = items.filter((it) => it.kind === 'movement').map((it) => ({ ...it, bar: barOf.get(it.id) }));

  // --- influences: from the parent bar, a few years before the child begins, down to the
  // child's head, so a lineage reads as something flowing into something
  const influences = [];
  for (const b of bars) {
    for (const pid of b.m.influences) {
      const pb = barOf.get(pid);
      if (!pb) continue;
      const fromYear = Math.min(Math.max(b.m.start - 6, pb.m.start), pb.m.end);
      influences.push({ from: pb, to: b, x0: pb.cx, y0: yOf(fromYear), x1: b.cx, y1: b.y0 });
    }
  }

  const events = data.events.map((e) => ({ e, y: yOf(e.year + 0.5) }));

  // turning-point notes in the gutter, pushed apart top-down (desktop only)
  const notes = [];
  if (!small) {
    const w = axisX - 62;
    let floor = -Infinity;
    for (const ev of events.filter((v) => v.e.major)) {
      const lines = wrap(ev.e.label, w, font(K.meta), measure);
      const h = lines.length * K.meta.line;
      const y = Math.max(ev.y - K.meta.line / 2, floor);
      notes.push({ ...ev, lines, y: y, h, x: axisX - 8, w });
      floor = y + h + 8;
    }
  }

  const lastItem = Math.max(...items.map((it) => it.y + it.h));
  const total = Math.max(Y[years], lastItem);

  return {
    small, K, cols, axisX, width, total, yOf, yearAt,
    bars, barOf, headers, figures, influences, events, notes,
    stream: small ? items.filter((it) => it.kind === 'event') : [],
  };
}
