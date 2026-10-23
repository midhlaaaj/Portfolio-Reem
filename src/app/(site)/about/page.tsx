import type { Metadata } from 'next';
import { AboutPage } from '@/components/site/AboutPage';
import { PageFrame } from '@/components/site/PageFrame';
import { JsonLd } from '@/components/ui/JsonLd';
import { getAbout, getCopy, getMedia, getPageSeo, getSettings } from '@/lib/data';
import { buildMetadata, personJsonLd } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [s, seo, about] = await Promise.all([getSettings(), getPageSeo('about'), getAbout()]);
  const media = await getMedia([seo.imageId, about.portraitId, s.seoImageId]);
  return buildMetadata({
    title: 'About: Self-Taught Graphic and Motion Designer',
    description:
      'Reem Fathima is a self-taught graphic designer making social media posters, logos, event branding and motion graphics for businesses in Kerala and the Gulf.',
    path: '/about',
    override: seo,
    image: seo.imageId ? media.get(seo.imageId) : about.portraitId ? media.get(about.portraitId) : null,
    defaultImage: media.get(s.seoImageId ?? ''),
    siteTitle: s.siteTitle,
  });
}

export default async function About() {
  const [about, settings, copy] = await Promise.all([getAbout(), getSettings(), getCopy()]);
  const portrait = about.portraitId ? ((await getMedia([about.portraitId])).get(about.portraitId) ?? null) : null;
  return (
    <PageFrame backdrop="glow">
      <JsonLd data={personJsonLd(settings, portrait)} />
      <AboutPage
        copy={copy}
        ab={{
          portrait,
          lead: about.lead,
          story: about.story,
          toolsDesign: about.toolsDesign,
          toolsAI: about.toolsAI,
          role: about.expRole,
          years: about.expStart ? `${about.expStart} to present` : 'Present',
          expText: about.expText,
          cvUrl: settings.cvUrl,
          cvName: settings.cvName,
        }}
      />
    </PageFrame>
  );
}
