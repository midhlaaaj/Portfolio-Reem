import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, media } from '@/db';
import { revalidateSite } from '@/lib/admin/revalidate';
import { logActivity } from '@/lib/admin/activity';
import { makeVariants } from '@/lib/images';
import { deleteObject, putObject, readObject } from '@/lib/storage';

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
    // Also proves the stored file really is an image (sharp throws otherwise).
    const { web, full } = await makeVariants(buf);
    const webKey = `media/${m[1]}-web.webp`;
    const fullKey = `media/${m[1]}-full.webp`;
    const [url, fullUrl] = await Promise.all([
      putObject(webKey, web.data, 'image/webp'),
      putObject(fullKey, full.data, 'image/webp'),
    ]);
    // The untouched upload is no longer needed once both versions exist.
    await deleteObject(key).catch(() => {});
    const label = (name ?? 'image').replace(/[\/]/g, '').slice(0, 120) || 'image';
    const [row] = await db
      .insert(media)
      .values({
        id: m[1],
        url,
        width: web.width,
        height: web.height,
        alt: text.slice(0, 300),
        name: label,
        bytes: web.data.length,
        storageKey: webKey,
        fullUrl,
        fullStorageKey: fullKey,
        fullBytes: full.data.length,
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
