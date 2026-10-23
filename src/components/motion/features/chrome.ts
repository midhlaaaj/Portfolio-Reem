import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../gsap';
import { BP, engine, jumpToY, readEnv, scrollToY } from '../engine';
import { go, openProject, saveScroll } from '../transitions';
import { hoverAt } from './cards';
import { lightboxApi } from './lightbox-api';
import { toggleMenu, setMenu } from './menu';

/** Same-origin internal navigation we should hijack: plain left click, no modifiers, same tab. */
function isPlainClick(e: MouseEvent, a?: HTMLAnchorElement | null) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a && (a.target === '_blank' || a.hasAttribute('download'))) return false;
  return true;
}

function onClick(e: MouseEvent) {
  const t = e.target instanceof Element ? e.target : null;
  if (!t) return;

  if (t.closest('[data-menu-toggle]')) {
    e.preventDefault();
    toggleMenu();
    return;
  }
  if (t.closest('[data-top]')) {
    e.preventDefault();
    scrollToY(0);
    return;
  }
  const scrollTarget = t.closest<HTMLElement>('[data-scrollto]');
  if (scrollTarget) {
    e.preventDefault();
    const n = document.querySelector(scrollTarget.dataset.scrollto!);
    if (n) scrollToY(n.getBoundingClientRect().top + scrollY - (engine.mobile ? 84 : 120));
    return;
  }
  const lb = t.closest<HTMLElement>('[data-lb]');
  if (lb) {
    e.preventDefault();
    lightboxApi.open?.(lb);
    return;
  }

  const project = t.closest<HTMLAnchorElement>('a[data-project]');
  if (project && isPlainClick(e, project)) {
    // Capture phase: take over before next/link starts its own navigation.
    e.preventDefault();
    e.stopPropagation();
    openProject(project);
    return;
  }
  const link = t.closest<HTMLAnchorElement>('a[data-go]');
  if (link && isPlainClick(e, link)) {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    e.stopPropagation();
    // Same page: just smooth-scroll to the top instead of wiping to ourselves.
    if (url.pathname === location.pathname && url.search === location.search) {
      if (engine.menuOpen) setMenu(false);
      scrollToY(0);
      return;
    }
    go(url.pathname + url.search + url.hash, link.dataset.go || '');
  }
}

const prefetched = new Set<string>();
/** Warms the destination route as soon as someone points at, focuses or touches an internal link. */
function onIntent(e: Event) {
  const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[data-go],a[data-project]');
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const key = url.pathname + url.search;
  if (prefetched.has(key) || key === location.pathname + location.search) return;
  prefetched.add(key);
  engine.prefetch?.(key);
}

function onKey(e: KeyboardEvent) {
  if (engine.menuOpen && e.key === 'Escape') setMenu(false);
  const t = e.target as Element | null;
  if ((e.key === 'Enter' || e.key === ' ') && t?.matches?.('[data-lb]')) {
    e.preventDefault();
    lightboxApi.open?.(t as HTMLElement);
  }
}

/** Waits for the page to be tall enough (images, fonts) before restoring a saved scroll position. */
function restoreTo(y: number, n = 0) {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (max >= y - 2 || n > 90) {
    const target = Math.max(0, Math.min(y, max));
    jumpToY(target);
    gsap.delayedCall(0.25, () => Math.abs(scrollY - target) > 4 && jumpToY(target));
    return;
  }
  gsap.delayedCall(0.032, () => restoreTo(y, n + 1));
}

/** Called after every route change: back/forward restores where you were, new pages start at the top. */
export function onRouteChange() {
  ScrollTrigger.refresh();
  if (engine.backNav) {
    engine.backNav = false;
    let y = 0;
    try {
      y = +(sessionStorage.getItem(`rf-scroll:${location.pathname}${location.search}`) ?? 0);
    } catch {}
    if (y > 0) {
      engine.arrival = null;
      restoreTo(y);
      return;
    }
  }
  jumpToY(0);
  engine.navHidden = false;
}

/** Once-per-app setup: smooth scroll, the frame loop, pointer, nav behaviour, click and key handling. */
export function setupChrome(): () => void {
  readEnv();
  const cleanups: (() => void)[] = [];

  try {
    history.scrollRestoration = 'manual';
  } catch {}

  document.body.classList.toggle('rf-cursor', engine.cursorOn);
  cleanups.push(() => document.body.classList.remove('rf-cursor'));
  gsap.set('[data-menu-line]', { yPercent: 110 });

  if (!engine.touch && !engine.reduced) {
    engine.lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
    engine.lenis.on('scroll', ScrollTrigger.update);
    cleanups.push(() => {
      engine.lenis?.destroy();
      engine.lenis = null;
    });
  }

  // One frame loop for everything per-frame: Lenis, pointer effects, nav, page hooks.
  gsap.ticker.lagSmoothing(0);
  let last = performance.now();
  let lastY = scrollY;
  let hoverY = scrollY;
  let navEl: HTMLElement | null = null;
  let navBg: HTMLElement | null = null;
  const navLast = { t: '', o: NaN, pe: '' };
  const tick = (time: number) => {
    const now = time * 1000;
    const dt = Math.min(64, now - last);
    last = now;
    engine.lenis?.raf(now);
    const L = (k: number) => 1 - Math.pow(1 - k, dt / 16.667);
    for (const hook of engine.hooks) hook(now, dt, L);

    const sy = scrollY;
    if (!navEl?.isConnected) {
      navEl = document.querySelector<HTMLElement>('[data-nav]');
      navBg = navEl?.querySelector<HTMLElement>('[data-nav-bg]') ?? null;
    }
    const nav = navEl;
    if (nav) {
      if (!engine.menuOpen && !engine.busy) {
        if (sy > 120 && sy > lastY + 2) engine.navHidden = true;
        else if (sy < lastY - 2 || sy <= 120) engine.navHidden = false;
      }
      const t = engine.navHidden ? 'translate3d(0,-100%,0)' : 'translate3d(0,0,0)';
      if (t !== navLast.t) nav.style.transform = navLast.t = t;
      if (engine.nav !== navLast.o) nav.style.opacity = String((navLast.o = engine.nav));
      const pe = engine.nav < 0.2 ? 'none' : '';
      if (pe !== navLast.pe) nav.style.pointerEvents = navLast.pe = pe;
      const solid = sy > 24;
      if (navBg && navBg.dataset.on !== String(solid)) {
        navBg.dataset.on = String(solid);
        navBg.style.opacity = solid ? '1' : '0';
      }
    }
    lastY = sy;

    // Scrolling under a still pointer changes what it is hovering.
    if (engine.p.seen && Math.abs(sy - hoverY) > 4) {
      hoverY = sy;
      engine.target = document.elementFromPoint(engine.p.x, engine.p.y);
      hoverAt(engine.target);
    }
  };
  gsap.ticker.add(tick);
  cleanups.push(() => gsap.ticker.remove(tick));

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const p = engine.p;
    p.x = e.clientX;
    p.y = e.clientY;
    p.out = false;
    p.seen = true;
    engine.target = e.target as Element;
    hoverAt(engine.target);
  };
  const onLeave = () => {
    engine.p.out = true;
    engine.target = null;
    hoverAt(null);
  };
  const onResize = () => {
    engine.mobile = innerWidth < BP;
  };
  const onPop = () => {
    engine.backNav = true;
  };
  const onHide = () => saveScroll();
  const onShow = (e: PageTransitionEvent) => {
    if (e.persisted) engine.busy = false;
  };
  addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  document.addEventListener('click', onClick, true);
  addEventListener('keydown', onKey);
  document.addEventListener('pointerover', onIntent, { passive: true });
  document.addEventListener('focusin', onIntent);
  document.addEventListener('touchstart', onIntent, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('popstate', onPop);
  addEventListener('pagehide', onHide);
  addEventListener('pageshow', onShow);
  cleanups.push(() => {
    removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    document.removeEventListener('click', onClick, true);
    removeEventListener('keydown', onKey);
    document.removeEventListener('pointerover', onIntent);
    document.removeEventListener('focusin', onIntent);
    document.removeEventListener('touchstart', onIntent);
    removeEventListener('resize', onResize);
    removeEventListener('popstate', onPop);
    removeEventListener('pagehide', onHide);
    removeEventListener('pageshow', onShow);
  });

  // Film grain drifts by jumping the noise tile around every 125ms. One CSS variable update drives every grain layer.
  if (!engine.reduced) {
    const id = setInterval(() => {
      const s = document.documentElement.style;
      s.setProperty('--gx', `${Math.round(Math.random() * 220)}px`);
      s.setProperty('--gy', `${Math.round(Math.random() * 220)}px`);
    }, 125);
    cleanups.push(() => clearInterval(id));
  }

  // Keep the saved position current so back/forward always has something to return to.
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const onScroll = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveScroll, 150);
  };
  addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => {
    removeEventListener('scroll', onScroll);
    clearTimeout(saveTimer);
  });

  return () => cleanups.forEach((c) => c());
}
