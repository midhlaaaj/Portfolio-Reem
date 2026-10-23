import { Fragment } from 'react';
import type { Copy } from '@/content/copy';
import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { MediaItem } from '@/lib/data';
import css from './ServicesPage.module.css';

export type ServiceView = {
  id: string;
  name: string;
  desc: string;
  deliverables: string[];
  price: string;
  project: { slug: string; title: string; image: MediaItem | null } | null;
};

type Props = {
  intro: string;
  pricingOn: boolean;
  items: ServiceView[];
  steps: { title: string; text: string }[];
};

export function ServicesPage({ copy: c, intro, pricingOn, items, steps }: Props & { copy: Copy }) {
  return (
    <>
      <section className={css.section1}>
        <div className={css.div1}>
          <h1 className={css.h11} data-rv="lines" data-rv-dur="900">
            <span className={css.span1}>
              <span className={css.span2} data-line="">
                {c['services.title']}
              </span>
            </span>
          </h1>
          <p className={css.p1} data-rv="up" data-rv-delay="250">
            {intro}
          </p>
        </div>
      </section>
      <section className={css.section2}>
        {items.map((it) => (
          <Fragment key={it.id}>
            <article className={css.article1} id={it.id}>
              <div className={css.div2}>
                <h2 className={css.h21} data-rv="lines">
                  <span className={css.span3}>
                    <span className={css.span2} data-line="">
                      {it.name}
                    </span>
                  </span>
                </h2>
                <p className={css.p2} data-rv="up">
                  {it.desc}
                </p>
                {pricingOn && it.price && (
                  <>
                    <p className={css.p3} data-rv="up">
                      {it.price}
                    </p>
                  </>
                )}
              </div>
              <div className={css.div3} data-rv="up">
                <div className={css.div4}>
                  <span className={css.span4}>{c['services.deliverables']}</span>
                  <ul className={css.ul1}>
                    {it.deliverables.map((d) => (
                      <li key={d} className={css.li1}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                {it.project && (
                  <>
                    <TLink
                      className={css.a1}
                      data-project=""
                      data-fcard=""
                      data-cursor="View"
                      data-label={it.project.title}
                      href={`/work/${it.project.slug}`}
                    >
                      <div className={css.div5}>
                        {it.project.image && (
                          <Img
                            className={css.img1}
                            data-card-cover=""
                            m={it.project.image}
                            sizes="(max-width: 820px) 92vw, 30vw"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <span className={css.span5}>{c['services.featured']}</span>
                      <span className={css.span6}>{it.project.title}</span>
                    </TLink>
                  </>
                )}
                {!it.project && (
                  <>
                    <div className={css.div4}></div>
                  </>
                )}
              </div>
            </article>
          </Fragment>
        ))}
        <div className={css.div6} aria-hidden="true"></div>
      </section>
      <section className={css.section3}>
        <div className={css.div7}>
          <div className={css.div8}>
            <h2 className={css.h22} data-rv="lines">
              <span className={css.span7}>
                <span className={css.span2} data-line="">
                  {c['services.howLine1']}
                </span>
              </span>
              <span className={css.span3}>
                <span className={css.span2} data-line="">
                  {c['services.howLine2']}
                </span>
              </span>
            </h2>
            <p className={css.p4} data-rv="up">
              {['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][steps.length - 1] ??
                steps.length}{' '}
              {steps.length === 1 ? 'step' : 'steps'} from first message to final files.
            </p>
          </div>
          <div className={css.div9}>
            <div className={css.div10} aria-hidden="true">
              <div className={css.div11} data-scrub=""></div>
            </div>
            <ol className={css.ol1}>
              {steps.map((p, i_) => (
                <Fragment key={p.title}>
                  <li className={css.li2} data-rv="up">
                    <span className={css.span8} aria-hidden="true"></span>
                    <span className={css.span9}>{String(i_ + 1).padStart(2, '0')}</span>
                    <h3 className={css.h31}>{p.title}</h3>
                    <p className={css.p5}>{p.text}</p>
                  </li>
                </Fragment>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
