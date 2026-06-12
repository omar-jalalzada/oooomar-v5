> **Accepted 2026-06-11.** First plan for the project: scaffold the wireframe-level MVP from the brief (`docs/brief.md`), incorporating decisions confirmed with Omar (Astro over Vite SPA, Vercel over GH Pages, Vercel Analytics) and process ideas adopted from Patrick Morgan's portfolio-rebuild writeup (pipeline-first phasing, vertical slice, CLAUDE.md conventions, ideas parking lot, plan archive).

# Personal Site MVP — Plan

## Context

Omar is building a personal site to anchor the next chapter of his career: design leadership writing, reflections, interactive "Lab" experiments, and a head-of-design-level portfolio. The brief (pasted 2026-06-11) defines a wireframe-level MVP: a functioning site with a home page, 3+ category landing pages, 2 sample writings, 2 sample labs, and a publishing workflow where adding a markdown file or a static HTML folder publishes a new page with its own URL. Brand/visual polish is explicitly deferred — this ship is structure + pipeline, not identity.

The repo (`hamburg` workspace, branch `hamburg`) is empty except for a stray `tenor.gif`, which we'll delete.

## Decisions (resolving the brief's open questions)

- **Framework**: Astro 5 + `@astrojs/react` (user-confirmed). Markdown content collections with typed frontmatter, file-based routing, static output. React available for any interactive island, but wireframe pages are plain Astro components.
- **Hosting**: Vercel (user-confirmed), via `@astrojs/vercel` adapter with `webAnalytics: { enabled: true }` for zero-setup **Vercel Analytics** (user-confirmed). Connecting the repo to Vercel is a manual dashboard step for Omar — noted in verification.
- **Content pipeline**: Markdown repo is the source of truth. Notion stays a capture tool; publishing = drop a `.md` file in the right collection folder, commit, push → Vercel deploys. Notion MCP automation is a later phase, by design ("start manual; add automation when volume rises").
- **Labs hosting/routing**: each lab is a self-contained static folder at `public/prototypes/<slug>/index.html` (served verbatim at `/prototypes/<slug>/`). A matching metadata entry in the `labs` content collection drives the card grid and a framed detail page at `/labs/<slug>` that iframes the prototype with title/description/"open full screen" link. No build step touches prototype HTML — AI-generated pages drop in as-is.
- **SEO v1**: per-page `<title>`/meta description/OG tags in the base layout, `@astrojs/sitemap`, canonical URLs, and an RSS feed for writing (`@astrojs/rss`) — cheap now, and the feed supports later cross-posting to Substack/Medium. Keyword strategy ("design in cybersecurity") deferred.
- **Styling**: vanilla CSS with a small `tokens.css` (4px spacing grid, 3-level type hierarchy, neutral palette). No Tailwind/CSS framework — wireframe now, and nothing to rip out when the real brand system lands.

## Architecture

```
astro.config.mjs            # react, sitemap, vercel adapter (webAnalytics on), site URL
src/
  content.config.ts         # collections: writing, labs, work (zod schemas)
  content/
    writing/*.md            # title, description, topic (design-leadership|reflections),
                            # tags[], date, status (draft|published), format
    labs/*.md               # title, description, date, tags[], status, prototype slug
    work/*.md               # case-study stubs (Sublime, Kin, Alto, Coatue)
  layouts/Base.astro        # head/meta/OG, nav, footer
  components/               # Card.astro, CardGrid.astro, FilterBar.astro (plain Astro)
  pages/
    index.astro             # intro, category tiles, featured labs, recent writing
    writing/index.astro     # card grid + topic/tag filter (query-param based, no JS island needed)
    writing/[slug].astro    # clean MD reading page
    labs/index.astro        # card grid
    labs/[slug].astro       # framed prototype (iframe + full-screen link)
    work/index.astro        # case-study cards, "coming soon" stubs
    about.astro             # bio + why-me + focus areas (placeholder copy)
    contact.astro           # mailto + links
    rss.xml.js              # writing feed
  styles/tokens.css, global.css
public/prototypes/<slug>/index.html   # self-contained lab prototypes
```

- **Drafts**: every collection query filters `status === 'published'` in production builds (`import.meta.env.PROD`); drafts render in `npm run dev` so they can be previewed.
- **Metadata** covers the brief's filtering needs: content type is the collection, plus topic/tags/date/status/format in frontmatter.
- **Nav**: Home, Writing, Labs, Work, About, Contact (About lives in the nav directly; the brief nests it under Work but it reads as a top-level page — trivially movable).

## Implementation phases

Ordering follows the "pipeline first, then one complete vertical slice, then breadth" approach (adopted from Patrick Morgan's rebuild writeup): prove deployment before building, establish patterns on one real page before fanning out.

**Phase 1 — Pipeline.** Delete `tenor.gif`; scaffold minimal Astro project at repo root with `@astrojs/react`, `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/vercel`; placeholder index page. *Checkpoint: `npm run build` passes; repo ready for Omar to import in the Vercel dashboard (manual step — do it now so every later push gets a preview deploy).*

**Phase 2 — Content foundation.** `content.config.ts` schemas (zod-validated frontmatter — the build fails on malformed metadata, the key guardrail when agents write content) and all sample content: 2 writings (one design-leadership, one reflection), 2 lab prototypes (self-contained HTML demos in `public/prototypes/`) with matching `labs` entries, 4 work stubs. *Checkpoint: build passes with everything schema-validated; nothing styled yet.*

**Phase 3 — One complete slice.** `Base.astro` layout (meta/OG/nav/footer), tokens/global CSS, and one fully-working writing detail page. This page sets the type hierarchy, spacing, and card patterns everything else reuses. *Checkpoint: one URL that looks and reads right end-to-end.*

**Phase 4 — Breadth.** Remaining pages: home, writing index (topic/tag filter), labs index + framed detail, work index, about, contact, RSS. *Checkpoint: every nav route works; MVP definition met.*

**Phase 5 — Docs & process.** 
- `README.md`: publishing workflow ("to publish a post, add `src/content/writing/my-post.md`; to publish a lab, add `public/prototypes/<slug>/` + `src/content/labs/<slug>.md`").
- `docs/brief.md`: commit the project brief (from this session's paste) so every future session/workspace has it as context, not just this chat.
- `docs/ideas.md`: parking lot for deferred "while I'm at it" ideas — scope creep goes here, not into builds.
- **Plan archive** (process requirement): `docs/plans/` as a permanent timeline of every accepted plan. Each accepted plan saved verbatim as `docs/plans/YYYY-MM-DD-<slug>.md` with a short header (date, what prompted it); `docs/plans/README.md` is a reverse-chronological index (date, title, link, one-line outcome). This plan becomes the first entry: `docs/plans/2026-06-11-personal-site-mvp.md`.
- `CLAUDE.md` at repo root — a lean, living conventions file shared by every Conductor workspace: project overview, stack, the plan-archive rule (*"when the user accepts a plan in plan mode, copy it into `docs/plans/YYYY-MM-DD-<slug>.md` and index it in `docs/plans/README.md` before starting implementation"*), the parking-lot rule (deferred ideas → `docs/ideas.md`), and the standing tool principle: prefer well-known tools with deep community/AI training data (Astro, React) over niche ones. Conventions discovered during the build get appended here as they're made.

## Verification

- `npm run dev` — click through every nav route; confirm writing/lab detail pages render; confirm a `status: draft` test post appears in dev.
- `npm run build && npm run preview` — confirm the draft post is excluded, `/sitemap-index.xml` and `/rss.xml` exist, prototype iframes load at `/labs/<slug>` and raw at `/prototypes/<slug>/`.
- Edge cases per review habit: long post title on a card, a lab entry with no tags.
- Manual (Omar): import the GitHub repo in the Vercel dashboard; analytics activates automatically via the adapter flag.

## Later (explicitly out of scope)

Brand/visual identity, cinematic home entrance, Notion MCP pipeline, collaborations in Labs, full case-study content, SEO keyword work, Substack/Medium cross-posting.
