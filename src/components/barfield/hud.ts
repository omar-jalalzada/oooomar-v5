/**
 * The instrument: vector chrome on a 2D overlay, not part of the shaded image.
 *
 * At rest it draws nothing at all — the resting state is only the letters. Contact brings
 * up the four frames and the links between them; claiming a letter takes one frame solid
 * and raises the gauge for whichever control that letter owns.
 */
import { P, SPECS, type RangeSpec } from './dials';
import {
  HOT, LETTERS, LETTER_DIAL, M, TAU, approach, clamp, grab, rave, sound, states, vis,
  viewport, type LetterState, type MusicState, type Rect,
} from './state';

let hudCanvas: HTMLCanvasElement;
let hctx: CanvasRenderingContext2D;
let tagEl: HTMLElement;
let tagTxtEl: HTMLElement;
let tagRules: HTMLElement[] = [];
let pillEl: HTMLElement | null = null;

export function initHud(canvas: HTMLCanvasElement, tagline: HTMLElement, pill?: HTMLElement | null) {
  hudCanvas = canvas;
  hctx = canvas.getContext('2d')!;
  tagEl = tagline;
  tagTxtEl = tagline.querySelector('.txt')!;
  tagRules = [...tagline.querySelectorAll<HTMLElement>('.rule')];
  pillEl = pill ?? null;
}

const pseudo = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };

let jitterSeed = 0;
let jitterAt = 0;

function brackets(w: number, h: number, ax: number, ay: number) {
  hctx.beginPath();
  hctx.moveTo(0, ay);         hctx.lineTo(0, 0);         hctx.lineTo(ax, 0);
  hctx.moveTo(w - ax, 0);     hctx.lineTo(w, 0);         hctx.lineTo(w, ay);
  hctx.moveTo(w, h - ay);     hctx.lineTo(w, h);         hctx.lineTo(w - ax, h);
  hctx.moveTo(ax, h);         hctx.lineTo(0, h);         hctx.lineTo(0, h - ay);
  hctx.stroke();
}

// Interacting links the frames into a chain. Because the letters sit at
// different depths and move in parallax, the ties skew and stretch as they
// drift — the connection is what makes them read as one tracked object.
function drawConnectors(presence: number) {
  if (presence <= 0.04) return;

  const xs = states.flatMap((st) => [st.rect.x, st.rect.x + st.rect.w]);
  const ys = states.flatMap((st) => [st.rect.y, st.rect.y + st.rect.h]);
  const bx0 = Math.min(...xs) - 16;
  const bx1 = Math.max(...xs) + 16;
  const by0 = Math.min(...ys) - 16;
  const by1 = Math.max(...ys) + 16;

  hctx.save();
  hctx.strokeStyle = '#f0d24a';
  hctx.fillStyle = '#f0d24a';
  hctx.lineWidth = 1;

  const centre = (st: LetterState) => [st.rect.x + st.rect.w / 2, st.rect.y + st.rect.h / 2];
  const focus = M.focusIdx >= 0 ? states[M.focusIdx].hover : 0;

  // Everything radiates from the claimed letter. A star, not a chain: the point
  // is that the others hang off *this* one, so every line has to start here.
  if (focus > 0.04) {
    const [fx, fy] = centre(states[M.focusIdx]);
    states.forEach((st, i) => {
      if (i === M.focusIdx) return;
      const [cx, cy] = centre(st);
      // Stop the line short of the node so it doesn't bury the dot.
      const dx = cx - fx;
      const dy = cy - fy;
      const len = Math.hypot(dx, dy) || 1;
      hctx.globalAlpha = focus * 0.45;
      hctx.beginPath();
      hctx.moveTo(fx + (dx / len) * 12, fy + (dy / len) * 12);
      hctx.lineTo(cx - (dx / len) * 7, cy - (dy / len) * 7);
      hctx.stroke();
      hctx.globalAlpha = focus * 0.7;
      hctx.beginPath();
      hctx.arc(cx, cy, 2.5, 0, TAU);
      hctx.fill();
    });

    // The hub.
    hctx.globalAlpha = focus * 0.95;
    hctx.beginPath();
    hctx.arc(fx, fy, 3.5, 0, TAU);
    hctx.fill();
    hctx.globalAlpha = focus * 0.5;
    hctx.beginPath();
    hctx.arc(fx, fy, 9, 0, TAU);
    hctx.stroke();
  }

  // Corner brackets around the group, but only while nothing is claimed — once a
  // letter takes the stage the radial lines already say how the set is related, and
  // a box around the lot of them on top of that is just a border.
  const hold = presence * (1 - focus);
  if (hold > 0.03) {
    hctx.globalAlpha = hold * 0.4;
    hctx.save();
    hctx.translate(bx0, by0);
    brackets(bx1 - bx0, by1 - by0,
             Math.min(34, (bx1 - bx0) * 0.12), Math.min(26, (by1 - by0) * 0.2));
    hctx.restore();
  }
  hctx.restore();
}

// The tagline is real type, so it stays in the DOM and only its placement comes
// from the field. Every number is derived from the same projection that positions
// the letters — including the dial panel's offset, since the mark slides left when
// the panel is open and a tagline that ignored that would sit off the mark's axis.

let tagBootAt = -1;
/** Last metrics the rules were measured against, so the reflow happens on resize only. */
const ruledFor = { fontPx: -1, markW: -1 };

export function drawTagline(now: number, dt: number) {
  if (tagBootAt < 0) tagBootAt = now;
  // Where the mark actually settled, published by the layout pass. Size and standoff both
  // scale with it, so the pairing keeps its proportions at any logoScale rather than
  // drifting as the word grows — and follows the letters when they stack on a phone
  // instead of staying pinned under a wordmark that isn't there.
  //
  // The assembly spans the mark's own width and is centred on that span, not on the
  // composition centre, which in the word sits 14 units to the right of it.
  const mark = viewport.markBox;
  const s = mark.unit;
  const baseline = mark.bottom;
  const markW = mark.w;

  // 20 units of the mark, except that a stack is sized by the viewport's *height* — a glyph
  // is about a thousandth of it — so under roughly 600px tall the proportional size falls
  // below anything readable. Legibility wins over the ratio there, at the price below.
  const fontPx = viewport.stacked ? Math.max(20 * s, 11) : 20 * s;

  // Lands a beat after the field, the way it does on the real home.
  M.tagIn = approach(M.tagIn, now - tagBootAt > 380 ? 1 : 0, 0.26, dt);

  // Withdraws entirely while you're taking the mark apart. It belongs to the settled
  // presentation layer and has no business being legible mid-gesture, and M.hudUp is
  // already the engagement number, with the snappy fall on it.
  //
  // Which looks at first like it leaves nothing for the reaction below to be seen in,
  // since the music only plays while you're engaged. It doesn't, because the two run on
  // very different clocks: M.hudUp falls in a few hundred milliseconds and the sound takes
  // ten seconds to go. So the window is the tail — you let go, the word snaps back to
  // crisp, and the tagline is the last thing still moving, breathing the track down to
  // silence. Holding it visible during the gesture instead was tried and measured out as
  // unreadable: at a third of its strength over the expanded letter's wall of lit bars it
  // was mud, the same problem the gauges needed a scrim for. This way its one job happens
  // where the screen is empty enough to see it.
  const back = M.hudUp;

  // ── the mix, in the type ─────────────────────────────────────────────────
  // Tracking opens on the kick, the rules brighten with the top end, and the whole line
  // lifts a hair on the beat. Every term is scaled by `mus`, so with the sound off this
  // is perfectly still — a settled state should stay a settled state.
  const track = 0.30 + vis.pulse * 0.055 * vis.mus;

  tagEl.style.fontSize = `${fontPx.toFixed(2)}px`;
  tagEl.style.width = `${markW.toFixed(1)}px`;
  tagEl.style.left = `${mark.cx.toFixed(1)}px`;
  tagEl.style.top = `${(baseline + 46 * s).toFixed(1)}px`;
  tagEl.style.transform = `translate(-50%, ${(back * 10 - (1 - M.tagIn) * 7
    - vis.pulse * 1.5 * vis.mus).toFixed(2)}px)`;
  tagEl.style.opacity = (M.tagIn * (1 - back)
    * (0.58 + vis.pulse * 0.16 * vis.mus)).toFixed(3);
  tagTxtEl.style.letterSpacing = `${track.toFixed(4)}em`;
  tagTxtEl.style.marginRight = `${(-track).toFixed(4)}em`;

  // The price of that floor: once the type is no longer proportional to the mark it can be
  // wider than it, and the rules are flex children that would collapse to slivers rather
  // than to nothing. They measure the mark or they don't run — a 2px tick either side reads
  // as a rendering fault, not as a dimension line. Re-measured only when the metrics that
  // decide it change, because `offsetWidth` is a synchronous reflow and this is per frame.
  if (fontPx !== ruledFor.fontPx || markW !== ruledFor.markW) {
    ruledFor.fontPx = fontPx;
    ruledFor.markW = markW;
    const room = (markW - tagTxtEl.offsetWidth) / 2;
    tagRules.forEach((el) => { el.style.display = room < 8 ? 'none' : ''; });
  }
  // The bands arrive centred on zero, so this brightens and dims either side of its
  // resting value rather than only ever brightening.
  const ruleA = clamp(0.36 + vis.top * 0.30 * vis.mus, 0.08, 0.9);
  tagRules.forEach((el) => { el.style.opacity = ruleA.toFixed(3); });

  // ── the control, under the line ──────────────────────────────────────────
  // Centred on the same mark and standing off the tagline by a fraction of it, so the three
  // hold together as one lockup at any size. It rides the entrance with the tagline but
  // *not* its withdrawal: the line has no business being legible mid-gesture, whereas a
  // control you can't see is a control you can't press. So `M.tagIn` and none of `back`.
  if (pillEl) {
    const gap = Math.max(10, 26 * s);
    pillEl.style.left = `${mark.cx.toFixed(1)}px`;
    pillEl.style.top = `${(baseline + 46 * s + fontPx * 1.2 + gap).toFixed(1)}px`;
    pillEl.style.transform = `translate(-50%, ${(-(1 - M.tagIn) * 7).toFixed(2)}px)`;
    pillEl.style.opacity = M.tagIn.toFixed(3);
  }
}

// Each letter owns one dial in the mix, and this is the gauge for it, drawn in the
// strip beside the letter. It has two states: a dim one that comes up with the hover and
// exists only to say there is something here to pull, and a lit one that follows the
// drag. The hint carets belong to the first and get out of the way for the second; the
// ticks and the larger number belong to the second, because reading an exact value is
// only wanted once you are setting one.
//
// The gesture is the same for all four letters — press, drag up for more — so the frame
// is the same for all four too: one vertical track, caret and readout, in the same place
// each time. What changes is the glyph under it, and that is the part that says what
// kind of quantity you have hold of. Four different widgets would have made one gesture
// look like four.
function drawDialGauge(idx: number, r: Rect, side: number, A: number, show: number, act: number, ms: MusicState | null) {
  const d = LETTER_DIAL[idx];
  const spec = SPECS[d.id] as RangeSpec;
  const lo = spec.min;
  const hi = spec.max;
  const val = P[d.id];
  const frac = clamp((val - lo) / (hi - lo), 0, 1);
  const H = 150;
  const ly = (r.h - H) / 2;
  const my = ly + H * (1 - frac);
  // Beside the letter, but kept on screen. A stacked glyph is centred and half the width,
  // so neither margin holds the gauge's full reach and the unclamped position ran it off
  // the edge entirely. It carries its own backing panel, so where it has to encroach on the
  // bars it still reads — which is why this clamps rather than picking a smaller gauge.
  const REACH = 96;
  const raw = side > 0 ? r.w + 34 : -34;
  const lx = side > 0
    ? Math.min(raw, viewport.hudRight - 4 - r.x - REACH)
    : Math.max(raw, 4 - r.x + REACH);
  // Text runs away from the track on whichever side the gauge ended up.
  const tx = (wide: number) => (side > 0 ? lx + 16 : lx - 16 - wide);

  hctx.save();

  // A scrim first. The gauge sits in the gap beside the letter, and the letter next to
  // it is a wall of lit bars — thin yellow line work over that is unreadable whatever
  // you do to its opacity. The music chip below the letter already solved this the same
  // way. It darkens rather than covers, so the bars still show through it.
  const px0 = side > 0 ? lx - 18 : lx - 74;
  const py0 = ly - 26;
  hctx.fillStyle = 'rgba(9, 5, 11, 0.86)';
  // Reaches full darkness well before the gauge reaches full brightness, because a
  // half-transparent scrim is worse than none: it dims the line work as much as the bars.
  hctx.globalAlpha = A * Math.min(1, show * 1.3);
  hctx.fillRect(px0, py0, 92, H + 70);
  // And a frame around it once you have hold of it, so the thing you are driving is
  // visibly live rather than merely present.
  if (act > 0.03) {
    hctx.strokeStyle = '#f0d24a';
    hctx.globalAlpha = A * act * 0.45;
    hctx.lineWidth = 1;
    hctx.strokeRect(px0 + 0.5, py0 + 0.5, 91, H + 69);
  }

  // ── the redline zone ─────────────────────────────────────────────────────
  // Only the tempo has one. It marks off the top eighth of the dial in a colour that is not
  // the instrument's, and that is the entire affordance for the easter egg: one with no
  // affordance at all is just dead code, since nobody maxes a dial they have no reason to
  // max. It says something is here without saying what.
  const isTempo = d.id === 'tempo';
  const zoneH = H * 0.125;
  if (isTempo) {
    hctx.fillStyle = HOT;
    hctx.globalAlpha = A * show * (0.30 + rave.charge * 0.5);
    hctx.fillRect(lx - 1.5, ly, 3, zoneH);
    // Hatched, so it reads as a marked-off region rather than as a coloured length of track.
    hctx.strokeStyle = HOT;
    hctx.lineWidth = 1;
    hctx.globalAlpha = A * show * 0.42;
    for (let k = 0; k < 4; k += 1) {
      const yy = ly + 2 + k * (zoneH / 4);
      hctx.beginPath();
      hctx.moveTo(lx + side * 3, yy);
      hctx.lineTo(lx + side * 9, yy - 3);
      hctx.stroke();
    }
  }

  hctx.strokeStyle = '#f0d24a';
  hctx.fillStyle = '#f0d24a';
  hctx.font = '500 11px "JetBrains Mono", monospace';

  // The track, and how much of it you have used.
  hctx.globalAlpha = A * show * 0.30;
  hctx.fillRect(lx - 1.5, ly, 3, H);
  // The fill itself turns hot inside the zone, so the gauge changes character rather than
  // merely passing a mark.
  hctx.fillStyle = isTempo && frac > 0.875 ? HOT : '#f0d24a';
  hctx.globalAlpha = A * show * (0.62 + act * 0.38);
  hctx.fillRect(lx - 1.5, my, 3, H - (my - ly));
  hctx.fillStyle = '#f0d24a';

  // Ticks, eighths of the range with the quarters longer.
  hctx.globalAlpha = A * show * (0.22 + act * 0.42);
  hctx.lineWidth = 1;
  for (let k = 0; k <= 8; k += 1) {
    const ty = ly + (H * k) / 8;
    hctx.beginPath();
    hctx.moveTo(lx + side * 3, ty);
    hctx.lineTo(lx + side * (k % 2 === 0 ? 10 : 6), ty);
    hctx.stroke();
  }

  // Caret and value. The number grows a little as you take hold of it.
  hctx.globalAlpha = A * show * (0.8 + act * 0.2);
  hctx.beginPath();
  hctx.moveTo(lx - side * 4, my);
  hctx.lineTo(lx - side * 12, my - 5.5);
  hctx.lineTo(lx - side * 12, my + 5.5);
  hctx.closePath();
  hctx.fill();
  hctx.font = `500 ${(11 + act * 3).toFixed(1)}px "JetBrains Mono", monospace`;
  const num = d.fmt(val);
  hctx.globalAlpha = A * show * (0.85 + act * 0.15);
  // Kept inside the track's span. At the very top of the range the caret sits level with
  // the label above it and the two collided; a number a few pixels away from its own
  // caret is a much smaller problem than two pieces of type on top of each other.
  hctx.fillText(num, tx(hctx.measureText(num).width), clamp(my + 4, ly + 11, ly + H));

  // Which dial this is — except the tempo, which renames itself as it goes critical. That
  // is the whole of the instrument's acknowledgement of the party: it keeps its own colour
  // and its own type and just reports what is happening, which is funnier than joining in.
  hctx.font = '500 11px "JetBrains Mono", monospace';
  const hotLbl = isTempo && (rave.charge > 0.02 || rave.lit > 0.5);
  const lbl = isTempo && rave.lit > 0.5 ? 'REDLINE'
            : isTempo && rave.charge > 0.02 ? 'HOLD' : d.label;
  hctx.fillStyle = hotLbl ? HOT : '#f0d24a';
  hctx.globalAlpha = A * show * (0.72 + act * 0.28);
  hctx.fillText(lbl, tx(hctx.measureText(lbl).width), ly - 8);

  // How much of the hold is done. Without it, pegging the dial and waiting looks like
  // nothing happening at all — the charge is the one part of this gesture with no other
  // feedback, and a second of no feedback is easily long enough to let go.
  if (rave.charge > 0.02 && rave.lit < 0.98) {
    hctx.fillStyle = HOT;
    hctx.globalAlpha = A * show * 0.28;
    hctx.fillRect(lx + side * 13, ly, side * 3, H * 0.28);
    hctx.globalAlpha = A * show * 0.95;
    hctx.fillRect(lx + side * 13, ly, side * 3, H * 0.28 * rave.charge);
  }
  hctx.fillStyle = '#f0d24a';

  // The hint: a caret at each end of the track saying which way it goes. Only while you
  // are not already dragging — once you are, the gauge itself is the feedback.
  const hint = A * show * (1 - act) * 0.85;
  if (hint > 0.01) {
    hctx.globalAlpha = hint;
    [-1, 1].forEach((dir) => {
      const yy = dir < 0 ? ly - 5 : ly + H + 5;
      hctx.beginPath();
      hctx.moveTo(lx, yy + dir * 5);
      hctx.lineTo(lx - 4, yy);
      hctx.lineTo(lx + 4, yy);
      hctx.closePath();
      hctx.fill();
    });
  }

  // ── the glyph ────────────────────────────────────────────────────────────
  const gx = side > 0 ? lx + 10 : lx - 56;
  const gy = ly + H + 20;
  const lit = A * show * (0.75 + act * 0.25);

  if (d.glyph === 'beat') {
    // Four quarter notes with the one you are on lit: a rate shown as a rate, so
    // dragging up reads as the lights arriving faster rather than as a number changing.
    for (let k = 0; k < 4; k += 1) {
      const on = ms !== null && Math.floor(ms.step / 4) === k;
      hctx.globalAlpha = A * show * (on ? 1 : 0.3);
      hctx.beginPath();
      hctx.arc(gx + 6 + k * 12, gy + 10, on ? 4.2 : 2.4, 0, TAU);
      hctx.fill();
    }
  } else if (d.glyph === 'clip') {
    // A wave squaring off. Grit is a soft clipper, so the honest picture of it is the
    // shape of its own transfer curve: a clean sine at nothing, a hard square at full.
    const c = Math.max(0.08, 1 - frac * 0.92);
    hctx.globalAlpha = lit;
    hctx.lineWidth = 1.6;
    hctx.beginPath();
    for (let k = 0; k <= 46; k += 1) {
      const yy = gy + 10 - (clamp(Math.sin((k / 46) * TAU * 1.5), -c, c) / c) * 8.5;
      if (k === 0) hctx.moveTo(gx + k, yy); else hctx.lineTo(gx + k, yy);
    }
    hctx.stroke();
  } else if (d.glyph === 'hit') {
    // Struck bars on a floor: as tall as the weight you have set, and flashing on each
    // kick, so the thing you are adjusting and the thing it does are one object.
    hctx.globalAlpha = A * show * 0.22;
    hctx.fillRect(gx, gy + 19, 46, 1.5);
    const bh = 4 + frac * 15;
    for (let k = 0; k < 3; k += 1) {
      const hgt = bh * (k === 1 ? 1 : 0.6);
      hctx.globalAlpha = A * show * Math.min(1, 0.5 + vis.pulse * 0.5);
      hctx.fillRect(gx + 9 + k * 13, gy + 19 - hgt, 5, hgt);
    }
  } else {
    // A rising staircase of segments, lit up to the level — the one gauge everybody
    // already knows how to read.
    for (let k = 0; k < 8; k += 1) {
      const on = (k + 1) / 8 <= frac + 1e-6;
      hctx.globalAlpha = A * show * (on ? 0.95 : 0.22);
      const hgt = 4 + (k / 7) * 13;
      hctx.fillRect(gx + k * 5.8, gy + 19 - hgt, 3.6, hgt);
    }
  }
  hctx.restore();
}

export function drawHud(now: number, presence: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (hudCanvas.width !== Math.floor(w * dpr) || hudCanvas.height !== Math.floor(h * dpr)) {
    hudCanvas.width = Math.floor(w * dpr);
    hudCanvas.height = Math.floor(h * dpr);
  }
  hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hctx.clearRect(0, 0, w, h);
  if (!P.hudOn) return;

  // Re-roll the jitter a few times a second rather than every frame, so it
  // reads as a scanner re-acquiring rather than as noise.
  if (now - jitterAt > 70) { jitterSeed = now; jitterAt = now; }

  hctx.font = '500 11px "JetBrains Mono", monospace';

  drawConnectors(presence);

  states.forEach((st, i) => {
    const l = LETTERS[i];
    const r = st.rect;
    const hov = st.hover;
    // Interacting raises every frame; hovering takes one of them to full. No
    // floor term, so at rest this resolves to nothing at all.
    const alpha = presence * 0.30 + hov * 0.70;
    if (alpha <= 0.004) return;

    // Flicker only while the frame is arriving; solid once it's locked on.
    const flicker = hov > 0.03 && hov < 0.88
      ? (pseudo(jitterSeed * 0.013 + i * 9.7) > 0.34 ? 1 : 0.22)
      : 1;
    const jx = hov * (pseudo(jitterSeed * 0.017 + i * 7.1) - 0.5) * 7;
    const jy = hov * (pseudo(jitterSeed * 0.019 + i * 3.3) - 0.5) * 7;

    hctx.save();
    hctx.globalAlpha = alpha * flicker;
    hctx.strokeStyle = '#f0d24a';
    hctx.lineWidth = 1 + hov * 1.1;
    hctx.translate(r.x + jx, r.y + jy);

    brackets(r.w, r.h, Math.min(r.w * 0.3, 12 + hov * 32), Math.min(r.h * 0.3, 12 + hov * 32));

    // Solid box the moment it locks on — this is the letter being claimed, so it
    // wants to be unambiguous rather than tentative.
    if (hov > 0.12) {
      hctx.save();
      hctx.globalAlpha = alpha * flicker * clamp((hov - 0.12) / 0.3, 0, 1) * 0.7;
      hctx.strokeRect(0, 0, r.w, r.h);
      hctx.restore();
    }
    // Second frame standing off the first, opening outward as it settles.
    if (hov > 0.25) {
      const g = 5 + hov * 9;
      hctx.save();
      hctx.globalAlpha = alpha * flicker * (hov - 0.25) / 0.75 * 0.4;
      hctx.setLineDash([3, 5]);
      hctx.strokeRect(-g, -g, r.w + g * 2, r.h + g * 2);
      hctx.restore();
    }
    if (hov > 0.2) {
      const sy = ((now / 1500) % 1) * r.h;
      hctx.save();
      hctx.globalAlpha = alpha * flicker * 0.45;
      hctx.beginPath();
      hctx.moveTo(0, sy);
      hctx.lineTo(r.w, sy);
      hctx.stroke();
      hctx.restore();
    }

    // Label chip with live coordinates and depth, nudged to stay on screen
    // when its letter sits near an edge.
    if (hov > 0.06) {
      const zs = `${st.z >= 0 ? '+' : '−'}${Math.abs(st.z).toFixed(2)}`;
      const label = `${l.name} ${Math.round(r.x)},${Math.round(r.y)} Z${zs}`;
      const tw = hctx.measureText(label).width + 10;
      const absX = r.x + jx;
      const absY = r.y + jy;
      let dx = 0;
      if (absX < 4) dx = 4 - absX;
      else if (absX + tw > w - 4) dx = w - 4 - (absX + tw);
      const dy = absY < 20 ? r.h + 30 : 0;
      hctx.save();
      hctx.globalAlpha = alpha * flicker;
      hctx.fillStyle = '#f0d24a';
      hctx.fillRect(dx, dy - 16, tw, 14);
      hctx.fillStyle = '#111';
      hctx.fillText(label, dx + 5, dy - 5);
      hctx.restore();
    }

    // ── the beat ─────────────────────────────────────────────────────────────
    // A ring leaves the box on every quarter note and fades as it grows, on whichever
    // letter you are holding — it is the pulse of the track rather than a readout of any
    // one dial, so it belongs to all four. Drag the O and the rings arrive faster; drag
    // the A and they hit harder. Phase comes from the audio clock, so it cannot drift
    // away from the kick.
    const ms = hov > 0.3 ? (sound.engine?.musicState() ?? null) : null;
    if (ms) {
      const g = ms.beat;
      hctx.save();
      hctx.strokeStyle = '#f0d24a';
      // The ring has to outrun the rest of the chrome to be seen at all — the standoff
      // frame already stands 14px off the box and the two chips reach further than
      // that, so a ripple that faded inside 20px was drawing underneath furniture. It
      // now clears 48px and its brightness falls off linearly rather than squared.
      hctx.globalAlpha = alpha * flicker * (1 - g) * 0.5;
      hctx.lineWidth = 2.2 - g * 1.4;
      const e = 5 + g * 44;
      hctx.strokeRect(-e, -e, r.w + e * 2, r.h + e * 2);
      // And the box itself takes the hit, so the beat is legible even when the ring is
      // lost against the letter behind it.
      if (g < 0.2) {
        hctx.globalAlpha = alpha * flicker * (1 - g / 0.2) * 0.5;
        hctx.lineWidth = 2.4;
        hctx.strokeRect(-1, -1, r.w + 2, r.h + 2);
      }
      hctx.restore();
    }

    // The sound gauge for whatever this letter owns. Two states: dim on hover, which
    // is there only to say the letter can be pulled, and lit while you're pulling it.
    const act = i === grab.last ? M.grabIn : 0;
    // The idle state is nearly as bright as the active one on purpose. Separating them
    // by opacity alone left the hover state too faint to read against the bars, and a
    // hint you have to squint at isn't a hint — so the two states differ by what they
    // contain instead: ticks and a bigger number arrive, the hint carets leave.
    const gShow = Math.max(clamp((hov - 0.22) / 0.30, 0, 1) * 0.8, act);
    if (gShow > 0.01) {
      // Flip inboard when the gauge would run under the dial panel or off the window —
      // the panel is the real edge of the picture while it's open, and the gauge needs
      // its whole 130px, not just its anchor, to be inside it. When *neither* margin holds
      // it, which is a stacked glyph on a phone, take the roomier side and let the gauge
      // clamp itself into the window.
      const roomR = viewport.hudRight - (r.x + jx + r.w);
      const roomL = r.x + jx;
      const side = roomR >= 130 ? 1 : roomL >= 130 ? -1 : roomR >= roomL ? 1 : -1;
      drawDialGauge(i, r, side, alpha * flicker, gShow, act, ms);
    }

    // Music readout, under the claimed letter only. Outlined rather than filled so
    // it reads as a second instrument to the coordinate chip above, not a repeat of
    // it. It's drawn from `musicState()`, which returns null unless the sequencer is
    // actually running — so it can never describe music you aren't hearing, and it
    // stays absent entirely with the sound off.
    if (ms) {
      // Mid-crossfade it names both grooves; settled, it names the chord you're in.
      const txt = ms.blend < 0.94
        ? `♪ ${ms.from.label} ▸ ${ms.to.label}`
        : `♪ ${ms.to.chord.name} · ${ms.to.label} · ${ms.bpm}`;
      const cw = Math.max(hctx.measureText(txt).width + 12, 132);
      const ch = 32;
      // Flip above the letter rather than run off the bottom of the window.
      let mx = 0;
      let my = r.h + 10;
      if (r.y + jy + my + ch > h - 6) my = -ch - 10;
      if (r.x + jx + mx + cw > w - 6) mx = w - 6 - cw - (r.x + jx);
      if (r.x + jx + mx < 6) mx = 6 - (r.x + jx);

      hctx.save();
      hctx.globalAlpha = alpha * flicker * clamp((hov - 0.3) / 0.35, 0, 1);
      hctx.fillStyle = 'rgba(10, 6, 12, 0.82)';
      hctx.fillRect(mx, my, cw, ch);
      hctx.strokeStyle = '#f0d24a';
      hctx.lineWidth = 1;
      hctx.strokeRect(mx, my, cw, ch);
      hctx.fillStyle = '#f0d24a';
      hctx.fillText(txt, mx + 6, my + 12);

      // The bar's sixteen sixteenths, each as tall as the number of voices landing on
      // it, with the one you're hearing lit. Naming the groove says what changed; this
      // shows it — the hats fill the bar in at the A and drain out of it at the R, and
      // during a crossfade you watch one shape become the other.
      const cellW = (cw - 12) / 16;
      ms.density.forEach((d: number, k: number) => {
        const bh = 2 + d * 11;
        hctx.globalAlpha = alpha * flicker * (k === ms.step ? 1 : 0.34);
        hctx.fillRect(mx + 6 + k * cellW, my + ch - 5 - bh,
                      Math.max(1.4, cellW - 1.6), bh);
      });
      hctx.restore();
    }

    hctx.restore();
  });
}