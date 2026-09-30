/**
 * Layer 3 of Card Tricks: the type.
 *
 * Every card uses the same handful of slots, so the layer is a fixed anatomy
 * with the words poured in:
 *
 *   label ········································· meta      header row, on the margin
 *   HERO value                                   aside      the reading, and what it means
 *   unit
 *
 *                     (the figure lives here)
 *
 *   footer — tabs, a scale, or a caption                    anchored to the bottom margin
 *
 * Hierarchy comes from two things only: a short size scale (hero, aside, secondary, label,
 * micro) and three ink tiers — primary, secondary, tertiary — which are the one ink colour
 * at falling opacity. No colour ever carries hierarchy; that's what keeps the type sitting
 * *on* the gradient instead of fighting it.
 *
 * Sizes and positions are in card pixels at the 320px card width, and the whole layer is
 * scaled as one. The measurements were read off the reference card this study started
 * from, which happened to be screenshotted at exactly 320 wide.
 *
 * The layer is DOM, not canvas — real text keeps its hinting, selection and accessibility,
 * and the composite can stack it over the two canvases as-is.
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
      range('heroWeight', 'Hero weight', 100, 900, 10, 340),
      range('textWeight', 'Text weight', 100, 900, 10, 330),
      range('heroTracking', 'Hero tracking (em)', -0.1, 0.05, 0.005, -0.015),
      choice('numerals', 'Numerals', [['proportional', 'Proportional'], ['tabular', 'Tabular']], 'proportional'),
    ],
  },
  {
    id: 'scale',
    title: 'Scale',
    dials: [
      range('hero', 'Hero', 20, 120, 1, 60),
      range('aside', 'Aside value', 8, 48, 0.5, 23),
      range('secondary', 'Secondary', 8, 32, 0.5, 15.5),
      range('label', 'Label', 7, 20, 0.5, 12),
      range('micro', 'Micro', 6, 16, 0.5, 10.5),
    ],
  },
  {
    id: 'layout',
    title: 'Layout',
    dials: [
      range('pad', 'Margin', 8, 48, 1, 24),
      range('heroTop', 'Hero top', 24, 320, 1, 70),
      range('unitGap', 'Unit gap', -10, 30, 1, 6),
      range('asideRise', 'Aside rise', -40, 60, 1, 14),
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
      range('secondary', 'Secondary', 0, 1, 0.01, 0.82),
      range('tertiary', 'Tertiary', 0, 1, 0.01, 0.5),
    ],
  },
  {
    id: 'content',
    title: 'Content',
    dials: [
      text('label', 'Label', 'Card Tricks'),
      choice('metaKind', 'Meta', [['text', 'Text'], ['picker', 'Picker'], ['arrow', 'Arrow'], ['none', 'None']], 'text'),
      text('metaLabel', 'Meta label', 'Sep'),
      text('metaValue', 'Meta value', '2026'),
      text('value', 'Hero value', '3'),
      text('unit', 'Unit', 'layers, one card'),
      choice('unitPlace', 'Unit sits', [['below', 'Below'], ['inline', 'Inline'], ['none', 'None']], 'below'),
      choice('unitTone', 'Unit ink', [['primary', 'Primary'], ['tertiary', 'Tertiary']], 'primary'),
      text('asideValue', 'Aside value', ''),
      text('asideUnit', 'Aside unit', ''),
      choice('footerKind', 'Footer', [['caption', 'Caption'], ['tabs', 'Tabs'], ['scale', 'Scale'], ['none', 'None']], 'caption'),
      text('footer', 'Footer items (comma)', 'WebGL, Canvas, Type'),
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
 * Words and the few layout changes each card needs, keyed by the experiment's slug.
 *
 * The hero is each experiment's signature number — the one it leads with, or shows in
 * its own interface — so the card says what the thing *is* before the title does. The
 * aside carries a second count when there's a good one, and the footer is the techniques
 * unless the experiment has its own vocabulary: the bar field's four letters are tabs,
 * the Sankey's categories are a scale with Graymail lit.
 */
const card = (label, month, value, unit, techniques, extra = {}) => ({
  ...extra,
  content: {
    label, metaKind: 'text', metaLabel: month, metaValue: '2026', value, unit,
    asideValue: '', asideUnit: '', footerKind: 'caption', footer: techniques,
    ...(extra.content || {}),
  },
});

export const TYPE_PRESETS = {
  'card-tricks': card('Card Tricks', 'Sep', '3', 'layers, one card', 'WebGL, Canvas, Type', {
    content: { asideValue: '15', asideUnit: 'figures' },
  }),
  atlas: card('Been There, Spun That', 'Jun', '4,068', 'check-ins since 2011', 'Cobe, WebGL, Geospatial', {
    scale: { hero: 44 }, layout: { heroTop: 56, asideRise: 10 },
    content: { asideValue: '28', asideUnit: 'countries' },
  }),
  'bar-field': card('Raising the Bar', 'Sep', '4', 'letters, four instruments', 'O, M, A, R', {
    content: { footerKind: 'tabs' },
  }),
  farsh: card('Knot a Pixel', 'Sep', '478k', 'yarn tufts, each one animated', 'Three.js, GLSL, Instancing', {
    layout: { heroTop: 62 },
  }),
  'naughty-narwal': card('Point Taken', 'Sep', '20,000', 'points, drawn one by one', 'p5.js, Point fields', {
    scale: { hero: 52 }, layout: { heroTop: 62 },
    content: { asideValue: '6', asideUnit: 'shapes' },
  }),
  sankey: card('Flow State', 'Jun', '80%', 'of the flow was graymail', 'Spam, Malicious, Graymail, Suspicious', {
    scale: { hero: 44 }, layout: { heroTop: 56 },
    content: { footerKind: 'scale', active: 2 },
  }),
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
const CHEVRON = '<svg viewBox="0 0 10 6" width="0.75em" height="0.45em" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

      const meta = c.metaKind === 'text'
        ? `<span style="color:${tone('tertiary')}">${esc(c.metaLabel)}</span><span style="color:${tone('primary')};margin-left:0.45em">${numeric(c.metaValue)}</span>`
        : c.metaKind === 'picker'
        ? `<span style="color:${tone('tertiary')}">${esc(c.metaLabel)}</span><span style="color:${tone('primary')};margin-left:0.75em">${numeric(c.metaValue)}</span><span style="color:${tone('secondary')};margin-left:0.7em;display:inline-flex">${CHEVRON}</span>`
        : c.metaKind === 'arrow'
          ? `<span style="color:${tone('secondary')};display:inline-flex">${ARROW}</span>`
          : '';

      const unitColor = tone(c.unitTone);
      const unitInline = c.unitPlace === 'inline' && c.unit
        ? `<span style="font-size:${s.secondary}px;color:${unitColor};margin-left:0.3em;letter-spacing:0">${esc(c.unit)}</span>` : '';
      const unitBelow = c.unitPlace === 'below' && c.unit
        ? `<div style="font-size:${s.secondary}px;color:${unitColor};margin-top:${l.unitGap}px">${esc(c.unit)}</div>` : '';
      const aside = c.asideValue || c.asideUnit
        ? `<div style="position:relative;top:${-l.asideRise}px;white-space:nowrap"><span style="font-size:${s.aside}px;color:${tone('primary')};font-weight:${font.heroWeight}">${numeric(c.asideValue)}</span>${c.asideUnit ? `<span style="font-size:${s.micro}px;color:${tone('secondary')};margin-left:0.35em">${esc(c.asideUnit)}</span>` : ''}</div>`
        : '';

      let footer = '';
      if (c.footerKind === 'tabs' && items.length) {
        footer = `<div style="display:flex;justify-content:center;align-items:baseline;gap:${l.tabGap}px">${items.map((it, i) => (i === active
          ? `<span style="position:relative;font-size:${s.secondary}px;color:${tone('primary')}">${esc(it)}<i style="position:absolute;left:50%;top:${-l.dotRise}px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:${tone('primary')}"></i></span>`
          : `<span style="font-size:${s.label}px;color:${tone('tertiary')}">${esc(it)}</span>`)).join('')}</div>`;
      } else if (c.footerKind === 'scale' && items.length) {
        footer = `<div style="display:flex;justify-content:space-between;align-items:baseline">${items.map((it, i) => `<span style="font-size:${i === active ? s.label : s.micro}px;color:${tone(i === active ? 'primary' : 'tertiary')}">${esc(it)}</span>`).join('')}</div>`;
      } else if (c.footerKind === 'caption' && items.length) {
        footer = `<div style="font-size:${s.label}px;color:${tone('tertiary')}">${items.map(esc).join(' · ')}</div>`;
      }

      root.innerHTML = `
        <div style="position:absolute;left:${l.pad}px;right:${l.pad}px;top:${l.pad}px;display:flex;justify-content:space-between;align-items:center;font-size:${s.label}px;min-height:${s.label}px">
          <span style="color:${tone('secondary')}">${esc(c.label)}</span>
          <span style="display:inline-flex;align-items:center">${meta}</span>
        </div>
        <div style="position:absolute;left:${l.pad}px;right:${l.pad}px;top:${l.heroTop}px;display:flex;justify-content:space-between;align-items:baseline">
          <div>
            <span style="font-size:${s.hero}px;font-weight:${font.heroWeight};letter-spacing:${font.heroTracking}em">${numeric(c.value)}</span>${unitInline}
            ${unitBelow}
          </div>
          ${aside}
        </div>
        ${footer ? `<div style="position:absolute;left:${l.pad}px;right:${l.pad}px;bottom:${l.footer}px">${footer}</div>` : ''}
      `;
    },
  };
}
