'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import type { AdminProjectRow } from '@/lib/admin/queries';
import { reorderProjects, toggleFeatured } from '../../_actions/projects';
import { useAdmin } from '../../_components/AdminProvider';
import { SortableList, SortableRow } from '../../_components/Sortable';
import { Switch, cx } from '../../_components/ui';
import { fmtDate } from '../../_components/fmt';
import css from '../../admin.module.css';

export function ProjectsTable({ initial }: { initial: AdminProjectRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const { toast, go } = useAdmin();
  const [, startTransition] = useTransition();
  useEffect(() => setRows(initial), [initial]);

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => !needle || `${r.title} ${r.client}`.toLowerCase().includes(needle));
  const published = rows.filter((r) => r.status === 'published').length;
  const canDrag = !needle;

  const reorder = (ids: string[]) => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    setRows(ids.map((id) => byId.get(id)!));
    startTransition(async () => {
      const res = await reorderProjects(ids);
      if (res.ok) toast('Order saved.');
      else {
        setRows(initial);
        toast('The new order could not be saved.', 'error');
      }
    });
  };

  const toggle = (id: string) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, featured: !x.featured } : x)));
    startTransition(async () => {
      const res = await toggleFeatured(id);
      if (!res.ok) {
        setRows(initial);
        toast(res.error ?? 'That could not be saved.', 'error');
        return;
      }
      toast(
        res.featured
          ? res.featuredCount > 4
            ? 'Featured. Home shows the first 4 featured projects.'
            : 'Featured on Home.'
          : 'Removed from Home.',
      );
    });
  };

  return (
    <div className={css.page}>
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Projects</h1>
          <p className={css.sub}>
            {rows.length} {rows.length === 1 ? 'project' : 'projects'}, {published} published
          </p>
        </div>
        <Link href="/admin/projects/new" className={cx(css.btn, css.btnPrimary)}>
          Add project
        </Link>
      </div>

      {rows.length > 0 && (
        <div className={css.toolbar}>
          <input
            type="search"
            aria-label="Search projects"
            placeholder="Search by title or client"
            className={css.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className={css.toolbarHint}>
            {canDrag
              ? 'Drag rows to change the order on the Work page. Focus a handle and use the arrow keys to move it.'
              : 'Clear the search to reorder projects.'}
          </span>
        </div>
      )}

      {rows.length === 0 && (
        <div className={css.emptyCard}>
          <p style={{ margin: 0, font: '500 17px/1.5 var(--font-body)', color: 'var(--paper)' }}>
            No projects yet. Add your first one to show it on the site.
          </p>
          <Link href="/admin/projects/new" className={cx(css.btn, css.btnPrimary)}>
            Add project
          </Link>
        </div>
      )}
      {rows.length > 0 && shown.length === 0 && (
        <p
          style={{
            margin: 0,
            padding: '24px 0',
            font: '500 16px/1.5 var(--font-body)',
            color: 'rgba(244,242,239,0.75)',
          }}
        >
          No projects match that search. Try a different title or client.
        </p>
      )}

      {shown.length > 0 && (
        <div className={css.table}>
          <div className={css.tableHead} aria-hidden="true">
            <span />
            <span />
            <span>Project</span>
            <span>Client</span>
            <span>Categories</span>
            <span>Featured</span>
            <span>Status</span>
            <span>Last edited</span>
          </div>
          <SortableList ids={rows.map((r) => r.id)} onReorder={reorder} disabled={!canDrag}>
            {shown.map((r) => {
              const live = r.status === 'published';
              return (
                <SortableRow
                  key={r.id}
                  id={r.id}
                  disabled={!canDrag}
                  handleLabel="Reorder project. Use arrow keys to move."
                  className={css.tableRow}
                >
                  {(handle) => (
                    <>
                      {handle}
                      <div className={css.thumb}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {r.thumb && <img src={r.thumb} alt="" />}
                      </div>
                      <Link
                        href={`/admin/projects/${r.id}`}
                        className={css.rowTitle}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                          e.preventDefault();
                          void go(`/admin/projects/${r.id}`);
                        }}
                      >
                        <span className={css.rowTitleMain}>{r.title || 'Untitled project'}</span>
                        <span className={css.rowTitleSub}>/work/{r.slug}</span>
                      </Link>
                      <span className={css.cell}>{r.client || 'No client yet'}</span>
                      <span className={css.cell} style={{ flex: '1.3 1 140px' }}>
                        {r.cats || 'None'}
                      </span>
                      <span className={css.cellFeat}>
                        <Switch
                          checked={r.featured}
                          onChange={() => toggle(r.id)}
                          label={`Feature ${r.title || 'project'} on Home`}
                        />
                      </span>
                      <span className={css.cellStatus}>
                        <span className={cx(css.statusDot, live && css.statusDotLive)} aria-hidden="true" />
                        {live ? 'Published' : 'Draft'}
                      </span>
                      <span className={css.cellEdited}>{fmtDate(r.updatedAt)}</span>
                    </>
                  )}
                </SortableRow>
              );
            })}
          </SortableList>
        </div>
      )}
    </div>
  );
}
