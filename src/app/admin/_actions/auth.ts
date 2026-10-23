'use server';

import { headers } from 'next/headers';
import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';

export type LoginState = { error: string; email: string };

/** Failed-login throttle: 8 attempts per 15 minutes per address. Best effort on serverless, on top of bcrypt's cost. */
const attempts = new Map<string, { n: number; reset: number }>();

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.n >= 8) {
    return { error: 'Too many attempts. Wait a few minutes and try again.', email: String(form.get('email') ?? '') };
  }

  try {
    await signIn('credentials', {
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      redirectTo: '/admin',
    });
  } catch (e) {
    if (e instanceof AuthError) {
      const cur = attempts.get(ip);
      attempts.set(
        ip,
        cur && cur.reset > now ? { n: cur.n + 1, reset: cur.reset } : { n: 1, reset: now + 15 * 60_000 },
      );
      return { error: "That email and password don't match.", email: String(form.get('email') ?? '') };
    }
    throw e; // the redirect on success is thrown by signIn
  }
  return { error: '', email: '' };
}

export async function logout() {
  await signOut({ redirectTo: '/admin/login' });
}
