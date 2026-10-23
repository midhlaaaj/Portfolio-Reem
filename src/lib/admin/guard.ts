import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/** Every admin page, action and data read goes through this; the layout alone is not trusted. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect('/admin/login');
  return session;
}
