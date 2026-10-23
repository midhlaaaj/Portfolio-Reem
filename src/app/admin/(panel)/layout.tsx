import { count, eq } from 'drizzle-orm';
import { db, inquiries } from '@/db';
import { requireAdmin } from '@/lib/admin/guard';
import { AdminShell } from '../_components/AdminShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(inquiries).where(eq(inquiries.status, 'new'));
  return (
    <AdminShell newCount={n} email={session.user?.email ?? ''}>
      {children}
    </AdminShell>
  );
}
