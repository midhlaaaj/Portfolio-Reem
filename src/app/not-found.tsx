import type { Metadata } from 'next';
import { NotFoundPage } from '@/components/site/NotFoundPage';
import { getCopy } from '@/lib/data';
import { SiteShell } from '@/components/site/SiteShell';

export const metadata: Metadata = { title: { absolute: 'Page not found, Reem Fathima' }, robots: { index: false } };

export default async function NotFound() {
  const copy = await getCopy();
  return (
    <SiteShell>
      <main id="main">
        <NotFoundPage copy={copy} />
      </main>
    </SiteShell>
  );
}
