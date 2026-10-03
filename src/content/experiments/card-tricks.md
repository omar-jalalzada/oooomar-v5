---
title: Card Tricks
description: One card system, three layers, a card for every experiment.
technique: [WebGL, GLSL, Canvas, OKLab, Generative line work, Typography]
date: 2026-09-29
status: draft
prototype: card-tricks
card:
  look: card-tricks
  stat: { value: "3", unit: "layers, 15 figures" }
---

A portfolio grid of screenshots flattens every experiment into the same rectangle. These cards give each one a face instead, built from three layers that stay consistent while everything on them changes: a soft gradient ground, a piece of line work, and the type. The ground is a few blurred ellipses over a flat colour, blended in OKLab so the colours stay luminous where they meet. The line work comes from one generator: a mark, repeated, with its properties swept around a single shared point. That point is what makes twenty strokes read as one form. The type puts each experiment's signature number first, so the card says what the thing is before the title does.
