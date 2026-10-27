import './env.mts';
import { count } from 'drizzle-orm';
import { slugify } from '../src/lib/text';
import { connect } from '../src/db/connect';
import * as t from '../src/db/schema';
import {
  seedAbout,
  seedCategories,
  seedHome,
  seedMedia,
  seedProjects,
  seedServices,
  seedSettings,
  seedTestimonials,
} from '../src/db/seed-data';

const db = connect();
const force = process.argv.includes('--force');

const [{ n }] = await db.select({ n: count() }).from(t.projects);
if (n > 0 && !force) {
  console.log('Database already has content. Pass --force to wipe and reseed.');
  process.exit(0);
}
if (force) {
  for (const table of [t.sectionMedia, t.projectSections, t.projectCategories, t.projects, t.companies, t.categories, t.testimonials, t.pages, t.settings, t.activity, t.media]) {
    await db.delete(table);
  }
}

await db.insert(t.media).values(seedMedia.map((m) => ({ ...m })));
await db.insert(t.categories).values(seedCategories.map((c, position) => ({ ...c, position })));

let featuredPos = 0;
for (const [position, p] of seedProjects.entries()) {
  const id = `p-${p.slug}`;
  await db.insert(t.projects).values({
    id,
    slug: p.slug,
    title: p.title,
    client: p.client,
    scope: p.scope,
    year: p.year,
    tab: p.tab,
    overview: p.overview,
    seoTitle: p.seoTitle,
    seoDesc: p.seoDesc,
    coverId: p.cover,
    status: 'published',
    featured: p.featured,
    featuredPosition: p.featured ? featuredPos++ : 0,
    position,
  });
  await db.insert(t.projectCategories).values(p.cats.map((categoryId, i) => ({ projectId: id, categoryId, position: i })));
  for (const [i, s] of p.sections.entries()) {
    const sid = `s-${p.slug}-${i}`;
    await db.insert(t.projectSections).values({ id: sid, projectId: id, type: s.type, title: s.title, text: s.text, position: i });
    if (s.media.length) {
      await db.insert(t.sectionMedia).values(s.media.map((mediaId, j) => ({ sectionId: sid, mediaId, position: j })));
    }
  }
}

await db.insert(t.testimonials).values(seedTestimonials.map((q, position) => ({ ...q, position, visible: false })));
await db.insert(t.pages).values([
  { key: 'home', content: seedHome, seo: {} },
  { key: 'about', content: seedAbout, seo: {} },
  { key: 'services', content: seedServices, seo: {} },
]);
await db.insert(t.settings).values({ id: 1, data: seedSettings });
const clients = [...new Set(seedProjects.map((p) => p.client))];
await db.insert(t.companies).values(clients.map((name, position) => ({ name, slug: slugify(name), position })));
await db.insert(t.activity).values({ text: 'Site content imported from the portfolio PDF' });

console.log(`Seeded ${seedMedia.length} images, ${seedProjects.length} projects.`);
process.exit(0);
