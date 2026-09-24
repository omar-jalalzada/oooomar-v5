---
title: Bar field
description: OMAR drawn as a field of 246 vertical bars on the GPU. Reach into it and the letters answer — each one is a dial, and a drag down its face sets the drums, the dirt, the tempo or the volume of a sequencer that plays while you work.
tags: [webgpu, wgsl, audio, instrument]
date: 2026-09-23
status: draft
prototype: bar-field
---

The wordmark is not type here, it is a spectrum. Four letters are rasterised into a field of vertical bars and drawn in one WebGPU pass — position, height and lean derived from the letterforms themselves, so the mark is legible without any glyph being drawn. Each letter layer composites additively into a float target, gets a luminance threshold and a separable gaussian, and comes back through a tone-mapped composite. The bloom is the point: at rest the bars are crisp and almost still, and the light only blooms where the letters are dense.

Reaching in changes what it is. Bring a pointer near and an instrument assembles around whichever letter you are closest to — a detection frame, a coordinate readout, a gauge for the control that letter owns. Claim one and it takes focus, scaling up about its own centre while the others make room. Every frame, tick and rule in that chrome strokes at half a CSS pixel, which is exactly one device pixel on a two-times screen, so the instrument reads as etched rather than drawn.

The letters are dials. A vertical drag down the O sets the weight of the drums, the M the dirt, the A the pace and the R how loud any of it is, and the sequencer behind them is a real one — a sixteen-step pattern with its own kick, clap and bass, built in the Web Audio graph rather than sampled. It cannot start on its own, because a browser will not resume an audio context without a genuine gesture, which is why there is a control to press. That constraint turned out to be a gift: the engine is the largest module in the piece and none of it is fetched until somebody asks for sound.

Once it is playing the field listens back. The tagline is split per character and a playhead sweeps across it in time with the sequencer, and the tracking opens on the kick. The line's entrance is a scanner acquiring it, character by character, in the same yellow as the gauges — the text belongs to the machine rather than sitting on top of it.

The dial panel in the corner is the whole design surface, and it is genuinely live. The numbers in it were found by hand over many passes, and `Copy dials` emits them in the exact shape they get pasted back into the source as the new defaults.

This one had a previous life as the site's homepage. It reads better as an instrument you choose to pick up than as the first thing between a visitor and the door, so it moved here and the front page went quiet.

Without WebGPU it shows the logotype and says nothing about it. A page should never explain a browser to its visitor.
