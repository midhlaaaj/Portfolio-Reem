import { z } from 'zod';

export const SECTION_TYPES = [
  ['full', 'Full-bleed'],
  ['grid', 'Grid'],
  ['strip', 'Strip'],
  ['video', 'Video'],
] as const;

export const sectionInputSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['full', 'grid', 'strip', 'video']),
  title: z.string().trim().max(120),
  text: z.string().trim().max(600),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'), 'Use a full link to the video file.'),
  mediaIds: z.array(z.string()),
});
export type SectionInput = z.infer<typeof sectionInputSchema>;

export const projectInputSchema = z.object({
  id: z.string().nullable(),
  title: z.string().trim().min(1, 'Add a title. It shows on the folder card and the project page.').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'Add a slug. It becomes the page address.')
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens in the slug.'),
  client: z.string().trim().min(1, 'Add the client name.').max(120),
  scope: z.string().trim().max(160),
  year: z.string().trim().max(10),
  tab: z.string().trim().max(40),
  overview: z.string().trim().max(2000),
  coverId: z.string().nullable(),
  featured: z.boolean(),
  seoTitle: z.string().trim().max(120),
  seoDesc: z.string().trim().max(160),
  categoryIds: z.array(z.string()),
  sections: z.array(sectionInputSchema),
});
export type ProjectInput = z.infer<typeof projectInputSchema>;

export const testimonialInputSchema = z
  .object({
    id: z.string().nullable(),
    quote: z.string().trim().min(1, 'Add the quote.').max(800),
    name: z.string().trim().max(80),
    role: z.string().trim().max(80),
    business: z.string().trim().max(80),
    photoId: z.string().nullable(),
    visible: z.boolean(),
  })
  .refine((t) => t.name || t.business, {
    message: 'Add a name or a business so visitors know who said it.',
    path: ['name'],
  });
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

export const categoryNameSchema = z.string().trim().min(1, 'Add a category name.').max(40);

export type ActionResult<T = object> =
  ({ ok: true } & T) | { ok: false; error?: string; fieldErrors?: Record<string, string> };

export type MediaRecord = { id: string; src: string; alt: string; w: number; h: number; name: string };
