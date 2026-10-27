import { ScrollTrigger } from '../gsap';
import { clamp, engine, jumpToY } from '../engine';

/**
 * Horizontal strips that scroll sideways while the page scrolls down: a sticky stage inside a tall section, the
 * track translated by scroll progress, with a progress bar. Under reduced motion
 * the stage becomes an ordinary horizontally scrollable row.
 */
export function setupHpins(root: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];

  root.querySelectorAll<HTMLElement>('[data-hpin]').forEach((section) => {
    const stage = section.querySelector<HTMLElement>('[data-hpin-stage]');
    const track = section.querySelector<HTMLElement>('[data-hpin-track]');
    const bar = section.querySelector<HTMLElement>('[data-hpin-bar]');
    if (!stage || !track) return;

    if (engine.reduced) {
      Object.assign(stage.style, { position: 'relative', height: 'auto', overflowX: 'auto', padding: '8px 0' });
      section.style.height = '';
      return;
    }

    const s = { dist: 0, progress: 0, visible: false };
    const layout = () => {
      stage.style.height = CSS.supports('height', '100svh') ? '100svh' : '100vh';
      s.dist = Math.max(0, track.offsetWidth - stage.clientWidth);
      section.style.height = `${stage.offsetHeight + s.dist}px`;
    };
    layout();

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${s.dist}`,
      invalidateOnRefresh: true,
      onRefreshInit: layout,
      onUpdate: (self) => {
        s.progress = self.progress;
      },
    });

    const io = new IntersectionObserver(([e]) => (s.visible = e.isIntersecting), { rootMargin: '50px' });
    io.observe(section);

    const frame = () => {
      if (!s.visible || !s.dist) return;
      const x = -clamp(s.progress, 0, 1) * s.dist;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (bar) bar.style.transform = `scaleX(${s.progress.toFixed(4)})`;
    };
    engine.hooks.add(frame);

    // Fonts and images settle after first paint and change the track width.
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 300);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 1200);

    const onScroll = () => {
      if (stage.scrollLeft) stage.scrollLeft = 0;
    };
    // Tabbing to an item scrolls the page so the item slides into view.
    const onFocus = (ev: FocusEvent) => {
      if (!s.dist) return;
      const item = (ev.target as Element).closest('[data-hpin-track] > *') as HTMLElement | null;
      if (!item) return;
      stage.scrollLeft = 0;
      const x = clamp(item.offsetLeft - (stage.clientWidth - item.offsetWidth) / 2, 0, s.dist);
      jumpToY(section.getBoundingClientRect().top + scrollY + x);
    };
    stage.addEventListener('scroll', onScroll);
    stage.addEventListener('focusin', onFocus);

    cleanups.push(() => {
      st.kill();
      io.disconnect();
      engine.hooks.delete(frame);
      clearTimeout(t1);
      clearTimeout(t2);
      stage.removeEventListener('scroll', onScroll);
      stage.removeEventListener('focusin', onFocus);
      track.style.transform = '';
      section.style.height = '';
      stage.style.height = '';
    });
  });

  return () => cleanups.forEach((c) => c());
}
