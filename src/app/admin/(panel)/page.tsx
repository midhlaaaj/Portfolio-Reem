import Link from 'next/link';
import { adminDashboard } from '@/lib/admin/queries';
import { fmtDate } from '../_components/fmt';
import css from '../admin.module.css';

export default async function DashboardPage() {
  const d = await adminDashboard();
  return (
    <div className={`${css.page} ${css.pageWide}`}>
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Dashboard</h1>
          <p className={css.sub}>Welcome back, Reem. Everything you change here updates the live site.</p>
        </div>
        <div className={css.actions}>
          <Link href="/admin/inquiries" className={css.btn}>
            View inquiries
          </Link>
          <Link href="/admin/projects/new" className={`${css.btn} ${css.btnPrimary}`}>
            Add project
          </Link>
        </div>
      </div>

      <div className={css.cols}>
        <section className={css.card}>
          <div className={css.statRow}>
            <span className={css.statBig}>{d.newCount}</span>
            <span className={css.statLabel}>{d.newCount === 1 ? 'new inquiry' : 'new inquiries'}</span>
          </div>
          <div className={css.list}>
            {d.latest.map((q) => (
              <Link key={q.id} href={`/admin/inquiries?open=${q.id}`} className={css.listLink}>
                {q.isNew && <span className={css.newDot} aria-label="New" />}
                <span className={css.two}>
                  <span className={css.twoMain}>{q.name}</span>
                  <span className={css.twoSub}>{q.type || 'Not specified'}</span>
                </span>
                <span className={css.when}>{fmtDate(q.at)}</span>
              </Link>
            ))}
            {d.latest.length === 0 && (
              <p className={css.empty} style={{ marginTop: 14 }}>
                No inquiries yet. Messages from the contact form show up here.
              </p>
            )}
          </div>
        </section>

        <section className={css.card}>
          <h2 className={css.cardTitle}>Projects</h2>
          <div className={css.statTriple}>
            <div className={css.statCol}>
              <span className={css.statMid}>{d.published}</span>
              <span className={css.statName}>Published</span>
            </div>
            <div className={css.statCol}>
              <span className={css.statMid}>{d.drafts}</span>
              <span className={css.statName}>Drafts</span>
            </div>
            <div className={css.statCol}>
              <span className={css.statMid}>{d.onHome}</span>
              <span className={css.statName}>On Home</span>
            </div>
          </div>
          <div className={css.actions} style={{ marginTop: 'auto' }}>
            <Link href="/admin/projects" className={`${css.btn} ${css.btnSm}`}>
              Manage projects
            </Link>
            <Link href="/admin/media" className={`${css.btn} ${css.btnSm}`}>
              Upload images
            </Link>
          </div>
        </section>

        <section className={`${css.card} ${css.cardTight}`}>
          <h2 className={css.cardTitle}>Recent edits</h2>
          <ul className={css.activityList}>
            {d.activity.map((a) => (
              <li key={a.id} className={css.activityItem}>
                <span>{a.text}</span>
                <span className={css.when}>{fmtDate(a.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
