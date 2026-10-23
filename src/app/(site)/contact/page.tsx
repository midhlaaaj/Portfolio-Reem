import type { Metadata } from 'next';
import { ContactPage } from '@/components/site/ContactPage';
import { PageFrame } from '@/components/site/PageFrame';
import { getCopy, getMedia, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const img = (await getMedia([s.seoImageId])).get(s.seoImageId ?? '');
  return buildMetadata({
    title: 'Contact and Project Enquiries',
    description:
      `Get in touch with Reem Fathima about a poster, logo, event or social media project. ${s.replyTime}`.trim(),
    path: '/contact',
    defaultImage: img,
    siteTitle: s.siteTitle,
  });
}

export default async function Contact() {
  const [s, copy] = await Promise.all([getSettings(), getCopy()]);
  return (
    <PageFrame backdrop="contact" footer="plain">
      <ContactPage copy={copy} settings={s} />
    </PageFrame>
  );
}
