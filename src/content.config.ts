import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { LOOKS } from './lib/experiment-card/looks.js';

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

const experiments = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experiments' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    technique: z.array(z.string()),
    date: z.coerce.date(),
    status,
    // folder name under public/prototypes/ containing the self-contained index.html
    prototype: z.string(),
    // the cover on the Experiments page; `look` names a ground and figure in
    // src/lib/experiment-card/, `stat` is the one supporting line under the name
    card: z.object({
      look: z.enum(LOOKS),
      stat: z.object({ value: z.string(), unit: z.string() }).optional(),
    }),
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
    // the visual cover on the About page; `variant` names a scene in src/components/work/cards/
    card: z
      .object({
        variant: z.enum(['kin', 'alto', 'coatue', 'macys']),
        statement: z.string(),
      })
      .optional(),
  }),
});

// The long read behind a role card, at /work/<id>/. The id must match a work entry's id: the
// page takes the company, period and card from there.
const caseStudies = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/case-studies' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      facts: z.array(z.object({ label: z.string(), value: z.string() })),
      // the body of work, shown as a moving gallery; `kind` decides which lane a screen runs in
      gallery: z.array(
        z.object({
          src: image(),
          alt: z.string(),
          kind: z.enum(['web', 'ipad', 'iphone', 'system', 'process']),
        }),
      ),
      // renames a gallery lane for this product, e.g. { web: "Mosaic Web" }
      laneLabels: z
        .object({ web: z.string(), ipad: z.string(), iphone: z.string(), system: z.string() })
        .partial()
        .optional(),
      // full screens shown in a drawn device in place of a lane's strip, switched by tabs; a
      // screen's hotspots reveal the dialogs behind its controls, every position and width a
      // percent of the screen
      showcases: z
        .array(
          z.object({
            lane: z.enum(['web', 'ipad', 'iphone', 'system']),
            device: z.enum(['imac', 'ipad', 'iphone']),
            // lists the lane's other screens under the device, the ones not on its screen yet
            grid: z.boolean().default(false),
            screens: z
              .array(
                z.object({
                  label: z.string(),
                  src: image(),
                  alt: z.string(),
                  hotspots: z
                    .array(
                      z.object({
                        label: z.string(),
                        x: z.number(),
                        y: z.number(),
                        reveals: z.array(
                          z.object({
                            src: image(),
                            alt: z.string(),
                            x: z.number(),
                            y: z.number(),
                            w: z.number(),
                            // for exports whose panel background came out transparent
                            surface: z.boolean().optional(),
                          }),
                        ),
                      }),
                    )
                    .default([]),
                }),
              )
              .min(1),
          }),
        )
        .default([]),
      status,
    }),
});

export const collections = { writing, experiments, work, caseStudies };
