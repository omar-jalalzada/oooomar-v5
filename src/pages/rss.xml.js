import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('writing'))
    .filter((post) => post.data.status === 'published')
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Omar Jalalzada — Writing',
    description:
      'Writing on design leadership, cybersecurity, and systems for a calm life.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/writing/${post.id}/`,
    })),
  });
}
