import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['draft', 'published']);

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topic: z.enum(['design-leadership', 'reflections']),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    status,
    format: z.enum(['article', 'note']).default('article'),
    // optional cover image (path under /public), used on cards and the article header
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/labs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    status,
    // folder name under public/prototypes/ containing the self-contained index.html
    prototype: z.string(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    company: z.string(),
    role: z.string(),
    period: z.string(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99),
    status,
  }),
});

export const collections = { writing, labs, work };
