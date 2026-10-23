'use client';

import { useGSAP } from './gsap';
import { setupHero } from './features/hero';

/** Mounts with the Home hero markup and runs its folder animation; everything is cleaned up when the route changes. */
export function HeroMotion() {
  useGSAP(() => setupHero(), []);
  return null;
}
