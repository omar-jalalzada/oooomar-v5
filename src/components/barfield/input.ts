/**
 * Pointer and the grab gesture.
 *
 * In the sketch this drove the dial panel's `<input>` elements directly and let the
 * browser clamp and snap the value. Now it goes through `setDial`, which does both, and
 * the panel — when it exists at all — is just another subscriber.
 */
import { P, SPECS, setDial, type RangeSpec } from './dials';
import { LETTER_DIAL, els, grab, pointer, states } from './state';

/**
 * Where the pointer is, in the settled wordmark's slots.
 *
 * Always `restRect`, never the live box: hit-testing where a letter currently is would
 * mean claiming one moves it out from under the cursor, which drops the hover, which
 * springs it back — an oscillation with no stable state. So the intact wordmark is the
 * control surface and the spacing is purely the response.
 */
export function hitTest(x: number, y: number): number {
  let hit = -1;
  states.forEach((st, i) => {
    const r = st.restRect;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) hit = i;
  });
  return hit;
}

/** A press on the dev-only panel, or on any button, belongs to that control. */
function onChrome(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('#dials')) || Boolean(target.closest('button'));
}

// ── grabbing a letter ──────────────────────────────────────────────────────
// Every letter is a handle onto one control in the mix: press it and drag up or down.
// The letter travels with the pointer in both axes, because a handle that follows your
// hand is what makes it feel like an object rather than an invisible modifier on a
// hover — but only the vertical distance means anything.
//
// One dial each rather than one dial with four ways in. It gives the four letters
// separate jobs instead of making them interchangeable, and it means the word as a
// whole is the mixing desk: the O sets the pace, the M the dirt, the A the weight of
// the drums, the R how loud any of it is.
//
// Sideways used to drive a second dial at the same time. Two axes on one grab was one
// more thing than the gesture wanted, and the second one was hard to avoid nudging
// while aiming the first.
//
// Letting go is the same event as moving away: the letter walks back to its place.
// Keeping it where it was dropped meant hit-testing it where it now was rather than in
// its slot, and the moment the two disagreed the hover flickered between them.

// The dial's whole range in 340px of travel, measured from wherever it stood when you
// pressed. Relative rather than absolute, so a second drag carries on from where the
// last one left off instead of jumping to match the pointer.
const DRAG_SPAN = 340;

function dragDial(id: keyof typeof SPECS, from: number, delta: number) {
  const spec = SPECS[id] as RangeSpec;
  // setDial clamps and snaps to the step, which is what the range input used to do for
  // us back when the panel was the source of truth.
  setDial(spec.id, from + (delta / DRAG_SPAN) * (spec.max - spec.min));
}

function dragTo(x: number, y: number) {
  grab.offX = x - grab.px;
  grab.offY = y - grab.py;
  // Up is always more, whatever the letter happens to own.
  dragDial(LETTER_DIAL[grab.idx].id, grab.from, -grab.offY);
}

const endGrab = () => {
  if (grab.idx < 0) return;
  grab.idx = -1;
  els.stage?.classList.remove('grabbing');
};

export function bindInput() {
  window.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0 || onChrome(e.target)) return;
    // Hit-test here rather than trusting the hover left by the last pointermove. On
    // touch there is no move before the finger lands, so that value is still -1 and the
    // first tap-drag on a phone did nothing at all.
    const idx = hitTest(e.clientX, e.clientY);
    if (idx < 0) return;
    e.preventDefault();
    grab.idx = idx;
    grab.last = idx;
    grab.px = e.clientX;
    grab.py = e.clientY;
    grab.from = P[LETTER_DIAL[idx].id];
    grab.offX = 0;
    grab.offY = 0;
    els.stage?.classList.add('grabbing');
  });

  window.addEventListener('pointerup', endGrab);
  window.addEventListener('pointercancel', endGrab);
  window.addEventListener('blur', endGrab);

  window.addEventListener('pointermove', (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = e.clientX / window.innerWidth;
    pointer.ny = e.clientY / window.innerHeight;
    pointer.seen = true;
    pointer.lastMove = performance.now();
    if (grab.idx >= 0) dragTo(e.clientX, e.clientY);
  });

  window.addEventListener('pointerleave', () => {
    pointer.seen = false;
    // Dragging out of the window means the release happens where we'll never hear about
    // it, so end the gesture here rather than leaving a press stuck down. Same for the
    // window losing focus mid-drag.
    endGrab();
  });

  // A touch that lands on a letter has to own the gesture outright: without this the
  // vertical drag that sets the tempo scrolls the page instead, and on iOS it starts
  // the rubber-band overscroll before the first pointermove even arrives.
  els.stage?.addEventListener('touchstart', (e: TouchEvent) => {
    const t = e.touches[0];
    if (t && hitTest(t.clientX, t.clientY) >= 0) e.preventDefault();
  }, { passive: false });
}
