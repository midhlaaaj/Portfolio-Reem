import type { Metadata } from 'next';
import { PageFrame } from '@/components/site/PageFrame';
import { PrivacyPage } from '@/components/site/PrivacyPage';
import { getCopy, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return buildMetadata({
    title: 'Privacy',
    description: 'What the contact form collects, how it is used, how long it is kept and how to ask for deletion.',
    path: '/privacy',
    siteTitle: s.siteTitle,
  });
}

export default async function Privacy() {
  const [s, copy] = await Promise.all([getSettings(), getCopy()]);
  return (
    <PageFrame backdrop={null}>
      <PrivacyPage copy={copy} email={s.email} />
    </PageFrame>
  );
}
