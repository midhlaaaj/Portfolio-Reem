'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { addCategory, deleteCategory, renameCategory } from '../../_actions/content';
import { useAdmin } from '../../_components/AdminProvider';
import { cx } from '../../_components/ui';
import css from '../../admin.module.css';

type Row = { id: string; name: string; slug: string; count: number };

export function CategoriesManager({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const { toast, confirm } = useAdmin();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addCategory(name);
      if (!res.ok) {
        setError(res.error ?? 'That could not be added.');
        return;
      }
      setName('');
      setError('');
      toast('Category added.');
      router.refresh();
    });
  };

  const saveRename = (e: FormEvent) => {
    e.preventDefault();
    if (!renaming) return;
    startTransition(async () => {
      const res = await renameCategory(renaming.id, renaming.name);
      if (!res.ok) {
        toast(res.error ?? 'That could not be renamed.', 'error');
        return;
      }
      setRenaming(null);
      toast('Category renamed.');
      router.refresh();
    });
  };

  const del = async (c: Row) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      text: c.count
        ? `${c.count} ${c.count === 1 ? 'project uses' : 'projects use'} this category. Deleting it removes it from them. This can't be undone.`
        : "No projects use this category. This can't be undone.",
      label: 'Delete category',
    });
    if (!ok) return;
    await deleteCategory(c.id);
    toast('Category deleted.');
    router.refresh();
  };

  return (
    <div className={cx(css.page, css.narrow)}>
      <div className={css.headText}>
        <h1 className={css.h1}>Categories</h1>
        <p className={css.sub}>These become the filter tabs on the Work page.</p>
      </div>

      <form className={css.field} style={{ gap: 8 }} noValidate onSubmit={add}>
        <label className={css.label} htmlFor="cat-new">
          New category
        </label>
        <div className={css.inlineForm}>
          <input
            id="cat-new"
            className={css.input}
            placeholder="Packaging"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
          <button type="submit" className={cx(css.btn, css.btnPrimary)} style={{ height: 44 }} disabled={pending}>
            Add category
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
            No categories yet. Add one above.
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
                    {c.count} {c.count === 1 ? 'project' : 'projects'}
                  </span>
                  <div className={css.chips} style={{ gap: 6 }}>
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
                </>
              )}
              {isRenaming && (
                <form className={css.renForm} noValidate onSubmit={saveRename}>
                  <input
                    aria-label="Category name"
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
