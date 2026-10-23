import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { auth } from '@/auth';
import { db, media } from '@/db';
import { revalidateSite } from '@/lib/admin/revalidate';
import { logActivity } from '@/lib/admin/activity';
import { putObject } from '@/lib/storage';

export const runtime = 'nodejs';

/** Vercel functions accept request bodies up to 4.5 MB, so the browser resizes images before sending them. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_PDF_BYTES = 2.5 * 1024 * 1024;
const MAX_EDGE = 2400;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return fail('Not signed in.', 401);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail('That upload could not be read.');
  }
  const file = form.get('file');
  const kind = form.get('kind') === 'pdf' ? 'pdf' : 'image';
  if (!(file instanceof File)) return fail('No file was sent.');

  if (kind === 'pdf') {
    if (file.type !== 'application/pdf') return fail('Upload the CV as a PDF.');
    if (file.size > MAX_PDF_BYTES) return fail('That PDF is over 2.5 MB. Export a smaller version and try again.');
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.subarray(0, 5).toString() !== '%PDF-') return fail('That file is not a valid PDF.');
    const key = `cv/${crypto.randomUUID()}.pdf`;
    const url = await putObject(key, buf, 'application/pdf');
    return NextResponse.json({ ok: true, url, name: file.name });
  }

  const alt = String(form.get('alt') ?? '').trim();
  if (!alt) return fail('Add alt text. Describe what the image shows for people using screen readers.');
  if (!IMAGE_TYPES.has(file.type)) return fail('Only JPEG, PNG, WebP or AVIF images can be added to Media.');
  if (file.size > MAX_IMAGE_BYTES) return fail('That image is too large. Try a smaller file.');

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Re-encode on the server: strips metadata, enforces the size cap, and proves the file really is an image.
    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const id = crypto.randomUUID();
    const key = `media/${id}.webp`;
    const url = await putObject(key, data, 'image/webp');
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    const [row] = await db
      .insert(media)
      .values({
        id,
        url,
        width: info.width,
        height: info.height,
        alt: alt.slice(0, 300),
        name,
        bytes: data.length,
        storageKey: key,
      })
      .returning();
    await logActivity(`Uploaded ${name}`);
    revalidateSite();
    return NextResponse.json({
      ok: true,
      media: { id: row.id, src: row.url, alt: row.alt, w: row.width, h: row.height, name: row.name },
    });
  } catch (e) {
    console.error('upload failed', e);
    return fail('That file could not be read as an image.');
  }
}
