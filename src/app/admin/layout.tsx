import type { Metadata } from 'next';
import css from './admin.module.css';

export const metadata: Metadata = {
  title: { absolute: 'Admin, Reem Fathima' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={css.root}>{children}</div>;
}
