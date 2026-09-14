---
title: Naughty Narwal
description: A branding tool built on p5.js — pick a drawing from the shelf, and a field of twenty thousand points swims into a creature you can dial in by hand.
tags: [p5.js, generative, tool]
date: 2026-09-13
status: draft
prototype: naughty-narwal
---

Five drawings on a shelf, a dark well, and a panel of dials. Each drawing is one function walked twenty thousand times: no sprites, no meshes, nothing but points. Where they pile up you read flesh, where they thin out you read hair, and time enters as a phase rather than a path — so the silhouette holds still while the creature never quite does.

Type is the one that makes it a branding tool. You submit a word — `Omar`, `SUBLIME`, whatever case you typed — and the field is only allowed to live inside those letters. Fill occupies the ink and leaves the counters empty; Outline walks the edge, including the hole in an O. Escape is how far a point may leave its letter: at zero the lockup holds, and as it opens the word grows hair.

It started as a decoding job. Two `#つぶやきProcessing` sketches, each a single tweet of dense p5, one drawing a pair of jellyfish and the other a ribbed swimmer. The interesting part is that the pair isn't two animals: splitting the index by two and pushing the halves half a turn apart makes one formula grow a companion. Bell and tentacles are the same trick — below a cut the wave takes nine values and wraps a dense dome, above it the phase runs fast and thins into filaments. Body and hair, one branch, no second object.

Which is the whole premise of the tool. Nobody is drawing a jellyfish here; a point field is being tuned until it reads as one. So the constants come out of the tweet and onto a panel — how many of them, how long the body, where flesh gives way to hair, how much it wriggles, how hard it's inked.

Two things had to be taken apart to make it steerable. The references tie the form to the point count, so turning up the density grows the animal; here the walk is normalised so density decides how many strands there are and the body has a dial of its own. And the maths has no idea how big it is — several of these swim well outside their own centre — so the frame is measured rather than guessed, by sampling a few thousand points across a spread of times and fitting the box they all stay inside.

Every dot is its own composite, which is the one thing not worth optimising away. Batching the lot into a single path is far faster and flattens the drawing completely: a union fills once, so where the field folds over itself nothing accumulates, and the accumulation was the flesh. What did get spent instead is resolution — the canvas renders at single density, because each point is an arc to be filled and four times the pixels was the difference between sixty frames a second and thirty.

Custom vectors come later. Type is that idea started with a keyboard: an asset is a silhouette the field is allowed to occupy, not a picture stamped on top of one.
