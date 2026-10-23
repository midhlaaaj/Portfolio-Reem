import { TLink } from '@/components/motion/TLink';
import type { Copy } from '@/content/copy';
import css from './NotFoundPage.module.css';

export function NotFoundPage({ copy: c }: { copy: Copy }) {
  return (
    <>
      <section className={css.section1} data-light-zone="">
        <div className={css.div1} data-light="" data-light-pull="0.5" aria-hidden="true"></div>
        <div className={css.div2} data-rv="up" data-rv-y="90">
          <div className={css.div3} data-tilt="">
            <div className={css.div4}>
              <span className={css.span1}>{c['notfound.tab']}</span>
            </div>
            <div className={css.div5} aria-hidden="true"></div>
            <div className={css.div6}>
              <div className={css.div7} data-spec="" aria-hidden="true"></div>
              <div className={css.div8} data-grain="" aria-hidden="true"></div>
            </div>
          </div>
        </div>
        <div className={css.div9}>
          <h1 className={css.h11} data-rv="lines" data-rv-delay="250">
            <span className={css.span2}>
              <span className={css.span3} data-line="">
                {c['notfound.line1']}
              </span>
            </span>
            <span className={css.span2}>
              <span className={css.span3} data-line="">
                {c['notfound.line2']}
              </span>
            </span>
          </h1>
          <div className={css.div10} data-rv="up" data-rv-delay="400">
            <TLink className={css.a1} data-go="Work" href="/work">
              {c['notfound.back']}
            </TLink>
          </div>
        </div>
      </section>
    </>
  );
}
