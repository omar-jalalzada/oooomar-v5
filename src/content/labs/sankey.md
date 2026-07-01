---
title: Sankey
description: A living Sankey for message remediation — colour-blended flowing bands, hover-to-trace paths with per-branch breakdowns, click-to-collapse for dominant nodes, and a live DialKit-style tuning panel.
tags: [dataviz, interaction, motion]
date: 2026-06-24
status: draft
prototype: sankey
---

An attempt at the best-looking Sankey diagram — message remediation flow modelled as full
source→sink paths, so it stays mass-consistent under interaction. Bands are gradient ribbons that
blend each source colour into its target; hovering a node traces its whole upstream/downstream path
and breaks down where its flow goes next, and on hover the band's own colours brighten in a soft
wave that travels along the lane.

Its headline idea solves a real Sankey failure mode: when one category (here, Graymail at ~80%)
dwarfs the rest into illegibility, you **click a node to collapse it in place** — the chart
rebalances with a smooth tween so the remaining flows become readable, while every label keeps its
true count and percentage. A DialKit-style control panel (generated from a single declarative
config) exposes ribbon opacity, curvature, node gap, the flow sheen, and light/dark theme.
Self-contained HTML — no dependencies, no build step.
