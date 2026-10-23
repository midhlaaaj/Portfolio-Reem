import 'server-only';
import { asc, count, desc, eq, inArray } from 'drizzle-orm';
import {
  activity,
  categories,
  db,
  inquiries,
  media,
  pages,
  projectCategories,
  projectSections,
  projects,
  sectionMedia,
  settings,
  testimonials,
} from '@/db';
import {
  aboutContentSchema,
  homeContentSchema,
  seoOverrideSchema,
  servicesContentSchema,
  siteSettingsSchema,
} from '@/lib/content';
import { requireAdmin } from './guard';
import type { MediaRecord, ProjectInput } from './schemas';

const toRecord = (m: typeof media.$inferSelect): MediaRecord => ({
  id: m.id,
  src: m.url,
  alt: m.alt,
  w: m.width,
  h: m.height,
  name: m.name,
});

async function mediaByIds(ids: (string | null | undefined)[]): Promise<Record<string, MediaRecord>> {
  const wanted = [...new Set(ids.filter((x): x is string => !!x))];
  if (!wanted.length) return {};
  const rows = await db.select().from(media).where(inArray(media.id, wanted));
  return Object.fromEntries(rows.map((r) => [r.id, toRecord(r)]));
}

// ---------- dashboard ----------

export async function adminDashboard() {
  await requireAdmin();
  const [[{ n: newCount }], latest, all, feed] = await Promise.all([
    db.select({ n: count() }).from(inquiries).where(eq(inquiries.status, 'new')),
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(3),
    db.select({ status: projects.status, featured: projects.featured }).from(projects),
    db.select().from(activity).orderBy(desc(activity.id)).limit(6),
  ]);
  const published = all.filter((p) => p.status === 'published');
  return {
    newCount,
    latest: latest.map((q) => ({
      id: q.id,
      name: q.name,
      type: q.type,
      isNew: q.status === 'new',
      at: q.createdAt.toISOString(),
    })),
    published: published.length,
    drafts: all.length - published.length,
    onHome: published.filter((p) => p.featured).length,
    activity: feed.map((a) => ({ id: a.id, text: a.text, at: a.createdAt.toISOString() })),
  };
}

// ---------- projects ----------

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  client: string;
  cats: string;
  thumb: string | null;
  featured: boolean;
  status: 'draft' | 'published';
  updatedAt: string;
};

export async function adminProjectRows(): Promise<AdminProjectRow[]> {
  await requireAdmin();
  const [rows, links, cats] = await Promise.all([
    db.select().from(projects).orderBy(asc(projects.position)),
    db.select().from(projectCategories).orderBy(asc(projectCategories.position)),
    db.select().from(categories),
  ]);
  const covers = await mediaByIds(rows.map((r) => r.coverId));
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    client: r.client,
    cats: links
      .filter((l) => l.projectId === r.id)
      .map((l) => catName.get(l.categoryId))
      .filter(Boolean)
      .join(', '),
    thumb: r.coverId ? (covers[r.coverId]?.src ?? null) : null,
    featured: r.featured,
    status: r.status,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export type ProjectEditData = {
  input: ProjectInput;
  status: 'draft' | 'published';
  updatedAt: string | null;
  media: Record<string, MediaRecord>;
  categories: { id: string; name: string }[];
};

export async function adminProjectEdit(id: string | null): Promise<ProjectEditData | null> {
  await requireAdmin();
  const cats = (await db.select().from(categories).orderBy(asc(categories.position))).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  if (!id) {
    return {
      input: {
        id: null,
        title: '',
        slug: '',
        client: '',
        scope: '',
        year: String(new Date().getFullYear()),
        tab: '',
        overview: '',
        coverId: null,
        featured: false,
        seoTitle: '',
        seoDesc: '',
        categoryIds: [],
        sections: [],
      },
      status: 'draft',
      updatedAt: null,
      media: {},
      categories: cats,
    };
  }
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) return null;
  const [links, secs] = await Promise.all([
    db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, id))
      .orderBy(asc(projectCategories.position)),
    db.select().from(projectSections).where(eq(projectSections.projectId, id)).orderBy(asc(projectSections.position)),
  ]);
  const sm = secs.length
    ? await db
        .select()
        .from(sectionMedia)
        .where(
          inArray(
            sectionMedia.sectionId,
            secs.map((s) => s.id),
          ),
        )
        .orderBy(asc(sectionMedia.position))
    : [];
  const mediaMap = await mediaByIds([p.coverId, ...sm.map((m) => m.mediaId)]);
  return {
    input: {
      id: p.id,
      title: p.title,
      slug: p.slug,
      client: p.client,
      scope: p.scope,
      year: p.year,
      tab: p.tab,
      overview: p.overview,
      coverId: p.coverId,
      featured: p.featured,
      seoTitle: p.seoTitle,
      seoDesc: p.seoDesc,
      categoryIds: links.map((l) => l.categoryId),
      sections: secs.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        text: s.text,
        videoUrl: s.videoUrl,
        mediaIds: sm.filter((m) => m.sectionId === s.id).map((m) => m.mediaId),
      })),
    },
    status: p.status,
    updatedAt: p.updatedAt.toISOString(),
    media: mediaMap,
    categories: cats,
  };
}

// ---------- categories ----------

export async function adminCategories() {
  await requireAdmin();
  const [cats, links] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.position)),
    db.select().from(projectCategories),
  ]);
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: links.filter((l) => l.categoryId === c.id).length,
  }));
}

// ---------- testimonials ----------

export type AdminTestimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  business: string;
  visible: boolean;
  photo: MediaRecord | null;
};

export async function adminTestimonials(): Promise<AdminTestimonial[]> {
  await requireAdmin();
  const rows = await db.select().from(testimonials).orderBy(asc(testimonials.position));
  const photos = await mediaByIds(rows.map((r) => r.photoId));
  return rows.map((r) => ({
    id: r.id,
    quote: r.quote,
    name: r.name,
    role: r.role,
    business: r.business,
    visible: r.visible,
    photo: r.photoId ? (photos[r.photoId] ?? null) : null,
  }));
}

// ---------- inquiries ----------

export type AdminInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  budget: string;
  timeline: string;
  message: string;
  status: 'new' | 'replied' | 'archived';
  at: string;
};

export async function adminInquiries(): Promise<AdminInquiry[]> {
  await requireAdmin();
  const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  return rows.map((q) => ({
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    type: q.type,
    budget: q.budget,
    timeline: q.timeline,
    message: q.message,
    status: q.status,
    at: q.createdAt.toISOString(),
  }));
}

// ---------- media ----------

export type AdminMediaItem = MediaRecord & { used: string[] };

export async function adminMediaItems(): Promise<AdminMediaItem[]> {
  await requireAdmin();
  const [items, projs, secs, links, pageRows, tests, settingsRow] = await Promise.all([
    db.select().from(media).orderBy(desc(media.createdAt)),
    db.select({ id: projects.id, title: projects.title, coverId: projects.coverId }).from(projects),
    db.select({ id: projectSections.id, projectId: projectSections.projectId }).from(projectSections),
    db.select().from(sectionMedia),
    db.select().from(pages),
    db.select().from(testimonials),
    db.select().from(settings).where(eq(settings.id, 1)),
  ]);
  const projectOfSection = new Map(secs.map((s) => [s.id, s.projectId]));
  const titleOf = new Map(projs.map((p) => [p.id, p.title]));
  const content = Object.fromEntries(pageRows.map((p) => [p.key, p.content as Record<string, unknown>]));
  const home = content.home as { heroLeftId?: string; heroRightId?: string; showreelPosterId?: string } | undefined;
  const about = content.about as { portraitId?: string } | undefined;
  const services = content.services as { items?: { imageId?: string | null; name: string }[] } | undefined;
  const seoId = (settingsRow[0]?.data as { seoImageId?: string | null } | undefined)?.seoImageId;

  return items.map((m) => {
    const used = new Set<string>();
    for (const p of projs) if (p.coverId === m.id) used.add(p.title);
    for (const l of links) if (l.mediaId === m.id) used.add(titleOf.get(projectOfSection.get(l.sectionId) ?? '') ?? '');
    if (home && [home.heroLeftId, home.heroRightId, home.showreelPosterId].includes(m.id))
      used.add('Home folder papers');
    if (about?.portraitId === m.id) used.add('About portrait');
    for (const s of services?.items ?? []) if (s.imageId === m.id) used.add(`Service: ${s.name}`);
    for (const t of tests) if (t.photoId === m.id) used.add(`Testimonial: ${t.business}`);
    if (seoId === m.id) used.add('Default SEO image');
    used.delete('');
    return { ...toRecord(m), used: [...used] };
  });
}

// ---------- settings & pages ----------

export async function adminSettingsData() {
  await requireAdmin();
  const [row] = await db.select().from(settings).where(eq(settings.id, 1));
  const data = siteSettingsSchema.parse(row.data);
  return { settings: data, media: await mediaByIds([data.seoImageId]) };
}

export async function adminPagesData() {
  await requireAdmin();
  const rows = await db.select().from(pages);
  const get = (k: string) => rows.find((r) => r.key === k)!;
  const home = homeContentSchema.parse(get('home').content);
  const about = aboutContentSchema.parse(get('about').content);
  const services = servicesContentSchema.parse(get('services').content);
  const seo = {
    home: seoOverrideSchema.parse(get('home').seo ?? {}),
    about: seoOverrideSchema.parse(get('about').seo ?? {}),
    services: seoOverrideSchema.parse(get('services').seo ?? {}),
  };
  const projs = await db.select().from(projects).orderBy(asc(projects.position));
  const featured = projs
    .filter((p) => p.featured)
    .sort((a, b) => a.featuredPosition - b.featuredPosition || a.position - b.position);
  const mediaMap = await mediaByIds([
    home.heroLeftId,
    home.heroRightId,
    home.showreelPosterId,
    ...home.brands.map((b) => b.imageId),
    about.portraitId,
    ...services.items.map((i) => i.imageId),
    ...featured.map((p) => p.coverId),
    seo.home.imageId,
    seo.about.imageId,
    seo.services.imageId,
  ]);
  return {
    home,
    about,
    services,
    seo,
    media: mediaMap,
    projectOptions: projs.map((p) => ({ slug: p.slug, title: p.title })),
    featured: featured.map((p) => ({
      id: p.id,
      title: p.title,
      published: p.status === 'published',
      thumb: p.coverId ? (mediaMap[p.coverId]?.src ?? null) : null,
    })),
  };
}
