import type { Metadata } from 'next';
import { PageFrame } from '@/components/site/PageFrame';
import { ServicesPage, type ServiceView } from '@/components/site/ServicesPage';
import { getCopy, getMedia, getPageSeo, getPublishedProjects, getServices, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const [s, seo, sv] = await Promise.all([getSettings(), getPageSeo('services'), getServices()]);
  const media = await getMedia([seo.imageId, s.seoImageId]);
  return buildMetadata({
    title: 'Graphic Design and Social Media Services',
    description:
      'Social media creatives, logo and brand identity design, event branding, print and motion graphics. See what each service includes and how I work.',
    path: '/services',
    override: seo,
    image: seo.imageId ? media.get(seo.imageId) : null,
    defaultImage: media.get(s.seoImageId ?? ''),
    siteTitle: s.siteTitle,
  });
}

export default async function Services() {
  const [sv, projects, copy] = await Promise.all([getServices(), getPublishedProjects(), getCopy()]);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const items: ServiceView[] = sv.items.map((it) => {
    const p = it.projectSlug ? bySlug.get(it.projectSlug) : undefined;
    return {
      id: it.id,
      name: it.name,
      desc: it.desc,
      deliverables: it.deliverables,
      price: it.price,
      project: p ? { slug: p.slug, title: p.title, image: p.cover } : null,
    };
  });
  return (
    <PageFrame backdrop="glow">
      <ServicesPage copy={copy} intro={sv.intro} pricingOn={sv.pricingOn} items={items} steps={sv.process} />
    </PageFrame>
  );
}
