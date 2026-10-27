import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { directUploads, presignPut } from '@/lib/storage';

export const runtime = 'nodejs';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

/** Hands the browser a one-off URL so an image of any size goes straight to storage. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false, error: 'Not signed in.' }, { status: 401 });
  const { type } = (await req.json().catch(() => ({}))) as { type?: string };
  const ext = type ? EXT[type] : undefined;
  if (!ext)
    return NextResponse.json(
      { ok: false, error: 'Only JPEG, PNG, WebP or AVIF images can be added to Media.' },
      { status: 400 },
    );
  // Without S3 settings (local dev) the browser falls back to the regular upload route.
  if (!directUploads()) return NextResponse.json({ ok: true, direct: false });
  const id = crypto.randomUUID();
  const key = `media/${id}.${ext}`;
  return NextResponse.json({ ok: true, direct: true, id, key, url: await presignPut(key, type!) });
}
