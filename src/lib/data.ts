import 'server-only';
import { cache } from 'react';
import { COPY_DEFAULTS, type Copy } from '@/content/copy';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import * as t from '@/db/schema';
import {
  aboutContentSchema,
  homeContentSchema,
  seoOverrideSchema,
  servicesContentSchema,
  siteSettingsSchema,
  type AboutContent,
  type HomeContent,
  type PageKey,
  type SeoOverride,
  type ServicesContent,
  type SiteSettings,
} from '@/lib/content';

export type MediaItem = { id: string; src: string; alt: string; w: number; h: number };

const toMedia = (m: typeof t.media.$inferSelect | null | undefined): MediaItem | null =>
  m ? { id: m.id, src: m.url, alt: m.alt, w: m.width, h: m.height } : null;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const [row] = await db.select().from(t.settings).where(eq(t.settings.id, 1));
  return siteSettingsSchema.parse(row?.data);
});

async function pageRow(key: PageKey) {
  const [row] = await db.select().from(t.pages).where(eq(t.pages.key, key));
  if (!row) throw new Error(`Missing page content for "${key}". Run npm run db:seed.`);
  return row;
}
export const getHome = cache(async (): Promise<HomeContent> =>
  homeContentSchema.parse((await pageRow('home')).content),
);
export const getAbout = cache(async (): Promise<AboutContent> =>
  aboutContentSchema.parse((await pageRow('about')).content),
);
export const getServices = cache(async (): Promise<ServicesContent> =>
  servicesContentSchema.parse((await pageRow('services')).content),
);
/** Fixed site wording (see content/copy.ts). Kept async so pages read it the same way as their other content. */
export const getCopy = async (): Promise<Copy> => COPY_DEFAULTS;
export const getPageSeo = cache(async (key: PageKey): Promise<SeoOverride> =>
  seoOverrideSchema.parse((await pageRow(key)).seo ?? {}),
);

export const getMedia = cache(async (ids: (string | null | undefined)[]): Promise<Map<string, MediaItem>> => {
  const wanted = [...new Set(ids.filter((x): x is string => !!x))];
  if (!wanted.length) return new Map();
  const rows = await db.select().from(t.media).where(inArray(t.media.id, wanted));
  return new Map(rows.map((r) => [r.id, toMedia(r)!]));
});

export const getCategories = cache(async () => db.select().from(t.categories).orderBy(asc(t.categories.position)));

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  client: string;
  scope: string;
  tab: string;
  cats: string[];
  cover: MediaItem | null;
  featured: boolean;
};

async function toCards(rows: (typeof t.projects.$inferSelect)[]): Promise<ProjectCard[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [links, cats, covers] = await Promise.all([
    db
      .select()
      .from(t.projectCategories)
      .where(inArray(t.projectCategories.projectId, ids))
      .orderBy(asc(t.projectCategories.position)),
    getCategories(),
    getMedia(rows.map((r) => r.coverId)),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  return rows.map((r) => {
    const names = links
      .filter((l) => l.projectId === r.id)
      .map((l) => catName.get(l.categoryId))
      .filter((n): n is string => !!n);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      client: r.client,
      scope: r.scope,
      tab: r.tab || names[0] || '',
      cats: names,
      cover: r.coverId ? (covers.get(r.coverId) ?? null) : null,
      featured: r.featured,
    };
  });
}

export const getPublishedProjects = cache(async (): Promise<ProjectCard[]> =>
  toCards(
    await db.select().from(t.projects).where(eq(t.projects.status, 'published')).orderBy(asc(t.projects.position)),
  ),
);

export const getFeaturedProjects = cache(async (limit = 4): Promise<ProjectCard[]> =>
  toCards(
    await db
      .select()
      .from(t.projects)
      .where(and(eq(t.projects.status, 'published'), eq(t.projects.featured, true)))
      .orderBy(asc(t.projects.featuredPosition), asc(t.projects.position))
      .limit(limit),
  ),
);

export type ProjectSection = {
  id: string;
  type: 'full' | 'grid' | 'strip' | 'video';
  title: string;
  text: string;
  videoUrl: string;
  media: MediaItem[];
};
export type ProjectFull = ProjectCard & {
  year: string;
  overview: string;
  seoTitle: string;
  seoDesc: string;
  status: 'draft' | 'published';
  updatedAt: Date;
  sections: ProjectSection[];
};

export async function loadProject(row: typeof t.projects.$inferSelect): Promise<ProjectFull> {
  const [[card], secs] = await Promise.all([
    toCards([row]),
    db
      .select()
      .from(t.projectSections)
      .where(eq(t.projectSections.projectId, row.id))
      .orderBy(asc(t.projectSections.position)),
  ]);
  const links = secs.length
    ? await db
        .select()
        .from(t.sectionMedia)
        .where(
          inArray(
            t.sectionMedia.sectionId,
            secs.map((s) => s.id),
          ),
        )
        .orderBy(asc(t.sectionMedia.position))
    : [];
  const media = await getMedia(links.map((l) => l.mediaId));
  return {
    ...card,
    year: row.year,
    overview: row.overview,
    seoTitle: row.seoTitle,
    seoDesc: row.seoDesc,
    status: row.status,
    updatedAt: row.updatedAt,
    sections: secs.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      text: s.text,
      videoUrl: s.videoUrl,
      media: links
        .filter((l) => l.sectionId === s.id)
        .map((l) => media.get(l.mediaId))
        .filter((m): m is MediaItem => !!m),
    })),
  };
}

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectFull | null> => {
  const [row] = await db
    .select()
    .from(t.projects)
    .where(and(eq(t.projects.slug, slug), eq(t.projects.status, 'published')));
  return row ? loadProject(row) : null;
});

export const getVisibleTestimonials = cache(async () => {
  const rows = await db
    .select()
    .from(t.testimonials)
    .where(eq(t.testimonials.visible, true))
    .orderBy(asc(t.testimonials.position));
  return rows.map((r) => ({ id: r.id, quote: r.quote, who: [r.name, r.role, r.business].filter(Boolean).join(', ') }));
});

export const getLatestUpdate = cache(async (): Promise<Date | null> => {
  const [row] = await db
    .select({ d: t.projects.updatedAt })
    .from(t.projects)
    .orderBy(desc(t.projects.updatedAt))
    .limit(1);
  return row?.d ?? null;
});
