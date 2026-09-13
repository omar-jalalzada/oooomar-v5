/**
 * WGSL for the bar field.
 *
 * Pass chain, one command buffer per frame:
 *
 *   field    -> hdr      rgba16float, full res   four letter layers, depth ordered
 *   bright   -> bloomA   half res                luminance threshold
 *   blurH    -> bloomB   half res                separable gaussian, x
 *   blurV    -> bloomA   half res                separable gaussian, y
 *   composite-> surface                          hdr + bloom, tone mapped
 *
 * Every literal here keeps WGSL in its name (and the inline tag) so
 * `node scripts/check-wgsl-literals.mjs` picks all of them up. Never put a backtick
 * inside one of these, including in a comment: it terminates the string, and the only
 * symptom is a parse error naming a shader identifier.
 */

// ── shared WGSL: noise, SDF primitives ─────────────────────────────────────
const COMMON_WGSL = /* wgsl */`
fn hash11(n: f32) -> f32 { return fract(sin(n * 127.1) * 43758.5453); }
fn hash21(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }

fn vnoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2f(1.0, 0.0));
  let c = hash21(i + vec2f(0.0, 1.0));
  let d = hash21(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
  var v = 0.0;
  var amp = 0.5;
  var q = p;
  for (var i = 0; i < 4; i = i + 1) {
    v = v + amp * vnoise(q);
    q = q * 2.03;
    amp = amp * 0.5;
  }
  return v;
}

fn sdBox(p: vec2f, c: vec2f, h: vec2f) -> f32 {
  let d = abs(p - c) - h;
  return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

// Signed distance to a half-plane through pt with unit outward normal n —
// negative inside. max() over several of these is an exact field for a convex
// wedge, and that is how the notches get cut out of the M and the R.
//
// The letters used to be built by min()-ing abutting boxes and quads together,
// which is only a correct distance field *outside* the union. At an internal seam
// where two pieces merely touch, min() measures the distance to the phantom
// shared edge, so the field dips to zero along a line the letterform doesn't
// actually have — and the bar field dutifully antialiases a dark break into every
// stroke crossing it. The R showed it worst: three of its four seams had no
// overlap at all, and the horizontal one cut clean across the letter.
//
// Cutting instead of adding fixes it by construction: a notch's edges are real
// edges, so every zero in the field belongs to the letter. Each half-plane whose
// line continues on through the interior is paired with another constraint that
// is strongly positive there, so the wedge closes before the line can do damage.
fn sdHalf(q: vec2f, pt: vec2f, n: vec2f) -> f32 {
  return dot(q - pt, n);
}

// The A bowl: a box whose top-right corner is a 60u arc centred at (1246, 691).
fn sdABowl(q: vec2f) -> f32 {
  let lo = vec2f(1186.0, 631.0);
  let hi = vec2f(1306.0, 864.0);
  var d = sdBox(q, (lo + hi) * 0.5, (hi - lo) * 0.5);
  let c = vec2f(1246.0, 691.0);
  if (q.x > c.x && q.y < c.y) { d = length(q - c) - 60.0; }
  return d;
}

// ── the logotype, one function per letter, in viewBox units (403 624 1232 281)
fn sdO(q: vec2f) -> f32 {
  var d = sdBox(q, vec2f(577.0, 747.5), vec2f(127.0, 116.5));
  return max(d, -(length(q - vec2f(574.0, 747.0)) - 24.0));
}

// One block, three notches. The diagonals all share the direction (49, 59.744),
// so every normal here is that vector's perpendicular, +/- on each axis.
fn sdM(q: vec2f) -> f32 {
  var d = sdBox(q, vec2f(866.0, 747.5), vec2f(152.0, 116.5));
  // The valley in the top edge: the wedge lying above both diagonals, apex where
  // they cross at (866, 690.744).
  d = max(d, -max(sdHalf(q, vec2f(817.0, 631.0), vec2f(-0.773098,  0.634159)),
                  sdHalf(q, vec2f(915.0, 631.0), vec2f( 0.773098,  0.634159))));
  // The two notches cut up from the baseline either side of the V's foot. Each is
  // bounded by a diagonal parallel to the one above it, and by the inner edge of
  // its own stem — which is what stops the wedge swallowing the stem as well.
  d = max(d, -max(sdHalf(q, vec2f(817.0, 804.256), vec2f( 0.773098, -0.634159)),
                  sdHalf(q, vec2f(817.0, 747.5),   vec2f(-1.0, 0.0))));
  d = max(d, -max(sdHalf(q, vec2f(915.0, 804.256), vec2f(-0.773098, -0.634159)),
                  sdHalf(q, vec2f(915.0, 747.5),   vec2f( 1.0, 0.0))));
  return d;
}

// The full-height bar at x 1031..1153 is the A's left stroke, even though the
// source SVG classes it as an M block — grouping it with the M made the M's
// frame reach into the A, and the two boxes overlap by 19 units.
fn sdA(q: vec2f) -> f32 {
  var d = sdBox(q, vec2f(1092.0, 747.5), vec2f(61.0, 116.5));
  d = min(d, sdBox(q, vec2f(1254.5, 747.5), vec2f(51.5, 116.5)));
  d = min(d, sdBox(q, vec2f(1168.5, 676.0), vec2f(34.5, 45.0)));
  d = min(d, sdBox(q, vec2f(1168.5, 751.5), vec2f(34.5, 42.5)));
  d = min(d, sdABowl(q));
  return max(d, -(length(q - vec2f(1169.0, 734.0)) - 24.0));
}

// The R was four boxes and a quad; everything above y=794 turns out to tile one
// solid rectangle exactly, so the whole letter is that block with two notches
// taken out below the bowl — one either side of the leg — and the counter punched
// through. Both notches are bounded above by the bowl's underside at y=794, which
// is also what keeps each leg edge from cutting on up through the bowl.
fn sdR(q: vec2f) -> f32 {
  var d = sdBox(q, vec2f(1439.5, 747.5), vec2f(120.5, 116.5));
  // Between the stem and the leg's leading edge.
  d = max(d, -max(max(sdHalf(q, vec2f(1421.0, 792.0), vec2f( 0.821373, -0.570398)),
                      sdHalf(q, vec2f(1422.0, 747.5), vec2f(-1.0, 0.0))),
                      sdHalf(q, vec2f(1439.5, 794.0), vec2f( 0.0, -1.0))));
  // The shelf outboard of the leg, under the bowl's right shoulder.
  d = max(d, -max(sdHalf(q, vec2f(1516.0, 792.0), vec2f(-0.853371, 0.521449)),
                  sdHalf(q, vec2f(1439.5, 794.0), vec2f( 0.0, -1.0))));
  return max(d, -(length(q - vec2f(1469.0, 734.0)) - 24.0));
}

fn hsl2rgb(h: f32, s: f32, l: f32) -> vec3f {
  let hp = fract(h / 360.0) * 6.0;
  let c = (1.0 - abs(2.0 * l - 1.0)) * s;
  let x = c * (1.0 - abs(hp - 2.0 * floor(hp / 2.0) - 1.0));
  var rgb = vec3f(0.0);
  if (hp < 1.0) { rgb = vec3f(c, x, 0.0); }
  else if (hp < 2.0) { rgb = vec3f(x, c, 0.0); }
  else if (hp < 3.0) { rgb = vec3f(0.0, c, x); }
  else if (hp < 4.0) { rgb = vec3f(0.0, x, c); }
  else if (hp < 5.0) { rgb = vec3f(x, 0.0, c); }
  else { rgb = vec3f(c, 0.0, x); }
  return rgb + (l - c * 0.5);
}
`;

// ── pass 1: the bar field, four letter layers ──────────────────────────────
export const FIELD_WGSL = /* wgsl */`
struct P {
  resX: f32, resY: f32,
  time: f32,
  cols: f32,
  barWidth: f32,
  gapNoise: f32,
  logoScale: f32,
  threshold: f32,
  edgeJitter: f32,
  blobWarp: f32,
  warpSpeed: f32,
  hue: f32,
  sat: f32,
  shimmer: f32,
  coreGlow: f32,
  mouseX: f32,
  mouseY: f32,
  offX: f32,
  flow: f32,
  // How much the silhouette is allowed to deform right now: near 0 while the
  // field is at rest (crisp letterforms), 1 while you're interacting with it.
  agit: f32,
  // ── the visualiser ──
  // The strokes were always alive on a clock; these put them on the music's clock.
  // mtime counts *beats*, not seconds, so every rate derived from it speeds up when
  // the tempo does — which is the whole point: drag a letter up and the jitter
  // quickens. It keeps counting with the sound off, so the field is never frozen.
  mtime: f32,
  // How much music there is to answer, 0..1, straight off the audio fade envelope.
  // Everything reactive is mixed in by this, so with nothing playing the field looks
  // exactly as it did before any of this existed.
  mus: f32,
  // Low-band transient envelope: fast up, slower down, so a kick lands as a hit.
  pulse: f32,
  // The mix split four ways, each as a *signed* deviation from its own recent
  // average, -1..1. Columns pick a band by their own hash, so different strokes answer
  // different parts of the track. Signed because a visualiser has to redistribute
  // energy rather than add it: passing absolute levels lifted the whole letter's
  // brightness by a third and closed up the A's counter.
  bandLo: f32,
  bandMid: f32,
  bandHi: f32,
  bandTop: f32,
  // Tempo across its dial, 0..1. mtime already makes the tempo set the *rate* of
  // everything; this lets it set the amount too, so dragging a letter up doesn't just
  // move the jitter faster, it moves it further.
  tempoN: f32,
  // The share of the field's deformation the letters that aren't claimed take. See
  // calmShare below.
  spaceWave: f32,
  // ── the redline ──
  // How lit the party is, 0..1. Every term it touches is multiplied by it, so at zero
  // this version renders identically to v5 and the easter egg costs the resting picture
  // nothing at all.
  rave: f32,
}
@group(0) @binding(0) var<uniform> p: P;

// Per-letter transforms, computed on the CPU so the HUD can use the same
// numbers. xy = screen offset in device px, z = scale, w = brightness.
struct Letters {
  o: vec4f,
  m: vec4f,
  a: vec4f,
  r: vec4f,
  rot: vec4f,
  hover: vec4f,
  // Signed depth per letter, used only to order the layers.
  zs: vec4f,
}
@group(0) @binding(1) var<uniform> L: Letters;

${COMMON_WGSL}

// How much of the field's deformation a letter takes. The claimed letter takes all of
// it; the other three take spaceWave of it, because at full strength the warp and the
// gap noise chew a small letter into pieces — the three that aren't the subject were
// doing more waving than the one that was.
//
// Only their *shape* is calmed. The depth breath and the vertical float are position,
// and both are untouched by this: the movement stays, the waving goes.
//
// Faded in by foc, how claimed anything is at all, so with nothing claimed every
// letter is deformed exactly as it always was and the resting word is unchanged.
fn calmShare(hov: f32, foc: f32) -> f32 {
  return mix(1.0, mix(p.spaceWave, 1.0, hov), foc);
}
// Only the two deformations that carry time are calmed: the fbm warp, which is the big
// slow undulation, and the gap noise, which is the travelling holes. Those are the
// waving. The per-column edge jitter is static and stays at full, or the letters that
// aren't claimed flatten into rectangles.

// A column's slice of the mix, signed: positive where its band is louder than it has
// lately been, negative where it's quieter. The four bands are spread across a 0..1
// selector and read with interpolation, so neighbouring columns answer neighbouring
// frequencies rather than snapping between them.
//
// Selected by the column's own hash, not by its position on screen. A left-to-right
// ramp would have turned the mark into a literal EQ display; scattering it keeps the
// field looking like the field it already was, and only its movement changes.
fn bandAt(x: f32) -> f32 {
  let fsel = clamp(x, 0.0, 1.0) * 3.0;
  let i = i32(floor(fsel));
  // var, not let: WGSL only allows a runtime index into addressable memory.
  var b = array<f32, 4>(p.bandLo, p.bandMid, p.bandHi, p.bandTop);
  return mix(b[i], b[min(i + 1, 3)], fsel - floor(fsel));
}

const VB_W: f32 = 1232.0;
const VB_CX: f32 = 1019.0;
const VB_CY: f32 = 764.5;

// Screen point → one letter's local viewBox space.
//
// The scale is applied about the *composition* centre, not each letter's own
// centre. That's the difference between a perspective projection and four
// independently resized letters: a nearer letter grows AND is pushed further
// out from the middle, so the word still reads as one word. Scaling each letter
// in place instead just breaks the logotype's alignment.
fn toLocal(samplePt: vec2f, centre: vec2f, s: f32, lp: vec4f, rot: f32, lc: vec2f) -> vec2f {
  // Inverse of the forward transform the CPU projects the HUD rects with:
  //   screen = centre + ((lc - VB_C) + (v - lc) * scale) * s + offset
  // Each letter scales about its *own* centre and then translates freely, which
  // is what lets one letter grow and take the middle while the rest scatter. The
  // earlier version scaled about the composition centre, so growing a letter also
  // flung it outward — fine for shallow perspective, useless for this.
  let base = vec2f(lc.x - VB_CX, lc.y - VB_CY);
  var q = lc + ((samplePt - centre - vec2f(lp.x, lp.y)) / s - base) / lp.z;
  // Then a little roll about the letter's own centre, for character.
  let ca = cos(rot);
  let sa = sin(rot);
  let d = q - lc;
  return lc + vec2f(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
}

// Threshold, per-column end jitter and punched gaps — everything that moves the
// silhouette. All of it scales with agit, so at rest the letterforms are crisp
// and only come apart once you interact. Hovering a letter adds a fast extra
// flicker on top, so it reads as agitated rather than just brighter.
// lsc is the letter's on-screen scale, and every deformation is multiplied by
// it. The amounts are all in screen pixels, so without this a letter shrunk to
// half size takes twice the proportional damage and falls apart into clumps while
// the big one beside it looks fine. Scaling by lsc means each letter is distorted
// by the same fraction of itself — and the claimed letter, being larger than 1,
// gets correspondingly more agitated, which is what you want anyway.
fn perturb(dRaw: f32, col: f32, px: vec2f, res: vec2f, hov: f32, lsc: f32, cs: f32) -> f32 {
  var d = dRaw - (0.5 - p.threshold) * res.y * 0.07;
  // Not calmed by cs, unlike the two below. This one has no time in it at all: it's a
  // fixed offset per column, so it can't wave — it's the ragged silhouette itself, and
  // calming it just flattened the unclaimed letters into plain blocks.
  d = d + (hash11(col * 1.7 + 3.1) - 0.5) * p.edgeJitter * p.agit * lsc;
  // How much of this letter's movement the music is allowed to drive. Mostly the
  // claimed letter, because that's the one being looked at, with a little left over
  // for the other three so the word still reads as one picture.
  let react = p.mus * max(hov, p.agit * 0.22);
  if (hov > 0.01) {
    // Re-rolled on musical subdivisions instead of on wall-clock — twelve to the
    // beat, which is a 32nd-note flicker at any tempo. The *amount* is this column's
    // own band plus the kick, mixed in by mus so that with nothing playing the
    // expression collapses to the flat 1.0 it used to be.
    // Ten re-rolls to the beat, which at the default 125bpm is 21Hz — near enough the
    // flat 20Hz this used to run at that the look is the look it always had, and only
    // its tie to the tempo is new. At the ends of the dial it's 15Hz and 23Hz.
    let fl = hash11(col * 2.3 + floor(p.mtime * 10.0) * 0.37) - 0.5;
    let driven = (0.88 + bandAt(hash11(col * 5.3 + 1.7)) * 0.85 + p.pulse * 0.55)
               * (0.82 + p.tempoN * 0.42);
    let amp = mix(1.0, driven, p.mus);
    d = d + fl * hov * p.edgeJitter * 1.4 * lsc * amp;
  }
  if (p.gapNoise > 0.0) {
    let g = vnoise(vec2f(col * 0.6, px.y / res.y * 26.0 + p.mtime * 0.3));
    d = d + (1.0 - g) * p.gapNoise * res.y * 0.04 * p.agit * lsc * cs;
  }
  // The kick lengthens the strokes a touch. The only place the music moves the
  // silhouette itself rather than what's happening inside it, so it stays small —
  // enough to read as the field breathing on the beat, not enough to soften the
  // letterform.
  d = d - p.pulse * react * res.y * 0.008 * lsc;
  return d;
}

// Returns premultiplied colour in rgb and the layer's coverage in a, so the
// caller can composite the layers in depth order instead of just summing them.
fn shadeLayer(dShape: f32, lp: vec4f, hov: f32, col: f32, colW: f32,
              px: vec2f, cxpx: f32, res: vec2f) -> vec4f {
  // Bar profile: rounded-box combine of the horizontal and shape distances,
  // which is what gives the capsule ends.
  let dx = abs(px.x - cxpx) - colW * 0.5 * p.barWidth;
  let q2 = vec2f(dx, dShape);
  let d = min(max(dx, dShape), 0.0) + length(max(q2, vec2f(0.0)));
  let mask = 1.0 - smoothstep(-1.2, 1.2, d);
  if (mask <= 0.002) { return vec4f(0.0); }

  let depth = clamp(-dShape / (res.y * 0.06), 0.0, 1.0);
  let colRand = hash11(col * 5.3 + 1.7);
  let vgrad = clamp((px.y / res.y - 0.30) / 0.44, 0.0, 1.0);

  // Energy travelling along the stroke. This is where the life lives now: it
  // modulates brightness only, so the bar's ends stay exactly where the SDF put
  // them and the letterform stays legible while its insides keep moving. Each
  // column carries its own phase so neighbours don't pulse in lockstep.
  let phase = colRand * 6.2832;
  // Musical time, so the energy travelling along the strokes runs with the track. The
  // coefficient is set so that around the default tempo this advances at roughly the
  // rate the wall clock did, and the tempo dial moves it either side of that.
  let t = p.mtime * 0.56 * p.flow;
  let wave = sin(px.y / res.y * 10.0 - t * 2.2 + phase) * 0.5 + 0.5;
  let grain = vnoise(vec2f(col * 0.4, px.y / res.y * 6.0 - t * 1.1));
  let energy = mix(wave, grain, 0.55);
  // Level, per column, per band — and signed, so a quiet band pulls its columns down
  // exactly as far as a loud one pushes them up. That's what makes it read as metering
  // rather than as the letter simply being turned up.
  let react = p.mus * max(hov, p.agit * 0.22);
  let lift = (0.60 + colRand * 0.46 + vgrad * 0.30)
           * (1.0 + (energy - 0.5) * p.shimmer * 1.4)
           * (1.0 + bandAt(colRand) * 0.5 * react + p.pulse * 0.22 * react)
           // At the redline the bars simply burn brighter, and harder on every kick. This is
           // where the party's light comes from rather than from exposure: raising exposure
           // drives all three channels toward 1.0 through the tonemap and bleaches the hue,
           // whereas brightening a saturated bar keeps its colour on the way up.
           // Eased off on whichever letter is claimed. That one is already brightened twice
           // over by hov, and at the redline it blew out to white in the middle — losing the
           // rainbow on the one letter you are actually looking at.
           * (1.0 + p.rave * (0.35 + p.pulse * 0.55) * (1.0 - hov * 0.55));

  // ── the redline's colour ─────────────────────────────────────────────────
  // Hue fanned *across* the field rather than swept globally. A single hue uniform
  // cycling through the spectrum is a hue rotation, and a hue rotation reads as a filter
  // laid over the picture — everything one colour at a time. Spreading it over the
  // per-column hash instead builds the rainbow out of the same structure the visualiser
  // already uses, so what has gone colourful is the field itself. The band term lets the
  // music paint it, and the drift on musical time keeps it churning at a rate the tempo
  // sets, which at this point is pegged.
  // Mostly a sweep across the word, with per-column scatter on top. Picking each column's
  // hue purely from its own hash was the first attempt and it read as coloured static, not
  // as a rainbow — a rainbow is a gradient, and the eye wants to see the spectrum travel
  // somewhere. The scatter keeps it from being a clean printed gradient, and the drift on
  // musical time rolls the whole thing through the word at a rate the tempo sets.
  let hueRave = p.rave * (px.x / res.x * 300.0 + colRand * 70.0
                          + bandAt(colRand) * 40.0 + p.mtime * 26.0);

  // Letters further back lose saturation as well as brightness — atmosphere. Saturation
  // climbs hard while lit, which it has to: see the composite, where a per-channel
  // reinhard desaturates whatever it brightens, so a party that only added light would
  // have bleached out the exact colour it was trying to show.
  let sat = clamp(p.sat / 100.0 * (0.55 + 0.45 * clamp(lp.w, 0.0, 1.0))
                  + p.rave * 0.40, 0.0, 1.0);
  // Lightness breathes on the kick. Deliberately a breath and not a strobe, and the
  // sequencer keeps the kick on quarter notes even at the redline: four-on-the-floor at
  // 140 is 2.3 flashes a second, which stays under the rate that makes full-field
  // flashing a photosensitivity risk. Doubling the kick would have put it over.
  var base = hsl2rgb(p.hue + hov * 16.0 + hueRave, sat,
                     0.50 + colRand * 0.12 + p.rave * p.pulse * 0.10);
  // Even out perceived brightness across the wheel while the rainbow is lit. HSL at a fixed
  // lightness is nowhere near equally bright per hue — green and yellow carry several times
  // the luminance of blue and violet — so a raw sweep reads as a lime field with occasional
  // other colours in it. Pulling every hue toward a common luminance is the difference
  // between a spectrum that looks chosen and one that looks computed. Partially, via the
  // exponent: full normalisation multiplies blue by nearly six and it blooms into a smear.
  let lum = max(dot(base, vec3f(0.2126, 0.7152, 0.0722)), 0.05);
  base = mix(base, base * pow(0.45 / lum, 0.65), p.rave);
  var outc = base * mask * max(lift, 0.0) * lp.w * (1.0 + hov * 0.5);

  // The white core rides the same energy, so the bloom pulses along the strokes
  // instead of sitting still.
  let core = 1.0 - smoothstep(0.0, max(0.6, colW * 0.26 * p.barWidth), abs(px.x - cxpx));
  outc = outc + vec3f(1.0) * core * mask * p.coreGlow * (0.45 + energy * 0.9)
              * (0.35 + depth * 0.65) * lp.w * (1.0 + hov * 0.9)
              * (1.0 + p.pulse * 0.45 * react);
  return vec4f(outc, mask);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let res = vec2f(p.resX, p.resY);
  let px = uv * res;

  // Quantise x to a column — this alone is what turns a silhouette into bars.
  // The grid stays fixed to the screen while the letters move behind it, which
  // is what makes it read as a scanner rather than as striped artwork.
  let cols = max(8.0, floor(p.cols));
  let colW = res.x / cols;
  let col = floor(px.x / colW);
  let cxpx = (col + 0.5) * colW;

  let s = (res.x * p.logoScale) / VB_W;

  // Warp the sample point, not the geometry: the letters stay analytic. One noise
  // field, but each letter takes its own share of the displacement — computing the
  // noise once and scaling the result keeps this at two fbm lookups rather than eight.
  let basePt = vec2f(cxpx, px.y);
  var wv = vec2f(0.0);
  let warp = p.blobWarp * p.agit;
  if (warp > 0.001) {
    let tw = p.time * p.warpSpeed;
    let n1 = fbm(vec2f(cxpx / res.x * 3.2, px.y / res.y * 2.4) + vec2f(tw, tw * 0.7));
    let n2 = fbm(vec2f(cxpx / res.x * 2.8 + 8.0, px.y / res.y * 3.1) + vec2f(tw * 0.8, tw));
    wv = vec2f(n1 - 0.5, n2 - 0.5) * warp * res.y * 0.24;
  }

  // How claimed anything is at all, which is what fades the calming in and out.
  let foc = max(max(L.hover.x, L.hover.y), max(L.hover.z, L.hover.w));
  let cO = calmShare(L.hover.x, foc);
  let cM = calmShare(L.hover.y, foc);
  let cA = calmShare(L.hover.z, foc);
  let cR = calmShare(L.hover.w, foc);

  // Centre of the *visible* area, so the dial panel doesn't crop the mark.
  let centre = vec2f(res.x * 0.5 + p.offX, res.y * 0.5);

  let dO = perturb(sdO(toLocal(basePt + wv * cO, centre, s, L.o, L.rot.x, vec2f( 577.0, 747.5))) * s * L.o.z, col, px, res, L.hover.x, L.o.z, cO);
  let dM = perturb(sdM(toLocal(basePt + wv * cM, centre, s, L.m, L.rot.y, vec2f( 866.0, 747.5))) * s * L.m.z, col, px, res, L.hover.y, L.m.z, cM);
  let dA = perturb(sdA(toLocal(basePt + wv * cA, centre, s, L.a, L.rot.z, vec2f(1168.5, 747.5))) * s * L.a.z, col, px, res, L.hover.z, L.a.z, cA);
  let dR = perturb(sdR(toLocal(basePt + wv * cR, centre, s, L.r, L.rot.w, vec2f(1439.5, 747.5))) * s * L.r.z, col, px, res, L.hover.w, L.r.z, cR);

  var lay = array<vec4f, 4>(
    shadeLayer(dO, L.o, L.hover.x, col, colW, px, cxpx, res),
    shadeLayer(dM, L.m, L.hover.y, col, colW, px, cxpx, res),
    shadeLayer(dA, L.a, L.hover.z, col, colW, px, cxpx, res),
    shadeLayer(dR, L.r, L.hover.w, col, colW, px, cxpx, res),
  );
  // var, not let: WGSL only allows a runtime index into addressable memory.
  var zv = array<f32, 4>(L.zs.x, L.zs.y, L.zs.z, L.zs.w);

  // Painter's order, furthest first. Summing the layers was fine while the
  // letters sat side by side and never met, but once they cross each other in
  // depth an overlap has to read as "behind", and adding makes it read as
  // "brighter" — the exact opposite. Insertion sort on four elements.
  var idx = array<i32, 4>(0, 1, 2, 3);
  for (var i = 1; i < 4; i = i + 1) {
    let cur = idx[i];
    var j = i;
    loop {
      if (j == 0) { break; }
      if (zv[idx[j - 1]] >= zv[cur]) { break; }
      idx[j] = idx[j - 1];
      j = j - 1;
    }
    idx[j] = cur;
  }

  var outc = vec3f(0.0);
  for (var i = 0; i < 4; i = i + 1) {
    let src = lay[idx[i]];
    outc = outc * (1.0 - src.a) + src.rgb;
  }

  return vec4f(outc, 1.0);
}
`;

// ── pass 2: luminance threshold ────────────────────────────────────────────
export const BRIGHT_WGSL = /* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
struct B { threshold: f32, pad0: f32, pad1: f32, pad2: f32 }
@group(0) @binding(2) var<uniform> b: B;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let c = textureSampleLevel(src, samp, uv, 0.0).rgb;
  let lum = dot(c, vec3f(0.2126, 0.7152, 0.0722));
  let k = max(0.0, lum - b.threshold) / max(lum, 1.0e-4);
  return vec4f(c * k, 1.0);
}
`;

// ── passes 3 & 4: separable gaussian ───────────────────────────────────────
export const BLUR_WGSL = /* wgsl */`
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;
struct BL { dirX: f32, dirY: f32, radius: f32, pad: f32 }
@group(0) @binding(2) var<uniform> bl: BL;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dims = vec2f(textureDimensions(src, 0));
  let stepUv = vec2f(bl.dirX, bl.dirY) / dims * bl.radius;
  var sum = vec3f(0.0);
  var wsum = 0.0;
  for (var i = -8; i <= 8; i = i + 1) {
    let fi = f32(i);
    let w = exp(-0.5 * fi * fi / 12.0);
    sum = sum + textureSampleLevel(src, samp, uv + stepUv * fi, 0.0).rgb * w;
    wsum = wsum + w;
  }
  return vec4f(sum / wsum, 1.0);
}
`;

// ── pass 5: composite + tone map ───────────────────────────────────────────
export const COMPOSITE_WGSL = /* wgsl */`
@group(0) @binding(0) var scene: texture_2d<f32>;
@group(0) @binding(1) var bloomTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;
struct C { amount: f32, exposure: f32, rave: f32, pad1: f32 }
@group(0) @binding(3) var<uniform> c: C;

const BG: vec3f = vec3f(0.078, 0.047, 0.086);

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let s = textureSampleLevel(scene, samp, uv, 0.0).rgb;
  let b = textureSampleLevel(bloomTex, samp, uv, 0.0).rgb;
  var col = (s + b * c.amount) * c.exposure;
  col = col / (col + vec3f(1.0));      // reinhard
  col = pow(col, vec3f(1.0 / 1.05));
  // Chroma restored *after* the tonemap, and only while the party is lit. This is where the
  // rainbow was actually being lost, and it took a while to find because every earlier
  // attempt fought it in the wrong place: reinhard runs per channel, so anything bright
  // enough pushes all three channels toward 1.0 and arrives white no matter how saturated it
  // was going in. Turning brightness down instead just made a dim rave. The tonemap has to
  // squash the range — that is its job — so the fix is to put the colour back on the far
  // side of it rather than to feed it less.
  let grey = dot(col, vec3f(0.2126, 0.7152, 0.0722));
  col = mix(vec3f(grey), col, 1.0 + c.rave * 1.15);
  return vec4f(BG + col, 1.0);
}
`;
