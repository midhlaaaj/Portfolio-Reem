import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core';

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

/** Every image the site shows. Seed images point at /assets, uploads point at object storage. */
export const media = pgTable('media', {
  id: id(),
  url: text('url').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  alt: text('alt').notNull(),
  name: text('name').notNull(),
  bytes: integer('bytes').notNull().default(0),
  /** Object-storage key, null for images that ship with the app. */
  storageKey: text('storage_key'),
  createdAt: createdAt(),
});

export const categories = pgTable('categories', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  position: integer('position').notNull().default(0),
});

export const projects = pgTable(
  'projects',
  {
    id: id(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    client: text('client').notNull(),
    scope: text('scope').notNull().default(''),
    year: text('year').notNull().default(''),
    /** Folder tab label; falls back to the first category name. */
    tab: text('tab').notNull().default(''),
    overview: text('overview').notNull().default(''),
    coverId: text('cover_id').references(() => media.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'published'] })
      .notNull()
      .default('draft'),
    featured: boolean('featured').notNull().default(false),
    featuredPosition: integer('featured_position').notNull().default(0),
    position: integer('position').notNull().default(0),
    seoTitle: text('seo_title').notNull().default(''),
    seoDesc: text('seo_desc').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_status_pos').on(t.status, t.position)],
);

export const projectCategories = pgTable(
  'project_categories',
  {
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.categoryId] })],
);

export const projectSections = pgTable(
  'project_sections',
  {
    id: id(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['full', 'grid', 'strip', 'video'] }).notNull(),
    title: text('title').notNull().default(''),
    text: text('text').notNull().default(''),
    videoUrl: text('video_url').notNull().default(''),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('sections_project').on(t.projectId, t.position)],
);

export const sectionMedia = pgTable(
  'section_media',
  {
    sectionId: text('section_id')
      .notNull()
      .references(() => projectSections.id, { onDelete: 'cascade' }),
    mediaId: text('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.sectionId, t.position] })],
);

export const testimonials = pgTable('testimonials', {
  id: id(),
  quote: text('quote').notNull(),
  name: text('name').notNull().default(''),
  role: text('role').notNull().default(''),
  business: text('business').notNull().default(''),
  photoId: text('photo_id').references(() => media.id, { onDelete: 'set null' }),
  visible: boolean('visible').notNull().default(true),
  position: integer('position').notNull().default(0),
});

export const inquiries = pgTable(
  'inquiries',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    type: text('type').notNull(),
    budget: text('budget').notNull().default(''),
    timeline: text('timeline').notNull().default(''),
    message: text('message').notNull(),
    status: text('status', { enum: ['new', 'replied', 'archived'] })
      .notNull()
      .default('new'),
    createdAt: createdAt(),
  },
  (t) => [index('inquiries_status_created').on(t.status, t.createdAt)],
);

/** Editable copy for Home, About and Services, plus optional SEO overrides. */
export const pages = pgTable('pages', {
  key: text('key', { enum: ['home', 'about', 'services'] }).primaryKey(),
  content: jsonb('content').notNull(),
  seo: jsonb('seo')
    .notNull()
    .default(sql`'{}'::jsonb`),
});

/** One row: site-wide contact details, social links, CV and default SEO. */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  data: jsonb('data').notNull(),
});

export const activity = pgTable('activity', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  createdAt: createdAt(),
});
