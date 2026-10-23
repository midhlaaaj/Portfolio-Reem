'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useGSAP } from './gsap';
import { engine } from './engine';
import { setupAtmosphere } from './features/atmosphere';
import { onRouteChange, setupChrome } from './features/chrome';
import { setupHpins } from './features/hpin';
import { setupReveals } from './features/reveal';
import { setupLifts, setupScrubs } from './features/scroll-extras';
import { arrive } from './transitions';
import { Cursor, Lightbox, Wipe } from './Overlays';

declare global {
  interface Window {
    __rv?: boolean;
  }
}

/**
 * The site's motion layer, mounted once in the layout: smooth scroll, frame loop, cursor, page wipe, lightbox, and the
 * per-route features (reveals, pinned strips, scrubs, lights) that are re-created whenever the route changes.
 */
export function MotionRoot() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    engine.navigate = (href) => router.push(href);
    engine.prefetch = (href) => router.prefetch(href);
    return () => {
      engine.navigate = null;
      engine.prefetch = null;
    };
  }, [router]);

  useEffect(() => {
    const dispose = setupChrome();
    window.__rv = true; // tells the pre-paint script the engine is alive, so it keeps the reveal start states
    return dispose;
  }, []);

  // Everything tied to the current page's DOM. useGSAP reverts the tweens and ScrollTriggers; the returned function
  // removes the listeners and frame hooks.
  useGSAP(
    () => {
      onRouteChange();
      arrive();
      // The CSS-driven first-visit intro belongs to Home only.
      if (location.pathname !== '/') document.documentElement.classList.remove('intro-first');
      const root = document.body;
      const cleanups = [
        setupReveals(root),
        setupHpins(root),
        setupScrubs(root),
        setupLifts(root),
        setupAtmosphere(root),
      ];
      return () => cleanups.forEach((c) => c());
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <>
      <Wipe />
      <Cursor />
      <Lightbox />
    </>
  );
}
