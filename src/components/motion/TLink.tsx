import type { ComponentProps } from 'react';

/**
 * Internal link. A plain anchor: with JavaScript the motion engine intercepts the click (red page wipe or folder
 * transition, then a soft route change) and prefetches on hover; without it the link is just a link.
 */
export function TLink(props: ComponentProps<'a'>) {
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a {...props} />;
}
