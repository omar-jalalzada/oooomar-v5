/**
 * Entry point: mount the dial panel, start the field, wire the sound control.
 *
 * The panel is mounted first and explicitly, rather than left to module execution order,
 * because the frame loop is handed `#mode` and `#fps` from inside it — they have to exist
 * by the time startField reads them.
 */
import { P } from './dials.js';
import { startField } from './field.js';
import { setSoundFocus, setSoundHover, setSoundUnavailable } from './hud.js';
import { sound } from './state.js';
import { mountPanel } from './panel.js';

mountPanel();

const stage = document.getElementById('stage');
const gl = document.getElementById('gl');
const hud = document.getElementById('hud');
const tagline = document.getElementById('tagline');
const soundBtn = document.getElementById('soundToggle');

if (stage && gl && hud && tagline) {
  const ok = await startField({
    stage,
    gl,
    hud,
    tagline,
    pill: soundBtn,
    panel: document.getElementById('dials'),
    mode: document.getElementById('mode'),
    fps: document.getElementById('fps'),
  });

  if (!ok) {
    document.getElementById('fallback')?.classList.add('show');
    stage.style.display = 'none';
    soundBtn?.remove();
    document.getElementById('dials')?.remove();
    document.getElementById('panelToggle')?.remove();
  }
}

// ── sound ────────────────────────────────────────────────────────────────
// A browser will not resume an AudioContext without a genuine user gesture, and
// pointermove is explicitly not one, so hovering can never be enough to begin. That is
// why there's a control to click — and it's also why the engine is imported here rather
// than at the top: it's the largest module in the field and not one byte of it is
// needed to draw a frame, so it isn't fetched until someone asks for sound.
let engine = null;

// The drawn control can't see the pointer — the overlay it lives on is pointer-events:
// none — so the hit target tells it. Focus too, since the UA ring is suppressed and the
// brackets are what replace it.
soundBtn?.addEventListener('pointerenter', () => setSoundHover(true));
soundBtn?.addEventListener('pointerleave', () => setSoundHover(false));
soundBtn?.addEventListener('focus', () => setSoundFocus(true));
soundBtn?.addEventListener('blur', () => setSoundFocus(false));

soundBtn?.addEventListener('click', async () => {
  soundBtn.disabled = true;
  try {
    if (!engine) {
      const { createAudio } = await import('./audio.js');
      engine = createAudio();
      if (!engine) {
        const lbl = soundBtn.querySelector('.snd-label');
        if (lbl) lbl.textContent = 'no audio here';
        setSoundUnavailable();
        return;
      }
      // Built inside the click handler, so the context is created under a live user
      // activation rather than resumed after the fact.
      sound.engine = engine;
      engine.setTempo(P.tempo);
    }
    const on = await engine.toggle();
    // Always the next action, never the current state — the label is what pressing it
    // will do. `aria-pressed` is what carries the state, which is its job.
    const lbl = soundBtn.querySelector('.snd-label');
    if (lbl) lbl.textContent = on ? 'turn off sound' : 'turn on sound';
    soundBtn.setAttribute('aria-pressed', String(on));
  } finally {
    // Left disabled only on the No audio path, where there's nothing to press for.
    if (engine) soundBtn.disabled = false;
  }
});
