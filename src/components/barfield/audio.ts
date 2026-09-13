/**
 * The sound engine. Synthesised rather than sampled, so there is nothing to vendor — the
 * music is built out of primitives the same way the picture is.
 *
 * Loaded on demand: the sound is opt-in, so this module is only fetched when the visitor
 * clicks the pill. It is the largest piece of the sketch and none of it is needed to draw
 * a frame.
 */
import { P } from './dials';
import { RAVE_KICK, rave, type AudioEngine } from './state';

// Synthesised rather than sampled, so the folder stays self-contained with nothing
// to vendor — the music gets built out of primitives the same way the picture does.
//
// This is a drum record. Kick, claps, hats, shaker, toms and ride carry it; a deep
// sine sub and short filtered chord stabs are the only tuned parts, and they sit
// under the drums rather than on top. There are no square waves anywhere and no
// resonant screech: the first pass had a detuned square arp and a Q-7 saw bass,
// which is exactly where the thin piped quality came from.
//
// WHAT EACH LETTER DOES
//
// Changing only the harmony between letters was a mistake — a chord swap under a
// pumping mix is close to inaudible, so moving across the word sounded like one
// unchanging loop. Each letter now owns a whole groove: its own kick pattern, its
// own percussion, its own drum weight and its own brightness, as well as its chord.
//
//   O  the floor      straight four, offbeat hats, rolling sub — the plain engine
//   M  heavy, broken  kick off the grid, tribal toms, hats stripped right back —
//                     the same weight as the floor but a different character
//   A  the lift       sixteenth hats, doubled claps, octave-bouncing sub, wide open
//   R  the drop out   kick and sub almost alone, half-time, drenched — the space
//
// So the letters really do give it different kinds of life: the drums lift at the A
// and fall away at the R.
//
// HOW ONE GROOVE BECOMES THE NEXT
//
// Two grooves are live at once and a crossfade walks between them over half a bar,
// so no pattern is ever switched: the hats you were hearing thin out as the toms
// arrive, and every voice a groove doesn't want fades rather than stops. The change
// is booked a couple of sixteenths ahead and a riser swells into it, with a soft
// cymbal landing on the beat it lands on. The first version did the opposite — it
// cut the master filter to 600 Hz right on the change, which put a hole in the music
// at the one moment it has to carry you across.
//
// Only the harmony still moves in one step, because that is what a chord change is;
// the riser and the cymbal are sitting on that beat to carry it. The tuned parts take
// their rhythm from whichever groove asked for it but always their pitch from the
// incoming chord, so two roots never sound at once.
//
// The sequencer keeps counting for as long as you stay engaged and the pointer only
// steers which groove is playing, so sliding between letters undulates instead of
// restarting. A change requested mid-crossfade is held rather than dropped and lands
// as soon as there's room, which is what keeps a fast sweep across all four letters
// reading as a chain of mixes. What you hear is gated by `M.hudUp`, the same number
// that raises the HUD, so silence at rest is one fact in both image and sound.
//
// The claimed letter carries a readout of all this in its HUD, drawn from
// `musicState()` — which returns nothing unless the sequencer is really running, so
// the picture can't describe music you aren't hearing.
//
// Leaving the word is a ten-second fade rather than a stop — see `level` below. The
// picture and the sound want opposite things here: the letters are tuned to snap back
// the instant you leave, and following that straight down made the music sound like
// the record being switched off.
//
// THE WORD IS THE DESK
//
// Each letter is a handle onto one control: press it and drag up or down. The O sets the
// pace, the M the dirt, the A the weight of the drums, the R how loud any of it is — see
// LETTER_DIAL by the pointer handling. One dial each rather than one dial reachable four
// ways, because that gives the letters separate jobs instead of making them
// interchangeable.
//
// Each has its own gauge in the HUD, in two states: dim on hover, which exists only to
// say the letter can be pulled, and lit while you're pulling it. The frame is the same
// for all four since the gesture is; what changes is the glyph, which is the part that
// says what kind of quantity you have hold of. See drawDialGauge.
//
// AND THE PICTURE LISTENS BACK
//
// The strokes are the visualiser. They were always moving; they now move on the
// music's clock rather than on a wall clock, and the mix sets how far. `readBands()`
// hands the field a four-way split of the master plus the sequencer's own kicks, and
// the shader's `mtime`, `mus`, `pulse` and band uniforms carry it — see the visualiser
// block by the frame loop for the conditioning, and `bandAt` / `perturb` / `shadeLayer`
// for what it drives. Everything reactive is mixed in by `mus`, so with the sound off
// the field is exactly what it was before any of this existed.
//
// A browser will not start an AudioContext without a genuine user gesture, and
// pointermove is explicitly not one, so hovering can never be enough to begin.
// That is why there's a pill to click.
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export interface Chord {
  root: number;
  tones: number[];
  name: string;
}

export interface Groove {
  label: string;
  chord: Chord;
  kick: number[];
  clap: number[];
  hat: number[];
  hatGhost: number[];
  open: number[];
  shake: number[];
  tom: number[];
  ride: number[];
  stab: number[];
  stabLen: number;
  /** [step, semitones above the root, length in sixteenths] */
  sub: number[][];
  /** How much of the tuned bus this groove wants. Only the R turns it down. */
  tuned?: number;
  punch: number;
  bright: number;
}

/** Which voices a groove asks for, by name — the keys `lv()` crossfades between. */
type VoiceKey = 'kick' | 'clap' | 'hat' | 'hatGhost' | 'open' | 'shake' | 'tom' | 'ride' | 'stab';

// step lists are sixteenths within the bar; sub entries are [step, semitones, steps]
const GROOVES: Groove[] = [
  {
    // O — the floor. Nothing clever, just the engine running.
    label: 'floor',
    chord: { root: 45, tones: [0, 12, 15, 19], name: 'Am' },
    kick: [0, 4, 8, 12],
    clap: [4, 12],
    hat: [2, 6, 10, 14],
    hatGhost: [1, 3, 5, 7, 9, 11, 13, 15],
    open: [14],
    shake: [1, 5, 9, 13],
    tom: [],
    ride: [],
    stab: [2, 6, 10, 14],
    stabLen: 1.3,
    sub: [[0, 0, 3], [3, 0, 1], [6, 0, 2], [8, 0, 3], [11, 0, 1], [14, 12, 2]],
    punch: 0.95,
    bright: 0,
  },
  {
    // M — heavy and broken. The kick leaves the grid and toms fill the gaps.
    label: 'broken',
    chord: { root: 41, tones: [0, 12, 16, 19], name: 'F' },
    kick: [0, 3, 6, 8, 11, 14],
    clap: [8],
    hat: [4, 12],
    hatGhost: [],
    open: [6],
    shake: [],
    tom: [2, 5, 7, 10, 13, 15],
    ride: [],
    stab: [0, 8],
    stabLen: 3,
    sub: [[0, 0, 3], [6, 0, 2], [8, 0, 3], [13, 7, 2]],
    punch: 1,
    bright: -0.06,
  },
  {
    // A — the lift. Everything doubles and the filter opens up.
    label: 'lift',
    chord: { root: 36, tones: [0, 12, 16, 19], name: 'C' },
    kick: [0, 4, 8, 12],
    clap: [4, 7, 12, 15],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    hatGhost: [],
    open: [6, 14],
    shake: [],
    tom: [],
    ride: [0, 2, 4, 6, 8, 10, 12, 14],
    stab: [0, 2, 4, 6, 8, 10, 12, 14],
    stabLen: 0.9,
    sub: [[0, 0, 2], [2, 12, 1], [4, 0, 2], [6, 12, 1],
          [8, 0, 2], [10, 12, 1], [12, 0, 2], [14, 12, 1]],
    punch: 1,
    bright: 0.62,
  },
  {
    // R — the drop out. Half-time, almost nothing left, all of it in the reverb.
    label: 'space',
    chord: { root: 43, tones: [0, 12, 16, 19], name: 'G' },
    kick: [0, 8],
    clap: [12],
    hat: [4, 12],
    hatGhost: [1, 3, 5, 7, 9, 11, 13, 15],
    open: [],
    shake: [2, 6, 10, 14],
    tom: [],
    ride: [],
    stab: [0],
    stabLen: 12,
    sub: [[0, 0, 8], [8, 0, 8]],
    tuned: 0.74,
    punch: 0.72,
    bright: -0.32,
  },
];

export function createAudio(): AudioEngine | null {
  const Ctx = window.AudioContext
    || (window as unknown as Record<string, typeof AudioContext>).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();

  // Two procedural buffers so there are still no assets: white noise for every
  // percussion voice, and a decaying noise burst used as a reverb impulse.
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1;

  const irLen = Math.floor(ctx.sampleRate * 2.2);
  const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
  for (let c = 0; c < 2; c += 1) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < irLen; i += 1) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.2);
    }
  }

  const outGain = ctx.createGain();
  outGain.gain.value = 0;
  const sat = ctx.createWaveShaper();
  sat.oversample = '2x';
  // The sweep sits before the saturator, so opening it drives more signal into the
  // distortion and the whole mix hardens as it brightens.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.Q.value = 0.9;
  const mix = ctx.createGain();
  mix.connect(lp);
  lp.connect(sat);
  sat.connect(outGain);
  outGain.connect(ctx.destination);

  // Dragging a letter sideways lands here on every pointer move, and each call builds
  // a fresh transfer curve and swaps it into a live node, so skip the ones that
  // wouldn't change the sound.
  let gritAt = -1;
  const setGrit = (amount: number) => {
    if (Math.abs(amount - gritAt) < 0.005) return;
    gritAt = amount;
    const curve = new Float32Array(1024);
    const k = 1 + amount * 4;
    for (let i = 0; i < 1024; i += 1) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = (Math.tanh(x * k) / Math.tanh(k)) * 0.92;
    }
    sat.curve = curve;
  };
  setGrit(0.45);

  // Tapped off the master *after* the fade, so what the field answers is what you
  // hear — including the ten-second fade and the filter closing over it. An analyser
  // is pulled by having an input; it doesn't need to reach the destination itself.
  const spectrum = ctx.createAnalyser();
  spectrum.fftSize = 2048;
  // Barely smoothed: the FFT's own averaging blunts exactly the transients the
  // picture wants, so the smoothing that's left is done per-band on the way out.
  spectrum.smoothingTimeConstant = 0.15;
  outGain.connect(spectrum);
  const specData = new Uint8Array(spectrum.frequencyBinCount);
  const binHz = ctx.sampleRate / spectrum.fftSize;
  const binsFor = (lo: number, hi: number) => [
    Math.max(1, Math.round(lo / binHz)),
    Math.min(spectrum.frequencyBinCount - 1, Math.round(hi / binHz)),
  ];
  // Kick and sub / toms and stab body / claps and stab top / hats, ride and shaker.
  const SPEC_BANDS = [binsFor(30, 130), binsFor(150, 700), binsFor(900, 4000),
                      binsFor(5000, 14000)];

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.13;
  const lfoAmt = ctx.createGain();
  lfoAmt.gain.value = 0;
  lfo.connect(lfoAmt);
  lfoAmt.connect(lp.frequency);
  lfo.start();

  const verb = ctx.createConvolver();
  verb.buffer = ir;
  const verbSend = ctx.createGain();
  verbSend.gain.value = 0.6;
  verbSend.connect(verb);
  verb.connect(mix);

  const dly = ctx.createDelay(1.2);
  const dlyLp = ctx.createBiquadFilter();
  dlyLp.type = 'lowpass';
  dlyLp.frequency.value = 1900;
  const fb = ctx.createGain();
  fb.gain.value = 0.33;
  dly.connect(dlyLp);
  dlyLp.connect(fb);
  fb.connect(dly);
  dlyLp.connect(mix);
  const dlySend = ctx.createGain();
  dlySend.gain.value = 0.24;
  dlySend.connect(dly);

  // Sidechain. Sub and stabs run through here and get flattened by every kick; the
  // drums bypass it so the kick isn't ducking itself. This duck is most of the
  // pumping energy — it's deep and it recovers fast.
  const pump = ctx.createGain();
  const tuned = ctx.createGain();
  tuned.gain.value = 0.62;
  pump.connect(tuned);
  tuned.connect(mix);
  const drums = ctx.createGain();
  drums.gain.value = 1;
  drums.connect(mix);

  // Every kick the sequencer books, so the picture can hit exactly when the drum
  // does. Detecting it in the spectrum instead doesn't work here: a continuous sub
  // sits under the kick in the same few bins, so the bottom end is always hot and its
  // level says nothing about when the drum landed. The first attempt measured a pulse
  // pinned at 0.98 that never moved. The sequencer already knows, so ask it.
  const bookedKicks: [number, number][] = [];
  let lastKick = -1;
  let lastKickLvl = 0;
  const kickEnv = () => {
    while (bookedKicks.length && bookedKicks[0]![0] <= ctx.currentTime) {
      const k = bookedKicks.shift()!;
      lastKick = k[0];
      lastKickLvl = k[1];
    }
    if (lastKick < 0) return 0;
    // Linear fall over a quarter second, scaled by how loud that kick actually was —
    // so a half-faded kick mid-crossfade pulses half as hard.
    return Math.max(0, 1 - (ctx.currentTime - lastKick) / 0.24) * Math.min(1, lastKickLvl);
  };

  function kick(t: number, level: number) {
    bookedKicks.push([t, level]);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.075);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    o.connect(g);
    g.connect(drums);
    o.start(t);
    o.stop(t + 0.38);
    // A short noise transient so it reads on small speakers, where the 44 Hz body
    // isn't there at all.
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1400;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(level * 0.32, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
    s.connect(hp);
    hp.connect(cg);
    cg.connect(drums);
    s.start(t, Math.random() * 1.4);
    s.stop(t + 0.04);
    // The duck tracks how loud this kick actually is, so a half-faded kick during a
    // groove crossfade doesn't flatten the whole mix as hard as a full one.
    pump.gain.setValueAtTime(1, t);
    pump.gain.linearRampToValueAtTime(1 - 0.84 * Math.min(1, level), t + 0.012);
    pump.gain.linearRampToValueAtTime(1, t + 0.19);
  }

  function clap(t: number, level: number) {
    for (let k = 0; k < 4; k += 1) {
      const tt = t + k * 0.009;
      const s = ctx.createBufferSource();
      s.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.9;
      const g = ctx.createGain();
      const last = k === 3;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(level * (last ? 0.9 : 0.55), tt + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + (last ? 0.16 : 0.035));
      s.connect(bp);
      bp.connect(g);
      g.connect(drums);
      g.connect(verbSend);
      s.start(tt, Math.random() * 1.4);
      s.stop(tt + 0.2);
    }
  }

  function hat(t: number, level: number, open: boolean) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.playbackRate.value = 1.6;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8200;
    const g = ctx.createGain();
    const dur = open ? 0.15 : 0.032;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(hp);
    hp.connect(g);
    g.connect(drums);
    if (open) g.connect(verbSend);
    s.start(t, Math.random() * 1.4);
    s.stop(t + dur + 0.02);
  }

  function shaker(t: number, level: number) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 6200;
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(bp);
    bp.connect(g);
    g.connect(drums);
    s.start(t, Math.random() * 1.4);
    s.stop(t + 0.1);
  }

  function ride(t: number, level: number) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 9500;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    s.connect(bp);
    bp.connect(g);
    g.connect(drums);
    g.connect(verbSend);
    s.start(t, Math.random() * 1.4);
    s.stop(t + 0.32);
  }

  // Pitched tom. Sine body plus a noise skin, tuned off the groove's own root so
  // the tribal fills stay in key.
  function tom(t: number, midi: number, level: number) {
    const hz = mtof(midi);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(hz * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g);
    g.connect(drums);
    g.connect(verbSend);
    o.start(t);
    o.stop(t + 0.26);
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = hz * 4;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(level * 0.22, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(bp);
    bp.connect(sg);
    sg.connect(drums);
    s.start(t, Math.random() * 1.4);
    s.stop(t + 0.07);
  }

  // Deep sine sub with a triangle an octave up for definition. Gently lowpassed and
  // nowhere near resonance — the round bottom end, not a lead.
  function sub(t: number, midi: number, dur: number, lvl: number) {
    const hz = mtof(midi);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 240;
    f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.62 * lvl, t + 0.012);
    g.gain.setValueAtTime(0.62 * lvl, t + dur * 0.88);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const a = ctx.createOscillator();
    a.type = 'sine';
    a.frequency.value = hz;
    a.connect(f);
    a.start(t);
    a.stop(t + dur + 0.03);
    const bq = ctx.createOscillator();
    bq.type = 'triangle';
    bq.frequency.value = hz * 2;
    const bg = ctx.createGain();
    bg.gain.value = 0.16;
    bq.connect(bg);
    bg.connect(f);
    bq.start(t);
    bq.stop(t + dur + 0.03);
    f.connect(g);
    g.connect(pump);
  }

  // Chord stab: detuned saws, fast attack, short decay, lowpassed well below any
  // screech. Rhythmic and repeated, which is the whole point — a held pad glide was
  // inaudible under the drums, but a stab on every offbeat states the chord clearly.
  function stab(t: number, chord: Chord, dur: number, lvl: number) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(2600, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur);
    f.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3 * lvl, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.3 * lvl * 0.34, t + Math.min(dur * 0.5, 0.22));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chord.tones.forEach((tn, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = mtof(chord.root + tn);
      o.detune.value = (i - 1.5) * 6;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
    f.connect(g);
    g.connect(pump);
    g.connect(verbSend);
    g.connect(dlySend);
  }

  // Announced, not sprung. The first version marked a change by cutting the master
  // filter to 600 Hz on the downbeat — which put a hole in the music at the one
  // moment it needs to carry you across. Both of these add energy instead: a riser
  // swells into the change, and a soft cymbal lands on it.
  function riser(t: number, dur: number) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(6500, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + dur * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    s.connect(bp);
    bp.connect(g);
    g.connect(drums);
    g.connect(verbSend);
    s.start(t, Math.random());
    s.stop(t + dur + 0.12);
  }

  function swell(t: number) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 4400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.13, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    s.connect(hp);
    hp.connect(g);
    g.connect(drums);
    g.connect(verbSend);
    s.start(t, Math.random() * 0.4);
    s.stop(t + 1.2);
  }

  let enabled = false;
  let running = false;
  let engagement = 0;
  // What you actually hear. It comes up with the picture but takes about ten seconds
  // to go, because the two want opposite things: the letters are tuned to snap back
  // the instant you leave, and following that straight down made the music sound like
  // the record being switched off. Everything downstream is gated on this rather than
  // on engagement — including the clock, so the groove plays on underneath while it
  // fades instead of stopping and leaving a reverb tail alone in the room, and coming
  // back inside the fade rejoins the take mid-bar rather than restarting it.
  let level = 0;
  let lastAt = 0;
  let step = 0;
  let nextTime = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  // Two grooves are live at once. `blend` walks from the one you left to the one you
  // claimed over half a bar, so nothing is ever switched — the old hats thin out as
  // the new toms arrive. `latchAt` is the step the swap is booked for, set a couple
  // of sixteenths ahead so the riser has somewhere to swell from.
  let prevIdx = 0;
  let curIdx = 0;
  let targetGroove = 0;
  let blend = 1;
  let latchAt = -1;
  const BLEND_STEPS = 8;

  const has = (list: number[], st: number) => list.indexOf(st) >= 0;
  const ease = (x: number) => x * x * (3 - 2 * x);
  // Equal-power crossfade: the two weights are a quarter-circle apart, so their
  // squares sum to one and the midpoint of a transition holds its level. Fading them
  // linearly instead cost 3 dB halfway across, which is small but it is a dip, and
  // going from the busiest groove to the sparsest is where you could hear it.
  const weights = (x: number) => {
    const th = ease(x) * Math.PI * 0.5;
    return [Math.cos(th), Math.sin(th)];
  };
  // Toms walk the chord rather than sitting on one drum, so the fills stay in key.
  const TOM_WALK = [0, 7, 3, 10, 5, 12];

  function scheduleStep(i: number, t: number, s16: number) {
    const st = i % 16;

    // Book the change two sixteenths out and swell into it. Waiting for the current
    // crossfade to pass halfway before booking the next one is what keeps a fast
    // sweep across all four letters reading as a chain of mixes rather than a mess:
    // the request is held, not dropped, and lands as soon as there's room for it.
    if (latchAt < 0 && targetGroove !== curIdx && blend > 0.5) {
      latchAt = i + 2 + (i % 2);
      riser(t, s16 * (latchAt - i));
    }
    if (i === latchAt) {
      prevIdx = curIdx;
      curIdx = targetGroove;
      blend = 0;
      latchAt = -1;
      swell(t);
      // Bring the incoming bed in on the change instead of waiting for its turn in
      // the bar. A breakdown holds the room with one long sub note starting on the
      // downbeat, so landing on, say, the third sixteenth used to leave the outgoing
      // drums fading out over nothing — the only dip left once the crossfade went
      // equal-power, and the only one you could hear. This note runs until whichever
      // of the groove's own notes comes next, so it fills the gap exactly.
      const nb = GROOVES[curIdx];
      const longest = Math.max(0, ...nb.sub.map(([, , len]) => len));
      if (longest >= 4) {
        const nxt = nb.sub.map(([s]) => s).filter((s) => s > st).sort((a, b) => a - b)[0];
        const span = (nxt === undefined ? 16 : nxt) - st;
        if (span > 0.5) {
          sub(t, nb.chord.root - 24, s16 * span, nb.tuned === undefined ? 1 : nb.tuned);
        }
      }
    }

    const A = GROOVES[prevIdx];
    const B = GROOVES[curIdx];
    const [wA, wB] = weights(blend);
    const pu = (A.punch * wA + B.punch * wB) / (wA + wB)
             * (P.punch === undefined ? 1 : P.punch);
    // A hit only one groove wants fades in or out; a hit they both want stays at full
    // level rather than being summed, so the kick doesn't swell mid-transition just
    // because two patterns happen to agree about it.
    //
    // At the redline all four grooves play at once: any voice that *any* groove asks for
    // on this step fires, so the four patterns stack into one wall. That is also what
    // makes it feel faster than the dial can go without touching the tempo — the floor
    // groove's ghost hats cover all sixteen sixteenths, so the union is already
    // double-time — which matters, because actually raising the rate here would drag the
    // visualiser's beat clock and the HUD's bar out of step with it.
    //
    // The kick is the one exception and is pinned to four-on-the-floor rather than joining
    // the union, with off-grid kicks pulled out as the party rises. Half of that is genre
    // (a rave kick is on the floor, and the union of four kick patterns is just mud), and
    // half is the photosensitivity guardrail: the field flashes on every kick the
    // sequencer books, and the union would have put that over three flashes a second.
    const rl = rave.lit;
    const lv = (key: VoiceKey) => {
      const a = has(A[key], st);
      const b = has(B[key], st);
      const base = a && b ? 1 : a ? wA : b ? wB : 0;
      if (rl < 0.01) return base;
      if (key === 'kick') {
        return has(RAVE_KICK, st) ? Math.max(base, rl) : base * (1 - rl);
      }
      // Borrowed hits come in a little under the settled groove's own, so the letter you
      // are actually on stays accented through the wall. Bringing them in at full level
      // made all four grooves identical at the redline, and moving between letters stopped
      // changing anything at all — the party ate the thing the letters were for.
      return GROOVES.some((g) => has(g[key], st)) ? Math.max(base, rl * 0.8) : base;
    };

    // A riser every second bar while lit, so the party keeps building instead of sitting
    // at one level. Reusing the transition riser rather than inventing a voice for it.
    if (st === 0 && rl > 0.5 && Math.floor(i / 16) % 2 === 1) riser(t, s16 * 15);

    const kl = lv('kick');
    if (kl > 0.04) kick(t, kl * pu);
    const cl = lv('clap');
    if (cl > 0.04) clap(t, cl * 0.42 * pu);
    const op = lv('open');
    const hl = lv('hat');
    if (hl > 0.04) hat(t, hl * 0.13 * pu, op > 0.3);
    else if (op > 0.04) hat(t, op * 0.14 * pu, true);
    const gh = lv('hatGhost');
    if (gh > 0.04) hat(t, gh * 0.045 * pu, false);
    const sh = lv('shake');
    if (sh > 0.04) shaker(t, sh * 0.075 * pu);
    const rd = lv('ride');
    if (rd > 0.04) ride(t, rd * 0.05 * pu);

    // The tuned parts take their rhythm from whichever groove asked for it but their
    // harmony always from the incoming one, so two roots are never sounding at once.
    // The chord does land on the latch rather than crossfading, which is what a chord
    // change is; the riser and the cymbal are sitting on that exact beat to carry it.
    const beds: [Groove, number][] = [[A, wA], [B, wB]];
    beds.forEach(([gr, wt]) => {
      if (wt < 0.04) return;
      // The bed level is the incoming groove's, not the pattern's owner, so a
      // breakdown's sub doesn't arrive at the previous groove's weight.
      const bed = wt * (B.tuned === undefined ? 1 : B.tuned);
      const ti = gr.tom.indexOf(st);
      if (ti >= 0) tom(t, gr.chord.root - 12 + TOM_WALK[ti % 6], wt * 0.5 * pu);
      gr.sub.forEach(([sst, semis, len]: number[]) => {
        if (sst === st) sub(t, B.chord.root - 24 + semis, s16 * len, bed);
      });
      if (has(gr.stab, st)) stab(t, B.chord, s16 * gr.stabLen, bed);
    });

    blend = Math.min(1, blend + 1 / BLEND_STEPS);
  }

  function tick() {
    const s16 = 60 / (P.tempo || 115) / 4;
    // The clock only runs while you are engaged and parks at the top of the bar when
    // you leave, so re-entry lands on a downbeat while a slide between letters —
    // which never drops engagement to zero — keeps the take going.
    if (!running) {
      if (level < 0.02) return;
      running = true;
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      prevIdx = targetGroove;
      curIdx = targetGroove;
      blend = 1;
      latchAt = -1;
    } else if (level < 0.01) {
      // Below this the gain is under a thousandth and the filter is nearly shut, so
      // there is nothing left to hear and no reason to keep scheduling into it.
      running = false;
      return;
    }
    const ahead = ctx.currentTime + 0.14;
    while (nextTime < ahead) {
      scheduleStep(step, nextTime, s16);
      step += 1;
      nextTime += s16;
    }
  }

  return {
    get enabled() { return enabled; },
    async toggle() {
      enabled = !enabled;
      if (enabled) {
        await ctx.resume();
        dly.delayTime.value = (60 / (P.tempo || 115)) * 0.75;
        if (!timer) timer = setInterval(tick, 25);
      } else {
        if (timer) { clearInterval(timer); timer = null; }
        running = false;
        level = 0;
        lastAt = 0;
        outGain.gain.cancelScheduledValues(ctx.currentTime);
        outGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        setTimeout(() => { if (!enabled) ctx.suspend(); }, 500);
      }
      return enabled;
    },
    setGrit,
    setTempo(bpm) { dly.delayTime.setTargetAtTime((60 / bpm) * 0.75, ctx.currentTime, 0.1); },
    update(gate, focusIdx, nx) {
      engagement = enabled ? gate : 0;
      if (!enabled) return;
      const now = ctx.currentTime;
      const dt = lastAt ? Math.min(0.12, now - lastAt) : 1 / 60;
      lastAt = now;
      // Fast up, slow down. At this time constant the fade is roughly 30 dB down by
      // ten seconds, which is where it stops being something you're listening to.
      const tau = engagement > level ? 0.09 : 3;
      level += (engagement - level) * (1 - Math.exp(-dt / tau));
      outGain.gain.setTargetAtTime(level * P.volume * 0.8, now, 0.05);
      // Brightness rides the same level, the groove's own bias, and where you are
      // across the word — so the A genuinely opens up, the R genuinely goes dark, and
      // walking away sinks the mix rather than only turning it down.
      const [wa, wb] = weights(blend);
      const bias = (GROOVES[prevIdx].bright * wa + GROOVES[curIdx].bright * wb) / (wa + wb);
      // The filter swings wide open at the redline — roughly three octaves up, which is
      // what turns the same drums from a club mix into something shrieking. The soft clip
      // sits after this filter, so opening it also drives the distortion harder.
      const cut = 380 * Math.pow(2, level * 4.1 + bias * 1.5 + nx * 0.7 + rave.lit * 1.6);
      lp.frequency.setTargetAtTime(Math.min(cut, 14000), now, 0.12);
      lfoAmt.gain.setTargetAtTime(level * 700, now, 0.25);
      if (focusIdx >= 0) targetGroove = focusIdx;
    },
    // The mix split four ways for the visualiser, the kick, and how much music there
    // is. Null when the sound is off, which is what returns the field to its
    // unreactive look.
    //
    // Raw here — just the bin average over 0..1. Rescaling it to a useful range is
    // the caller's job, because the right window differs per band by a lot and has to
    // be found live; see the auto-gain in the frame loop.
    readBands() {
      if (!enabled) return null;
      spectrum.getByteFrequencyData(specData);
      const out = SPEC_BANDS.map(([a, z]) => {
        let s = 0;
        for (let i = a; i <= z; i += 1) s += specData[i];
        return s / (z - a + 1) / 255;
      });
      return { lo: out[0], mid: out[1], hi: out[2], top: out[3], kick: kickEnv(), level };
    },
    // What the sequencer is doing right now, for the HUD to read. The step is
    // corrected back by however far ahead the scheduler has run, so the playhead
    // shows the sixteenth you are hearing rather than the one being written.
    musicState() {
      if (!enabled || !running) return null;
      const s16 = 60 / (P.tempo || 115) / 4;
      // Where the music actually is, in fractional sixteenths: the scheduler's step
      // counter minus however far ahead of the speakers it has written. The HUD draws
      // its beat off this rather than off the frame clock, so the picture is locked to
      // what you're hearing and can't drift as the tempo changes.
      const pos = step - (nextTime - ctx.currentTime) / s16;
      const [wA, wB] = weights(blend);
      const weight: Record<VoiceKey, number> = { kick: 1, clap: 0.7, tom: 0.6, open: 0.5,
                       stab: 0.45, hat: 0.4, ride: 0.3, shake: 0.25, hatGhost: 0.2 };
      const keys = Object.keys(weight) as VoiceKey[];
      const density: number[] = [];
      for (let k = 0; k < 16; k += 1) {
        let d = 0;
        const live: [Groove, number][] = [[GROOVES[prevIdx]!, wA!], [GROOVES[curIdx]!, wB!]];
        live.forEach(([gr, wt]) => {
          keys.forEach((key) => {
            if (has(gr[key], k)) d += weight[key] * wt;
          });
          gr.sub.forEach(([sst]) => { if (sst === k) d += 0.4 * wt; });
        });
        density.push(Math.min(1, d / 2.3));
      }
      return {
        step: Math.floor((((pos % 16) + 16) % 16)),
        beat: ((((pos / 4) % 1) + 1) % 1),
        blend,
        from: GROOVES[prevIdx],
        to: GROOVES[curIdx],
        bpm: Math.round(P.tempo || 115),
        density,
      };
    },
  };
}