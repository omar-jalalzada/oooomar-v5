import { getCollection, type CollectionEntry } from 'astro:content';

type CollectionName = 'writing' | 'experiments' | 'work' | 'caseStudies';

// Drafts render in `npm run dev` so they can be previewed,
// but are excluded from production builds.
export async function getVisible<C extends CollectionName>(
  collection: C
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection);
  return entries.filter(
    (entry) => import.meta.env.DEV || entry.data.status === 'published'
  );
}

export function byDateDesc<C extends 'writing' | 'experiments'>(
  a: CollectionEntry<C>,
  b: CollectionEntry<C>
): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

// Props for an ExperimentCard per visible experiment, newest first. The card's number is
// its place in the catalogue oldest first, so it stays put as new experiments arrive.
export async function experimentCards() {
  const entries = (await getVisible('experiments')).sort(byDateDesc);
  return entries.map((entry, i) => ({
    look: entry.data.card.look,
    href: `/experiments/${entry.id}/`,
    title: entry.data.title,
    date: entry.data.date,
    techniques: entry.data.technique,
    stat: entry.data.card.stat,
    index: entries.length - i,
  }));
}
