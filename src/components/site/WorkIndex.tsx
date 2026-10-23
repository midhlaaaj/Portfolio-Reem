'use client';

import type { Copy } from '@/content/copy';
import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { ProjectCard } from '@/lib/data';
import css from './WorkIndex.module.css';

gsap.registerPlugin(Flip, useGSAP);

type Props = { projects: ProjectCard[]; categories: string[] };

export function WorkIndex({ copy: c, projects, categories }: Props & { copy: Copy }) {
  const [cat, setCat] = useState('All');
  const root = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const pillReady = useRef(false);
  const ALL = c['work.all'];
  const tabs = [ALL, ...categories];

  const visible = projects.filter((p) => cat === 'All' || p.cats.includes(cat));
  const visibleIds = new Set(visible.map((p) => p.id));
  const offsetIds = new Set(visible.filter((_, i) => i % 2 === 1).map((p) => p.id));

  const choose = (next: string) => {
    if (next === cat) return;
    // Record where every visible card is now, then let React apply the filter and Flip them to the new layout.
    flipState.current = Flip.getState(root.current!.querySelectorAll('[data-wcard]:not([hidden])'));
    setCat(next);
  };

  const placePill = (instant: boolean) => {
    const el = root.current;
    const pill = el?.querySelector<HTMLElement>('[data-pill]');
    const btn = el?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(cat)}"]`);
    if (!pill || !btn) return;
    if (instant) pill.style.transition = 'none';
    pill.style.width = `${btn.offsetWidth}px`;
    pill.style.transform = `translate3d(${btn.offsetLeft}px,${btn.offsetTop}px,0)`;
    if (instant) {
      void pill.offsetWidth;
      pill.style.transition = '';
    }
  };

  // Pill follows the active tab. First paint and resizes are instant, tab changes animate (CSS transition).
  useLayoutEffect(() => {
    placePill(!pillReady.current);
    pillReady.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);
  useLayoutEffect(() => {
    const re = () => placePill(true);
    addEventListener('resize', re);
    document.fonts?.ready.then(re);
    return () => removeEventListener('resize', re);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  useGSAP(
    () => {
      const state = flipState.current;
      flipState.current = null;
      if (!state || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      Flip.from(state, {
        duration: 0.65,
        ease: 'expo.out',
        targets: root.current!.querySelectorAll('[data-wcard]:not([hidden])'),
        onEnter: (els) =>
          gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.65, ease: 'expo.out' }),
      });
    },
    { scope: root, dependencies: [cat] },
  );

  return (
    <div ref={root} style={{ display: 'contents' }}>
      <section className={css.section1}>
        <div className={css.div1}>
          <h1 className={css.h11} data-rv="lines" data-rv-dur="900">
            <span className={css.span1}>
              <span className={css.span2} data-line="">
                {c['work.title']}
              </span>
            </span>
          </h1>
          <span className={css.span3} data-rv="up" data-rv-delay="350">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
        <p className={css.p1} data-rv="up" data-rv-delay="200">
          {c['work.intro']}
        </p>
        <div className={css.div2} data-rv="up" data-rv-delay="300">
          <div className={css.div3} role="toolbar" aria-label="Filter projects">
            <span className={css.span4} data-pill="" aria-hidden="true"></span>
            {tabs.map((name) => (
              <button
                key={name}
                className={css.button1}
                type="button"
                data-tab={name}
                onClick={() => choose(name)}
                aria-pressed={name === cat}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className={css.section2}>
        <div className={css.div4} data-wgrid="" data-single={visible.length < 2}>
          {projects.map((p) => (
            <div
              key={p.id}
              className={css.div5}
              data-wcard=""
              data-slug={p.slug}
              data-offset={offsetIds.has(p.id)}
              hidden={!visibleIds.has(p.id)}
            >
              <TLink
                className={css.a1}
                data-project=""
                data-fcard=""
                data-cursor="View"
                data-label={p.title}
                href={`/work/${p.slug}`}
              >
                <div className={css.div6} data-rv="clip">
                  <div className={css.div7} data-card-tab="">
                    {p.tab}
                  </div>
                  <div className={css.div8}>
                    <div className={css.div9} aria-hidden="true"></div>
                    <div className={css.div10}>
                      <div className={css.div11} data-rv-in="">
                        {p.cover && (
                          <Img
                            className={css.img1}
                            data-card-cover=""
                            m={p.cover}
                            sizes="(max-width: 820px) 92vw, 46vw"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className={css.div12} aria-hidden="true"></div>
                      <div className={css.div13}>
                        <h2 className={css.h21}>{p.title}</h2>
                        <p className={css.p2}>{p.client}</p>
                        <div className={css.div14}>
                          <span className={css.span5}>
                            <span className={css.span6} aria-hidden="true"></span>
                            {c['home.viewProject']}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TLink>
            </div>
          ))}
        </div>
        {visible.length === 0 && <p className={css.p3}>{c['work.empty']}</p>}
      </section>
    </div>
  );
}
