'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from './gsap';
import { engine, readEnv } from './engine';
import { cursor } from './features/cards';
import { lightboxApi } from './features/lightbox-api';
import { registerWipe } from './transitions';
import css from './Overlays.module.css';

/** Red folder that wipes up over the page between routes, plus the reduced-motion cross-fade cover. */
export function Wipe() {
  const wipe = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  useEffect(() => {
    registerWipe({ wipe: wipe.current!, label: label.current!, fade: fade.current! });
    return () => registerWipe(null);
  }, []);
  return (
    <>
      <div ref={wipe} className={css.wipe} aria-hidden="true">
        <div className={css.wipeTab} />
        <div className={css.wipeBody} />
        <div className={css.wipeGrainA} data-grain="" />
        <div className={css.wipeGrainB} data-grain="" />
        <div ref={label} className={css.wipeLabel} />
      </div>
      <div ref={fade} className={css.fade} aria-hidden="true" />
    </>
  );
}

/** The red dot that follows the mouse and grows into a label (View, Open, Drag, Play). Desktop only. */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // Child effects run before MotionRoot's, so detect the device here rather than rely on its setup.
    readEnv();
    if (!engine.cursorOn) return;
    const pos = { x: 0, y: 0 };
    cursor.register({
      setLabel(l) {
        dot.current!.style.transform = l ? 'scale(1)' : 'scale(.1389)';
        if (l) text.current!.textContent = l;
        text.current!.style.opacity = l ? '1' : '0';
      },
    });
    const frame = (_n: number, _dt: number, L: (k: number) => number) => {
      const p = engine.p;
      const el = root.current;
      if (!el) return;
      if (p.seen) {
        if (!pos.x && !pos.y) {
          pos.x = p.x;
          pos.y = p.y;
        }
        pos.x += (p.x - pos.x) * L(0.18);
        pos.y += (p.y - pos.y) * L(0.18);
        el.style.transform = `translate3d(${pos.x.toFixed(1)}px,${pos.y.toFixed(1)}px,0)`;
      }
      el.style.opacity = p.seen && !p.out ? '1' : '0';
    };
    engine.hooks.add(frame);
    return () => {
      engine.hooks.delete(frame);
      cursor.register(null);
    };
  }, []);
  return (
    <div ref={root} className={css.cursor} aria-hidden="true">
      <div ref={dot} className={css.cursorDot} />
      <span ref={text} className={css.cursorLabel} />
    </div>
  );
}

/** Full-screen image viewer for the project galleries. Opens from the clicked thumbnail, arrows and Escape work. */
export function Lightbox() {
  const root = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<{ items: HTMLElement[]; i: number; open: boolean }>({
    items: [],
    i: 0,
    open: false,
  });
  const trigger = useRef<HTMLElement | null>(null);
  const from = useRef<DOMRect | null>(null);

  useEffect(() => {
    lightboxApi.open = (tr) => {
      const group = tr.closest('[data-lb-group]') ?? document;
      const items = Array.from(group.querySelectorAll<HTMLElement>('[data-lb]')).filter((x) => x.querySelector('img'));
      if (!items.length) return;
      trigger.current = tr;
      from.current = tr.querySelector('img')!.getBoundingClientRect();
      cursor.setLightbox(true);
      engine.lenis?.stop();
      setState({ items, i: Math.max(0, items.indexOf(tr)), open: true });
    };
    return () => {
      lightboxApi.open = null;
    };
  }, []);

  const step = (d: number) => setState((s) => ({ ...s, i: (s.i + d + s.items.length) % s.items.length }));
  const dismiss = () => {
    setState((s) => ({ ...s, open: false }));
    cursor.setLightbox(false);
    engine.lenis?.start();
    trigger.current?.focus({ preventScroll: true });
  };

  // Show the current image; the first one flies in from the thumbnail, later ones cross-fade.
  const first = useRef(true);
  useEffect(() => {
    if (!state.open) {
      first.current = true;
      return;
    }
    const holder = state.items[state.i];
    const src = holder?.querySelector('img');
    const el = img.current;
    if (!holder || !src || !el) return;
    // Full-size file when the markup provides one, otherwise whatever the thumbnail resolved to.
    el.src = holder.dataset.lbSrc || src.currentSrc || src.src;
    el.alt = src.alt || '';
    const run = () => {
      if (engine.reduced) return;
      if (!first.current) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.32, ease: 'rfOut' });
        return;
      }
      const a = from.current;
      const r = el.getBoundingClientRect();
      if (!a || !r.width) return;
      gsap.fromTo(
        el,
        {
          x: a.left + a.width / 2 - (r.left + r.width / 2),
          y: a.top + a.height / 2 - (r.top + r.height / 2),
          scale: a.width / r.width,
        },
        { x: 0, y: 0, scale: 1, duration: 0.65, ease: 'rfOut', clearProps: 'transform' },
      );
    };
    const go = () => {
      run();
      first.current = false;
    };
    if (el.complete && el.naturalWidth) go();
    else
      el.onload = () => {
        el.onload = null;
        go();
      };
  }, [state]);

  useEffect(() => {
    if (state.open) close.current?.focus({ preventScroll: true });
  }, [state.open]);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.open]);

  // Swipe to change image on touch.
  const sx = useRef<number | null>(null);

  return (
    <div
      ref={root}
      className={css.lightbox}
      style={state.open ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto' } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      aria-hidden={!state.open}
      onPointerDown={(e) => (sx.current = e.clientX)}
      onPointerUp={(e) => {
        if (sx.current === null) return;
        const d = e.clientX - sx.current;
        sx.current = null;
        if (Math.abs(d) > 50 && e.pointerType !== 'mouse') step(d < 0 ? 1 : -1);
      }}
      onClick={(e) => e.target === root.current && dismiss()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} className={css.lightboxImg} alt="" />
      <button ref={close} type="button" className={`${css.lbButton} ${css.lbClose}`} onClick={dismiss}>
        Close
      </button>
      <div className={css.lbBar}>
        <button type="button" className={css.lbButton} onClick={() => step(-1)}>
          Previous
        </button>
        <span className={css.lbCount}>{state.items.length ? `${state.i + 1} / ${state.items.length}` : ''}</span>
        <button type="button" className={css.lbButton} onClick={() => step(1)}>
          Next
        </button>
      </div>
    </div>
  );
}
