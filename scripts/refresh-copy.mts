import './env.mts';
import { eq } from 'drizzle-orm';
import { connect } from '../src/db/connect';
import * as t from '../src/db/schema';
import { seedAbout, seedHome, seedMedia, seedProjects, seedServices, seedSettings } from '../src/db/seed-data';

/**
 * Pushes the wording in seed-data.ts into an already-seeded database without touching media, uploads,
 * inquiries, ordering, links or contact details. Use it after editing copy; `db:seed --force` wipes everything.
 */
const url = process.env.DATABASE_URL ?? '';
if (!/(127\.0\.0\.1|localhost)/.test(url) && !process.argv.includes('--remote')) {
  console.log('DATABASE_URL is not local. Pass --remote to update that database.');
  process.exit(1);
}

const db = connect();

for (const p of seedProjects) {
  await db
    .update(t.projects)
    .set({ title: p.title, overview: p.overview, seoTitle: p.seoTitle, seoDesc: p.seoDesc })
    .where(eq(t.projects.slug, p.slug));
  for (const [i, s] of p.sections.entries()) {
    await db
      .update(t.projectSections)
      .set({ title: s.title, text: s.text })
      .where(eq(t.projectSections.id, `s-${p.slug}-${i}`));
  }
}

const pageRow = async (key: 'home' | 'about' | 'services') => {
  const [row] = await db.select().from(t.pages).where(eq(t.pages.key, key));
  return (row?.content ?? {}) as Record<string, unknown>;
};
const savePage = (key: 'home' | 'about' | 'services', content: unknown) =>
  db.update(t.pages).set({ content }).where(eq(t.pages.key, key));

const { tagline, smallLine, clientsLine, introText, selectedWorkTitle, ctaText } = seedHome;
await savePage('home', {
  ...(await pageRow('home')),
  tagline,
  smallLine,
  clientsLine,
  introText,
  selectedWorkTitle,
  ctaText,
});

const about = await pageRow('about');
await savePage('about', {
  ...about,
  lead: seedAbout.lead,
  story: seedAbout.story,
  expRole: seedAbout.expRole,
  expText: seedAbout.expText,
});

const services = (await pageRow('services')) as typeof seedServices;
const liveItems = new Map((services.items ?? []).map((it) => [it.id, it]));
await savePage('services', {
  ...services,
  intro: seedServices.intro,
  process: seedServices.process,
  items: seedServices.items.map((it) => {
    const live = liveItems.get(it.id);
    return live ? { ...live, name: it.name, short: it.short, desc: it.desc, deliverables: it.deliverables } : it;
  }),
});

// The share-preview image: add it if missing, and select it only if the old default is still selected.
const og = seedMedia.find((m) => m.id === seedSettings.seoImageId);
if (og) await db.insert(t.media).values({ ...og }).onConflictDoNothing();

const [settings] = await db.select().from(t.settings).where(eq(t.settings.id, 1));
const live = (settings?.data ?? {}) as { seoImageId?: string | null };
await db
  .update(t.settings)
  .set({
    data: {
      ...live,
      siteTitle: seedSettings.siteTitle,
      siteDesc: seedSettings.siteDesc,
      seoImageId: !live.seoImageId || live.seoImageId === 'm-cover' ? seedSettings.seoImageId : live.seoImageId,
    },
  })
  .where(eq(t.settings.id, 1));

console.log('Wording refreshed.');
process.exit(0);
