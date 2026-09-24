/**
 * Boot and the frame loop: the pass chain, the uniforms, and the redline envelope.
 *
 * Everything the redline turns up is multiplied on the way into a uniform and never
 * written back into `P`. Igniting it would otherwise stomp the dial values, and Copy
 * dials would start reporting numbers nobody set — so the dials keep saying what you set
 * them to, and letting go restores the picture exactly.
 */
import { clock, effect, frameLoop, init, sampler, surface, target } from './vgpu.js';
import { BLUR_WGSL, BRIGHT_WGSL, COMPOSITE_WGSL, FIELD_WGSL } from './shaders.js';
import { P, onDialChange } from './dials.js';
import { drawHud, drawTagline, initHud } from './hud.js';
import { updateLetters } from './letters.js';
import { HOT, M, RAVE_HOLD, RAVE_MAX, approach, autoGain, clamp, els, pointer, rave, sound, states, vis, viewport, } from './state.js';
import { bindInput } from './input.js';
/**
 * A narrow enough viewport that the field has to be cheaper. 246 columns across a phone
 * is under two pixels each — all of the cost of the density and none of the look — and a
 * five-pass bloom chain at 3x device pixels is what actually drops the frame rate.
 */
const isSmall = () => window.innerWidth < 760;
/**
 * Columns are capped by the viewport rather than by the dial, so the committed default
 * still renders exactly as set on a desktop and only narrow screens pay less. Four device
 * pixels per column is about where a bar stops reading as a bar.
 */
const colCap = () => clamp(Math.round(window.innerWidth / 4), 60, 480);
/**
 * Reduced motion maps onto the Animate switch the sketch already had: the idle drift and
 * the musical clock both stop, so the word sits settled and crisp. Interaction still
 * responds, because that motion is asked for.
 */
const prefersReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/**
 * The mark is centred in the *visible* area, not the viewport, so the dev dial panel
 * doesn't crop it. With no panel — which is every production load — both of these
 * collapse to the plain viewport, which is why nothing else has to know it exists.
 */
/**
 * Below this the letters stack. It is the width at which the word set in a row stops being
 * the better presentation, not a device class — a narrow desktop window gets the stack too,
 * which is the honest behaviour and makes the mode trivial to see while iterating.
 */
const STACK_MAX_WIDTH = 640;
function measureViewport(panel) {
    viewport.stacked = window.innerWidth < STACK_MAX_WIDTH;
    const open = panel && !document.body.classList.contains('panel-closed');
    if (!open) {
        viewport.markOffX = 0;
        viewport.hudRight = window.innerWidth;
        return;
    }
    const left = panel.getBoundingClientRect().left;
    viewport.hudRight = left - 8;
    viewport.markOffX = -Math.max(0, window.innerWidth - left) / 2;
}
/**
 * Brings the field up. Resolves false when WebGPU isn't available, which is the caller's
 * cue to leave the SVG fallback in place — a homepage should never explain itself to a
 * browser, it should just show the wordmark.
 */
export async function startField(refs) {
    // `@webgpu/types` isn't installed — vgpu owns the GPU surface and nothing here touches
    // a device directly, so this one feature check is the only place the global is named.
    if (!('gpu' in navigator))
        return false;
    let gpu;
    try {
        gpu = await init();
    }
    catch {
        return false;
    }
    els.stage = refs.stage;
    initHud(refs.hud, refs.tagline, refs.pill);
    bindInput();
    const view = surface(gpu, refs.gl, { dpr: [1, isSmall() ? 1.5 : 2] });
    const linear = sampler(gpu, {
        minFilter: 'linear', magFilter: 'linear',
        addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge',
    });
    // The bloom chain runs at a fraction of full res. Quarter on a phone: it's a wide
    // gaussian either way, so the softness survives the shrink and four of the five passes
    // get sixteen times cheaper.
    const shrink = isSmall() ? 4 : 2;
    const small = ([w, h]) => [Math.max(1, Math.floor(w / shrink)), Math.max(1, Math.floor(h / shrink))];
    const hdr = target(gpu, { size: view.size, format: 'rgba16float' });
    const bloomA = target(gpu, { size: small(view.size), format: 'rgba16float' });
    const bloomB = target(gpu, { size: small(view.size), format: 'rgba16float' });
    const field = effect(gpu, FIELD_WGSL, {
        label: 'field',
        set: {
            p: {
                resX: hdr.size[0], resY: hdr.size[1],
                time: 0,
                cols: Math.min(P.cols, colCap()), barWidth: P.barWidth, gapNoise: P.gapNoise,
                logoScale: P.logoScale, threshold: P.threshold, edgeJitter: P.edgeJitter,
                blobWarp: P.blobWarp, warpSpeed: P.warpSpeed,
                hue: P.hue, sat: P.sat, shimmer: P.shimmer, coreGlow: P.coreGlow,
                mouseX: 0.5, mouseY: 0.5,
                offX: 0,
                flow: P.flow,
                agit: 1 - P.restCalm,
                pad0: 0,
            },
            L: {
                o: [0, 0, 1, 1], m: [0, 0, 1, 1], a: [0, 0, 1, 1], r: [0, 0, 1, 1],
                rot: [0, 0, 0, 0], hover: [0, 0, 0, 0], zs: [0, 0, 0, 0],
            },
        },
    });
    const bright = effect(gpu, BRIGHT_WGSL, {
        label: 'bright',
        set: { src: hdr, samp: linear, b: { threshold: P.bloomThreshold, pad0: 0, pad1: 0, pad2: 0 } },
    });
    const blurH = effect(gpu, BLUR_WGSL, {
        label: 'blurH',
        set: { src: bloomA, samp: linear, bl: { dirX: 1, dirY: 0, radius: P.bloomRadius, pad: 0 } },
    });
    const blurV = effect(gpu, BLUR_WGSL, {
        label: 'blurV',
        set: { src: bloomB, samp: linear, bl: { dirX: 0, dirY: 1, radius: P.bloomRadius, pad: 0 } },
    });
    const composite = effect(gpu, COMPOSITE_WGSL, {
        label: 'composite',
        set: {
            scene: hdr, bloomTex: bloomA, samp: linear,
            c: { amount: P.bloomAmount, exposure: P.exposure, rave: 0, pad1: 0 },
        },
    });
    // Tracks what the bloom passes were last told, since those aren't rewritten every frame.
    let raveApplied = -1;
    // Dial changes only touch the uniforms they own — no per-frame writes for values that
    // aren't animating.
    onDialChange((id) => {
        // Force the rave layer to be re-applied over the new value, or moving a bloom dial
        // mid-party would leave the plain P value in place until the envelope next moved.
        if (id === 'bloomThreshold' || id === 'bloomAmount' || id === 'exposure')
            raveApplied = -1;
        if (id === 'bloomThreshold')
            bright.set({ b: { threshold: P.bloomThreshold } });
        if (id === 'bloomRadius') {
            blurH.set({ bl: { radius: P.bloomRadius } });
            blurV.set({ bl: { radius: P.bloomRadius } });
        }
        if (id === 'bloomAmount')
            composite.set({ c: { amount: P.bloomAmount } });
        if (id === 'exposure')
            composite.set({ c: { exposure: P.exposure } });
        if (id === 'grit')
            sound.engine?.setGrit(P.grit);
        if (id === 'tempo')
            sound.engine?.setTempo(P.tempo);
    });
    view.onResize(({ width, height }) => {
        hdr.resize([width, height]);
        const [bw, bh] = small([width, height]);
        bloomA.resize([bw, bh]);
        bloomB.resize([bw, bh]);
        field.set({ p: { resX: width, resY: height } });
    });
    gpu.onError((err) => console.error('[vgpu]', err.code ?? '', err.message ?? err));
    const time = clock(gpu);
    let animatedTime = 0;
    let fpsLast = performance.now();
    let fpsFrames = 0;
    frameLoop(gpu, (frame) => {
        // Real dt drives interaction easing; animatedTime drives the idle drift so the
        // Animate switch freezes the motion without freezing the interaction.
        const dt = Math.min(time.deltaTime, 1 / 20);
        const animate = P.animate && !prefersReduced();
        M.animate = animate;
        if (animate)
            animatedTime += dt;
        // Beats, not seconds — so dragging the tempo up genuinely quickens the jitter rather
        // than just changing what you hear. Frozen by the same switch as the idle drift,
        // since that switch means "stop moving".
        if (animate)
            M.mtime += dt * ((P.tempo || 115) / 60);
        measureViewport(refs.panel);
        const raw = sound.engine?.readBands() ?? null;
        // Symmetric, unlike the kick below. A fast rise and slow fall on a signed value would
        // quietly bias it positive and put back the brightness lift the centring just took
        // out; the snap belongs to the pulse, which is what a transient is for.
        const env = (cur, tgt) => approach(cur, tgt, 0.045, dt);
        vis.lo = env(vis.lo, raw ? autoGain(0, raw.lo, dt) : 0);
        vis.mid = env(vis.mid, raw ? autoGain(1, raw.mid, dt) : 0);
        vis.hi = env(vis.hi, raw ? autoGain(2, raw.hi, dt) : 0);
        vis.top = env(vis.top, raw ? autoGain(3, raw.top, dt) : 0);
        // Straight from the sequencer's own kicks, so it can't be late and can't be missed.
        // Only smoothed on the way down, and only a little.
        vis.pulse = Math.max(raw ? raw.kick : 0, approach(vis.pulse, 0, 0.055, dt));
        vis.mus = approach(vis.mus, raw ? raw.level : 0, 0.2, dt);
        // ── the redline ──────────────────────────────────────────────────────────
        // Pegged means pegged — the dial's own maximum, not "nearly". Charge builds while you
        // hold it there and drains quickly when you don't, and ignition is a threshold on the
        // charge rather than the charge itself, so holding is a build in which nothing happens
        // and then it goes, rather than a slow fade up.
        const pegged = P.tempo >= RAVE_MAX - 1e-6;
        rave.charge = clamp(rave.charge + (pegged ? dt / RAVE_HOLD : -dt / 0.4), 0, 1);
        const wantLit = rave.charge >= 1 ? 1 : 0;
        // In fast, out slow. A drop lands rather than easing in; but cutting it dead the
        // instant the tempo dips would read as a bug, so coming down takes a second or two.
        rave.lit = approach(rave.lit, wantLit, wantLit > rave.lit ? 0.16 : 0.55, dt);
        const rv = rave.lit;
        // The panel readout is the deadpan tell, and it only exists in dev — in production the
        // BPM gauge relabelling itself REDLINE is the whole acknowledgement, which is the
        // better place for it anyway since that is where the gesture is happening.
        if (refs.mode) {
            const modeNow = rv > 0.5 ? 'redline' : 'z-space';
            if (refs.mode.textContent !== modeNow)
                refs.mode.textContent = modeNow;
            refs.mode.style.color = rv > 0.5 ? HOT : '';
        }
        updateLetters(animatedTime, dt);
        const toDevice = hdr.size[0] / Math.max(1, window.innerWidth);
        const packed = states.map((st) => [st.offX * toDevice, st.offY * toDevice, st.scale, st.dim]);
        field.set({
            p: {
                time: animatedTime,
                cols: Math.min(P.cols, colCap()), barWidth: P.barWidth,
                logoScale: P.logoScale, threshold: P.threshold,
                // Restrained on purpose, and this is the one place "turn everything up" had to be
                // argued with. Taken literally it deletes the logo: the first pass added 0.30 of
                // gap noise, doubled the edge jitter and forced full agitation, and the result was
                // confetti with no readable OMAR anywhere in it. What the party is allowed to do
                // is move faster and burn brighter; what it is not allowed to do is chew up the
                // letterforms, so the terms that change *shape* get a fraction of the ones that
                // change *speed*.
                gapNoise: P.gapNoise + rv * 0.03,
                edgeJitter: P.edgeJitter * (1 + rv * 0.18),
                blobWarp: P.blobWarp * (1 + rv * 0.18),
                warpSpeed: P.warpSpeed * (1 + rv * 1.40),
                shimmer: P.shimmer * (1 + rv * 0.55),
                hue: P.hue, sat: P.sat,
                // The one thing the party turns *down*, and further than feels natural. The core
                // is white, and white is the enemy here — it is what the reinhard bleaches the
                // hue into.
                coreGlow: P.coreGlow * (1 - rv * 0.45),
                mouseX: pointer.nx, mouseY: pointer.ny,
                offX: viewport.markOffX * toDevice,
                flow: P.flow * (1 + rv * 1.30),
                // Agitated while lit whatever the pointer is doing, so at the redline the whole
                // word is alive rather than only whichever letter you happen to be holding — but
                // capped well below 1, because full agitation is what made the letters unreadable.
                agit: Math.max((1 - P.restCalm) + P.restCalm * M.activity, rv * 0.3),
                mtime: M.mtime, mus: vis.mus, pulse: vis.pulse,
                bandLo: vis.lo, bandMid: vis.mid, bandHi: vis.hi, bandTop: vis.top,
                tempoN: clamp(((P.tempo || 115) - 90) / 50, 0, 1),
                // The calming of unclaimed letters is partly lifted, so at the redline the whole
                // word joins in rather than only the claimed letter. Only partly: lifting it all
                // the way put every letter at full deformation at once, which is where the
                // confetti came from.
                spaceWave: P.spaceWave + rv * 0.5 * (1 - P.spaceWave),
                rave: rv,
            },
            L: {
                o: packed[0], m: packed[1], a: packed[2], r: packed[3],
                rot: states.map((st) => st.rot),
                hover: states.map((st) => st.hover),
                zs: states.map((st) => st.z),
            },
        });
        // The bloom passes aren't rewritten every frame normally, so they're refreshed only
        // when the envelope has actually moved. Threshold drops so far more of the field
        // blooms and amount climbs — while exposure comes *down*, which is the
        // counterintuitive half: the composite tonemaps per channel, so pushing exposure up
        // at full saturation drives every channel to 1.0 and turns the rainbow into a white
        // blob. Dialling everything up naively is precisely how you lose the colour.
        if (Math.abs(rv - raveApplied) > 0.002) {
            // Only mildly lowered. Dropping the threshold hard put the whole field into the
            // bloom and the glow closed up the O and A counters and filled in the M's valley —
            // the mark went illegible from light rather than from geometry.
            bright.set({ b: { threshold: P.bloomThreshold * (1 - rv * 0.15) } });
            // Exposure still comes down, but only a little. Pulling it 42% — enough to fully
            // protect the saturation — measured out as a murky, dim picture: technically
            // colourful and not remotely a party. Most of the hue is defended by taking white
            // out of the core instead, which costs no brightness.
            composite.set({ c: { amount: P.bloomAmount * (1 + rv * 0.35),
                    exposure: P.exposure * (1 - rv * 0.06), rave: rv } });
            raveApplied = rv;
        }
        frame.pass(hdr, field);
        frame.pass(bloomA, bright);
        frame.pass(bloomB, blurH);
        frame.pass(bloomA, blurV);
        frame.pass(view, composite);
        const now = performance.now();
        drawHud(now, M.hudUp);
        drawTagline(now, dt);
        // Sound reads the same engagement number the HUD does, so the music can't get out of
        // step with what you're looking at.
        sound.engine?.update(M.hudUp, M.focusIdx, pointer.nx);
        if (refs.fps) {
            fpsFrames += 1;
            if (now - fpsLast >= 500) {
                refs.fps.textContent = `${Math.round((fpsFrames * 1000) / (now - fpsLast))} fps`;
                fpsFrames = 0;
                fpsLast = now;
            }
        }
    });
    return true;
}
