import { TLink } from '@/components/motion/TLink';
import type { Copy } from '@/content/copy';
import { Img } from '@/components/ui/Img';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import type { MediaItem, ProjectCard, ProjectFull } from '@/lib/data';
import { splitTitle } from '@/lib/text';
import css from './ProjectPage.module.css';

const ratio = (m: MediaItem) => (m.w && m.h ? m.w / m.h : 1.5);
const label = (m: MediaItem) => `Open ${m.alt || 'image'}`;

export function ProjectPage({
  copy: c,
  project: p,
  next,
}: {
  project: ProjectFull;
  next: ProjectCard | null;
  copy: Copy;
}) {
  return (
    <>
      <header className={css.header1} data-pheader="" data-rv="clip">
        <div className={css.div1} data-rv-in="">
          {p.cover && <Img className={css.img1} m={p.cover} sizes="100vw" priority />}
        </div>
        <div className={css.div2} aria-hidden="true"></div>
      </header>

      <section className={css.section1}>
        <h1 className={css.h11} data-rv="lines" data-rv-delay="120" data-rv-dur="900">
          {splitTitle(p.title).map((line) => (
            <span key={line} className={css.span1}>
              <span className={css.span2} data-line="">
                {line}
              </span>
            </span>
          ))}
        </h1>
        <div className={css.div3} data-rv="up">
          <div className={css.div4}>
            <span className={css.span3}>{c['project.client']}</span>
            <span className={css.span4}>{p.client}</span>
          </div>
          <div className={css.div4}>
            <span className={css.span3}>{c['project.scope']}</span>
            <span className={css.span4}>{p.scope || c['project.confirm']}</span>
          </div>
          <div className={css.div4}>
            <span className={css.span3}>{c['project.year']}</span>
            <span className={css.span4}>{p.year || c['project.confirm']}</span>
          </div>
        </div>
        <p className={css.p1} data-rv="up">
          {p.overview}
        </p>
      </section>

      {p.sections.map((s) => {
        const imgs = s.media;
        const isStrip = s.type === 'strip' && imgs.length > 0;
        return (
          <section key={s.id} className={css.section2} data-lb-group="" aria-label={s.title || 'Section'}>
            {!isStrip && (
              <div className={css.div5} data-rv="up">
                <h2 className={css.h21}>{s.title}</h2>
                <p className={css.p2}>{s.text}</p>
              </div>
            )}

            {s.type === 'full' &&
              imgs.map((im) => (
                <div
                  key={im.id}
                  className={css.div6}
                  style={{ aspectRatio: ratio(im) }}
                  data-lb=""
                  data-lb-src={im.full}
                  data-cursor="View"
                  role="button"
                  tabIndex={0}
                  aria-label={label(im)}
                  data-rv="clip"
                >
                  <div className={css.div1} data-rv-in="">
                    <Img className={css.img1} m={im} sizes="100vw" loading="lazy" />
                  </div>
                </div>
              ))}

            {(s.type === 'grid' || (s.type === 'strip' && !isStrip)) && imgs.length > 0 && (
              <div
                className={css.div7}
                style={{ maxWidth: imgs.length === 1 && imgs[0].w && imgs[0].w < 1000 ? '1040px' : '1440px' }}
              >
                <div className={css.div8}>
                  {imgs.map((im) => {
                    const ar = ratio(im).toFixed(3);
                    return (
                      <div
                        key={im.id}
                        className={css.div9}
                        style={{ flex: `${ar} 1 calc(${ar} * clamp(150px, 18vw, 260px))` }}
                        data-lb=""
                        data-lb-src={im.full}
                        data-cursor="View"
                        role="button"
                        tabIndex={0}
                        aria-label={label(im)}
                        data-rv="clip"
                      >
                        <div className={css.div10} style={{ aspectRatio: ratio(im) }}>
                          <div className={css.div11} data-rv-in="">
                            <Img className={css.img1} m={im} sizes="(max-width: 820px) 92vw, 40vw" loading="lazy" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isStrip && (
              <div className={css.div12} data-hpin="">
                <div className={css.div13} data-hpin-stage="">
                  <div className={css.div14}>
                    <h2 className={css.h21}>{s.title}</h2>
                    <p className={css.p2}>{s.text}</p>
                  </div>
                  <div className={css.div15} data-hpin-track="">
                    {imgs.map((im) => (
                      <div
                        key={im.id}
                        className={css.div16}
                        data-lb=""
                        data-lb-src={im.full}
                        data-cursor="View"
                        role="button"
                        tabIndex={0}
                        aria-label={label(im)}
                      >
                        <Img className={css.img1} m={im} sizes="360px" draggable={false} loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <div className={css.div17}>
                    <div className={css.div18}>
                      <div className={css.div19} data-hpin-bar=""></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {s.type === 'video' && (
              <div className={css.div20}>
                <div className={css.div21} data-cursor="Play" data-rv="clip">
                  <div className={css.div1} data-rv-in="">
                    {s.videoUrl && (
                      <VideoPlayer
                        className={css.img1}
                        src={s.videoUrl}
                        poster={imgs[0]?.src}
                        label={s.title || 'Video'}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {next && (
        <section className={css.section3}>
          <span className={css.span5} data-rv="up">
            {c['project.next']}
          </span>
          <TLink
            className={css.a1}
            data-project=""
            data-fcard=""
            data-lift=""
            data-cursor="Open"
            data-label={next.title}
            aria-label={`Next project: ${next.title}`}
            href={`/work/${next.slug}`}
          >
            <div className={css.div22} data-card-tab="">
              {next.tab}
            </div>
            <div className={css.div23}>
              <div className={css.div24} aria-hidden="true"></div>
              <div className={css.div25}>
                {next.cover && (
                  <Img
                    className={css.img2}
                    data-card-cover=""
                    m={next.cover}
                    sizes="(max-width: 1440px) 92vw, 1312px"
                    loading="lazy"
                  />
                )}
                <div className={css.div26} aria-hidden="true"></div>
                <div className={css.div27}>
                  <h2 className={css.h22}>{next.title}</h2>
                  <p className={css.p3}>{next.client}</p>
                </div>
              </div>
            </div>
          </TLink>
        </section>
      )}
    </>
  );
}
