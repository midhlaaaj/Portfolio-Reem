import { gsap } from '../gsap';
import { engine } from '../engine';
import { tabPos } from './cards';

/** The red rule on "How I work" fills as the steps scroll past. Under reduced motion it is simply full. */
export function setupScrubs(root: HTMLElement): () => void {
  const els = root.querySelectorAll<HTMLElement>('[data-scrub]');
  if (!els.length) return () => {};
  if (engine.reduced) {
    els.forEach((e) => (e.style.transform = 'scaleY(1)'));
    return () => {};
  }
  const tweens = Array.from(els).map((el) =>
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: '50% 0' },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement!, start: 'top 62%', end: 'bottom 62%', scrub: true },
      },
    ),
  );
  return () => tweens.forEach((t) => t.scrollTrigger?.kill());
}

/** Folder tabs on the "Next project" card lift once the card is half in view. */
export function setupLifts(root: HTMLElement): () => void {
  const els = root.querySelectorAll<HTMLElement>('[data-lift]');
  if (!els.length) return () => {};
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const tab = en.target.querySelector<HTMLElement>('[data-card-tab]');
        if (tab) {
          tab.dataset.lift = '1';
          tabPos(tab);
        }
      }),
    { threshold: 0.5 },
  );
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}
