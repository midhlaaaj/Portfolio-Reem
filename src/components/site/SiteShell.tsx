import { MotionRoot } from '@/components/motion/MotionRoot';
import { getCopy, getSettings } from '@/lib/data';
import { Nav } from './Nav';
import css from './Shell.module.css';

/** The persistent frame around every public page: fixed nav, menu, motion engine. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [s, copy] = await Promise.all([getSettings(), getCopy()]);
  return (
    <div className={css.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav copy={copy} email={s.email} phone={s.phone} whatsapp={s.whatsapp} />
      <MotionRoot />
      <div className="rf-grain" data-grain="" aria-hidden="true" />
      {children}
    </div>
  );
}
