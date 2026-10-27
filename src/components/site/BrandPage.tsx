import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { CompanyPage } from '@/lib/data';
import css from './BrandPage.module.css';
import pcss from './ProjectPage.module.css';
import wcss from './WorkIndex.module.css';

/** The company header and details, then its images as the project pages' pinned strip, then its project cards. */
export function BrandPage({ company: c }: { company: CompanyPage }) {
  const host = c.website ? c.website.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';
  return (
    <>
      <header className={css.header} data-rv="clip">
        <div className={css.cover} data-rv-in="">
          {c.cover && <Img className={css.img} m={c.cover} sizes="100vw" priority />}
        </div>
        <div className={css.shade} aria-hidden="true"></div>
      </header>

      <section className={css.intro}>
        <h1 className={css.title} data-rv="lines" data-rv-dur="900">
          <span className={css.titleMask}>
            <span className={css.titleLine} data-line="">
              {c.name}
            </span>
          </span>
        </h1>
        <div className={css.meta} data-rv="up" data-rv-delay="250">
          {c.kind && <span className={css.kind}>{c.kind}</span>}
          <span className={css.count}>
            {c.projects.length} {c.projects.length === 1 ? 'project' : 'projects'}
          </span>
          {host && (
            <a className={css.site} href={c.website} target="_blank" rel="noopener noreferrer">
              {host}
            </a>
          )}
        </div>
        {c.description && (
          <p className={css.about} data-rv="up" data-rv-delay="350">
            {c.description}
          </p>
        )}
      </section>

      {c.showcase.length > 0 && (
        <section className={pcss.section2} data-lb-group="" aria-label={`Images from ${c.name} projects`}>
          <div className={pcss.div12} data-hpin="">
            <div className={pcss.div13} data-hpin-stage="">
              <div className={pcss.div14}>
                <h2 className={pcss.h21}>Selected images</h2>
                <p className={pcss.p2}>A look inside the projects designed for {c.name}.</p>
              </div>
              <div className={pcss.div15} data-hpin-track="">
                {c.showcase.map((im) => (
                  <div
                    key={im.id}
                    className={pcss.div16}
                    data-lb=""
                    data-lb-src={im.full}
                    data-cursor="View"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${im.alt || c.name}`}
                  >
                    <Img className={pcss.img1} m={im} sizes="360px" draggable={false} loading="lazy" />
                  </div>
                ))}
              </div>
              <div className={pcss.div17}>
                <div className={pcss.div18}>
                  <div className={pcss.div19} data-hpin-bar=""></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {c.projects.length > 0 && (
        <section className={wcss.section2}>
          <div className={wcss.div4} data-wgrid="" data-single={c.projects.length < 2}>
            {c.projects.map((p, i) => (
              <div key={p.id} className={wcss.div5} data-wcard="" data-slug={p.slug} data-offset={i % 2 === 1}>
                <TLink
                  className={wcss.a1}
                  data-project=""
                  data-fcard=""
                  data-cursor="View"
                  data-label={p.title}
                  href={`/work/${p.slug}`}
                >
                  <div className={wcss.div6} data-rv="clip">
                    <div className={wcss.div7} data-card-tab="">
                      {p.tab}
                    </div>
                    <div className={wcss.div8}>
                      <div className={wcss.div9} aria-hidden="true"></div>
                      <div className={wcss.div10}>
                        <div className={wcss.div11} data-rv-in="">
                          {p.cover && (
                            <Img
                              className={wcss.img1}
                              data-card-cover=""
                              m={p.cover}
                              sizes="(max-width: 820px) 92vw, 46vw"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <div className={wcss.div12} aria-hidden="true"></div>
                        <div className={wcss.div13}>
                          <h2 className={wcss.h21}>{p.title}</h2>
                          <p className={wcss.p2}>{p.client}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TLink>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
