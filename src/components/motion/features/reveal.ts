import { gsap } from '../gsap';
import { engine } from '../engine';

const rvY = (el: HTMLElement) => +(el.dataset.rvY ?? 36);

/** Plays the reveal for one element: lines slide up, blocks rise, images open with a clip. Once only. */
function reveal(el: HTMLElement, delayMs: number) {
  if (el.hasAttribute('data-rv-done')) return;
  // Releases the pre-paint hidden state in globals.css; the tween below takes over the same frame.
  el.setAttribute('data-rv-done', '');
  const type = el.dataset.rv;
  const delay = delayMs / 1000;

  if (type === 'lines') {
    const dur = +(el.dataset.rvDur ?? 650) / 1000;
    const stagger = +(el.dataset.rvStagger ?? 70) / 1000;
    gsap.fromTo(
      el.querySelectorAll('[data-line]'),
      { yPercent: 112 },
      { yPercent: 0, duration: dur, ease: 'rfOut', delay, stagger, clearProps: 'transform' },
    );
    return;
  }
  if (type === 'clip') {
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'rfOut', delay, clearProps: 'clipPath' },
    );
    const inner = el.querySelector('[data-rv-in]');
    if (inner)
      gsap.fromTo(inner, { scale: 1.15 }, { scale: 1, duration: 1.1, ease: 'rfOut', delay, clearProps: 'transform' });
    return;
  }
  if (type === 'rule') {
    gsap.fromTo(
      el,
      { scaleX: 0, transformOrigin: '0 50%' },
      { scaleX: 1, duration: 1.1, ease: 'rfOut', delay, clearProps: 'transform' },
    );
    return;
  }
  if (type === 'fade') {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'rfOut', delay, clearProps: 'opacity' });
    return;
  }
  gsap.fromTo(
    el,
    { opacity: 0, y: rvY(el) },
    { opacity: 1, y: 0, duration: 0.9, ease: 'rfOut', delay, clearProps: 'opacity,transform' },
  );
}

/**
 * Heading line reveals, block rises and clip reveals as things enter the viewport. Only headings and media animate;
 * body text never does. Elements start hidden through CSS (.rv-on), so nothing flashes and nothing is lost without JS.
 */
export function setupReveals(root: HTMLElement): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-rv]'));
  const motion = document.documentElement.classList.contains('rv-on') && !engine.reduced;
  if (!motion) {
    els.forEach((e) => e.setAttribute('data-rv-done', ''));
    return () => {};
  }
  // Arriving from a folder click: the page header is already on screen as the transition's end frame.
  if (engine.arrival?.t === 'project') {
    els.filter((e) => e.matches('[data-pheader]')).forEach((e) => e.setAttribute('data-rv-done', ''));
  }

  const io = new IntersectionObserver(
    (entries) => {
      const inView = entries.filter((en) => en.isIntersecting).map((en) => en.target as HTMLElement);
      inView.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      inView.forEach((e, i) => {
        io.unobserve(e);
        reveal(e, engine.revealBase + i * 80 + +(e.dataset.rvDelay ?? 0));
      });
      // Scrolled past before it could play (fast scroll, anchor jump): show it, no animation delay.
      entries
        .filter((en) => !en.isIntersecting && en.boundingClientRect.bottom < 0)
        .forEach((en) => {
          io.unobserve(en.target);
          reveal(en.target as HTMLElement, 0);
        });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  );
  els.forEach((e) => {
    if (!e.hasAttribute('data-rv-done')) io.observe(e);
  });
  return () => io.disconnect();
}
