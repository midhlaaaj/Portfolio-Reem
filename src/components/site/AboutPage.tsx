import type { Copy } from '@/content/copy';
import { Img } from '@/components/ui/Img';
import type { MediaItem } from '@/lib/data';
import css from './AboutPage.module.css';

export type AboutView = {
  portrait: MediaItem | null;
  lead: string;
  story: string;
  toolsDesign: string[];
  toolsAI: string[];
  role: string;
  years: string;
  expText: string;
  cvUrl: string;
  cvName: string;
};

export function AboutPage({ ab, copy: c }: { ab: AboutView; copy: Copy }) {
  return (
    <>
      <section className={css.section1}>
        <div className={css.div1}>
          <div className={css.div2} data-rv="clip">
            <div className={css.div3} data-rv-in="">
              {ab.portrait && (
                <Img className={css.img1} m={ab.portrait} sizes="(max-width: 820px) 92vw, 560px" priority />
              )}
            </div>
            <div className={css.div4} aria-hidden="true"></div>
            <div className={css.div5} aria-hidden="true"></div>
            <div className={css.div6} data-grain="" aria-hidden="true"></div>
          </div>
          <div className={css.div7}>
            <h1 className={css.h11} data-rv="lines" data-rv-delay="200" data-rv-dur="900">
              <span className={css.span1}>
                <span className={css.span2} data-line="">
                  {c['about.title']}
                </span>
              </span>
            </h1>
            <p className={css.p1} data-rv="up" data-rv-delay="350">
              {ab.lead}
            </p>
            <p className={css.p2} data-rv="up" data-rv-delay="420">
              {ab.story}
            </p>
          </div>
        </div>
      </section>
      <section className={css.section2}>
        <h2 className={css.h21} data-rv="lines">
          <span className={css.span3}>
            <span className={css.span2} data-line="">
              {c['about.tools']}
            </span>
          </span>
        </h2>
        <div className={css.div8}>
          <div className={css.div9} data-rv="up">
            <h3 className={css.h31}>{c['about.toolsDesign']}</h3>
            <ul className={css.ul1}>
              {ab.toolsDesign.map((t) => (
                <li key={t} className={css.li1}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className={css.div9} data-rv="up">
            <h3 className={css.h31}>{c['about.toolsAI']}</h3>
            <ul className={css.ul2}>
              {ab.toolsAI.map((t) => (
                <li key={t} className={css.li1}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className={css.section2}>
        <h2 className={css.h21} data-rv="lines">
          <span className={css.span3}>
            <span className={css.span2} data-line="">
              {c['about.experience']}
            </span>
          </span>
        </h2>
        <div className={css.div10} data-rv="up">
          <div className={css.div11}>
            <h3 className={css.h32}>{ab.role}</h3>
            <span className={css.span4}>{ab.years}</span>
          </div>
          <p className={css.p3}>{ab.expText}</p>
        </div>
        <div className={css.div12} data-rv="up">
          {ab.cvUrl && (
            <>
              <a className={css.a1} download={ab.cvName || 'Reem-Fathima-CV.pdf'} href={ab.cvUrl}>
                {c['about.downloadCv']}
              </a>
            </>
          )}
        </div>
      </section>
    </>
  );
}
