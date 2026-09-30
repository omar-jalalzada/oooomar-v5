---
title: Why We’re Building a Design OS
description: How we are turning design judgment into reusable context, processes, checks, and feedback loops at Sublime.
topic: design-leadership
tags: [design-os, ai, design-systems, design-leadership]
date: 2026-09-30
status: draft
format: article
---

The way we produce design is changing quickly.

AI can turn written intent into a working interface. It can take approved content and assemble a webpage, ad, or one-pager. It can generate dozens of directions in the time it once took to produce a first pass.

The production opportunity is obvious. The quality problem is harder.

Two people can use the same model and the same design system and get very different results. The difference comes from the context they provide, the decisions they make, and their ability to evaluate the output.

At Sublime, we started working on the system around those decisions. We call it our Design OS.

> A Design OS turns design judgment into reusable context, processes, checks, and feedback loops. Each project gives the next one a better starting point.

In practice, it is a shared workspace built around file-based workflows. A designer starts with an intention. An agent routes the request to the right workflow and creates a first result. The browser gives the team a place to compare directions and leave feedback. The project files keep the brief, explorations, decisions, feedback, and final assets together.

The workspace supports the work without owning the output. Final assets remain independent and portable.

## Why we need it

A surprising amount of design work begins by reconstructing knowledge the company already has.

Someone needs to find the relevant product context, remember feedback from a similar project, identify the right components, choose a process, and explain what good looks like.

That knowledge is usually spread across people, documents, design files, conversations, and code. A project can lose context when it changes hands. Critique feedback disappears after the work ships. Senior designers repeat the same guidance. Every new project starts closer to zero than it should.

AI makes this fragmentation more visible. It can move quickly, but only with the context and direction it receives. Thin context produces a polished guess.

The Design OS gives the work a better starting point. It also gives us a place to preserve what the team learns.

## What goes into a Design OS

We currently think about the system in four parts: context, judgment, process, and verification.

### Context

Context covers the decisions that already exist.

It includes design tokens, typography, product vocabulary, brand foundations, component APIs, accessibility requirements, and stable knowledge about the product and its users.

The hard part is choosing what to include. More context can create noise. We want the smallest useful set of information for the decision in front of us.

This layer prevents people and agents from inventing basic answers that the team has already settled.

### Judgment

Judgment explains what good looks like.

Broad principles are difficult to apply consistently. “Make it intuitive” gives very little direction. A useful guideline describes the behavior, names the reason, and shows what success looks like.

We separate decisions into three zones:

1. **Fixed.** Tokens, accessibility requirements, brand colors, and established foundations.
2. **Guided.** Components, information hierarchy, and familiar patterns. Alternatives are possible when the reason is clear.
3. **Open.** Concepts, interactions, art direction, and new solutions. Exploration is useful here.

This gives the system clear boundaries. It protects the decisions where variation creates defects and preserves freedom where exploration improves the work.

### Process

The process should fit the size and ambiguity of the problem.

A copy correction needs a short path. A new product workflow needs deeper framing, exploration, validation, and specification. Recurring creative work should use a proven workflow. New brand or product territory needs more room to diverge.

Our current workflows cover product concepts, websites, application graphics, ads, one-pagers, diagrams, and experiments. The initial request determines where the work goes. Each workflow carries its own brief, guidance, review model, and output requirements.

Experiments are an intentional exception. They need no formal brief, review round, or production outcome. The Design OS gives them a place to live and share while leaving the creative process open.

A good operating system knows when to add structure, when to preserve freedom, and where a human decision still belongs.

For substantial product work, our starting sequence is:

1. Frame the problem.
2. Explore meaningful directions.
3. Refine with human judgment.
4. Validate with evidence.
5. Specify what engineering needs.

The work begins with intent, constraints, user context, and success criteria. Interactive prototypes help us evaluate the experience. The written record preserves the reasoning and the load-bearing decisions.

Creative work follows the same principle. Approved content comes first. Once the thinking is stable, agents can help transfer content into templates, apply brand foundations, create size variants, and prepare exports. Designers own hierarchy, composition, art direction, and final quality.

The Design OS routes each project to the lightest process that fits.

### Verification

Different decisions need different forms of review.

Mechanical rules should use deterministic checks. Geometry can be measured. Accessibility can be inspected. Component usage can be compared against the system.

Focused evaluations can help with output that varies. Human critique remains essential for ambiguous decisions involving product judgment, composition, interaction, and art direction.

We have found that broad requests like “review this design” produce vague feedback. A useful check identifies the element, the rule, and the measured difference. It gives the designer or agent something concrete to fix.

The system should locate the issue and preserve human attention for the decisions that require judgment.

Review state also needs clear boundaries. Accepting a direction, selecting a final, and publishing the work are separate decisions. An agent can help move the work forward. It cannot treat feedback as permission to publish.

## Start with recurring work

Recurring creative work gives us a practical place to begin.

One-pagers, ads, product graphics, templated webpages, blog covers, and diagrams contain repeated production work. Content gets transferred. Layouts get resized. Styles get applied. Common structures get rebuilt.

Agents can handle more of that setup. Early experiments have also shown clear limits. Original art direction, strong hierarchy, novel composition, and final quality still require close attention from a designer.

Those limits help us define the workflow.

Our creative team uses three principles:

1. Automate the mechanics.
2. Keep judgment with the designer.
3. Approve the content before production begins.

We build each workflow for ourselves first. Real use exposes missing context, weak checks, and unnecessary steps. The system earns broader use after it works for the team that created it.

## The learning loop is the important part

Every critique contains potential system knowledge.

A spacing comment may reveal a missing token. A repeated hierarchy problem may need a guideline. A workflow failure may need a check. A strong result may become an example for future work.

The loop is:

> Draft → critique → decision → ship → encode the learning

Human review decides what enters the system. A single comment or successful project does not automatically become a rule. We look for repeated evidence, understand the reason, and choose the right form: a rule, example, check, evaluation, or nothing.

Project-specific feedback stays with the project. A lesson moves into shared guidance when it applies beyond that one case. We place it in the narrowest relevant workflow and keep one authoritative home for each instruction. This keeps the system from recreating the fragmentation it was built to solve.

Rituals make that loop possible.

AI-assisted work can become private very quickly. Someone opens an agent and returns later with something that looks finished. The team sees the artifact and misses the exploration, reasoning, and small decisions behind it.

Brief critiques, work-in-progress reviews, pairing sessions, decision logs, and retrospectives keep that knowledge visible. They help the team improve the work and improve the system at the same time.

## We are still testing it

The Design OS is a working hypothesis.

The system is three weeks old. Several workflows are already producing useful work for us. Others are still mostly guidance, early scaffolding, or open questions. We are learning quickly because the team is using it on real projects.

We still need to learn how well we can route different types of work. We need to see whether agent-assisted exploration produces genuine breadth. We need to test whether encoded judgment and peer review can maintain quality as the team moves faster.

We are testing the system on real work, one workflow at a time. Each project shows us where the context is weak, where the process adds friction, and where human judgment matters most.

The goal is quality at speed.

A good Design OS helps the team produce strong work today and gives tomorrow’s project a better starting point.
