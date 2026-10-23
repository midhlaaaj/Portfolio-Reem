'use server';

import { and, eq, inArray, max, ne } from 'drizzle-orm';
import { db, categories, projectCategories, projectSections, projects, sectionMedia } from '@/db';
import { logActivity } from '@/lib/admin/activity';
import { fieldErrors } from '@/lib/admin/errors';
import { requireAdmin } from '@/lib/admin/guard';
import { revalidateSite } from '@/lib/admin/revalidate';
import { projectInputSchema, type ActionResult } from '@/lib/admin/schemas';

export async function saveProject(
  input: unknown,
  status: 'draft' | 'published',
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  await requireAdmin();
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const [clash] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(d.id ? and(eq(projects.slug, d.slug), ne(projects.id, d.id)) : eq(projects.slug, d.slug));
  if (clash) {
    return {
      ok: false,
      fieldErrors: { slug: 'Another project already uses this slug. Change it to something unique.' },
    };
  }

  // The folder tab always shows the first category's name.
  let tab = '';
  if (d.categoryIds[0]) {
    const [c] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, d.categoryIds[0]));
    tab = c?.name ?? '';
  }

  const id = d.id ?? crypto.randomUUID();
  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      const [existing] = d.id ? await tx.select().from(projects).where(eq(projects.id, id)) : [];
      const base = {
        slug: d.slug,
        title: d.title,
        client: d.client,
        scope: d.scope,
        year: d.year,
        tab,
        overview: d.overview,
        coverId: d.coverId,
        status,
        featured: d.featured,
        seoTitle: d.seoTitle,
        seoDesc: d.seoDesc,
        updatedAt: now,
      };
      if (existing) {
        let featuredPosition = existing.featuredPosition;
        if (d.featured && !existing.featured) {
          const [m] = await tx.select({ v: max(projects.featuredPosition) }).from(projects);
          featuredPosition = (m?.v ?? -1) + 1;
        }
        await tx
          .update(projects)
          .set({ ...base, featuredPosition })
          .where(eq(projects.id, id));
      } else {
        const [pos] = await tx.select({ v: max(projects.position) }).from(projects);
        const [fpos] = await tx.select({ v: max(projects.featuredPosition) }).from(projects);
        await tx.insert(projects).values({
          id,
          ...base,
          position: (pos?.v ?? -1) + 1,
          featuredPosition: d.featured ? (fpos?.v ?? -1) + 1 : 0,
        });
      }

      await tx.delete(projectCategories).where(eq(projectCategories.projectId, id));
      if (d.categoryIds.length) {
        await tx
          .insert(projectCategories)
          .values(d.categoryIds.map((categoryId, position) => ({ projectId: id, categoryId, position })));
      }

      // Sections are replaced wholesale; their media links cascade.
      await tx.delete(projectSections).where(eq(projectSections.projectId, id));
      for (const [position, s] of d.sections.entries()) {
        await tx.insert(projectSections).values({
          id: s.id,
          projectId: id,
          type: s.type,
          title: s.title,
          text: s.text,
          videoUrl: s.type === 'video' ? s.videoUrl : '',
          position,
        });
        if (s.mediaIds.length) {
          await tx
            .insert(sectionMedia)
            .values(s.mediaIds.map((mediaId, i) => ({ sectionId: s.id, mediaId, position: i })));
        }
      }
    });
  } catch (e) {
    console.error('saveProject failed', e);
    return { ok: false, error: 'That could not be saved. Check the fields and try again.' };
  }

  await logActivity(status === 'published' ? `Published ${d.title}` : `Saved draft of ${d.title}`);
  revalidateSite();
  return { ok: true, id, updatedAt: now.toISOString() };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  const [p] = await db.select({ title: projects.title }).from(projects).where(eq(projects.id, id));
  await db.delete(projects).where(eq(projects.id, id));
  await logActivity(`Deleted ${p?.title || 'a project'}`);
  revalidateSite();
  return { ok: true };
}

export async function toggleFeatured(id: string): Promise<ActionResult<{ featured: boolean; featuredCount: number }>> {
  await requireAdmin();
  const [p] = await db.select().from(projects).where(eq(projects.id, id));
  if (!p) return { ok: false, error: 'That project no longer exists.' };
  const next = !p.featured;
  let featuredPosition = p.featuredPosition;
  if (next) {
    const [m] = await db.select({ v: max(projects.featuredPosition) }).from(projects);
    featuredPosition = (m?.v ?? -1) + 1;
  }
  await db.update(projects).set({ featured: next, featuredPosition, updatedAt: new Date() }).where(eq(projects.id, id));
  const featured = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.featured, true), eq(projects.status, 'published')));
  revalidateSite();
  return { ok: true, featured: next, featuredCount: featured.length };
}

/** Saves the order of the Work page. `ids` is every project, in the new order. */
export async function reorderProjects(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  await db.transaction(async (tx) => {
    for (const [position, id] of ids.entries()) await tx.update(projects).set({ position }).where(eq(projects.id, id));
  });
  revalidateSite();
  return { ok: true };
}

/** Saves the order of "Selected work" on Home. `ids` is every featured project, in the new order. */
export async function reorderFeatured(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  await db.transaction(async (tx) => {
    for (const [featuredPosition, id] of ids.entries()) {
      await tx
        .update(projects)
        .set({ featuredPosition })
        .where(and(eq(projects.id, id), inArray(projects.id, ids)));
    }
  });
  revalidateSite();
  return { ok: true };
}
