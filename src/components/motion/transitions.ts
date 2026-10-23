import { gsap } from './gsap';
import { engine } from './engine';
import { closeMenu } from './features/menu';

type WipeEls = { wipe: HTMLElement; label: HTMLElement; fade: HTMLElement };
let els: WipeEls | null = null;
const v = { wipe: 0, fade: 0 };

export function registerWipe(e: WipeEls | null) {
  els = e;
}

/** wipe: 0 hidden, 0..1 rising over the page, 1..2 lifting off. fade: reduced-motion cross-fade. */
function render() {
  if (!els) return;
  const w = v.wipe;
  const active = w > 0 && w < 2;
  const H = innerHeight + 80;
  const y = !active ? H : w <= 1 ? (1 - w) * H : -(w - 1) * H;
  els.wipe.style.visibility = active ? 'visible' : 'hidden';
  els.wipe.style.pointerEvents = active ? 'auto' : 'none';
  els.wipe.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
  els.fade.style.opacity = String(v.fade);
  els.fade.style.visibility = v.fade > 0.001 ? 'visible' : 'hidden';
}

const scrollKey = () => `rf-scroll:${location.pathname}${location.search}`;
export function saveScroll() {
  try {
    sessionStorage.setItem(scrollKey(), String(Math.round(scrollY)));
  } catch {}
}

function navigateNow(href: string) {
  if (engine.navigate) engine.navigate(href);
  else location.href = href;
}

let guardCall: gsap.core.Tween | null = null;

/** If the route never changes (offline, error), take the cover down so the site is never stuck behind it. */
function guard(href: string) {
  guardCall?.kill();
  guardCall = gsap.delayedCall(4.5, () => {
    if (!engine.busy) return;
    gsap.to(v, { wipe: 0, fade: 0, duration: 0.3, onUpdate: render });
    engine.busy = false;
    engine.arrival = null;
    cleanupOverlay();
    // The soft navigation failed to land; do it the hard way.
    if (location.pathname + location.search !== href) location.href = href;
  });
}

/** Red folder page wipe: cover the page, show the destination's name, navigate, lift away on arrival. */
export function go(href: string, label: string) {
  if (engine.busy || !href) return;
  engine.busy = true;
  closeMenu();
  saveScroll();
  if (engine.reduced) {
    engine.arrival = { t: 'fade' };
    gsap.to(v, { fade: 1, duration: 0.1, ease: 'rfOut', onUpdate: render });
    gsap.delayedCall(0.12, () => navigateNow(href));
    guard(href);
    return;
  }
  engine.arrival = { t: 'wipe', label };
  if (els) {
    els.label.textContent = label || '';
    gsap.set(els.label, { opacity: 0 });
  }
  gsap.to(v, { wipe: 1, duration: 0.45, ease: 'rfIo', onUpdate: render });
  gsap.delayedCall(0.3, () => els && gsap.to(els.label, { opacity: 1, duration: 0.18, ease: 'rfOut' }));
  gsap.delayedCall(0.6, () => navigateNow(href));
  guard(href);
}

let overlay: HTMLElement[] = [];
function cleanupOverlay() {
  overlay.forEach((n) => n.remove());
  overlay = [];
}

/** Folder card -> project page: the card's cover grows into the project header, then the route changes underneath it. */
export function openProject(a: HTMLAnchorElement) {
  const href = a.getAttribute('href') ?? '';
  const cover = a.querySelector<HTMLElement>('[data-card-cover]');
  const img = cover && (cover instanceof HTMLImageElement ? cover : cover.querySelector('img'));
  if (engine.reduced || !cover || !img || !img.naturalWidth) return go(href, a.dataset.label || 'Project');
  if (engine.busy) return;
  engine.busy = true;
  saveScroll();

  const r = cover.parentElement!.getBoundingClientRect();
  const W = innerWidth;
  const H = Math.min(innerHeight * 0.8, innerWidth * 0.62 + 200);

  const back = document.createElement('div');
  back.style.cssText = 'position:fixed;inset:0;z-index:83;background:#050505;opacity:0;';
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:0;top:0;z-index:84;overflow:hidden;background:#141416;';
  const im = document.createElement('img');
  im.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${getComputedStyle(img).objectPosition};`;
  im.src = img.currentSrc || img.src;
  im.alt = '';
  box.appendChild(im);
  document.body.append(back, box);
  overlay = [back, box];

  gsap.to(back, { opacity: 1, duration: 0.3, ease: 'rfOut' });
  gsap.fromTo(
    box,
    { x: r.left, y: r.top, width: r.width, height: r.height, borderRadius: 16 },
    { x: 0, y: 0, width: W, height: H, borderRadius: 0, duration: 0.9, ease: 'rfIo' },
  );
  engine.navHidden = true;
  engine.arrival = { t: 'project' };
  gsap.delayedCall(0.92, () => navigateNow(href));
  guard(href);
}

/** Called once the new route has rendered. Lifts the wipe / fades the cover / hands the folder transition over to the page. */
export function arrive() {
  const a = engine.arrival;
  if (!a) return;
  guardCall?.kill();
  if (a.t === 'wipe' && !engine.reduced && els) {
    els.label.textContent = a.label || '';
    gsap.set(els.label, { opacity: 1 });
    v.wipe = 1;
    render();
    engine.revealBase = 420;
    gsap.to(v, {
      wipe: 2,
      duration: 0.45,
      ease: 'rfIo',
      delay: 0.15,
      onUpdate: render,
      onComplete: () => {
        v.wipe = 0;
        render();
        engine.busy = false;
      },
    });
    gsap.delayedCall(1.4, () => (engine.revealBase = 0));
  } else if (a.t === 'fade' || a.t === 'wipe') {
    v.fade = 1;
    render();
    gsap.to(v, {
      fade: 0,
      duration: 0.1,
      ease: 'rfOut',
      delay: 0.02,
      onUpdate: render,
      onComplete: () => (engine.busy = false),
    });
  } else if (a.t === 'project') {
    // The overlay is exactly the page header's frame; remove it once the real header has painted under it.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.35,
          ease: 'rfOut',
          onComplete: () => {
            cleanupOverlay();
            engine.busy = false;
            engine.navHidden = false;
          },
        });
      }),
    );
  }
  gsap.delayedCall(2, () => (engine.arrival = null));
}
