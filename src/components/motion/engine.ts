'use client';

import type Lenis from 'lenis';
import { gsap } from './gsap';

/** Below this width the design switches to its mobile layout and behaviour. */
export const BP = 820;

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** Progress of x through [a, b], clamped to 0..1. */
export const seg = (x: number, a: number, b: number) => clamp((x - a) / (b - a), 0, 1);

export type FrameHook = (now: number, dt: number, L: (k: number) => number) => void;

export type Arrival = { t: 'wipe' | 'fade' | 'project'; label?: string } | null;

/**
 * Shared state for the motion layer. It lives outside React because it is read every frame and by features
 * that mount and unmount independently (hero, lights, nav, cursor).
 */
export const engine = {
  touch: false,
  reduced: false,
  mobile: false,
  cursorOn: false,
  lenis: null as Lenis | null,
  /** Pointer in viewport px. `seen` flips on the first real mouse move, `out` when it leaves the window. */
  p: { x: 0, y: 0, seen: false, out: false },
  /** Element under the pointer. */
  target: null as Element | null,
  /** Nav opacity; Home fades it in as part of its intro. */
  nav: 1,
  navHidden: false,
  menuOpen: false,
  busy: false,
  /** Extra delay for reveals right after a page wipe, so they play once the wipe has lifted. */
  revealBase: 0,
  arrival: null as Arrival,
  backNav: false,
  /** Lets a page veto or rewrite a cursor label (Home hides "Open" once the folder has been opened). */
  cursorFilter: null as null | ((label: string, el: Element | null) => string),
  hooks: new Set<FrameHook>(),
  navigate: null as null | ((href: string) => void),
  prefetch: null as null | ((href: string) => void),
};

/** Multiplier set per element by the page (e.g. hero light fades in with the intro). */
export const mul = new WeakMap<Element, number>();

export function readEnv() {
  const mm = (q: string) => matchMedia(q).matches;
  engine.touch = mm('(hover: none)') || mm('(pointer: coarse)');
  engine.reduced = mm('(prefers-reduced-motion: reduce)');
  engine.mobile = innerWidth < BP;
  engine.cursorOn = !engine.touch && !engine.reduced;
}

export function scrollToY(y: number, duration = 1.6) {
  if (engine.lenis) {
    engine.lenis.scrollTo(y, { duration, easing: gsap.parseEase('rfIo') as (t: number) => number });
  } else {
    scrollTo({ top: y, behavior: engine.reduced ? 'auto' : 'smooth' });
  }
}

export function jumpToY(y: number) {
  if (engine.lenis) engine.lenis.scrollTo(y, { immediate: true, force: true });
  else scrollTo(0, y);
}
