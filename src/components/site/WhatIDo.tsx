import { Fragment } from 'react';
import type { Copy } from '@/content/copy';
import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { MediaItem } from '@/lib/data';
import css from './WhatIDo.module.css';

type Props = { intro: string; services: { name: string; short: string; img: MediaItem | null }[] };

export function WhatIDo({ copy: c, intro, services }: Props & { copy: Copy }) {
  return (
    <>
      <section className={css.section1} id="what-i-do">
        <div className={css.div1}>
          <div className={css.div2}>
            <h2 className={css.h21} data-rv="lines">
              <span className={css.span1}>
                <span className={css.span2} data-line="">
                  {c['home.whatLine1']}
                </span>
              </span>
              <span className={css.span3}>
                <span className={css.span2} data-line="">
                  {c['home.whatLine2']}
                </span>
              </span>
            </h2>
            <div className={css.div3} data-rv="up">
              <p className={css.p1}>{intro}</p>
              <TLink className={css.a1} data-go="Services" href="/services">
                {c['home.exploreServices']}
              </TLink>
            </div>
          </div>
          <div className={css.div4}>
            {services.map((s, i_) => (
              <Fragment key={i_}>
                <TLink
                  className={css.a2}
                  data-go="Services"
                  data-fcard=""
                  data-cursor="View"
                  data-rv="up"
                  href="/services"
                >
                  <div className={css.div5}>
                    {s.img && (
                      <Img
                        className={css.img1}
                        data-card-cover=""
                        m={s.img}
                        sizes="(max-width: 820px) 96px, 176px"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className={css.div6}>
                    <h3 className={css.h31}>{s.name}</h3>
                    <p className={css.p2}>{s.short}</p>
                  </div>
                </TLink>
              </Fragment>
            ))}
          </div>
          <div className={css.div7}>
            <TLink className={css.a3} data-go="Services" href="/services">
              {c['home.exploreServices']}
            </TLink>
          </div>
        </div>
      </section>
    </>
  );
}
