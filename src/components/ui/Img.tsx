import { getImageProps, type ImageProps } from 'next/image';
import { preload } from 'react-dom';
import type { ImgHTMLAttributes } from 'react';
import type { MediaItem } from '@/lib/data';

type Props = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height'> &
  Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet' | 'width' | 'height' | 'alt' | 'loading' | 'placeholder'
  > & {
    m: Pick<MediaItem, 'src' | 'alt' | 'w' | 'h'>;
  };

/**
 * next/image's optimisation pipeline (resized AVIF/WebP, srcset, lazy loading) without the client component: this
 * renders a plain <img> on the server, so images cost no hydration. The intrinsic size comes from the media record
 * so the design's CSS keeps full control of layout.
 */
export function Img({ m, sizes = '100vw', priority, quality = 75, loading, ...rest }: Props) {
  const { props } = getImageProps({
    src: m.src,
    alt: m.alt,
    width: m.w,
    height: m.h,
    sizes,
    priority,
    quality,
    loading,
  });
  if (priority) {
    preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'high' });
  }
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} {...rest} />;
}
