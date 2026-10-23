import type { Metadata } from 'next';
import { PageFrame } from '@/components/site/PageFrame';
import { getCopy } from '@/lib/data';
import { requireAdmin } from '@/lib/admin/guard';
import { PreviewProject } from './PreviewProject';

export const metadata: Metadata = {
  title: { absolute: 'Preview, Reem Fathima' },
  robots: { index: false, follow: false },
};

/** Admin-only. Shows the project editor's unsaved draft using the real project page. */
export default async function PreviewPage() {
  await requireAdmin();
  const copy = await getCopy();
  return (
    <PageFrame backdrop="plain">
      <PreviewProject copy={copy} />
    </PageFrame>
  );
}
