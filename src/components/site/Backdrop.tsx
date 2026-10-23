import css from './Backdrop.module.css';

export type BackdropVariant = 'home' | 'glow' | 'contact' | 'plain';

/** The fixed dark-red wash behind each page. Home, Work, Services, About and Contact each use a slightly different one. */
export function Backdrop({ variant }: { variant: BackdropVariant }) {
  return <div className={`${css.backdrop} ${css[variant]}`} aria-hidden="true" />;
}
