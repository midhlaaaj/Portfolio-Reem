import { getObject } from '@/lib/storage';

export const runtime = 'nodejs';

/** Serves uploaded images and the CV from the private bucket. Files are immutable (new upload = new key), so cache hard. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/');
  if (!/^(media|cv)\/[A-Za-z0-9._-]+$/.test(key)) return new Response('Not found', { status: 404 });
  try {
    const f = await getObject(key);
    return new Response(f.body, {
      headers: {
        'Content-Type': f.type,
        ...(f.length ? { 'Content-Length': String(f.length) } : {}),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
