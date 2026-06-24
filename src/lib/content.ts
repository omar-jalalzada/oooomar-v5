import { getCollection, type CollectionEntry } from 'astro:content';

type CollectionName = 'writing' | 'labs' | 'work' | 'about';

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

export function byDateDesc<C extends 'writing' | 'labs'>(
  a: CollectionEntry<C>,
  b: CollectionEntry<C>
): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}
