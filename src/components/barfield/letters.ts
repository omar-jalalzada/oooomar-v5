/**
 * The layout pass: every letter's { z, scale, offset, rotation, dim, hover } for this
 * frame, computed on the CPU so the HUD can use the same numbers the shader does rather
 * than re-deriving a transform that could drift out of sync.
 */
import { P } from './dials';
import {
  LETTERS, M, TAU, VB_CY, approach, clamp, els, grab, pointer, states, viewport,
} from './state';
import { hitTest } from './input';

export function updateLetters(t: number, dt: number) {
  // Together at rest, separated while you're interacting. `idleLife` keeps a
  // little breathing in the field so it never looks switched off. Both directions
  // are quick — the snap back to the logotype is as much of the gesture as the
  // coming apart, so it shouldn't be something you wait for.
  // Engagement means the pointer is on a specific letter — nothing else. Moving
  // the mouse anywhere near the mark used to count, which meant the word visibly
  // stirred as you approached it and gave away the effect before you'd chosen
  // anything. The grace window is only there to bridge the few pixels between
  // adjacent letters, so sliding along the word doesn't stutter.
  const now = performance.now();
  if (M.lastHit >= 0) M.lastHitAt = now;
  const engaged = pointer.seen && (M.lastHit >= 0 || now - M.lastHitAt < 130);
  const target = engaged ? 1 : P.idleLife;
  const fall = 0.42 - P.snap * 0.36;
  M.activity = approach(M.activity, target, target > M.activity ? 0.07 : fall, dt);
  // The HUD is chrome, not atmosphere: it goes to nothing at rest rather than
  // idling at a whisper, so the resting state is only the letters.
  M.hudUp = approach(M.hudUp, engaged ? 1 : 0, engaged ? 0.06 : fall * 0.7, dt);
  const spread = M.activity * P.zSpread;

  // Which letter is claimed, and how completely. Read from last frame's hover, so
  // it lags by one frame — invisible at 60fps and it keeps the ordering simple.
  M.focusIdx = -1;
  let focus = 0;
  states.forEach((st, i) => { if (st.hover > focus) { focus = st.hover; M.focusIdx = i; } });

  const w = window.innerWidth;
  const h = window.innerHeight;
  const s = (w * P.logoScale) / 1232;
  const originX = w / 2 + viewport.markOffX;

  // Visible width excludes the dial panel, so nothing parks behind it.
  const visW = originX * 2;

  // ── which way the word runs ──────────────────────────────────────────────
  // Everything below is written against an axis rather than against x, because the two
  // layouts differ only in which way the letters are laid out and which way they move to
  // make room for each other. `flow` is the index of that axis: 0 for the word, 1 for the
  // stack. The alternative was a second copy of the accordion and the fit solve.
  const stacked = viewport.stacked;
  const flow = stacked ? 1 : 0;

  // How much the claimed letter grows to become the subject. In the word it is an eighth of
  // the screen and has room to. A stacked glyph is already half the width, so the same
  // multiplier takes it off both edges, past legibility, and over the space its own gauge
  // needs — there it is the subject already, and the gesture's feedback is the gauge and
  // the field's reaction rather than more size. At 1 the accordion also stands still,
  // which is the right answer for the same reason: nothing needs to move aside.
  const focusScale = stacked ? 1 : P.focusScale;

  // A settled letter's scale. 1 for the word, since the word *is* the viewBox at
  // `logoScale`; more than that for the stack, where each glyph gets the full width.
  let baseScale = 1;
  // Where each letter's centre sits when nothing is being touched: its slot in the
  // logotype, which the stack then overwrites.
  const restCx = LETTERS.map((l) => originX + (l.cx - 1019) * s);
  const restCy = LETTERS.map(() => h / 2 + (VB_CY - 764.5) * s);

  if (stacked) {
    // Height is what binds: four glyphs and their gaps have to clear the tagline, so the
    // stack is sized to the space rather than to a chosen scale, and only falls back to a
    // width limit on a viewport too narrow to fit a glyph that tall.
    const GAP = 0.12;               // of a glyph's height
    // Room below the stack for the tagline and the sound pill centred under it. Both are
    // fixed-size chrome — 11px type in a pill 16px off the bottom — so this is a px budget
    // rather than a fraction of the height, which is what stops the tagline from landing on
    // the pill on a short viewport.
    const reserve = 96 + h * 0.04;
    const avail = h - reserve - 32;
    const glyphU = 233;             // viewBox y 631..864
    const widestU = Math.max(...LETTERS.map((l) => l.x1 - l.x0));
    baseScale = Math.min(
      (w * 0.78) / (widestU * s),
      avail / (glyphU * s * (4 + 3 * GAP)),
    );
    const glyph = glyphU * s * baseScale;
    const slot = glyph * (1 + GAP);
    const top = 16 + (avail - (slot * 3 + glyph)) / 2;
    // A letter scales about its own centre, so aiming every centre at the same x is what
    // centres each glyph on the column — the word's horizontal slots are discarded.
    LETTERS.forEach((_, i) => {
      restCx[i] = originX;
      restCy[i] = top + glyph / 2 + i * slot;
    });
  }

  // ── the accordion ────────────────────────────────────────────────────────
  // The letters hold the baseline. Everything to the left of the claimed letter
  // slides further left and everything to the right slides further right, far
  // enough to clear the room its expansion needs, plus a widening gap per step so
  // the word breathes apart instead of just shuffling over.
  //
  // The set is re-centred afterwards, once the real boxes are known — see the
  // pass below the loop. Without it, claiming an outer letter walks the whole word
  // off one side, because its shifts are all in one direction.
  const shifts = LETTERS.map(() => 0);
  if (M.focusIdx >= 0 && focus > 0.001) {
    const fl = LETTERS[M.focusIdx];
    // How far the claimed letter grows along the axis the others are lined up on: its
    // width in the word, its height in the stack.
    const extentU = flow === 0 ? fl.x1 - fl.x0 : 233;
    const room = extentU * s * baseScale * (focusScale - 1) * 0.5;
    LETTERS.forEach((_, i) => {
      if (i === M.focusIdx) return;
      shifts[i] = (i < M.focusIdx ? -1 : 1) * (room + Math.abs(i - M.focusIdx) * P.spaceGap) * focus;
    });
  }

  const layout = (fit: number) => LETTERS.forEach((l, i) => {
    const st = states[i];
    const drift = Math.sin(t * l.rate * TAU * P.driftSpeed + l.phase);
    const sway = Math.sin(t * l.rate * TAU * P.driftSpeed * 0.63 + l.phase * 1.7);

    // Where this letter sits in the intact logotype. The shader is handed a displacement
    // from *this* — it derives the same position from the viewBox itself — so the stack is
    // expressed as a large settled displacement rather than as a second coordinate system.
    const natX = originX + (l.cx - 1019) * s;
    const natY = h / 2 + (VB_CY - 764.5) * s;

    const isFocus = i === M.focusIdx;
    const hov = st.hover;

    // Claimed letter expands in place; the others hold the line and give it room.
    // Every term is scaled by focus, so at rest they all collapse to the settled
    // layout and the word — or the stack — reassembles exactly.
    let sc = baseScale;
    let tx = restCx[i] + (flow === 0 ? shifts[i] * fit : 0);
    let tY = restCy[i] + (flow === 1 ? shifts[i] * fit : 0);
    // Signed depth breath: −1 nearest, +1 furthest. Only used by the others.
    let breath = 0;
    if (isFocus) {
      sc = baseScale * (1 + hov * (focusScale - 1));
    } else if (focus > 0.001) {
      // The liveliness that used to come from going round a ring now comes from
      // travelling in and out of depth on the spot — each letter breathes toward
      // and away from you on its own period, so the group is never still even
      // though nothing is going anywhere.
      breath = Math.sin(t * l.rate * TAU * P.driftSpeed * 0.9 + l.phase * 2.1);
      // Size and depth move together, which is what makes it read as distance
      // rather than as a letter arbitrarily growing.
      const persp = 1 / (1 + breath * P.spaceDepth);
      sc = baseScale * (1 + focus * (P.spaceScale * persp - 1));
      // A vertical float on top of the depth breath, on its own period and out of
      // phase with it, so they don't all rise and fall together. Position, not shape:
      // this is the movement worth having, and it's deliberately the thing that got
      // *more* while the waving got less.
      tY += Math.sin(t * l.rate * TAU * P.driftSpeed * 0.62 + l.phase * 1.4) * P.spaceFloat * focus
         // A slower second term at an unrelated ratio, so the float never settles into
         // an obvious loop the way a single sine does.
          + Math.sin(t * l.rate * TAU * P.driftSpeed * 0.23 + l.phase * 0.7)
            * P.spaceFloat * 0.45 * focus;
    }

    // Claimed letter comes forward, the others fall back — the depth split is what
    // keeps the big letter from just looking like a zoom. It stays the nearest
    // thing on screen by a clear margin, so even a letter at the near end of its
    // breath passes behind it rather than over it.
    const z = spread * (l.zBase + drift * 0.28)
            + (isFocus ? -hov * 1.05 : focus * (0.50 + breath * 0.80));
    st.z = z;
    st.scale = sc / (1 + z * 0.08);
    // Upper bound matters: let the claimed letter go much past this and the bars
    // blow out to flat white and the letterform stops reading.
    st.dim = clamp(1 - z * P.depthFade, 0.22, 1.24);
    st.rot = spread * sway * 0.020 + hov * 0.022
           + (isFocus ? 0 : focus * Math.sin(t * 0.37 + l.phase) * 0.05);

    // Parallax reverses across the focal plane, so near and far letters slide
    // in opposite directions as the pointer moves. The claimed letter opts out of
    // it: it's the anchor the others are spacing themselves against, and having it
    // dragged around by the same pointer that selected it eats into the gaps the
    // accordion just opened up on that side.
    const paDamp = isFocus ? 1 - hov * 0.88 : 1;
    const reach = z * P.parallax * 130 * paDamp;
    const paX = -(pointer.nx - 0.5) * 2 * reach;
    const paY = -(pointer.ny - 0.5) * 2 * reach * 0.55 + sway * spread * 14 * paDamp;
    st.offX = (tx - natX) + paX;
    st.offY = (tY - natY) + paY;

    // Two rects. `rect` is where the letter actually is, for the HUD. `restRect`
    // is its slot in the settled word, and that's what the pointer tests against
    // — hit-testing the live rect would mean claiming the O moves it out from
    // under the cursor, dropping the hover, springing it back, forever.
    const proj = (vx: number, vy: number) => [
      natX + (vx - l.cx) * st.scale * s + st.offX,
      natY + (vy - VB_CY) * st.scale * s + st.offY,
    ];
    const pad = 10;
    const box = (fn: (vx: number, vy: number) => number[]) => {
      const [x0, y0] = fn(l.x0, 631);
      const [x1, y1] = fn(l.x1, 864);
      return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
    };
    st.rect = box(proj);
    // The settled slot carries the settled scale, or on a phone the pointer would be
    // testing against the small horizontal word underneath the stack it can see.
    st.restRect = box((vx, vy) => [
      restCx[i] + (vx - l.cx) * baseScale * s,
      restCy[i] + (vy - VB_CY) * baseScale * s,
    ]);
  });

  // ── fit the opened-up word into the space available ──────────────────────
  // All of this works from the projected boxes, not from the inputs. An earlier
  // version clamped target positions using the pre-perspective scale, which
  // under-measures the real box — the claimed letter gets scaled a second time by
  // its own depth — so the widest letter still hung off the left edge.
  //
  // The group's width is linear in how much of the accordion is applied, and each
  // extreme is held by the same letter throughout, so two trial layouts are enough
  // to solve for the largest spread that fits. Cheap at four letters, and it means
  // the effect degrades by tightening its gaps on a narrow window instead of
  // shoving letters under the dial panel.
  // Measured along the flow axis, so the stack tightens its gaps against the height the
  // same way the word tightens against the width.
  const lo = () => Math.min(...states.map((st) => (flow === 0 ? st.rect.x : st.rect.y)));
  const hi = () => Math.max(...states.map((st) => (flow === 0
    ? st.rect.x + st.rect.w
    : st.rect.y + st.rect.h)));
  const extent = flow === 0 ? visW : h;
  const span = () => hi() - lo();
  layout(1);
  if (focus > 0.001) {
    const avail = extent - 20;
    const wide = span();
    if (wide > avail) {
      layout(0);
      const tight = span();
      layout(wide > tight ? clamp((avail - tight) / (wide - tight), 0, 1) : 0);
    }

    // Then centre what's left in the visible area, faded in by focus so the
    // resting logotype is never nudged.
    const shift = (extent / 2 - (lo() + hi()) / 2) * focus;
    if (shift !== 0) {
      states.forEach((st) => {
        if (flow === 0) { st.offX += shift; st.rect.x += shift; } else { st.offY += shift; st.rect.y += shift; }
      });
    }
  }

  // ── publish where the settled mark is ────────────────────────────────────
  // From the glyph extents rather than from `restRect`, which carries a hit-test pad. The
  // tagline pairs itself with this, and it is the only thing that has to know the two
  // layouts exist — which is the point of computing it here.
  {
    const u = baseScale * s;
    let left = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    LETTERS.forEach((l, i) => {
      left = Math.min(left, restCx[i] + (l.x0 - l.cx) * u);
      right = Math.max(right, restCx[i] + (l.x1 - l.cx) * u);
      bottom = Math.max(bottom, restCy[i] + (864 - VB_CY) * u);
    });
    viewport.markBox.cx = (left + right) / 2;
    viewport.markBox.w = right - left;
    viewport.markBox.bottom = bottom;
    viewport.markBox.unit = u;
  }

  // ── the grabbed letter ───────────────────────────────────────────────────
  // Added after the layout and the re-centring, so dragging one letter moves that
  // letter and nothing else: it doesn't feed back into the accordion, and it doesn't
  // drag the rest of the word sideways to keep the group centred.
  if (grab.last >= 0) {
    // Releasing is treated exactly like moving away: the displacement eases back to
    // nothing from wherever you let go. Holding the letter at the drop point instead
    // meant it had to be hit-tested where it now was rather than in its slot, and the
    // moment those two disagreed the hover flickered between them.
    if (grab.idx < 0) {
      grab.offX = approach(grab.offX, 0, 0.15, dt);
      grab.offY = approach(grab.offY, 0, 0.15, dt);
    }
    const st = states[grab.last];
    st.offX += grab.offX;
    st.offY += grab.offY;
    st.rect.x += grab.offX;
    st.rect.y += grab.offY;
  }
  M.grabIn = approach(M.grabIn, grab.idx >= 0 ? 1 : 0, grab.idx >= 0 ? 0.05 : 0.11, dt);

  // Hover resolves to a single letter: the pointer is over the settled wordmark, so
  // the slots never overlap and no tie-break is needed. Always the settled slot —
  // nothing here tests against where a letter currently is, which is what keeps a
  // letter from moving out from under the cursor and dropping its own hover.
  let hit = pointer.seen ? hitTest(pointer.x, pointer.y) : -1;
  // A press holds its letter regardless of where the pointer has got to, so you can
  // drag past the end of the box without the gesture letting go.
  if (grab.idx >= 0) hit = grab.idx;
  els.stage!.classList.toggle('grabbable', hit >= 0 && grab.idx < 0);
  M.lastHit = hit;
  states.forEach((st, i) => {
    st.hover = approach(st.hover, i === hit ? 1 : 0, i === hit ? 0.045 : 0.09, dt);
  });
}