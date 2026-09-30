/**
 * Layer 1 of Card Tricks: the ground a card is painted on.
 *
 * These grounds read as a mesh gradient, but they're closer to how a designer builds
 * one by hand: a flat ground, then a handful of heavily blurred ellipses stacked on top of
 * each other. So that's the model here. A *field* is one soft ellipse (centre, width,
 * height, opacity, feather), painted over the ground in list order, then the whole thing
 * is nudged by a low-frequency warp so the edges stop looking like ellipses, toned, and
 * finished with a vignette and film grain.
 *
 * Blending happens in OKLab by default. Mixing green into brown in sRGB goes through a
 * muddy grey; in OKLab it stays luminous, which is most of what makes these cards feel
 * lit rather than printed. The Space switch is there to see that difference, not to use.
 *
 * Geometry is in card fractions — x and width across, y and height down — so a palette
 * survives a format change: the same fields laid on a tall card and a landscape one keep
 * their proportions instead of their pixels.
 *
 * `createBackground(canvas)` is the whole surface: the experiment cards share one across
 * the page (see runtime.js).
 */

export const MAX_FIELDS = 8;

export const FORMATS = {
  tall: { label: 'Tall', w: 320, h: 624 },
  portrait: { label: 'Portrait', w: 320, h: 436 },
  landscape: { label: 'Landscape', w: 320, h: 288 },
};

const range = (id, label, min, max, step, value) => ({ kind: 'range', id, label, min, max, step, value });
const choice = (id, label, options, value) => ({ kind: 'choice', id, label, options, value });

/** The panel's groups, as data. State is keyed the same way: `bg.texture.grain`. */
export const BG_GROUPS = [
  {
    id: 'format',
    title: 'Format',
    dials: [
      choice('shape', 'Shape', [['tall', 'Tall'], ['portrait', 'Portrait'], ['landscape', 'Land']], 'tall'),
      range('corner', 'Corner', 0, 32, 1, 0),
    ],
  },
  {
    id: 'blend',
    title: 'Blend',
    dials: [
      choice('mode', 'Mode', [['layer', 'Layer'], ['mix', 'Mix']], 'layer'),
      choice('space', 'Space', [['oklab', 'OKLab'], ['linear', 'Linear'], ['srgb', 'sRGB']], 'oklab'),
      range('groundPull', 'Ground pull (mix)', 0.01, 1, 0.01, 0.43),
    ],
  },
  {
    id: 'warp',
    title: 'Warp',
    dials: [
      range('amount', 'Amount', 0, 0.4, 0.005, 0.09),
      range('scale', 'Scale', 0.2, 6, 0.05, 3.85),
    ],
  },
  {
    id: 'tone',
    title: 'Tone',
    dials: [
      range('exposure', 'Exposure', -1, 1, 0.01, 0),
      range('contrast', 'Contrast', 0.5, 1.5, 0.01, 1),
      range('saturation', 'Saturation', 0, 2, 0.01, 1),
      range('hue', 'Hue shift', -180, 180, 1, 0),
    ],
  },
  {
    id: 'texture',
    title: 'Texture',
    dials: [
      range('grain', 'Grain', 0, 0.3, 0.005, 0),
      range('grainSize', 'Grain size', 0.5, 4, 0.05, 0.55),
      range('grainMids', 'Grain in mids', 0, 1, 0.01, 0.6),
      range('vignette', 'Vignette', 0, 0.6, 0.01, 0.14),
      range('vignetteSpread', 'Vignette spread', 0.05, 1, 0.01, 0.5),
    ],
  },
  {
    id: 'motion',
    title: 'Motion',
    dials: [
      range('speed', 'Speed', 0, 3, 0.01, 0.6),
      range('drift', 'Drift', 0, 1, 0.01, 0.35),
      range('breathe', 'Breathe', 0, 1, 0.01, 0.25),
      range('flow', 'Warp flow', 0, 2, 0.01, 0.4),
      range('grainFps', 'Grain fps', 0, 30, 1, 12),
    ],
  },
];

export const FIELD_DIALS = [
  range('x', 'X', -0.5, 1.5, 0.005, 0.5),
  range('y', 'Y', -0.5, 1.5, 0.005, 0.5),
  range('rx', 'Width', 0.02, 1.5, 0.005, 0.4),
  range('ry', 'Height', 0.02, 1.5, 0.005, 0.2),
  range('opacity', 'Opacity', 0, 1, 0.01, 1),
  range('feather', 'Feather', 0.02, 1, 0.01, 1),
];

/** Clamp to the dial's range and snap to its step, which a range input would do for free. */
export function snapDial(spec, v) {
  if (spec.kind !== 'range') return v;
  const n = Math.min(spec.max, Math.max(spec.min, Number(v)));
  const snapped = Math.round((n - spec.min) / spec.step) * spec.step + spec.min;
  const decimals = (String(spec.step).split('.')[1] || '').length;
  return Number(snapped.toFixed(decimals));
}

const field = (color, x, y, rx, ry, opacity = 1, feather = 1) => ({ color, x, y, rx, ry, opacity, feather });

/**
 * One palette per experiment card, keyed by the experiment's prototype slug so the three
 * layers of a card can find each other. Each is lifted from the experiment itself — its
 * own colours, and where it has one, its own light — so a card reads as a still of the
 * piece rather than a decoration for it. Fields are listed bottom to top, since in Layer
 * mode that's the paint order. Anything a preset leaves out takes the dial default.
 *
 * The formats are mixed on purpose — a portfolio grid of one shape is a spreadsheet.
 */
export const PRESETS = [
  {
    id: 'card-tricks',
    name: 'Card Tricks',
    note: 'the moss card it started from',
    bg: {
      format: { shape: 'tall' },
      ground: '#a8c09c',
      fields: [
        field('#b8d2a6', 0.55, 0.55, 0.7, 0.25),
        field('#9c9d98', 0.5, 1.02, 0.9, 0.28, 0.95),
        field('#938656', 0.62, 0.27, 1.1, 0.12, 0.7),
        field('#468f4b', 0.45, -0.02, 1.1, 0.24, 1, 0.9),
        field('#6d9463', -0.05, 0.55, 0.22, 0.5, 0.5),
      ],
    },
  },
  {
    id: 'atlas',
    name: 'Been There, Spun That',
    note: 'electric blue · a lit globe',
    bg: {
      format: { shape: 'landscape' },
      ground: '#3558c9',
      fields: [
        field('#1d3799', 0.1, 1.0, 0.8, 0.6),
        field('#7f97ea', 0.35, 0.2, 0.7, 0.35, 0.7),
        field('#dfe5f4', 0.74, 0.58, 0.34, 0.42, 0.8),
        field('#ffffff', 0.7, 0.5, 0.12, 0.14, 0.35),
      ],
    },
  },
  {
    id: 'bar-field',
    name: 'Raising the Bar',
    note: 'dark room · magenta bloom',
    bg: {
      format: { shape: 'tall' },
      ground: '#140c16',
      texture: { vignette: 0.3 },
      fields: [
        field('#2a1631', 0.5, 0.0, 1.1, 0.4),
        field('#b8408f', 0.5, 0.62, 0.75, 0.2, 0.75),
        field('#ff7ac8', 0.5, 0.62, 0.32, 0.06, 0.45),
        field('#0c070d', 0.5, 1.05, 1.0, 0.25),
      ],
    },
  },
  {
    id: 'farsh',
    name: 'Knot a Pixel',
    note: 'madder red · indigo · wool',
    bg: {
      format: { shape: 'portrait' },
      ground: '#8a2a25',
      texture: { grain: 0, grainSize: 0.8, vignette: 0.32, vignetteSpread: 0.6 },
      fields: [
        field('#b8573a', 0.5, -0.05, 1.0, 0.4),
        field('#c98f45', 0.18, 0.3, 0.32, 0.2, 0.5),
        field('#5a1620', 0.5, 0.62, 0.7, 0.32, 0.9),
        field('#1f2748', 0.5, 1.05, 1.0, 0.38),
      ],
    },
  },
  {
    id: 'naughty-narwal',
    name: 'Point Taken',
    note: 'ink black · the ground is points',
    bg: {
      format: { shape: 'portrait' },
      ground: '#0c0d10',
      texture: { grain: 0, grainSize: 1.4, grainMids: 0.15 },
      fields: [
        field('#1b2330', 0.5, 0.0, 1.0, 0.45),
        field('#4f6190', 0.5, 0.64, 0.6, 0.32, 0.55),
        field('#9fb3d9', 0.5, 0.6, 0.24, 0.14, 0.3),
        field('#07080a', 0.5, 1.08, 1.0, 0.22),
      ],
    },
  },
  {
    id: 'sankey',
    name: 'Flow State',
    note: 'coral · teal · the graymail band',
    bg: {
      format: { shape: 'landscape' },
      ground: '#6fae9a',
      fields: [
        field('#33c6a3', 0.85, 0.95, 0.75, 0.5),
        field('#e35c4d', 0.1, 0.05, 0.65, 0.45, 0.9),
        field('#f0934e', 0.45, 0.22, 0.5, 0.25, 0.7),
        field('#a9a8a2', 0.5, 0.64, 1.2, 0.13, 0.6),
      ],
    },
  },
];

export function defaultState() {
  const bg = {};
  for (const g of BG_GROUPS) bg[g.id] = Object.fromEntries(g.dials.map((d) => [d.id, d.value]));
  bg.ground = '#cccccc';
  bg.fields = [];
  return bg;
}

/** A full, independent state for a preset — defaults with the preset's overrides on top. */
export function presetState(id) {
  const p = PRESETS.find((x) => x.id === id) || PRESETS[0];
  return mergeState(defaultState(), p.bg);
}

/** Lay a partial state (a preset, or pasted JSON) over a full one, group by group. */
export function mergeState(base, over) {
  const out = structuredClone(base);
  for (const g of BG_GROUPS) {
    if (over[g.id]) {
      for (const d of g.dials) {
        if (over[g.id][d.id] !== undefined) out[g.id][d.id] = snapDial(d, over[g.id][d.id]);
      }
    }
  }
  if (typeof over.ground === 'string') out.ground = over.ground;
  if (Array.isArray(over.fields)) {
    out.fields = over.fields.slice(0, MAX_FIELDS).map((f) => {
      const full = { color: typeof f.color === 'string' ? f.color : '#ffffff' };
      for (const d of FIELD_DIALS) full[d.id] = snapDial(d, f[d.id] ?? d.value);
      return full;
    });
  }
  return out;
}

// ── colour ────────────────────────────────────────────────────────────────

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const SPACES = { srgb: 0, linear: 1, oklab: 2 };

/** A hex colour in whichever space the shader is blending in. */
function inSpace(hex, space) {
  const rgb = hexToRgb(hex);
  if (space === 'srgb') return rgb;
  const lin = rgb.map(toLinear);
  return space === 'linear' ? lin : linearToOklab(lin);
}

// ── shader ────────────────────────────────────────────────────────────────

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
#define MAX_FIELDS ${MAX_FIELDS}

varying vec2 vUv;

uniform float uAspect;
uniform float uPxScale;
uniform int uCount;
uniform vec4 uGeo[MAX_FIELDS];
uniform vec2 uShape[MAX_FIELDS];
uniform vec3 uCol[MAX_FIELDS];
uniform vec3 uGround;
uniform int uSpace;
uniform int uMode;
uniform float uGroundPull;
uniform float uWarp;
uniform float uWarpScale;
uniform float uWarpPhase;
uniform float uExposure;
uniform float uContrast;
uniform float uSaturation;
uniform float uHue;
uniform float uGrain;
uniform float uGrainSize;
uniform float uGrainMids;
uniform float uGrainSeed;
uniform float uVignette;
uniform float uVignetteSpread;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 9.3);
    a *= 0.5;
  }
  return s;
}

vec3 toLinear(vec3 c) {
  vec3 lo = c / 12.92;
  vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(lo, hi, step(0.04045, c));
}

vec3 toSrgb(vec3 c) {
  c = max(c, 0.0);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(0.0031308, c));
}

vec3 linToOklab(vec3 c) {
  c = max(c, 0.0);
  float l = pow(0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b, 1.0 / 3.0);
  float m = pow(0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b, 1.0 / 3.0);
  float s = pow(0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b, 1.0 / 3.0);
  return vec3(0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
              1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
              0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}

vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
              -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
              -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

void main() {
  // Warp is sampled in square space so it isn't stretched down a tall card.
  vec2 q = vec2(vUv.x, vUv.y * uAspect) * uWarpScale;
  vec2 w = vec2(fbm(q + vec2(0.0, uWarpPhase)),
                fbm(q + vec2(5.2, 1.3 - uWarpPhase * 0.8))) - 0.47;
  vec2 uv = vUv + w * uWarp * vec2(1.0, 1.0 / uAspect);

  vec3 c = uGround;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < MAX_FIELDS; i++) {
    if (i >= uCount) break;
    vec4 g = uGeo[i];
    float t = length((uv - g.xy) / max(g.zw, vec2(0.001)));
    float a = uShape[i].x * (1.0 - smoothstep(1.0 - uShape[i].y, 1.0, t));
    if (uMode == 0) {
      c = mix(c, uCol[i], a);
    } else {
      acc += uCol[i] * a;
      wsum += a;
    }
  }
  if (uMode == 1) c = (acc + uGround * uGroundPull) / (wsum + uGroundPull);

  vec3 lin = uSpace == 0 ? toLinear(c) : (uSpace == 1 ? c : oklabToLin(c));
  lin *= exp2(uExposure);

  // Saturation and hue in OKLab, where scaling chroma doesn't also shift lightness.
  vec3 lab = linToOklab(lin);
  float cs = cos(uHue);
  float sn = sin(uHue);
  lab.yz = mat2(cs, sn, -sn, cs) * lab.yz * uSaturation;
  vec3 col = toSrgb(oklabToLin(lab));
  col = (col - 0.5) * uContrast + 0.5;

  vec2 e = abs(vUv - 0.5) * 2.0;
  float r = length(e) / 1.41421;
  col *= 1.0 - uVignette * smoothstep(1.0 - uVignetteSpread, 1.0, r);

  // Two hashes summed give a triangular distribution: finer, less speckly than one.
  vec2 gp = floor(gl_FragCoord.xy / max(uGrainSize * uPxScale, 1.0));
  float n = hash(gp + uGrainSeed * vec2(13.1, 7.7)) + hash(gp * 1.7 + uGrainSeed * 3.1 + 2.3) - 1.0;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  float mids = mix(1.0, 4.0 * luma * (1.0 - luma), uGrainMids);
  col += n * uGrain * mids;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader failed');
  return s;
}

/**
 * Where each field sits at time t. Motion only ever offsets the rest pose, so the handles,
 * the dials and a paused card all agree on where a field "is".
 */
export function animatedFields(bg, t) {
  const m = bg.motion;
  const s = t * m.speed;
  return bg.fields.map((f, i) => {
    const ph = i * 2.39996;
    const k = 1 + m.breathe * 0.35 * Math.sin(s * 0.9 + ph * 1.3);
    return {
      ...f,
      x: f.x + m.drift * 0.22 * Math.sin(s * (0.7 + 0.13 * i) + ph),
      y: f.y + m.drift * 0.12 * Math.cos(s * (0.5 + 0.11 * i) + ph * 1.7),
      rx: f.rx * k,
      ry: f.ry * (2 - k),
    };
  });
}

export function createBackground(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL unavailable');

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link failed');
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  const loc = (name) => (u[name] ??= gl.getUniformLocation(prog, name));

  const geo = new Float32Array(MAX_FIELDS * 4);
  const shape = new Float32Array(MAX_FIELDS * 2);
  const col = new Float32Array(MAX_FIELDS * 3);

  return {
    canvas,
    /** Size in device pixels. */
    setSize(w, h) {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    },
    /**
     * Draw into the top-left `w × h` of a larger canvas, so one canvas sized for the
     * biggest card can serve every card without being reallocated between them.
     */
    viewport(w, h) {
      gl.viewport(0, canvas.height - h, w, h);
    },
    /**
     * `pxScale` is device pixels per card pixel, so grain stays the same size in card
     * space whether this is the full stage or a 40px thumbnail.
     */
    render(bg, t, pxScale) {
      const f = FORMATS[bg.format.shape];
      const fields = animatedFields(bg, t);
      const space = bg.blend.space;
      geo.fill(0);
      shape.fill(0);
      col.fill(0);
      fields.forEach((fl, i) => {
        geo.set([fl.x, fl.y, fl.rx, fl.ry], i * 4);
        shape.set([fl.opacity, fl.feather], i * 2);
        col.set(inSpace(fl.color, space), i * 3);
      });
      gl.uniform1f(loc('uAspect'), f.h / f.w);
      gl.uniform1f(loc('uPxScale'), pxScale);
      gl.uniform1i(loc('uCount'), fields.length);
      gl.uniform4fv(loc('uGeo'), geo);
      gl.uniform2fv(loc('uShape'), shape);
      gl.uniform3fv(loc('uCol'), col);
      gl.uniform3fv(loc('uGround'), inSpace(bg.ground, space));
      gl.uniform1i(loc('uSpace'), SPACES[space]);
      gl.uniform1i(loc('uMode'), bg.blend.mode === 'mix' ? 1 : 0);
      gl.uniform1f(loc('uGroundPull'), bg.blend.groundPull);
      gl.uniform1f(loc('uWarp'), bg.warp.amount);
      gl.uniform1f(loc('uWarpScale'), bg.warp.scale);
      gl.uniform1f(loc('uWarpPhase'), t * bg.motion.flow * 0.1);
      gl.uniform1f(loc('uExposure'), bg.tone.exposure);
      gl.uniform1f(loc('uContrast'), bg.tone.contrast);
      gl.uniform1f(loc('uSaturation'), bg.tone.saturation);
      gl.uniform1f(loc('uHue'), (bg.tone.hue * Math.PI) / 180);
      gl.uniform1f(loc('uGrain'), bg.texture.grain);
      gl.uniform1f(loc('uGrainSize'), bg.texture.grainSize);
      gl.uniform1f(loc('uGrainMids'), bg.texture.grainMids);
      gl.uniform1f(loc('uGrainSeed'), bg.motion.grainFps > 0 ? Math.floor(t * bg.motion.grainFps) % 61 : 0);
      gl.uniform1f(loc('uVignette'), bg.texture.vignette);
      gl.uniform1f(loc('uVignetteSpread'), bg.texture.vignetteSpread);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
