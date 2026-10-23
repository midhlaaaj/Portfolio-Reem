import { Fragment } from 'react';
import type { Copy } from '@/content/copy';
import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { ProjectCard } from '@/lib/data';
import css from './SelectedWork.module.css';

/** Tab positions along the folder edge, from the design. */
const TAB_LEFT = ['4%', '30%', '52%', '72%'];

export function SelectedWork({ copy: c, projects, title }: { projects: ProjectCard[]; title: string; copy: Copy }) {
  return (
    <>
      <section className={css.section1}>
        <div className={css.div1}>
          <h2 className={css.h21} data-rv="lines">
            <span className={css.span1}>
              <span className={css.span2} data-line="">
                {title}
              </span>
            </span>
          </h2>
          <div className={css.div2} data-rv="up">
            <TLink className={css.a1} data-go="Work" href="/work">
              {c['home.seeAllWork']}
            </TLink>
          </div>
        </div>
        <div className={css.div3} data-stack="">
          {projects.map((f, i_) => (
            <Fragment key={f.id}>
              <div
                className={css.div4}
                style={{ top: `calc(13vh + ${i_ * 22}px)`, marginBottom: i_ < projects.length - 1 ? '12vh' : '0px' }}
                data-card=""
              >
                <TLink
                  className={css.a2}
                  data-project=""
                  data-fcard=""
                  data-cursor="View"
                  data-label={f.title}
                  href={`/work/${f.slug}`}
                >
                  <div className={css.div5} style={{ left: TAB_LEFT[i_] ?? '4%' }} data-card-tab="">
                    {f.tab}
                    <div className={css.div6} data-shade=""></div>
                  </div>
                  <div className={css.div7} aria-hidden="true"></div>
                  <div className={css.div8}>
                    {f.cover && (
                      <Img
                        className={css.img1}
                        data-card-cover=""
                        m={f.cover}
                        sizes="(max-width: 1440px) 92vw, 1312px"
                        loading="lazy"
                      />
                    )}
                    <div className={css.div9} aria-hidden="true"></div>
                    <div className={css.div10}>
                      <div className={css.div11}>
                        <h3 className={css.h31}>{f.title}</h3>
                        <p className={css.p1}>{f.client}</p>
                        <div className={css.div12}>
                          <span className={css.span3}>
                            <span className={css.span4} aria-hidden="true"></span>
                            {c['home.viewProject']}
                          </span>
                        </div>
                      </div>
                      <p className={css.p2}>{f.scope}</p>
                    </div>
                    <div className={css.div13} data-shade=""></div>
                  </div>
                </TLink>
              </div>
            </Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
