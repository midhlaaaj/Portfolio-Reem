import { TLink } from '@/components/motion/TLink';
import type { Copy } from '@/content/copy';
import { Img } from '@/components/ui/Img';
import type { MediaItem } from '@/lib/data';
import css from './Hero.module.css';

type Props = {
  tagline: string;
  smallLine: string;
  spreadLines: [string, string];
  left: MediaItem | null;
  right: MediaItem | null;
  poster: MediaItem | null;
  /** Optional showreel file. Plays muted inside the middle paper once the folder has fully opened. */
  showreelUrl?: string;
};

const PAPER_SIZES = '(max-width: 820px) 60vw, 30vw';

export function Hero({
  copy: c,
  tagline,
  smallLine,
  spreadLines,
  left,
  right,
  poster,
  showreelUrl,
}: Props & { copy: Copy }) {
  return (
    <section className={css.section1} data-hero-wrap="">
      <div className={css.div1} data-stage="" data-light-zone="">
        <div
          className={css.div2}
          data-light=""
          data-hero-light=""
          data-light-x="0.5"
          data-light-y="0.47"
          data-light-pull="0.55"
          aria-hidden="true"
        ></div>
        <div className={css.div3} data-fold-anchor="">
          <div className={css.div4} data-fold-sink="">
            <div className={css.div5} data-fold-shadow="" aria-hidden="true"></div>
            <div className={css.div6} data-fold-intro="">
              <div
                className={css.div7}
                data-fold-tilt=""
                data-cursor="Open"
                role="button"
                tabIndex={0}
                aria-label="Open the folder"
              >
                <div className={css.div8} data-fold-tab=""></div>
                <div className={css.div9} data-fold-back="" aria-hidden="true"></div>
                <div className={css.div10} data-paper="l">
                  {left && <Img className={css.img1} m={left} sizes={PAPER_SIZES} quality={90} loading="eager" />}
                </div>
                <div className={css.div10} data-paper="r">
                  {right && <Img className={css.img2} m={right} sizes={PAPER_SIZES} quality={90} loading="eager" />}
                </div>
                <div className={css.div11} data-paper="m">
                  {poster && <Img className={css.img1} m={poster} sizes={PAPER_SIZES} quality={90} priority />}
                  {showreelUrl && (
                    <video
                      className={css.reel}
                      data-showreel=""
                      data-src={showreelUrl}
                      muted
                      loop
                      playsInline
                      preload="none"
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  )}
                </div>
                <div className={css.div12} data-fold-front="">
                  <div className={css.div13} data-spec="" aria-hidden="true"></div>
                  <div className={css.div14} aria-hidden="true"></div>
                  <div className={css.div15} data-grain="" aria-hidden="true"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={css.div16} data-hero-ui="">
          <p className={css.p1}>{tagline}</p>
          <p className={css.p2}>{smallLine}</p>
          <div className={css.div17}>
            <TLink className={css.a1} data-go="Work" href="/work">
              {c['home.viewWork']}
            </TLink>
            <TLink className={css.a2} data-go="Contact" href="/contact">
              {c['home.startProject']}
            </TLink>
          </div>
        </div>
        <h1 className={css.h11} data-hero-name="">
          <span className={css.span1}>
            <span className={css.span2} data-name-line="0">
              Reem
            </span>
          </span>
          <span className={css.span3}>
            <span className={css.span2} data-name-line="1">
              Fathima
            </span>
          </span>
        </h1>
        <div className={css.div18} data-spread-ui="">
          <div className={css.div19}>
            <div className={css.div20}>
              <h2 className={css.h21}>
                <span className={css.span1}>
                  <span className={css.span2} data-spread-line="">
                    {spreadLines[0]}
                  </span>
                </span>
                <span className={css.span4}>
                  <span className={css.span2} data-spread-line="">
                    {spreadLines[1]}
                  </span>
                </span>
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
