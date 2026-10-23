'use server';

import { desc } from 'drizzle-orm';
import { db, media } from '@/db';
import { requireAdmin } from '@/lib/admin/guard';
import type { MediaRecord } from '@/lib/admin/schemas';

/** Every image, newest first. The picker calls this the first time it opens. */
export async function listMedia(): Promise<MediaRecord[]> {
  await requireAdmin();
  const rows = await db.select().from(media).orderBy(desc(media.createdAt));
  return rows.map((m) => ({ id: m.id, src: m.url, alt: m.alt, w: m.width, h: m.height, name: m.name }));
}
