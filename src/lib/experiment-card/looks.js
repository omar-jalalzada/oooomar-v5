/**
 * An experiment card's look: the three layers found by one key. Each layer module keys its
 * presets by the same look id (the experiment's slug when the look was made for it), so
 * this is where they meet. The content schema imports `LOOKS`, which makes naming a look
 * that doesn't exist a build error rather than a blank card.
 *
 * The layer modules came from public/prototypes/card-tricks/v13/, and this copy is now the
 * source: a look tuned on the bench is carried over here by hand.
 */
import { FORMATS, PRESETS, presetState } from './background.js';
import { visPresetState } from './visuals.js';
import { typeFor } from './type.js';

export const LOOKS = /** @type {[string, ...string[]]} */ (PRESETS.map((p) => p.id));

export function cardSpec(look, words) {
  const bg = presetState(look);
  return { format: FORMATS[bg.format.shape], bg, vis: visPresetState(look), type: typeFor(look, words) };
}

/**
 * The ground as CSS gradients: what the card shows before its script runs, and for good
 * if WebGL isn't there. Only an approximation of the shader, since it can't blend in
 * OKLab or warp, but it puts the right colours in the right places so nothing flashes.
 */
export function posterBackground(bg) {
  const layers = bg.fields
    .slice()
    .reverse()
    .map((f) => {
      const a = Math.round(f.opacity * 100);
      return `radial-gradient(ellipse ${(f.rx * 100).toFixed(1)}% ${(f.ry * 100).toFixed(1)}% at ${(f.x * 100).toFixed(1)}% ${(f.y * 100).toFixed(1)}%, color-mix(in oklab, ${f.color} ${a}%, transparent), transparent)`;
    });
  return [...layers, bg.ground].join(', ');
}
