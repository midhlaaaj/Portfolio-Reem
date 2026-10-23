import { z } from 'zod';

const text = (max = 2000) => z.string().trim().max(max);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v), 'Enter a full link starting with https://');

export const seoOverrideSchema = z.object({
  title: text(120).default(''),
  description: text(320).default(''),
  imageId: z.string().nullable().default(null),
});
export type SeoOverride = z.infer<typeof seoOverrideSchema>;

export const siteSettingsSchema = z.object({
  siteTitle: text(120),
  siteDesc: text(320),
  email: z
    .string()
    .trim()
    .min(1, 'Add an email address.')
    .email('Check the email. It should look like name@example.com.'),
  phone: text(40),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{7,15}$/, 'Use digits only, with the country code. For example 917510449444.'),
  instagram: url,
  behance: url,
  linkedin: url,
  cvUrl: text(500),
  cvName: text(200),
  seoImageId: z.string().nullable(),
  replyTime: text(200),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const homeContentSchema = z.object({
  tagline: text(400),
  smallLine: text(300),
  showreelUrl: url,
  showreelPosterId: z.string().nullable(),
  heroLeftId: z.string().nullable(),
  heroRightId: z.string().nullable(),
  clientsLine: text(300),
  introText: text(300).default('From a single poster to a full launch campaign, this is the work I do most.'),
  selectedWorkTitle: text(60).default('Recent projects'),
  brandsTitle: text(80).default("Brands I've worked with"),
  spreadLine1: text(40).default('A little bit'),
  spreadLine2: text(40).default('of everything.'),
  ctaLine1: text(40).default('Got something'),
  ctaLine2: text(40).default('to launch?'),
  ctaText: text(200).default(
    'Need a poster series, a logo, an event setup or a month of social media content? Tell me what you are planning.',
  ),
  brands: z
    .array(
      z.object({
        id: z.string(),
        projectSlug: z.string(),
        name: text(60),
        kind: text(80),
        imageId: z.string().nullable(),
      }),
    )
    .default([
      {
        id: 'b1',
        projectSlug: 'study-abroad-expo-2026',
        name: 'Bayroot International',
        kind: 'Study abroad consultancy',
        imageId: 'm-expo-entrance',
      },
      { id: 'b2', projectSlug: 'roostory', name: 'Roostory', kind: 'Grilled chicken restaurant', imageId: 'm-roost-3' },
      { id: 'b3', projectSlug: 'asaas', name: 'ASAAS', kind: 'Tax consultancy, UAE', imageId: 'm-asaas-4' },
      { id: 'b4', projectSlug: 'cb-perfume', name: 'CB Perfume', kind: 'Personalised fragrance', imageId: 'm-cb-mark' },
      { id: 'b5', projectSlug: 'sugar-sisters', name: 'Sugar Sisters', kind: 'Bakery', imageId: 'm-ss-cover' },
    ]),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

export const aboutContentSchema = z.object({
  lead: text(800),
  story: text(1600),
  toolsDesign: z.array(text(60)),
  toolsAI: z.array(text(60)),
  expRole: text(120),
  expStart: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, 'Use a four digit year, for example 2021.'),
  expText: text(800),
  portraitId: z.string().nullable(),
});
export type AboutContent = z.infer<typeof aboutContentSchema>;

export const serviceItemSchema = z.object({
  id: z.string(),
  name: text(80).min(1),
  short: text(200),
  desc: text(800),
  deliverables: z.array(text(120)),
  projectSlug: z.string(),
  imageId: z.string().nullable(),
  price: text(60),
});
export const servicesContentSchema = z.object({
  intro: text(400),
  pricingOn: z.boolean(),
  items: z.array(serviceItemSchema),
  process: z.array(z.object({ title: text(60), text: text(300) })),
});
export type ServicesContent = z.infer<typeof servicesContentSchema>;
export type ServiceItem = z.infer<typeof serviceItemSchema>;

export const pageKeys = ['home', 'about', 'services'] as const;
export type PageKey = (typeof pageKeys)[number];

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Add your name so I know who I'm replying to.").max(120),
  email: z
    .string()
    .trim()
    .min(1, 'Add your email so I can reply.')
    .max(200)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Check your email. It should look like name@example.com.'),
  phone: z.string().trim().max(40).default(''),
  budget: z.string().trim().max(60).default(''),
  type: z.string().trim().min(1, 'Choose a project type. Pick Something else if none fit.').max(60),
  timeline: z.string().trim().max(40).default(''),
  message: z.string().trim().min(1, 'Tell me a little about the project, even one line helps.').max(4000),
});
export type ContactForm = z.infer<typeof contactFormSchema>;

export const PROJECT_TYPES = [
  'Social media',
  'Branding',
  'Event branding',
  'Print',
  'Motion',
  'Something else',
] as const;
export const TIMELINES = ['This week', 'This month', 'Flexible'] as const;
export const BUDGETS = [
  'Under ₹25,000',
  '₹25,000 to ₹75,000',
  '₹75,000 to ₹2,00,000',
  'Above ₹2,00,000',
  'Not sure yet',
] as const;
