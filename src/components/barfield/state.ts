/**
 * Shared mutable state for the bar field.
 *
 * The sketch kept all of this as module-level `let`s in one long script. Split across
 * modules those can't work: an ES import is a live *read-only* view, so a value written
 * by the layout pass and read by the HUD has to live on an object both can reach. That
 * is what `M` is — the per-frame motion numbers, in one place, mutated by whichever
 * module owns each one.
 */
import type { NumericDialId } from './dials';

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// Frame-rate independent easing: fraction of the remaining gap to close in dt.
export const approach = (cur: number, target: number, tau: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-dt / tau));


/** Per-frame motion state, written by the module that owns each field and read widely. */
export const M = {
  /** 0 at rest, 1 while a letter is claimed. Owned by updateLetters. */
  activity: 0,
  /** The HUD's presence, and what the sound is gated by. Owned by updateLetters. */
  hudUp: 0,
  /** The tagline's entrance. Owned by drawTagline. */
  tagIn: 0,
  /** How held the grabbed letter is. Owned by updateLetters. */
  grabIn: 0,
  /**
   * The musical clock, counted in *beats* so every rate derived from it follows the
   * tempo. Owned by the frame loop, and keeps counting with the sound off.
   */
  mtime: 0,
  /** Which letter the pointer is on, -1 for none. Owned by updateLetters. */
  lastHit: -1,
  lastHitAt: -1e9,
  /** Which letter is claimed, and the one the accordion spaces around. */
  focusIdx: -1,
};

/**
 * Geometry that used to be read straight off the dial panel's bounding box. Recomputed
 * once a frame by the field, so nothing else needs to know whether a panel exists — in
 * production it never does, and these collapse to the whole viewport.
 */
export const viewport = {
  /** Horizontal nudge that keeps the mark centred in the *visible* area. 0 with no panel. */
  markOffX: 0,
  /** Right edge of the usable area, so a gauge can flip inboard before it goes under. */
  hudRight: 0,
  /**
   * Narrow viewports stack the letters down the screen instead of setting them as a word.
   * Set beside the letters as a word, each glyph is an eighth of a phone's width and the
   * tagline under it is too small to read; stacked, each one is half the width and the
   * field reads as four blocks rather than one thin strip.
   */
  stacked: false,
  /**
   * Where the *settled* mark sits this frame, in CSS px, published by the layout pass.
   * The tagline used to derive this from the wordmark's viewBox extents directly, which
   * silently assumes the letters are in a row.
   *
   * `unit` is one viewBox unit in CSS px for the settled mark, so anything pairing itself
   * with the mark can size off it and keep its proportions in either layout.
   */
  markBox: { cx: 0, bottom: 0, w: 0, unit: 0 },
};

/** The stage element, for the grab cursor. Set once at boot. */
export const els: { stage: HTMLElement | null } = { stage: null };

/**
 * The audio engine, once the visitor has asked for it. Held here rather than imported so
 * the HUD can read the sequencer's state without pulling the engine into the initial
 * bundle — sound is opt-in, and `audio.ts` is only fetched on the first click.
 */
export const sound: { engine: AudioEngine | null } = { engine: null };

export interface MusicState {
  step: number;
  beat: number;
  blend: number;
  from: { label: string; chord: { name: string } };
  to: { label: string; chord: { name: string } };
  bpm: number;
  density: number[];
}

export interface AudioEngine {
  readonly enabled: boolean;
  toggle(): Promise<boolean>;
  update(gate: number, focusIdx: number, nx: number): void;
  setGrit(v: number): void;
  setTempo(v: number): void;
  readBands(): { lo: number; mid: number; hi: number; top: number; kick: number; level: number } | null;
  musicState(): MusicState | null;
}


// ── the four letters ───────────────────────────────────────────────────────
// cx/cy are each letter's centre in viewBox units; x0..x1 its horizontal
// extent. zBase puts it in front of (negative) or behind (positive) the
// presentation plane once the field spreads.
export const VB_CY = 747.5;
export const LETTERS: LetterDef[] = [
  { name: 'O', cx:  577.0, x0:  450, x1:  704, zBase: -0.62, rate: 0.29, phase: 0.4 },
  { name: 'M', cx:  866.0, x0:  714, x1: 1018, zBase:  0.34, rate: 0.22, phase: 2.1 },
  { name: 'A', cx: 1168.5, x0: 1031, x1: 1306, zBase: -0.18, rate: 0.26, phase: 3.7 },
  { name: 'R', cx: 1439.5, x0: 1319, x1: 1560, zBase:  0.58, rate: 0.19, phase: 5.3 },
];
export const states: LetterState[] = LETTERS.map(() => ({
  z: 0, scale: 1, offX: 0, offY: 0, dim: 1, rot: 0, hover: 0,
  rect: { x: 0, y: 0, w: 0, h: 0 },
  restRect: { x: 0, y: 0, w: 0, h: 0 },
}));

// Letter order is O, M, A, R. `fmt` is how the gauge prints the number, which differs
// per dial because a percentage, a tempo and a weight aren't read the same way.
export const LETTER_DIAL: LetterDial[] = [
  { id: 'tempo' as NumericDialId,  label: 'BPM',  glyph: 'beat',  fmt: (v: number) => String(Math.round(v)) },
  { id: 'grit' as NumericDialId,   label: 'GRIT', glyph: 'clip',  fmt: (v: number) => v.toFixed(2) },
  { id: 'punch' as NumericDialId,  label: 'DRUM', glyph: 'hit',   fmt: (v: number) => v.toFixed(2) },
  { id: 'volume' as NumericDialId, label: 'VOL',  glyph: 'meter', fmt: (v: number) => `${Math.round(v * 100)}%` },
];


export const grab = {
  idx: -1,      // letter under an active press, -1 for none
  last: -1,     // most recently grabbed, so its readout can fade out after release
  px: 0, py: 0, // where the press started
  from: 0,      // what its dial read when the press landed
  offX: 0, offY: 0,
};

// The dial's whole range in 340px of travel, measured from wherever it stood when you
// pressed. Relative rather than absolute, so a second drag carries on from where the
// last one left off instead of jumping to match the pointer.

// ── pointer ────────────────────────────────────────────────────────────────
export const pointer = { x: 0, y: 0, nx: 0.5, ny: 0.5, seen: false, lastMove: -1e9 };

// ── visualiser state ───────────────────────────────────────────────────────
// `mtime` is the musical clock the strokes now run on, counted in beats so its rate
// follows the tempo. The rest is the mix, smoothed for the eye: fast attack so a kick
// arrives as a hit, slower release so it doesn't flicker between frames.

export const vis = { lo: 0, mid: 0, hi: 0, top: 0, pulse: 0, mus: 0 };

// Per-band auto-gain. Loudness falls off steeply with frequency, so a single fixed
// window is useless across four bands: the first attempt used one, and measured the
// bottom end pinned at 1.00 for every groove while the hats sat at 0.03 — the two
// bands that most distinguish one groove from another, both saying nothing. Each band
// now tracks its own floor and ceiling and is stretched to fill 0..1, so what the
// picture answers is how loud a band is *for that band*.
export const AGC = [0, 1, 2, 3].map(() => ({ lo: 1, hi: 0, avg: 0.5 }));

// ── the redline ────────────────────────────────────────────────────────────
// Maxing the tempo is the easter egg, and it has to be *held* rather than touched. The
// tempo keeps its value after you let go of a letter, so a trigger that simply fired at
// 140 would latch the first time anyone found it and never come off again — which makes
// it a permanent mode rather than a secret. It charges while the dial is pegged and
// unwinds the moment it isn't, so holding the throttle open is the whole gesture.
export const RAVE_HOLD = 1.0;                     // seconds pegged at the top before it goes
// Four on the floor. See the sequencer for why the kick doesn't join the pattern union.
export const RAVE_KICK = [0, 4, 8, 12];
export const RAVE_MAX = 140;                      // the tempo dial's own ceiling
export const rave = { charge: 0, lit: 0 };
// Tracks what the bloom passes were last told, since those aren't rewritten every frame.

export function autoGain(i: number, v: number, dt: number) {
  const g = AGC[i];
  g.hi = Math.max(v, g.hi - dt * 0.22);
  g.lo = Math.min(v, g.lo + dt * 0.13);
  const n = clamp((v - g.lo) / Math.max(0.04, g.hi - g.lo), 0, 1);
  // Then centred on its own running mean and handed over as a deviation. What matters
  // to the eye is whether a band is louder or quieter than it has been — an absolute
  // level can only ever push the picture one way, and doing that measured out as a
  // third more brightness everywhere rather than as movement.
  g.avg += (n - g.avg) * (1 - Math.exp(-dt / 1.4));
  return clamp((n - g.avg) * 2.2, -1, 1);
}

/** The instrument's warning colour. Not the HUD yellow — that is the whole point of it. */
export const HOT = '#ff5a3c';

export interface LetterDef {
  name: string;
  cx: number;
  x0: number;
  x1: number;
  zBase: number;
  rate: number;
  phase: number;
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface LetterState {
  z: number;
  scale: number;
  offX: number;
  offY: number;
  dim: number;
  rot: number;
  hover: number;
  /** Where the letter actually is, for the HUD. */
  rect: Rect;
  /** Its slot in the settled word — the control surface the pointer tests against. */
  restRect: Rect;
}

export interface LetterDial {
  id: NumericDialId;
  label: string;
  glyph: string;
  fmt: (v: number) => string;
}
