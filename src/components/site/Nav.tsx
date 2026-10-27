'use client';

import type { Copy } from '@/content/copy';
import { usePathname } from 'next/navigation';
import { TLink } from '@/components/motion/TLink';
import css from './Nav.module.css';

const LINKS = [
  { href: '/work', label: 'Work', match: (p: string) => p.startsWith('/work') },
  { href: '/services', label: 'Services', match: (p: string) => p.startsWith('/services') },
  { href: '/about', label: 'About', match: (p: string) => p.startsWith('/about') },
] as const;

const DESKTOP_LINKS = [{ href: '/', label: 'Home', match: (p: string) => p === '/' }, ...LINKS] as const;

type Props = { email: string; phone: string; whatsapp: string };

export function Nav({ copy: c, email, phone, whatsapp }: Props & { copy: Copy }) {
  const pathname = usePathname();
  return (
    <>
      <header className={css.header1} data-nav="">
        <div className={css.div1} data-nav-bg="" aria-hidden="true"></div>
        <nav className={css.nav1} aria-label="Main">
          <TLink
            className={css.a1}
            data-brand=""
            data-go="Home"
            data-nav-brand=""
            aria-label="Reem Fathima, home"
            href="/"
          >
            <span className={css.span1}>Reem Fathima</span>
          </TLink>
          <div className={css.div2}>
            {DESKTOP_LINKS.map((l) => (
              <TLink
                key={l.href}
                className={css.a2}
                data-go={l.label}
                href={l.href}
                aria-current={l.match(pathname) ? 'page' : undefined}
              >
                {l.match(pathname) && <span className={css.span2} aria-hidden="true"></span>}
                <span className={css.span3}>
                  <span className={css.span4}>
                    <span className={css.span5}>{l.label}</span>
                    <span className={css.span6} aria-hidden="true">
                      {l.label}
                    </span>
                  </span>
                </span>
              </TLink>
            ))}
            <TLink className={css.a3} data-go="Contact" href="/contact">
              {c['nav.start']}
            </TLink>
          </div>
          <button
            className={css.button1}
            type="button"
            data-menu-toggle=""
            aria-haspopup="dialog"
            aria-label={c['nav.menu']}
          >
            <svg className={css.icon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </nav>
      </header>
      <div className={css.div3} data-menu="" role="dialog" aria-modal="true" aria-label="Menu">
        <div className={css.div4}>
          <span className={css.span7}>Reem Fathima</span>
          <button className={css.button2} type="button" data-menu-toggle="" aria-label={c['nav.close']}>
            <svg className={css.icon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className={css.nav2} aria-label="Menu">
          <TLink
            className={pathname === '/' ? css.a5 : css.a4}
            data-go="Home"
            href="/"
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <span className={css.span8} data-menu-line="">
              {c['nav.home']}
            </span>
          </TLink>
          {LINKS.map((l) => (
            <TLink
              key={l.href}
              className={l.match(pathname) ? css.a5 : css.a4}
              data-go={l.label}
              href={l.href}
              aria-current={l.match(pathname) ? 'page' : undefined}
            >
              <span className={css.span8} data-menu-line="">
                {l.label}
              </span>
            </TLink>
          ))}
          <TLink
            className={pathname.startsWith('/contact') ? css.a5 : css.a4}
            data-go="Contact"
            href="/contact"
            aria-current={pathname.startsWith('/contact') ? 'page' : undefined}
          >
            <span className={css.span8} data-menu-line="">
              {c['nav.contact']}
            </span>
          </TLink>
        </nav>
        <div className={css.div5}>
          <a className={css.a6} href={`mailto:${email}`}>
            {email}
          </a>
          <a className={css.a6} target="_blank" rel="noopener" href={`https://wa.me/${whatsapp}`}>
            WhatsApp {phone}
          </a>
        </div>
      </div>
    </>
  );
}
