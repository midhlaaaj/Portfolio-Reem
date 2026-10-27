import { config } from 'dotenv';
config({ path: ['.env.local', '.env'], quiet: true });
import './env.mts';
import { connect } from '../src/db/connect';
import * as t from '../src/db/schema';
import { slugify } from '../src/lib/text';

/** Adds a company for every distinct project client that has none yet. Safe to run repeatedly. */
const db = connect();
const [existing, rows] = await Promise.all([
  db.select().from(t.companies),
  db.select({ client: t.projects.client }).from(t.projects).orderBy(t.projects.position),
]);
const have = new Set(existing.map((c) => c.slug));
let position = existing.length;
const added: string[] = [];
for (const { client } of rows) {
  const name = client.trim();
  const slug = slugify(name);
  if (!name || !slug || have.has(slug)) continue;
  have.add(slug);
  await db.insert(t.companies).values({ name, slug, position: position++ });
  added.push(name);
}
console.log(added.length ? `Added ${added.length} companies: ${added.join(', ')}` : 'No new companies to add.');
process.exit(0);
