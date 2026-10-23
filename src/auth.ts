import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

/** Compared against when the email is wrong, so response time doesn't reveal whether the email exists. */
let dummy: string | undefined;
const dummyHash = () => (dummy ??= bcrypt.hashSync(crypto.randomUUID(), 12));

/** Accepts a raw bcrypt hash or a base64 of one (base64 avoids `$` being mangled by env-file expansion). */
function adminHash(): string | null {
  const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!raw) return null;
  if (raw.startsWith('$2')) return raw;
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8');
    return decoded.startsWith('$2') ? decoded : null;
  } catch {
    return null;
  }
}

const credentialsSchema = z.object({ email: z.string().trim().min(1), password: z.string().min(1) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const hash = adminHash();
        if (!parsed.success || !email || !hash) return null;
        const emailMatches = parsed.data.email.toLowerCase() === email;
        const passwordMatches = await bcrypt.compare(parsed.data.password, emailMatches ? hash : dummyHash());
        return emailMatches && passwordMatches ? { id: 'admin', email, name: 'Reem' } : null;
      },
    }),
  ],
});
