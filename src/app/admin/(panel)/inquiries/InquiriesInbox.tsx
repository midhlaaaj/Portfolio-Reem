'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { AdminInquiry } from '@/lib/admin/queries';
import { setInquiryStatus } from '../../_actions/content';
import { useAdmin } from '../../_components/AdminProvider';
import { Chip, cx } from '../../_components/ui';
import { fmtDate, fmtLong } from '../../_components/fmt';
import css from '../../admin.module.css';

const LABEL = { new: 'New', replied: 'Replied', archived: 'Archived' } as const;
type Filter = 'all' | keyof typeof LABEL;

export function InquiriesInbox({ initial }: { initial: AdminInquiry[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useAdmin();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(params.get('open'));
  const [, startTransition] = useTransition();
  useEffect(() => setRows(initial), [initial]);

  const count = (k: Filter) => (k === 'all' ? rows.length : rows.filter((q) => q.status === k).length);
  const shown = rows.filter((q) => filter === 'all' || q.status === filter);
  const sel = rows.find((q) => q.id === selected) ?? null;

  const setStatus = (id: string, status: AdminInquiry['status'], message: string) => {
    setRows((r) => r.map((q) => (q.id === id ? { ...q, status } : q)));
    startTransition(async () => {
      await setInquiryStatus(id, status);
      toast(message);
      router.refresh();
    });
  };

  const digits = (sel?.phone ?? '').replace(/\D/g, '');

  return (
    <div className={css.page}>
      <div className={css.headText}>
        <h1 className={css.h1}>Inquiries</h1>
        <p className={css.sub}>Messages sent from the contact form.</p>
      </div>

      <div role="tablist" aria-label="Filter inquiries" className={css.pageTabs}>
        {(['all', 'new', 'replied', 'archived'] as const).map((k) => (
          <Chip key={k} tab small on={filter === k} onClick={() => setFilter(k)}>
            {k === 'all' ? 'All' : LABEL[k]} {count(k)}
          </Chip>
        ))}
      </div>

      <div className={css.inqLayout}>
        <div className={cx(css.inqList, sel && css.hideMobile)}>
          {shown.length === 0 && (
            <p className={css.empty} style={{ padding: 24, fontSize: 15 }}>
              {rows.length
                ? 'Nothing here. Try another tab.'
                : 'No inquiries yet. Messages from the contact form show up here.'}
            </p>
          )}
          {shown.map((q) => (
            <button
              key={q.id}
              type="button"
              className={css.inqItem}
              aria-current={selected === q.id}
              onClick={() => setSelected(q.id)}
            >
              <span className={css.inqTop}>
                {q.status === 'new' && <span className={css.newDot} aria-hidden="true" />}
                <span className={css.inqName}>{q.name}</span>
                <span className={css.inqMeta}>{fmtDate(q.at)}</span>
              </span>
              <span className={css.inqSub}>
                {q.type || 'Not specified'}, {q.budget || 'No budget given'}
              </span>
              <span className={css.inqMeta}>{LABEL[q.status]}</span>
            </button>
          ))}
        </div>

        {!sel && <div className={cx(css.inqPlaceholder, css.hideMobile)}>Choose an inquiry to read it.</div>}

        {sel && (
          <article className={css.inqDetail}>
            <button
              type="button"
              className={cx(css.btn, css.btnBack, css.mobileOnly)}
              onClick={() => setSelected(null)}
            >
              All inquiries
            </button>
            <div className={css.inqHead}>
              <div className={css.two} style={{ gap: 6 }}>
                <h2 className={css.inqH2}>{sel.name}</h2>
                <span className={css.inqContact}>
                  {sel.email}, {sel.phone || 'Not given'}
                </span>
              </div>
              <span className={css.pill}>{LABEL[sel.status]}</span>
            </div>
            <dl className={css.dl}>
              <div>
                <dt>Project type</dt>
                <dd>{sel.type || 'Not specified'}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{sel.budget || 'Not given'}</dd>
              </div>
              <div>
                <dt>Timeline</dt>
                <dd>{sel.timeline || 'Not given'}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{fmtLong(sel.at)}</dd>
              </div>
            </dl>
            <p className={css.inqMessage}>{sel.message}</p>
            <div className={css.actions}>
              <a
                className={cx(css.btn, css.btnPrimary)}
                href={`mailto:${sel.email}?subject=${encodeURIComponent(`Your ${(sel.type || 'design').toLowerCase()} project`)}`}
              >
                Reply by email
              </a>
              {digits.length >= 10 && (
                <a className={css.btn} href={`https://wa.me/${digits}`} target="_blank" rel="noopener">
                  Open WhatsApp
                </a>
              )}
              {sel.status !== 'replied' && (
                <button
                  type="button"
                  className={css.btn}
                  onClick={() => setStatus(sel.id, 'replied', 'Marked as replied.')}
                >
                  Mark as replied
                </button>
              )}
              {sel.status !== 'archived' && (
                <button
                  type="button"
                  className={cx(css.btn, css.btnQuiet)}
                  onClick={() => setStatus(sel.id, 'archived', 'Archived.')}
                >
                  Archive
                </button>
              )}
              {sel.status !== 'new' && (
                <button
                  type="button"
                  className={cx(css.btn, css.btnQuiet)}
                  onClick={() => setStatus(sel.id, 'new', 'Moved back to New.')}
                >
                  Move to New
                </button>
              )}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
