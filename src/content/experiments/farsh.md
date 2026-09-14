---
title: Farsh
description: A tribal Persian rug woven from 478,000 yarn tufts. Bring a cursor near and the wool unspools into an orbiting cloud of particles, then knots itself back.
tags: [three.js, generative, heritage]
date: 2026-09-12
status: draft
prototype: farsh
---

A knot chart of roughly 300 × 400 knots, where the borders, corner spandrels, stepped medallion and every boteh, cypress, hook and rosette are rasterised by maths rather than hand-drawn — so the chart can be re-resolved at any density. On top of it, a pile of four yarn tufts per knot on the GPU, each jittered, leaned and tapered, breathing on its own phase. Colour lives on the tufts, and the dark warp showing between them is what makes it read as fibre instead of pixels.

It hangs on a museum wall, lit by two lamps above it — one to each side. Each tuft is shaded by its distance from both lamps and by which way it happens to lean, so the pile catches the light unevenly, the way a real rug does when you walk past it.

Bring a cursor near and the wool lets go: each strand rounds off from a line into a particle, finds its own orbit, and circles a hollow at the centre where the rug has been carried away entirely. Every particle keeps the dye it was knotted with — it only catches a little more light for being off the surface. Each tuft releases at its own radius, so the outer boundary has no rim, just wool thinning into air. Move away and every particle re-knots exactly where it was, because it never stopped knowing its own place in the weave.

Twenty-nine dials sit in the corner, every one of them live, because the difference between wool and confetti turned out to be a handful of numbers worth finding by hand.

There is a second cut of it in `v2/`, where nothing waits on a cursor and the wall starts bare. A crest travels down from the top and the rug does not exist ahead of it: wool arrives loose a little before the crest reaches a knot, twirls in the air well past where the edges will be, and is knotted down behind it. So the wave doesn't dissolve a rug, it weaves one. It runs once, holds on the finished piece, and waits to be asked again.

How far a strand travels is deliberately independent of how much wool the crest releases, because a thin line of wool thrown a long way reads as particles, while a thick one thrown a short way reads as blur. The loose cloud is free of the rug's footprint entirely — a rug being woven has no edges yet to respect.

`v3/` puts it on a loom, and gets there by taking things away. The pile no longer moves at all — the crest is purely a reveal, and every knot simply arrives. All the motion belongs to one mechanism instead of three.

That mechanism is the wool itself. There is no separate yarn: a strand *is* a tuft of the rug, with the same place, lean, width and dye, drawn out into a long twirling length while the wool is still loose and shortening into exactly itself as the knot goes down. Nothing crossfades and nothing is drawn twice. The first attempt at this was a layer of its own, and it looked like a different material arriving from somewhere else — which is the whole thing this is not.

The cost of that is geometry. A quad is straight, so a strand has to be a ribbon of thirty-odd segments to curve at all, and 478,000 ribbons is far too much. So one tuft in every twenty-four is drawn as a ribbon and the rest stay single quads — a level of detail, not a second object. A tuft belongs to one mesh or the other for the whole pass, which is what keeps the finished rug at exactly the density it always had.

Three things then decided whether it read as weaving or as a brush. The strand holds its full length until the knot is nearly down and then pulls in sharply, because a length that shortens steadily across the whole band spends most of the band as a medium streak, and hundreds of medium streaks is a brush. Only about a twelfth of the wool is being worked at any moment, the rest simply sitting where it belongs — the open dark between threads is most of the picture. And a strand dims along its own length, which puts the weight of the yarn at the weaving edge while the threads themselves stay long; shortening them instead would only have made them not long.

The ribbons rendered nothing at all on the first try, and the draw counters insisted they were fine: 240,000 triangles, every frame. A ribbon running down the page is wound clockwise on screen, so every triangle was quietly culled as a back face. A curve turns back on itself anyway, so the fix is the one it always was — a strand has two sides.
