import type { Metadata } from 'next';
import { PageFrame } from '@/components/site/PageFrame';
import { WorkIndex } from '@/components/site/WorkIndex';
import { getCategories, getCopy, getMedia, getPublishedProjects, getSettings } from '@/lib/data';
import { buildMetadata } from '@/lib/seo';

const DESCRIPTION =
  'Browse branding, event, print, social media and motion projects by Reem Fathima for businesses in Kerala and the Gulf.';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const img = (await getMedia([s.seoImageId])).get(s.seoImageId ?? '');
  return buildMetadata({
    title: 'Design Portfolio: Branding, Print and Social Media',
    description: DESCRIPTION,
    path: '/work',
    defaultImage: img,
    siteTitle: s.siteTitle,
  });
}

export default async function WorkPage() {
  const [projects, categories, copy] = await Promise.all([getPublishedProjects(), getCategories(), getCopy()]);
  return (
    <PageFrame backdrop="glow">
      <WorkIndex copy={copy} projects={projects} categories={categories.map((c) => c.name)} />
    </PageFrame>
  );
}
