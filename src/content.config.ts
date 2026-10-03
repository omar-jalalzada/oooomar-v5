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
  schema: ({ image }) => {
    const handheldScreen = z.object({
      src: image(),
      alt: z.string(),
      overlay: z.object({ src: image(), alt: z.string(), w: z.number() }).optional(),
    });
    // `label` is the short caption shown under the phone, `alt` the full description
    const phoneScreen = z.object({ src: image(), label: z.string(), alt: z.string() });
    return z.object({
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
      ).default([]),
      // renames a gallery lane for this product, e.g. { web: "Mosaic Web" }
      laneLabels: z
        .object({ web: z.string(), ipad: z.string(), iphone: z.string(), system: z.string() })
        .partial()
        .optional(),
      // full screens shown in a drawn iMac in place of a lane's strip, switched by tabs; a
      // screen's hotspots reveal the dialogs behind its controls, every position and width a
      // percent of the screen
      showcases: z
        .array(
          z.object({
            lane: z.enum(['web', 'ipad', 'iphone', 'system']),
            device: z.enum(['imac']),
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
      // an iPad and an iPhone side by side, replacing both lanes, playing the same chapters in
      // step. A device a chapter leaves out holds its last screen; an overlay is a cropped
      // dialog that pops up centred over the screen, `w` its width as a percent of the screen's
      handhelds: z
        .object({
          label: z.string(),
          chapters: z
            .array(
              z
                .object({
                  label: z.string(),
                  ipad: handheldScreen.optional(),
                  iphone: handheldScreen.optional(),
                })
                .refine((chapter) => chapter.ipad || chapter.iphone, 'A chapter needs at least one device'),
            )
            .min(2),
        })
        .optional(),
      // a phone-first product: its key screens fanned out, then each flow played through a
      // phone step by step. Replaces the gallery for a study that sets it.
      phone: z
        .object({
          logo: image().optional(),
          // `words` take turns in the middle of the line, the first one shown first
          headline: z.object({ lead: z.string(), words: z.array(z.string()).min(2), tail: z.string() }),
          keyScreens: z.array(phoneScreen).min(3),
          flows: z
            .array(z.object({ title: z.string(), summary: z.string(), screens: z.array(phoneScreen).min(2) }))
            .min(1),
        })
        .optional(),
      status,
    });
  },
});

export const collections = { writing, experiments, work, caseStudies };
