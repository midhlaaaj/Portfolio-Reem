'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { addCompany, deleteCompany, renameCompany } from '../../_actions/content';
import { useAdmin } from '../../_components/AdminProvider';
import { cx } from '../../_components/ui';
import css from '../../admin.module.css';

type Row = { id: string; name: string; slug: string; projects: { id: string; title: string; published: boolean }[] };

export function CompaniesManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const { toast, confirm } = useAdmin();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addCompany(name);
      if (!res.ok) {
        setError(res.error ?? 'That could not be added.');
        return;
      }
      setName('');
      setError('');
      toast('Brand added.');
      router.refresh();
    });
  };

  const saveRename = (e: FormEvent) => {
    e.preventDefault();
    if (!renaming) return;
    startTransition(async () => {
      const res = await renameCompany(renaming.id, renaming.name);
      if (!res.ok) {
        toast(res.error ?? 'That could not be renamed.', 'error');
        return;
      }
      setRenaming(null);
      toast('Brand renamed.');
      router.refresh();
    });
  };

  const del = async (c: Row) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      text: c.projects.length
        ? `This only removes ${c.name} from the list. Its ${c.projects.length === 1 ? 'project keeps' : 'projects keep'} the client name. This can't be undone.`
        : "No projects use this brand. This can't be undone.",
      label: 'Delete brand',
    });
    if (!ok) return;
    await deleteCompany(c.id);
    toast('Brand deleted.');
    router.refresh();
  };

  return (
    <div className={cx(css.page, css.narrow)}>
      <div className={css.headText}>
        <h1 className={css.h1}>Brands</h1>
        <p className={css.sub}>The brands you have worked with. Each project's brand is matched to one of these by name.</p>
      </div>

      <form className={css.field} style={{ gap: 8 }} noValidate onSubmit={add}>
        <label className={css.label} htmlFor="co-new">
          New brand
        </label>
        <div className={css.inlineForm}>
          <input
            id="co-new"
            className={css.input}
            placeholder="Acme Studios"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
          <button type="submit" className={cx(css.btn, css.btnPrimary)} style={{ height: 44 }} disabled={pending}>
            Add brand
          </button>
        </div>
        {error && (
          <p className={css.err} role="alert">
            {error}
          </p>
        )}
      </form>

      <div className={css.listCard}>
        {initial.length === 0 && (
          <p className={css.empty} style={{ padding: 24, fontSize: 15 }}>
            No brands yet. Add one above.
          </p>
        )}
        {initial.map((c) => {
          const isRenaming = renaming?.id === c.id;
          return (
            <div key={c.id} className={css.catRow}>
              {!isRenaming && (
                <>
                  <div className={css.catName}>
                    <span className={css.twoMain}>{c.name}</span>
                    <span className={css.rowTitleSub}>{c.slug}</span>
                  </div>
                  <span className={css.catCount}>
                    {c.projects.length} {c.projects.length === 1 ? 'project' : 'projects'}
                  </span>
                  <div className={css.chips} style={{ gap: 6 }}>
                    <Link href={`/admin/brands/${c.id}`} className={cx(css.btn, css.btnXs)}>
                      Details
                    </Link>
                    <Link
                      href={`/admin/projects/new?client=${encodeURIComponent(c.name)}`}
                      className={cx(css.btn, css.btnXs, css.btnPrimary)}
                    >
                      New project
                    </Link>
                    <button
                      type="button"
                      className={cx(css.btn, css.btnXs)}
                      onClick={() => setRenaming({ id: c.id, name: c.name })}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                      onClick={() => void del(c)}
                    >
                      Delete
                    </button>
                  </div>
                  {c.projects.length > 0 && (
                    <div className={css.chips} style={{ flex: '1 1 100%', gap: 6 }}>
                      {c.projects.map((p) => (
                        <Link key={p.id} href={`/admin/projects/${p.id}`} className={cx(css.btn, css.btnXs)}>
                          {p.title}
                          {p.published ? '' : ' (draft)'}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
              {isRenaming && (
                <form className={css.renForm} noValidate onSubmit={saveRename}>
                  <input
                    aria-label="Brand name"
                    className={css.input}
                    value={renaming.name}
                    onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className={cx(css.btn, css.btnPrimary, css.btnSm, css.btnXs)}
                    style={{ height: 40 }}
                    disabled={pending}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={cx(css.btn, css.btnSm, css.btnXs)}
                    style={{ height: 40 }}
                    onClick={() => setRenaming(null)}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
