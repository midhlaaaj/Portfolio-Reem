import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BrandPage } from '@/components/site/BrandPage';
import { PageFrame } from '@/components/site/PageFrame';
import { getCompanyPage, getMedia, getPublishedProjects, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';
import { firstSentence, slugify } from '@/lib/text';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = new Set((await getPublishedProjects()).map((p) => slugify(p.client)));
  return [...slugs].filter(Boolean).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [company, s] = await Promise.all([getCompanyPage(slug), getSettings()]);
  if (!company) return { title: 'Brand not found', robots: { index: false } };
  const img = (await getMedia([s.seoImageId])).get(s.seoImageId ?? '');
  return buildMetadata({
    title: `${company.name}: Design Work`,
    description: company.description ? firstSentence(company.description) : `Projects Reem Fathima designed for ${company.name}.`,
    path: `/brands/${slug}`,
    image: company.cover,
    defaultImage: img,
    siteTitle: s.siteTitle,
  });
}

export default async function Brand({ params }: Params) {
  const { slug } = await params;
  const company = await getCompanyPage(slug);
  if (!company) notFound();
  return (
    <PageFrame backdrop="plain">
      <BrandPage company={company} />
    </PageFrame>
  );
}
