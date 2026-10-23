'use client';

import { useState } from 'react';
import css from './Testimonials.module.css';

export type Quote = { id: string; quote: string; who: string };

export function Testimonials({ quotes }: { quotes: Quote[] }) {
  const [index, setIndex] = useState(0);
  const n = quotes.length;
  if (!n) return null;
  const step = (d: number) => setIndex((i) => (i + d + n) % n);

  return (
    <section className={css.section1} aria-label="Testimonials">
      <div className={css.div1} data-rv="up">
        <span className={css.span1} aria-hidden="true">
          “
        </span>
        <div className={css.div2}>
          {quotes.map((t, i) => (
            <figure
              key={t.id}
              className={css.figure1}
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <blockquote className={css.blockquote1}>{t.quote}</blockquote>
              <figcaption className={css.figcaption1}>
                <span>{t.who}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {n > 1 && (
          <div className={css.div3}>
            <button className={css.button1} type="button" onClick={() => step(-1)} aria-label="Previous quote">
              Previous
            </button>
            <button className={css.button1} type="button" onClick={() => step(1)} aria-label="Next quote">
              Next
            </button>
            <span className={css.span2} data-qcount="" aria-live="polite">
              {index + 1} / {n}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
