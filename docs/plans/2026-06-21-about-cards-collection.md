# About Cards — Content Collection + Detail Pages

**Date:** 2026-06-21  
**Prompted by:** Writing and Lab already pull from content collections and have working detail pages. About is one hardcoded card with no collection. User wants About to be an expandable card set (travel, bio, contact, etc.) that feeds the Constellation the same way — and clicking any card navigates to its detail view consistently.

---

## Context

The Constellation renders each card as an `<a>` tag — clicking navigates to `href`. Writing and Lab cards work today because `writing/[slug].astro` and `labs/[slug].astro` exist. About needs the same treatment: a content collection to drive cards, and `about/[slug].astro` for detail pages.

Some about cards will link externally (read.cv, email) — those use the `href` field in the frontmatter and navigate directly to the external URL. Cards without `href` get an internal detail page at `/about/{slug}/`.

---

## What Changes

### 1. `src/content.config.ts` — add `about` collection

```ts
const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    meta: z.string().optional(),
    href: z.string().optional(), // set for external links (read.cv, mailto:, etc.)
    date: z.coerce.date(),
    status,
  }),
});

export const collections = { writing, labs, work, about };
```

### 2. `src/lib/content.ts` — add `'about'` to the type union

```ts
type CollectionName = 'writing' | 'labs' | 'work' | 'about';
```

### 3. `src/pages/about/[slug].astro` — new detail page

Works alongside the existing `src/pages/about.astro` (Astro routes these separately: `/about/` vs `/about/[slug]/`). Pattern mirrors `writing/[slug].astro`: load collection, get entry by slug, render markdown via `render()`, wrap in Base layout.

Structure:
```
---
import Base from '../../layouts/Base.astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const entries = await getCollection('about');
  return entries.map(e => ({ params: { slug: e.id }, props: { entry: e } }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();
---
<Base title={entry.data.title} description={entry.data.description}>
  <article class="container prose">
    <h1>{entry.data.title}</h1>
    <Content />
  </article>
</Base>
```

Drafts will be accessible in dev (getCollection returns all), production skips them because getStaticPaths only builds routes for returned entries — and in production Astro only generates what getStaticPaths returns.

Actually: need to filter drafts in production the same way. Use `getVisible('about')` (which already handles the dev/prod filter) instead of raw `getCollection`.

### 4. `src/pages/index.astro` — replace hardcoded aboutCard

```ts
import { getVisible, byDateDesc } from '../lib/content';

const aboutEntries = (await getVisible('about')).sort(byDateDesc);
const aboutCards = aboutEntries.map((a) => ({
  href: a.data.href ?? `/about/${a.id}/`,
  cat: 'about' as const,
  title: a.data.title,
  desc: a.data.description,
  meta: a.data.meta ?? '',
}));

// Replace the splice logic — just concat all three
const cards = [...writingCards, ...labCards, ...aboutCards];
```

### 5. `src/content/about/` — 5+ placeholder entries

All `status: draft` (visible in dev, excluded from production):

| File | Title | href | Notes |
|------|-------|------|-------|
| `bio.md` | Omar Jalalzada | *(none — uses /about/bio/)* | Bio / identity |
| `travel.md` | On the Road | *(none — uses /about/travel/)* | Travel log |
| `currently.md` | What I'm Building | *(none — uses /about/currently/)* | Now page |
| `contact.md` | Get in Touch | `mailto:omar@sublimesecurity.com` | Navigates to email client |
| `work-history.md` | Résumé | `https://read.cv/omar` | Navigates externally |
| `influences.md` | What Shaped Me | *(none — uses /about/influences/)* | Books, people, moments |

---

## What Does NOT Change

- `src/components/constellation/Constellation.astro` — untouched
- `src/pages/about.astro` — untouched (still the `/about/` overview page)
- All writing and labs content — untouched
- `Card.astro`, `CardGrid.astro`, `Base.astro` — untouched

---

## Navigation consistency

| Card type | Click destination |
|-----------|------------------|
| Writing | `/writing/{slug}/` — already works |
| Lab | `/labs/{slug}/` — already works |
| About (internal) | `/about/{slug}/` — new |
| About (external href) | External URL — native `<a>` behavior |

---

## Verification

1. `npm run dev` → Constellation loads; all three categories visible on canvas
2. Click a writing card → navigates to `/writing/{slug}/` ✓
3. Click a lab card → navigates to `/labs/{slug}/` ✓
4. Click an about card (internal) → navigates to `/about/{slug}/` detail page ✓
5. Click "Get in Touch" about card → opens email client ✓
6. Click "Résumé" about card → navigates to read.cv ✓
7. Category filter "about" in Constellation shows only about cards ✓
8. `npm run build` → succeeds; draft about cards absent from production
9. Omar reviews in browser at `localhost:4321` before any commit
