import type { Copy } from '@/content/copy';
import css from './PrivacyPage.module.css';

export function PrivacyPage({ email, copy: c }: { email: string; copy: Copy }) {
  return (
    <>
      <div className={css.main1}>
        <h1 className={css.h11} data-rv="lines">
          <span className={css.span1}>
            <span className={css.span2} data-line="">
              {c['privacy.title']}
            </span>
          </span>
        </h1>
        <div className={css.div1}>
          <div className={css.div2}>
            <h2 className={css.h21}>{c['privacy.h1']}</h2>
            <p className={css.p1}>{c['privacy.p1']}</p>
          </div>
          <div className={css.div2}>
            <h2 className={css.h21}>{c['privacy.h2']}</h2>
            <p className={css.p1}>{c['privacy.p2']}</p>
          </div>
          <div className={css.div2}>
            <h2 className={css.h21}>{c['privacy.h3']}</h2>
            <p className={css.p1}>{c['privacy.p3']}</p>
          </div>
          <div className={css.div2}>
            <h2 className={css.h21}>{c['privacy.h4']}</h2>
            <p className={css.p1}>
              {c['privacy.p4a']}{' '}
              <a className={css.a1} href={`mailto:${email}`}>
                {email}
              </a>{' '}
              {c['privacy.p4b']}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
