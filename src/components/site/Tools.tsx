'use client';

import { useEffect, useRef } from 'react';
import css from './Tools.module.css';

const SPEED = 40; // px per second

/** A row of tool pills that drifts on its own, loops forever, and can be dragged, swiped or wheel-scrolled. */
function Row({ tools, reverse, label }: { tools: string[]; reverse: boolean; label: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let paused = false;
    let resume = 0;
    let raf = 0;
    let last = performance.now();
    let pos = -1;
    const half = () => el.scrollWidth / 2;
    const wrap = () => {
      const h = half();
      if (el.scrollLeft >= h) el.scrollLeft -= h;
      else if (el.scrollLeft <= 0) el.scrollLeft += h;
    };
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (pos < 0) pos = reverse ? half() - 1 : 0;
      if (!paused) {
        // The position is kept as a float and never read back from scrollLeft (which rounds), so both rows
        // move at exactly SPEED px/s in either direction.
        const h = half();
        pos = (((pos + (reverse ? -1 : 1) * SPEED * dt) % h) + h) % h;
        el.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    const hold = () => {
      paused = true;
      clearTimeout(resume);
    };
    const release = (ms = 1800) => {
      clearTimeout(resume);
      resume = window.setTimeout(() => {
        pos = el.scrollLeft;
        paused = false;
      }, ms);
    };
    const onScroll = () => {
      wrap();
      if (paused) pos = el.scrollLeft;
    };
    const onWheel = () => {
      hold();
      release();
    };
    el.addEventListener('pointerenter', hold);
    el.addEventListener('pointerleave', () => release(300));
    let dragX: number | null = null;
    const down = (e: PointerEvent) => {
      hold();
      if (e.pointerType === 'mouse') dragX = e.clientX + el.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (dragX !== null) el.scrollLeft = dragX - e.clientX;
    };
    const up = () => {
      dragX = null;
      release();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    addEventListener('pointerup', up);
    el.addEventListener('touchstart', hold, { passive: true });
    el.addEventListener('touchend', () => release(), { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('scroll', onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resume);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      removeEventListener('pointerup', up);
    };
  }, [reverse]);

  // One copy has to be wider than the screen for the loop to wrap seamlessly, so short lists are repeated.
  const list = Array.from({ length: Math.max(1, Math.ceil(14 / tools.length)) }, () => tools).flat();
  const group = (hidden: boolean) => (
    <ul className={css.group} aria-hidden={hidden || undefined} style={{ margin: 0, listStyle: 'none', paddingLeft: 0 }}>
      {list.map((t, i) => (
        <li key={i} className={css.pill}>
          {t}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={css.marquee} ref={box} role="region" aria-label={label} data-rv="up">
      <div className={css.track}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

/** Two stacked rows of tool pills: design tools, then AI tools. */
export function Tools({ rows }: { rows: [string[], string[]] }) {
  const [design, ai] = rows;
  if (!design.length && !ai.length) return null;
  return (
    <section className={css.section}>
      {design.length > 0 && <Row tools={design} reverse={false} label="Design tools" />}
      {ai.length > 0 && <Row tools={ai} reverse label="AI tools" />}
    </section>
  );
}
