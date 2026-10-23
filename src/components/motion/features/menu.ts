import { gsap } from '../gsap';
import { engine } from '../engine';

let opener: HTMLElement | null = null;

/** Full-screen mobile menu: fades in, the five links rise line by line, page scroll is locked meanwhile. */
export function setMenu(on: boolean) {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!menu || on === engine.menuOpen) return;
  engine.menuOpen = on;
  menu.style.visibility = on ? 'visible' : 'hidden';
  menu.style.opacity = on ? '1' : '0';
  menu.style.pointerEvents = on ? 'auto' : 'none';
  menu.querySelectorAll('[data-menu-line]').forEach((line, i) => {
    gsap.to(line, {
      yPercent: on ? 0 : 110,
      duration: 0.65,
      ease: 'rfOut',
      delay: on ? 0.08 + i * 0.06 : 0,
      overwrite: true,
    });
  });
  if (engine.lenis) {
    if (on) engine.lenis.stop();
    else engine.lenis.start();
  }
  document.body.style.overflow = on ? 'hidden' : '';
  // Keyboard users land inside the dialog and return to the button that opened it.
  if (on) {
    opener = document.activeElement as HTMLElement | null;
    gsap.delayedCall(0.05, () => menu.querySelector<HTMLElement>('button')?.focus({ preventScroll: true }));
  } else {
    opener?.focus({ preventScroll: true });
    opener = null;
  }
}

export const closeMenu = () => setMenu(false);
export const toggleMenu = () => setMenu(!engine.menuOpen);
