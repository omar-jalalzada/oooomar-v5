/**
 * Dial state for the bar field.
 *
 * In the explore sketch the `<input type="range">` elements *were* the state: `P` was
 * populated by reading the DOM, and the letter-drag gesture worked by writing an input's
 * value and dispatching an `input` event. That made the panel load-bearing — dropping it
 * from the page would have taken the drag gesture, the sound controls and the redline
 * easter egg with it.
 *
 * So the spec lives here as data, `P` is the one live copy, and the panel becomes an
 * optional dev-only *view* over this module. Nothing else needs to know whether it exists.
 */
const range = (id, label, min, max, stepText, value) => ({ kind: 'range', id, label, min, max, step: Number(stepText), stepText, value });
const toggle = (id, label, value) => ({ kind: 'toggle', id, label, value });
/**
 * Ported verbatim from the v6 markup, including the committed defaults. Group order and
 * labels are the panel's, because `dialText()` emits them and those lines get pasted back
 * here when a setting earns its place as the new default.
 */
export const DIAL_GROUPS = [
    {
        title: 'Depth',
        dials: [
            range('zSpread', 'Z spread', 0, 1.5, '0.01', 1.5),
            range('parallax', 'Parallax', 0, 1.5, '0.01', 1.5),
            range('driftSpeed', 'Drift speed', 0, 2, '0.01', 1.21),
            range('depthFade', 'Depth fade', 0, 1, '0.01', 1),
            range('idleLife', 'Idle life', 0, 1, '0.01', 0),
        ],
    },
    {
        title: 'Focus',
        dials: [
            range('focusScale', 'Focus scale', 1, 3, '0.01', 2.46),
            range('spaceGap', 'Spread gap', 0, 140, '1', 0),
            range('spaceScale', 'Letter scale', 0.5, 1, '0.01', 1),
            range('spaceDepth', 'Depth breathe', 0, 0.7, '0.01', 0.32),
            range('spaceFloat', 'Float', 0, 48, '1', 26),
            range('spaceWave', 'Other wave', 0, 1, '0.01', 0.34),
        ],
    },
    {
        title: 'Motion',
        dials: [
            range('shimmer', 'Stroke shimmer', 0, 1.5, '0.01', 0.81),
            range('flow', 'Flow speed', 0, 3, '0.01', 1.1),
            range('restCalm', 'Rest calm', 0, 1, '0.01', 0.85),
            range('snap', 'Snap back', 0, 1, '0.01', 0.5),
        ],
    },
    {
        title: 'Density',
        dials: [
            range('cols', 'Columns', 40, 480, '2', 246),
            range('barWidth', 'Bar width', 0.15, 0.95, '0.01', 0.53),
            range('gapNoise', 'Gap noise', 0, 1, '0.01', 0),
        ],
    },
    {
        title: 'Bloom',
        dials: [
            range('bloomThreshold', 'Threshold', 0, 1.2, '0.01', 0.38),
            range('bloomRadius', 'Radius', 0, 10, '0.05', 6.4),
            range('bloomAmount', 'Amount', 0, 4, '0.01', 1.24),
            range('exposure', 'Exposure', 0.4, 3, '0.01', 1.35),
        ],
    },
    {
        title: 'Shape',
        dials: [
            range('logoScale', 'Logo scale', 0.3, 1.5, '0.01', 0.6),
            range('threshold', 'Threshold', 0.05, 0.95, '0.01', 0.55),
            range('edgeJitter', 'Edge jitter', 0, 60, '0.5', 12),
            range('blobWarp', 'Blob warp', 0, 1, '0.01', 0.44),
            range('warpSpeed', 'Warp speed', 0, 2, '0.01', 0.85),
        ],
    },
    {
        title: 'Color / HUD',
        dials: [
            range('hue', 'Hue', 240, 400, '1', 307),
            range('sat', 'Saturation', 0, 100, '1', 88),
            range('coreGlow', 'White core', 0, 2, '0.01', 0.9),
            toggle('hudOn', 'Hover HUD', true),
            toggle('animate', 'Animate', true),
        ],
    },
    {
        title: 'Sound',
        dials: [
            range('volume', 'Volume', 0, 1, '0.01', 0.86),
            range('tempo', 'Tempo', 90, 140, '1', 115),
            range('grit', 'Grit', 0, 1, '0.01', 0.1),
            range('punch', 'Drum weight', 0.3, 1.3, '0.01', 0.8),
        ],
    },
];
export const SPECS = Object.fromEntries(DIAL_GROUPS.flatMap((g) => g.dials.map((d) => [d.id, d])));
/** The one live copy every module reads. Mutated in place so existing reads of `P.x` hold. */
export const P = Object.fromEntries(Object.values(SPECS).map((d) => [d.id, d.value]));
const listeners = new Set();
/** Replaces the sketch's single `onDialChange` hook. Returns an unsubscribe. */
export function onDialChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
function notify(id) {
    for (const fn of listeners)
        fn(id);
}
/** How many decimals the authored step keeps, so snapping can't drift into 0.5300000000001. */
function decimals(stepText) {
    const dot = stepText.indexOf('.');
    return dot < 0 ? 0 : stepText.length - dot - 1;
}
/**
 * Snap to the step grid measured from `min` and clamp to range — exactly what
 * `<input type="range">` did for us when the panel was the source of truth.
 */
export function quantise(spec, v) {
    const snapped = spec.min + Math.round((v - spec.min) / spec.step) * spec.step;
    const clamped = Math.min(spec.max, Math.max(spec.min, snapped));
    return Number(clamped.toFixed(decimals(spec.stepText)));
}
export function setDial(id, v) {
    const spec = SPECS[id];
    const next = spec.kind === 'toggle' ? Boolean(v) : quantise(spec, Number(v));
    if (P[id] === next)
        return next;
    P[id] = next;
    notify(id);
    return next;
}
export function resetDials() {
    for (const spec of Object.values(SPECS)) {
        const set = setDial;
        set(spec.id, spec.value);
    }
}
/** The readout string for a dial, matching the panel's step-based precision. */
export function format(id) {
    const spec = SPECS[id];
    if (spec.kind === 'toggle')
        return P[spec.id] ? 'on' : 'off';
    const n = P[spec.id];
    return spec.stepText === '1' || spec.stepText === '2' ? String(Math.round(n)) : n.toFixed(2);
}
/**
 * Hand the whole set over as text. In a sketch like this the dials are where the work
 * actually happens, and the only way a setting that felt right in the browser becomes the
 * committed default is by being written down — so emit it in the form that's easiest to
 * paste back into `DIAL_GROUPS` above: one line per group, id=value, nothing to strip.
 */
export function dialText() {
    const lines = [`# bar field dials · ${window.innerWidth}x${window.innerHeight}`];
    for (const g of DIAL_GROUPS) {
        const parts = g.dials.map((d) => `${d.id}=${d.kind === 'toggle' ? P[d.id] : format(d.id)}`);
        lines.push(`${g.title.toLowerCase().padEnd(11)} ${parts.join('  ')}`);
    }
    return lines.join('\n');
}
