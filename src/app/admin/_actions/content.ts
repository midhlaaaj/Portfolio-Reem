'use server';

import { asc, eq, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { categories, db, inquiries, media, pages, projects, settings, testimonials } from '@/db';
import { logActivity } from '@/lib/admin/activity';
import { requireAdmin } from '@/lib/admin/guard';
import { revalidateSite } from '@/lib/admin/revalidate';
import { categoryNameSchema, testimonialInputSchema, type ActionResult } from '@/lib/admin/schemas';
import {
  aboutContentSchema,
  homeContentSchema,
  seoOverrideSchema,
  servicesContentSchema,
  siteSettingsSchema,
} from '@/lib/content';
import { deleteObject } from '@/lib/storage';
import { slugify } from '@/lib/text';
import { fieldErrors } from '@/lib/admin/errors';

// ---------- categories ----------

export async function addCategory(name: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const all = await db.select().from(categories);
  if (all.some((c) => c.name.toLowerCase() === parsed.data.toLowerCase() || c.slug === slugify(parsed.data))) {
    return { ok: false, error: 'That category already exists. Use a different name.' };
  }
  const [m] = await db.select({ v: max(categories.position) }).from(categories);
  await db.insert(categories).values({ name: parsed.data, slug: slugify(parsed.data), position: (m?.v ?? -1) + 1 });
  await logActivity(`Added category ${parsed.data}`);
  revalidateSite();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const [current] = await db.select().from(categories).where(eq(categories.id, id));
  if (!current) return { ok: false, error: 'That category no longer exists.' };
  const clash = (await db.select().from(categories)).find(
    (c) => c.id !== id && (c.name.toLowerCase() === parsed.data.toLowerCase() || c.slug === slugify(parsed.data)),
  );
  if (clash) return { ok: false, error: 'That category already exists. Use a different name.' };
  await db.transaction(async (tx) => {
    await tx
      .update(categories)
      .set({ name: parsed.data, slug: slugify(parsed.data) })
      .where(eq(categories.id, id));
    // Folder tabs that carried the old name follow the rename (as in the design).
    await tx.update(projects).set({ tab: parsed.data }).where(eq(projects.tab, current.name));
  });
  await logActivity(`Renamed category to ${parsed.data}`);
  revalidateSite();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const [c] = await db.select().from(categories).where(eq(categories.id, id));
  await db.delete(categories).where(eq(categories.id, id));
  await logActivity(`Deleted category ${c?.name ?? ''}`.trim());
  revalidateSite();
  return { ok: true };
}

// ---------- testimonials ----------

export async function saveTestimonial(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = testimonialInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const t = parsed.data;
  const values = {
    quote: t.quote,
    name: t.name,
    role: t.role,
    business: t.business,
    photoId: t.photoId,
    visible: t.visible,
  };
  if (t.id) {
    await db.update(testimonials).set(values).where(eq(testimonials.id, t.id));
  } else {
    const [m] = await db.select({ v: max(testimonials.position) }).from(testimonials);
    await db.insert(testimonials).values({ ...values, position: (m?.v ?? -1) + 1 });
  }
  await logActivity(`${t.id ? 'Updated' : 'Added'} a testimonial`);
  revalidateSite();
  return { ok: true };
}

export async function toggleTestimonial(id: string): Promise<ActionResult<{ visible: boolean }>> {
  await requireAdmin();
  const [t] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!t) return { ok: false, error: 'That testimonial no longer exists.' };
  await db.update(testimonials).set({ visible: !t.visible }).where(eq(testimonials.id, id));
  revalidateSite();
  return { ok: true, visible: !t.visible };
}

export async function deleteTestimonial(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(testimonials).where(eq(testimonials.id, id));
  await logActivity('Deleted a testimonial');
  revalidateSite();
  return { ok: true };
}

export async function reorderTestimonials(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  await db.transaction(async (tx) => {
    for (const [position, id] of ids.entries())
      await tx.update(testimonials).set({ position }).where(eq(testimonials.id, id));
  });
  revalidateSite();
  return { ok: true };
}

// ---------- pages & settings ----------

const pagesInputSchema = z.object({
  home: homeContentSchema,
  about: aboutContentSchema,
  services: servicesContentSchema,
});

export async function savePages(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = pagesInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, fieldErrors: fieldErrors(parsed.error), error: 'Check the fields marked in red.' };
  const p = parsed.data;
  await db.transaction(async (tx) => {
    await tx.update(pages).set({ content: p.home }).where(eq(pages.key, 'home'));
    await tx.update(pages).set({ content: p.about }).where(eq(pages.key, 'about'));
    await tx.update(pages).set({ content: p.services }).where(eq(pages.key, 'services'));
  });
  await logActivity('Updated page copy');
  revalidateSite();
  return { ok: true };
}

export async function savePageSeo(key: 'home' | 'about' | 'services', input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = seoOverrideSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  await db.update(pages).set({ seo: parsed.data }).where(eq(pages.key, key));
  revalidateSite();
  return { ok: true };
}

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, fieldErrors: fieldErrors(parsed.error), error: 'Check the fields marked in red.' };
  await db.update(settings).set({ data: parsed.data }).where(eq(settings.id, 1));
  await logActivity('Updated settings');
  revalidateSite();
  return { ok: true };
}

// ---------- inquiries ----------

export async function setInquiryStatus(id: string, status: 'new' | 'replied' | 'archived'): Promise<ActionResult> {
  await requireAdmin();
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
  return { ok: true };
}

// ---------- media ----------

export async function updateMediaAlt(id: string, alt: string): Promise<ActionResult> {
  await requireAdmin();
  const clean = alt.trim();
  if (!clean)
    return { ok: false, error: 'Add alt text. Describe what the image shows for people using screen readers.' };
  await db
    .update(media)
    .set({ alt: clean.slice(0, 300) })
    .where(eq(media.id, id));
  revalidateSite();
  return { ok: true };
}

/** Removes the image everywhere it is used (cover, sections, page slots, testimonial photo, share image), then the file. */
export async function deleteMedia(id: string): Promise<ActionResult> {
  await requireAdmin();
  const [m] = await db.select().from(media).where(eq(media.id, id));
  if (!m) return { ok: true };

  await db.transaction(async (tx) => {
    await tx.execute(sql`delete from section_media where media_id = ${id}`);
    // Content that references images by id inside JSON.
    const rows = await tx.select().from(pages).orderBy(asc(pages.key));
    for (const row of rows) {
      const next = JSON.parse(JSON.stringify(row.content), (k, v) =>
        (k.endsWith('Id') || k === 'imageId') && v === id ? null : v,
      );
      await tx.update(pages).set({ content: next }).where(eq(pages.key, row.key));
      const seo = JSON.parse(JSON.stringify(row.seo ?? {}), (k, v) => (k === 'imageId' && v === id ? null : v));
      await tx.update(pages).set({ seo }).where(eq(pages.key, row.key));
    }
    const [s] = await tx.select().from(settings).where(eq(settings.id, 1));
    if (s) {
      const data = { ...(s.data as Record<string, unknown>) };
      if (data.seoImageId === id) data.seoImageId = null;
      await tx.update(settings).set({ data }).where(eq(settings.id, 1));
    }
    await tx.delete(media).where(eq(media.id, id)); // covers and testimonial photos are set null by their foreign keys
  });
  if (m.storageKey) await deleteObject(m.storageKey).catch((e) => console.error('storage delete failed', e));
  await logActivity(`Deleted image ${m.name}`);
  revalidateSite();
  return { ok: true };
}
