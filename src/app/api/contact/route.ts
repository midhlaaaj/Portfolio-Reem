import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, inquiries } from '@/db';
import { logActivity } from '@/lib/admin/activity';
import { contactFormSchema } from '@/lib/content';

export const runtime = 'nodejs';

const bodySchema = contactFormSchema.extend({
  /** Honeypot. Real visitors never see or fill this field. */
  website: z.string().optional(),
  token: z.string().optional(),
});

/** Five messages per hour per address. Best effort on serverless; Turnstile is the real gate. */
const seen = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (seen.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  recent.push(now);
  seen.set(ip, recent);
  return recent.length > 5;
}

async function turnstileOk(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== 'production'; // unset in production fails closed
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const { website, token, ...form } = parsed.data;

  // A filled honeypot is a bot. Answer as if it worked so it learns nothing.
  if (website) return NextResponse.json({ ok: true });
  if (limited(ip))
    return NextResponse.json({ ok: false, error: 'Too many messages. Try again later.' }, { status: 429 });
  if (!(await turnstileOk(token, ip))) {
    return NextResponse.json(
      { ok: false, error: 'The spam check failed. Reload the page and try again.' },
      { status: 400 },
    );
  }

  await db.insert(inquiries).values({
    name: form.name,
    email: form.email,
    phone: form.phone,
    type: form.type,
    budget: form.budget,
    timeline: form.timeline,
    message: form.message,
  });
  await logActivity(`New inquiry from ${form.name}`);
  return NextResponse.json({ ok: true });
}
