import type { Metadata } from 'next';
import { Brands, type BrandCard } from '@/components/site/Brands';
import { Hero } from '@/components/site/Hero';
import { HeroMotion } from '@/components/motion/HeroMotion';
import { PageFrame } from '@/components/site/PageFrame';
import { SelectedWork } from '@/components/site/SelectedWork';
import { Testimonials } from '@/components/site/Testimonials';
import { Tools } from '@/components/site/Tools';
import { WhatIDo } from '@/components/site/WhatIDo';
import { JsonLd } from '@/components/ui/JsonLd';
import {
  getAbout,
  getBrandSummaries,
  getCopy,
  getFeaturedProjects,
  getHome,
  getMedia,
  getPageSeo,
  getPublishedProjects,
  getServices,
  getSettings,
  getVisibleTestimonials,
} from '@/lib/data';
import { buildMetadata, personJsonLd } from '@/lib/seo';
import { slugify } from '@/lib/text';

export async function generateMetadata(): Promise<Metadata> {
  const [s, seo, home] = await Promise.all([getSettings(), getPageSeo('home'), getHome()]);
  const media = await getMedia([seo.imageId, s.seoImageId, home.showreelPosterId]);
  return buildMetadata({
    description: s.siteDesc,
    path: '/',
    override: seo,
    image: seo.imageId ? media.get(seo.imageId) : null,
    defaultImage: media.get(s.seoImageId ?? ''),
    siteTitle: s.siteTitle,
  });
}

export default async function HomePage() {
  const [about, copy, home, settings, services, featured, published, quotes] = await Promise.all([
    getAbout(),
    getCopy(),
    getHome(),
    getSettings(),
    getServices(),
    getFeaturedProjects(4),
    getPublishedProjects(),
    getVisibleTestimonials(),
  ]);
  const media = await getMedia([
    home.heroLeftId,
    home.heroRightId,
    home.showreelPosterId,
    settings.seoImageId,
    ...services.items.map((i) => i.imageId),
    ...home.brands.map((b) => b.imageId),
  ]);
  const m = (id: string | null) => (id ? (media.get(id) ?? null) : null);

  const live = new Set(published.map((p) => p.slug));
  // Hand-picked cards from the Pages editor win; otherwise every brand with a published project is shown.
  const picked: BrandCard[] = home.brands
    .filter((b) => live.has(b.projectSlug))
    .map((b) => {
      const image = m(b.imageId);
      const client = published.find((p) => p.slug === b.projectSlug)?.client ?? b.name;
      return {
        slug: b.projectSlug,
        href: `/brands/${slugify(client)}`,
        title: published.find((p) => p.slug === b.projectSlug)?.title ?? b.name,
        name: b.name,
        kind: b.kind,
        image: image && { ...image, alt: `${b.name}, ${b.kind}` },
      };
    });
  const brands: BrandCard[] = picked.length
    ? picked
    : (await getBrandSummaries()).map((b) => ({
        slug: b.slug,
        href: `/brands/${b.slug}`,
        title: b.projectTitle,
        name: b.name,
        kind: b.kind,
        image: b.cover && { ...b.cover, alt: `${b.name}, ${b.kind}` },
      }));

  return (
    <PageFrame backdrop="home">
      <JsonLd data={personJsonLd(settings, m(settings.seoImageId))} />
      <HeroMotion />
      <Hero
        copy={copy}
        tagline={home.tagline}
        smallLine={home.smallLine}
        spreadLines={[home.spreadLine1, home.spreadLine2]}
        left={m(home.heroLeftId)}
        right={m(home.heroRightId)}
        poster={m(home.showreelPosterId)}
        showreelUrl={home.showreelUrl}
      />
      <WhatIDo
        copy={copy}
        intro={home.introText}
        services={services.items.map((i) => ({ name: i.name, short: i.short, img: m(i.imageId) }))}
      />
      <Tools rows={[about.toolsDesign, about.toolsAI]} />
      {featured.length > 0 && <SelectedWork copy={copy} projects={featured} title={home.selectedWorkTitle} />}
      {brands.length > 0 && <Brands title={home.brandsTitle} brands={brands} />}
      <Testimonials quotes={quotes} />
    </PageFrame>
  );
}
