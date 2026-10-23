import type { Metadata } from 'next';
import { SiteShell } from '@/components/site/SiteShell';
import { getMedia, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

/** Site-wide defaults. Each page overrides what it needs. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const img = (await getMedia([s.seoImageId])).get(s.seoImageId ?? '');
  return buildMetadata({ description: s.siteDesc, path: '/', defaultImage: img, siteTitle: s.siteTitle });
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
