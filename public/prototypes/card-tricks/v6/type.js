/**
 * Layer 3 of Card Tricks: the type.
 *
 * These cards are covers for experiments, not dashboard widgets, so the name leads and
 * everything else supports it:
 *
 *   No. 04 ·········································· Sep 2026   header, on the margin
 *   Title, set large,
 *   allowed to wrap                                              the hero
 *   20,000 points, drawn one by one                              the stat, one quiet line
 *
 *                     (the line work lives here)
 *
 *   p5.js · Canvas · Point fields                                techniques, on the margin
 *
 * Hierarchy comes from two things only: a short size scale (title, stat, label) and three
 * ink tiers — primary, secondary, tertiary — which are the one ink colour at falling
 * opacity. No colour ever carries hierarchy; that's what keeps the type sitting *on* the
 * gradient instead of fighting it. Within the stat the number takes primary ink and the
 * words take secondary, so it scans as a figure without competing with the title.
 *
 * Each slot carries a `ct-*` class and reads its motion from CSS custom properties
 * (`--ct-stat`, `--ct-arrow`, …) that default to the resting pose, so the motion layer
 * can animate a reveal by setting variables on the root — no re-render per frame.
 *
 * Sizes and positions are in card pixels at the 320px card width, and the whole layer is
 * scaled as one. The layer is DOM, not canvas — real text keeps its hinting, selection
 * and accessibility, and the composite can stack it over the two canvases as-is.
 */

const range = (id, label, min, max, step, value) => ({ kind: 'range', id, label, min, max, step, value });
const choice = (id, label, options, value) => ({ kind: 'choice', id, label, options, value });
const text = (id, label, value) => ({ kind: 'text', id, label, value });

export const FAMILIES = {
  outfit: "'Card Outfit', system-ui, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
  serif: "ui-serif, 'New York', Georgia, serif",
};

export const TYPE_GROUPS = [
  {
    id: 'font',
    title: 'Font',
    dials: [
      choice('family', 'Family', [['outfit', 'Outfit'], ['system', 'System'], ['serif', 'Serif']], 'outfit'),
      range('titleWeight', 'Title weight', 100, 900, 10, 360),
      range('textWeight', 'Text weight', 100, 900, 10, 330),
      range('titleTracking', 'Title tracking (em)', -0.1, 0.05, 0.005, -0.02),
      range('titleLeading', 'Title leading', 0.8, 1.4, 0.01, 1.04),
      choice('numerals', 'Numerals', [['proportional', 'Proportional'], ['tabular', 'Tabular']], 'proportional'),
    ],
  },
  {
    id: 'scale',
    title: 'Scale',
    dials: [
      range('title', 'Title', 16, 80, 0.5, 36),
      range('stat', 'Stat', 8, 28, 0.5, 14),
      range('label', 'Label', 7, 20, 0.5, 11.5),
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    dials: [
      choice('titleAt', 'Title sits', [['top', 'Top'], ['bottom', 'Bottom']], 'top'),
      range('pad', 'Margin', 8, 48, 1, 24),
      range('titleTop', 'Title top', 24, 320, 1, 52),
      range('titleWidth', 'Title measure', 100, 300, 1, 272),
      range('statGap', 'Stat gap', 0, 40, 1, 10),
      range('footer', 'Footer inset', 8, 120, 1, 22),
      range('tabGap', 'Tab gap', 8, 80, 1, 38),
      range('dotRise', 'Tab dot rise', 6, 40, 1, 22),
    ],
  },
  {
    id: 'ink',
    title: 'Ink',
    dials: [
      range('primary', 'Primary', 0, 1, 0.01, 1),
      range('secondary', 'Secondary', 0, 1, 0.01, 0.78),
      range('tertiary', 'Tertiary', 0, 1, 0.01, 0.5),
    ],
  },
  {
    id: 'content',
    title: 'Content',
    dials: [
      text('title', 'Title', 'Card Tricks'),
      text('statValue', 'Stat value', '3'),
      text('statUnit', 'Stat words', 'layers, 15 figures'),
      text('index', 'Index', 'No. 06'),
      choice('metaKind', 'Meta', [['text', 'Text'], ['arrow', 'Arrow'], ['none', 'None']], 'text'),
      text('metaLabel', 'Meta label', 'Sep'),
      text('metaValue', 'Meta value', '2026'),
      choice('footerKind', 'Footer', [['caption', 'Caption'], ['tabs', 'Tabs'], ['scale', 'Scale'], ['none', 'None']], 'caption'),
      text('footer', 'Footer items (comma)', 'WebGL, OKLab, Type'),
      range('active', 'Active item', 0, 7, 1, 0),
    ],
  },
];

export function snapDial(spec, v) {
  if (spec.kind === 'text') return String(v);
  if (spec.kind !== 'range') return v;
  const n = Math.min(spec.max, Math.max(spec.min, Number(v)));
  const snapped = Math.round((n - spec.min) / spec.step) * spec.step + spec.min;
  const decimals = (String(spec.step).split('.')[1] || '').length;
  return Number(snapped.toFixed(decimals));
}

export function defaultType() {
  const t = { inkColor: '#ffffff' };
  for (const g of TYPE_GROUPS) t[g.id] = Object.fromEntries(g.dials.map((d) => [d.id, d.value]));
  return t;
}

/**
 * Words per card, keyed by the experiment's slug. The index numbers the experiments in
 * the order they were made, so the grid reads as a catalogue. The stat is the one number
 * each write-up leads with, demoted to a single supporting line under the name.
 */
const card = (index, title, month, statValue, statUnit, techniques, extra = {}) => ({
  ...extra,
  content: {
    index, title, metaKind: 'text', metaLabel: month, metaValue: '2026',
    statValue, statUnit, footerKind: 'caption', footer: techniques,
    ...(extra.content || {}),
  },
});

export const TYPE_PRESETS = {
  atlas: card('No. 01', 'Been There, Spun That', 'Jun', '4,068', 'check-ins since 2011', 'Cobe, WebGL, Geospatial', {
    scale: { title: 32 }, layout: { titleTop: 48, titleWidth: 176 },
  }),
  sankey: card('No. 02', 'Flow State', 'Jun', '80%', 'of the flow was graymail', 'SVG, Path geometry, Motion', {
    scale: { title: 32 }, layout: { titleTop: 48 },
  }),
  farsh: card('No. 03', 'Knot a Pixel', 'Sep', '478k', 'yarn tufts, each one animated', 'Three.js, GLSL, Instancing'),
  'naughty-narwal': card('No. 04', 'Point Taken', 'Sep', '20,000', 'points, drawn one by one', 'p5.js, Canvas, Point fields'),
  'bar-field': card('No. 05', 'Raising the Bar', 'Sep', '4', 'letters, four instruments', 'WebGPU, WGSL, Web Audio'),
  'card-tricks': card('No. 06', 'Card Tricks', 'Sep', '3', 'layers, 15 figures', 'WebGL, OKLab, Type'),
};

export function mergeType(base, over = {}) {
  const out = structuredClone(base);
  if (typeof over.inkColor === 'string') out.inkColor = over.inkColor;
  for (const g of TYPE_GROUPS) {
    for (const d of g.dials) {
      const v = over[g.id]?.[d.id];
      if (v !== undefined) out[g.id][d.id] = snapDial(d, v);
    }
  }
  return out;
}

export const typePresetState = (id) => mergeType(defaultType(), TYPE_PRESETS[id]);

// ── rendering ─────────────────────────────────────────────────────────────

let fontInjected = false;
function ensureFont() {
  if (fontInjected) return;
  fontInjected = true;
  const url = new URL('../outfit-wght.woff2', import.meta.url);
  const style = document.createElement('style');
  style.textContent = `@font-face { font-family: 'Card Outfit'; src: url('${url}') format('woff2'); font-weight: 100 900; font-display: block; }`;
  document.head.append(style);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** A leading hyphen on a number is a minus sign; typeset it as one. */
const numeric = (s) => esc(s).replace(/^-(?=\d)/, '\u2212');

const ARROW = '<svg viewBox="0 0 10 10" width="0.9em" height="0.9em" aria-hidden="true"><path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4" fill="none" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function createType(root) {
  ensureFont();
  root.classList.add('vc-type');

  return {
    root,
    /** `W`/`H` is the card in card pixels; `k` is CSS pixels per card pixel. */
    render(t, W, H, k) {
      const { font, scale: s, layout: l, ink, content: c } = t;
      const tone = (tier) => `color-mix(in srgb, ${t.inkColor} ${Math.round(ink[tier] * 100)}%, transparent)`;
      const items = c.footer.split(',').map((x) => x.trim()).filter(Boolean);
      const active = Math.min(c.active, Math.max(0, items.length - 1));

      Object.assign(root.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        width: W + 'px',
        height: H + 'px',
        transform: `scale(${k})`,
        transformOrigin: '0 0',
        pointerEvents: 'none',
        fontFamily: FAMILIES[font.family],
        fontWeight: String(font.textWeight),
        fontVariantNumeric: font.numerals === 'tabular' ? 'tabular-nums' : 'normal',
        color: tone('primary'),
        lineHeight: '1',
        webkitFontSmoothing: 'antialiased',
      });

      const linkArrow = `<span class="ct-arrow" style="display:inline-flex;margin-left:0.5em;color:${tone('primary')};opacity:var(--ct-arrow, 0);transform:translateX(var(--ct-arrow-x, 0px))">${ARROW}</span>`;
      const meta = c.metaKind === 'text'
        ? `<span style="color:${tone('tertiary')}">${esc(c.metaLabel)}</span><span style="color:${tone('primary')};margin-left:0.45em">${numeric(c.metaValue)}</span>${linkArrow}`
        : c.metaKind === 'arrow'
          ? `<span style="color:${tone('secondary')};display:inline-flex">${ARROW}</span>`
          : '';

      const stat = c.statValue || c.statUnit
        ? `<div class="ct-stat" style="margin-top:${l.statGap}px;font-size:${s.stat}px;line-height:1.3;opacity:var(--ct-stat, 1);transform:translateY(var(--ct-stat-y, 0px))"><span style="color:${tone('primary')}">${numeric(c.statValue)}</span>${c.statUnit ? `<span style="color:${tone('secondary')};margin-left:0.35em">${esc(c.statUnit)}</span>` : ''}</div>`
        : '';

      const block = `
        <div class="ct-title" style="transform:translateY(var(--ct-title-y, 0px));font-size:${s.title}px;font-weight:${font.titleWeight};letter-spacing:${font.titleTracking}em;line-height:${font.titleLeading};text-wrap:balance">${esc(c.title)}</div>
        ${stat}`;

      let footer = '';
      if (c.footerKind === 'tabs' && items.length) {
        footer = `<div style="display:flex;justify-content:center;align-items:baseline;gap:${l.tabGap}px">${items.map((it, i) => (i === active
          ? `<span style="position:relative;font-size:${s.stat}px;color:${tone('primary')}">${esc(it)}<i style="position:absolute;left:50%;top:${-l.dotRise}px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:${tone('primary')}"></i></span>`
          : `<span style="font-size:${s.label}px;color:${tone('tertiary')}">${esc(it)}</span>`)).join('')}</div>`;
      } else if (c.footerKind === 'scale' && items.length) {
        footer = `<div style="display:flex;justify-content:space-between;align-items:baseline">${items.map((it, i) => `<span style="font-size:${s.label}px;color:${tone(i === active ? 'primary' : 'tertiary')}">${esc(it)}</span>`).join('')}</div>`;
      } else if (c.footerKind === 'caption' && items.length) {
        footer = `<div style="font-size:${s.label}px;color:${tone('tertiary')}">${items.map(esc).join(' · ')}</div>`;
      }

      // At the bottom the title stacks on the footer, so it grows upward from a fixed line.
      const titlePos = l.titleAt === 'bottom'
        ? `bottom:${l.footer + s.label + 16}px`
        : `top:${l.titleTop}px`;

      root.innerHTML = `
        <div style="position:absolute;left:${l.pad}px;right:${l.pad}px;top:${l.pad}px;display:flex;justify-content:space-between;align-items:center;font-size:${s.label}px;min-height:${s.label}px">
          <span style="color:${tone('tertiary')}">${esc(c.index)}</span>
          <span style="display:inline-flex;align-items:center">${meta}</span>
        </div>
        <div style="position:absolute;left:${l.pad}px;max-width:${Math.min(l.titleWidth, W - 2 * l.pad)}px;${titlePos}">${block}</div>
        ${footer ? `<div style="position:absolute;left:${l.pad}px;right:${l.pad}px;bottom:${l.footer}px">${footer}</div>` : ''}
      `;
    },
  };
}
