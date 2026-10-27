import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { auth } from '@/auth';
import { db, media } from '@/db';
import { revalidateSite } from '@/lib/admin/revalidate';
import { logActivity } from '@/lib/admin/activity';
import { deleteObject, readObject } from '@/lib/storage';

export const runtime = 'nodejs';

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
const KEY = /^media\/([0-9a-f-]{36})\.(jpg|png|webp|avif)$/;

/** Called after a direct upload: checks the stored file really is an image, then adds it to Media. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail('Not signed in.', 401);
  const { key, alt, name } = (await req.json().catch(() => ({}))) as { key?: string; alt?: string; name?: string };
  const m = key ? KEY.exec(key) : null;
  if (!key || !m) return fail('That upload could not be read.');
  const text = (alt ?? '').trim();
  if (!text) return fail('Add alt text. Describe what the image shows for people using screen readers.');

  try {
    const buf = await readObject(key);
    const meta = await sharp(buf, { failOn: 'error' }).metadata();
    if (!meta.width || !meta.height) throw new Error('not an image');
    // EXIF orientations 5 to 8 are rotated a quarter turn when displayed.
    const turned = (meta.orientation ?? 1) >= 5;
    const [w, h] = turned ? [meta.height, meta.width] : [meta.width, meta.height];
    const label = (name ?? 'image').replace(/[\/]/g, '').slice(0, 120) || 'image';
    const [row] = await db
      .insert(media)
      .values({
        id: m[1],
        url: `/files/${key}`,
        width: w,
        height: h,
        alt: text.slice(0, 300),
        name: label,
        bytes: buf.length,
        storageKey: key,
      })
      .returning();
    await logActivity(`Uploaded ${label}`);
    revalidateSite();
    return NextResponse.json({
      ok: true,
      media: { id: row.id, src: row.url, alt: row.alt, w: row.width, h: row.height, name: row.name },
    });
  } catch {
    await deleteObject(key).catch(() => {});
    return fail('That file is not a readable image.');
  }
}
