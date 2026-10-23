import 'server-only';
import type { Metadata } from 'next';
import type { SeoOverride, SiteSettings } from '@/lib/content';
import type { MediaItem } from '@/lib/data';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Reem Fathima';

export const abs = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

type Args = {
  /** Page title without the site name. Omit for Home, which uses the full site title. */
  title?: string;
  description: string;
  path: string;
  image?: MediaItem | null;
  /** Fallback share image from Settings. */
  defaultImage?: MediaItem | null;
  override?: Partial<SeoOverride> | null;
  type?: 'website' | 'article';
  noindex?: boolean;
  siteTitle: string;
};

/** Builds the full metadata set (title, description, canonical, Open Graph, Twitter) with admin overrides applied. */
export function buildMetadata(a: Args): Metadata {
  const title = a.override?.title || a.title;
  const description = a.override?.description || a.description;
  const img = a.image ?? a.defaultImage ?? null;
  const fullTitle = title ? `${title} | ${SITE_NAME}` : a.siteTitle;
  const images = img ? [{ url: abs(img.src), width: img.w, height: img.h, alt: img.alt }] : undefined;
  return {
    title: title ? { absolute: fullTitle } : { absolute: a.siteTitle },
    description,
    alternates: { canonical: a.path },
    robots: a.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: a.type ?? 'website',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: a.path,
      locale: 'en_IN',
      images,
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: images?.map((i) => i.url) },
  };
}

export function personJsonLd(
  s: Pick<SiteSettings, 'email' | 'phone' | 'instagram' | 'behance' | 'linkedin'>,
  image?: MediaItem | null,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE_NAME,
    jobTitle: 'Graphic designer and social media creative',
    url: SITE_URL,
    email: s.email,
    telephone: s.phone,
    image: image ? abs(image.src) : undefined,
    knowsAbout: [
      'Graphic design',
      'Social media design',
      'Poster design',
      'Brand identity',
      'Event branding',
      'Print design',
      'Motion graphics',
    ],
    sameAs: [s.instagram, s.behance, s.linkedin].filter(Boolean),
  };
}
