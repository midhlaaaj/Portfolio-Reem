import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageFrame } from '@/components/site/PageFrame';
import { ProjectPage } from '@/components/site/ProjectPage';
import { JsonLd } from '@/components/ui/JsonLd';
import { getCopy, getMedia, getProjectBySlug, getPublishedProjects, getSettings } from '@/lib/data';
import { SITE_NAME, SITE_URL, abs, buildMetadata } from '@/lib/seo';
import { firstSentence } from '@/lib/text';

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const [project, s] = await Promise.all([getProjectBySlug(slug), getSettings()]);
  if (!project) return { title: 'Project not found', robots: { index: false } };
  const fallback = (await getMedia([s.seoImageId])).get(s.seoImageId ?? '');
  return buildMetadata({
    title: project.seoTitle || project.title,
    description: project.seoDesc || firstSentence(project.overview),
    path: `/work/${project.slug}`,
    image: project.cover,
    defaultImage: fallback,
    type: 'article',
    siteTitle: s.siteTitle,
  });
}

export default async function Project({ params }: Params) {
  const { slug } = await params;
  const [project, all, copy] = await Promise.all([getProjectBySlug(slug), getPublishedProjects(), getCopy()]);
  if (!project) notFound();

  const i = all.findIndex((p) => p.id === project.id);
  const next = all.length > 1 ? all[(i + 1) % all.length] : null;

  return (
    <PageFrame backdrop="plain">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: project.seoDesc || firstSentence(project.overview, 300),
          url: `${SITE_URL}/work/${project.slug}`,
          image: project.cover ? abs(project.cover.src) : undefined,
          dateCreated: project.year || undefined,
          creator: { '@type': 'Person', name: SITE_NAME, url: SITE_URL },
          sponsor: { '@type': 'Organization', name: project.client },
          genre: project.cats,
          keywords: project.scope || undefined,
        }}
      />
      <ProjectPage copy={copy} project={project} next={next} />
    </PageFrame>
  );
}
