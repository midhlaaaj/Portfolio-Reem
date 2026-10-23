import { getCopy, getHome, getSettings } from '@/lib/data';
import { Backdrop, type BackdropVariant } from './Backdrop';
import { Footer } from './Footer';

type Props = {
  backdrop: BackdropVariant | null;
  /** 'cta' shows the "Got something to launch?" band above the footer, 'plain' only the footer. */
  footer?: 'cta' | 'plain';
  children: React.ReactNode;
};

export async function PageFrame({ backdrop, footer = 'cta', children }: Props) {
  const [settings, home, copy] = await Promise.all([getSettings(), getHome(), getCopy()]);
  return (
    <>
      {backdrop && <Backdrop variant={backdrop} />}
      <main id="main">{children}</main>
      <Footer
        copy={copy}
        settings={settings}
        cta={footer === 'cta'}
        ctaCopy={{ line1: home.ctaLine1, line2: home.ctaLine2, text: home.ctaText }}
      />
    </>
  );
}
