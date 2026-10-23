import type { SiteSettings } from '@/lib/content';
import type { Copy } from '@/content/copy';
import { TLink } from '@/components/motion/TLink';
import css from './Footer.module.css';

type Props = {
  settings: Pick<SiteSettings, 'email' | 'phone' | 'whatsapp' | 'instagram' | 'behance' | 'linkedin'>;
  cta?: boolean;
  ctaCopy?: { line1: string; line2: string; text: string };
};

export function Footer({ copy: c, settings: s, cta = true, ctaCopy }: Props & { copy: Copy }) {
  const tel = `tel:${s.phone.replace(/[^+0-9]/g, '')}`;
  return (
    <>
      <div className={css.div1}>
        {cta && (
          <>
            <section className={css.section1} data-light-zone="">
              <div className={css.div2} data-light="" data-light-x="0.72" data-light-y="0.55" aria-hidden="true"></div>
              <div className={css.div3}>
                <h2 className={css.h21} data-rv="lines">
                  <span className={css.span1}>
                    <span className={css.span2} data-line="">
                      {ctaCopy?.line1}
                    </span>
                  </span>
                  <span className={css.span3}>
                    <span className={css.span2} data-line="">
                      {ctaCopy?.line2}
                    </span>
                  </span>
                </h2>
                <div className={css.div4} data-rv="up">
                  <p className={css.p1}>{ctaCopy?.text}</p>
                  <TLink className={css.a1} data-go="Contact" href="/contact">
                    Start a project
                  </TLink>
                </div>
              </div>
            </section>
          </>
        )}
        <footer className={css.footer1}>
          <div className={css.div5} data-rv="up" data-rv-y="80">
            <div className={css.div6}>{c['footer.tab']}</div>
            <div className={css.div7}>
              <div className={css.div8} aria-hidden="true"></div>
              <div className={css.div9} data-grain="" aria-hidden="true"></div>
              <div className={css.div10}>
                <div className={css.div11}>
                  <div className={css.div12}>
                    <span className={css.span4}>{c['footer.emailMe']}</span>
                    <a className={css.a2} href={`mailto:${s.email}`}>
                      {s.email}
                    </a>
                    <a className={css.a3} href={tel}>
                      {s.phone}
                    </a>
                  </div>
                  <div className={css.div13}>
                    <div className={css.div14}>
                      <span className={css.span4}>{c['footer.elsewhere']}</span>
                      <div className={css.div15}>
                        <a className={css.a4} target="_blank" rel="noopener" href={`https://wa.me/${s.whatsapp}`}>
                          WhatsApp
                        </a>
                        {s.instagram && (
                          <>
                            <a className={css.a4} target="_blank" rel="noopener" href={s.instagram}>
                              Instagram
                            </a>
                          </>
                        )}
                        {s.behance && (
                          <>
                            <a className={css.a4} target="_blank" rel="noopener" href={s.behance}>
                              Behance
                            </a>
                          </>
                        )}
                        {s.linkedin && (
                          <>
                            <a className={css.a4} target="_blank" rel="noopener" href={s.linkedin}>
                              LinkedIn
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={css.div14}>
                      <span className={css.span4}>{c['footer.pages']}</span>
                      <div className={css.div15}>
                        <TLink className={css.a4} data-go="Work" href="/work">
                          {c['nav.work']}
                        </TLink>
                        <TLink className={css.a4} data-go="Services" href="/services">
                          {c['nav.services']}
                        </TLink>
                        <TLink className={css.a4} data-go="About" href="/about">
                          {c['nav.about']}
                        </TLink>
                        <TLink className={css.a4} data-go="Contact" href="/contact">
                          {c['nav.contact']}
                        </TLink>
                        <TLink className={css.a4} data-go="Privacy" href="/privacy">
                          {c['footer.privacy']}
                        </TLink>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={css.div16}>
                  <span>© {new Date().getFullYear()} Reem Fathima</span>
                  <button className={css.button1} type="button" data-top="">
                    {c['footer.top']}
                  </button>
                </div>
              </div>
              <div className={css.div17} aria-hidden="true">
                Reem Fathima
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
