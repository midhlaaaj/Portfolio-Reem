import { TLink } from '@/components/motion/TLink';
import { Img } from '@/components/ui/Img';
import type { MediaItem } from '@/lib/data';
import css from './Brands.module.css';

export type BrandCard = { slug: string; title: string; name: string; kind: string; image: MediaItem | null };

export function Brands({ title, brands }: { title: string; brands: BrandCard[] }) {
  return (
    <section className={css.section1} data-hpin="">
      <div className={css.div1} data-hpin-stage="">
        <div className={css.div2}>
          <h2 className={css.h21} data-rv="lines">
            <span className={css.span1}>
              <span className={css.span2} data-line="">
                {title}
              </span>
            </span>
          </h2>
        </div>
        <div className={css.div3} data-hpin-track="">
          {brands.map((b) => (
            <TLink
              key={b.slug}
              className={css.a1}
              data-project=""
              data-fcard=""
              data-cursor="View"
              data-label={b.title}
              href={`/work/${b.slug}`}
            >
              <div className={css.div4}>
                {b.image && (
                  <Img
                    className={css.img1}
                    data-card-cover=""
                    m={b.image}
                    sizes="(max-width: 820px) 250px, 380px"
                    draggable={false}
                    loading="lazy"
                  />
                )}
              </div>
              <div className={css.div5}>
                <span className={css.span3}>{b.name}</span>
                <span className={css.span4}>{b.kind}</span>
              </div>
            </TLink>
          ))}
        </div>
        <div className={css.div6}>
          <div className={css.div7}>
            <div className={css.div8} data-hpin-bar=""></div>
          </div>
        </div>
      </div>
    </section>
  );
}
