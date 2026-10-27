'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { logout } from '../_actions/auth';
import css from '../admin.module.css';
import { AdminProvider, useAdmin } from './AdminProvider';
import { cx } from './ui';

const NAV = [
  ['dashboard', 'Dashboard', '/admin'],
  ['projects', 'Projects', '/admin/projects'],
  ['brands', 'Brands', '/admin/brands'],
  ['categories', 'Categories', '/admin/categories'],
  ['testimonials', 'Testimonials', '/admin/testimonials'],
  ['pages', 'Pages', '/admin/pages'],
  ['inquiries', 'Inquiries', '/admin/inquiries'],
  ['media', 'Media', '/admin/media'],
  ['settings', 'Settings', '/admin/settings'],
] as const;

const CrumbContext = createContext<(title: string | null) => void>(() => {});
/** Lets the project editor put the project's title in the top bar breadcrumb. */
export function useCrumb(title: string | null) {
  const set = useContext(CrumbContext);
  useEffect(() => {
    set(title);
    return () => set(null);
  }, [title, set]);
}

function Frame({ newCount, email, children }: { newCount: number; email: string; children: ReactNode }) {
  const pathname = usePathname();
  const { go } = useAdmin();
  const [sheet, setSheet] = useState(false);
  const [acct, setAcct] = useState(false);
  const [crumb, setCrumb] = useState<string | null>(null);

  useEffect(() => {
    setSheet(false);
    setAcct(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSheet(false);
      setAcct(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const isActive = (key: string, href: string) =>
    key === 'dashboard' ? pathname === '/admin' : pathname.startsWith(href);
  const current = NAV.find(([k, , href]) => isActive(k, href));
  const label = current ? current[1] : 'Admin';
  const crumbText = crumb !== null ? `Projects / ${crumb || 'New project'}` : label;

  const navLinks = NAV.map(([key, text, href]) => {
    const active = isActive(key, href);
    return (
      <Link
        key={key}
        href={href}
        className={css.navBtn}
        aria-current={active ? 'page' : undefined}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          void go(href);
        }}
      >
        <span>{text}</span>
        {key === 'inquiries' && newCount > 0 && <span className={css.badge}>{newCount}</span>}
      </Link>
    );
  });

  return (
    <div className={css.shell}>
      <aside className={css.sidebar}>
        <div className={css.brandBox}>
          <span className={css.brandName}>Reem Fathima</span>
          <span className={css.brandSub}>Site admin</span>
        </div>
        <nav className={css.nav} aria-label="Admin">
          {navLinks}
        </nav>
      </aside>

      <div className={css.column}>
        <header className={css.topbar}>
          <span className={css.crumb}>{crumbText}</span>
          <div className={css.topRight}>
            <a className={css.viewSite} href="/" target="_blank" rel="noopener">
              View site
            </a>
            <button
              type="button"
              className={css.acctBtn}
              aria-expanded={acct}
              aria-label="Account menu"
              onClick={() => setAcct((a) => !a)}
            >
              <span className={css.avatar} aria-hidden="true">
                RF
              </span>
              Reem
            </button>
            {acct && (
              <div role="menu" className={css.acctMenu}>
                <span className={css.acctEmail}>{email}</span>
                <form action={logout}>
                  <button type="submit" role="menuitem" className={css.acctItem} style={{ width: '100%' }}>
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        <main className={css.content}>
          <CrumbContext.Provider value={setCrumb}>{children}</CrumbContext.Provider>
        </main>

        <div className={css.mobileBar}>
          <span className={css.mobileLabel}>{crumb !== null ? 'Project editor' : label}</span>
          <button type="button" className={css.mobileMenuBtn} onClick={() => setSheet(true)}>
            Menu
          </button>
        </div>
        <div className={cx(css.sheetBackdrop, sheet && css.sheetOpen)} onClick={() => setSheet(false)} />
        <div role="dialog" aria-label="Admin menu" className={cx(css.sheet, sheet && css.sheetOpen)}>
          <div className={css.sheetGrip} aria-hidden="true" />
          <nav className={css.sheetNav} aria-label="Admin">
            {navLinks}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function AdminShell(props: { newCount: number; email: string; children: ReactNode }) {
  return (
    <AdminProvider>
      <Frame {...props} />
    </AdminProvider>
  );
}
