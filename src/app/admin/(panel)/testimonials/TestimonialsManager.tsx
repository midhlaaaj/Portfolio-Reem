'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import type { AdminTestimonial } from '@/lib/admin/queries';
import type { MediaRecord } from '@/lib/admin/schemas';
import { deleteTestimonial, reorderTestimonials, saveTestimonial, toggleTestimonial } from '../../_actions/content';
import { useAdmin } from '../../_components/AdminProvider';
import { SortableList, SortableRow } from '../../_components/Sortable';
import { Switch, cx } from '../../_components/ui';
import css from '../../admin.module.css';

type Draft = {
  id: string | null;
  quote: string;
  name: string;
  role: string;
  business: string;
  photo: MediaRecord | null;
  visible: boolean;
};

const EMPTY: Draft = { id: null, quote: '', name: '', role: '', business: '', photo: null, visible: true };

export function TestimonialsManager({ initial }: { initial: AdminTestimonial[] }) {
  const router = useRouter();
  const { toast, confirm, pickImages } = useAdmin();
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<{ quote?: string; name?: string }>({});
  const [pending, startTransition] = useTransition();
  useEffect(() => setRows(initial), [initial]);

  const open = (t: AdminTestimonial | null) => {
    setErrors({});
    setDraft(
      t
        ? {
            id: t.id,
            quote: t.quote,
            name: t.name,
            role: t.role,
            business: t.business,
            photo: t.photo,
            visible: t.visible,
          }
        : EMPTY,
    );
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDraft(null);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const set = (patch: Partial<Draft>) => {
    setDraft((d) => d && { ...d, ...patch });
    setErrors((e) => ({
      ...e,
      ...('quote' in patch ? { quote: undefined } : {}),
      ...('name' in patch || 'business' in patch ? { name: undefined } : {}),
    }));
  };

  const save = () => {
    if (!draft) return;
    startTransition(async () => {
      const res = await saveTestimonial({
        id: draft.id,
        quote: draft.quote,
        name: draft.name,
        role: draft.role,
        business: draft.business,
        photoId: draft.photo?.id ?? null,
        visible: draft.visible,
      });
      if (!res.ok) {
        setErrors({ quote: res.fieldErrors?.quote, name: res.fieldErrors?.name });
        return;
      }
      setDraft(null);
      toast('Testimonial saved.');
      router.refresh();
    });
  };

  const reorder = (ids: string[]) => {
    const byId = new Map(rows.map((r) => [r.id, r]));
    setRows(ids.map((id) => byId.get(id)!));
    startTransition(async () => {
      const res = await reorderTestimonials(ids);
      if (res.ok) toast('Order saved.');
    });
  };

  const toggle = (t: AdminTestimonial) => {
    setRows((r) => r.map((x) => (x.id === t.id ? { ...x, visible: !x.visible } : x)));
    startTransition(async () => {
      await toggleTestimonial(t.id);
      toast(t.visible ? 'Hidden from the site.' : 'Showing on the site.');
    });
  };

  const del = async (t: AdminTestimonial) => {
    const ok = await confirm({
      title: 'Delete this testimonial?',
      text: "This can't be undone.",
      label: 'Delete testimonial',
    });
    if (!ok) return;
    await deleteTestimonial(t.id);
    toast('Testimonial deleted.');
    router.refresh();
  };

  const pickPhoto = async () => {
    const res = await pickImages({ multi: false, selected: [draft?.photo?.id ?? null] });
    if (res) set({ photo: res[0] ?? null });
  };

  const isNew = !draft?.id;
  return (
    <div className={cx(css.page, css.medium)}>
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Testimonials</h1>
          <p className={css.sub}>Visible quotes rotate on Home in this order. Drag to reorder.</p>
        </div>
        <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={() => open(null)}>
          Add testimonial
        </button>
      </div>

      {rows.length === 0 && (
        <p
          className={css.listCard}
          style={{ margin: 0, padding: 24, font: '400 15px/1.5 var(--font-body)', color: 'rgba(244,242,239,0.7)' }}
        >
          No testimonials yet. Add one to show it on Home.
        </p>
      )}

      <div className={css.tList}>
        <SortableList ids={rows.map((r) => r.id)} onReorder={reorder}>
          {rows.map((t) => (
            <SortableRow
              key={t.id}
              id={t.id}
              handleLabel="Reorder testimonial. Use arrow keys to move."
              className={css.tRow}
            >
              {(handle) => (
                <>
                  {handle}
                  <div className={css.tAvatar}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {t.photo ? (
                      <img src={t.photo.src} alt="" />
                    ) : (
                      <span>{(t.business || t.name || '?').trim().charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className={css.tBody}>
                    <p className={css.tQuote}>{t.quote.length > 140 ? `${t.quote.slice(0, 137)}...` : t.quote}</p>
                    <span className={css.tWho}>{[t.name, t.role, t.business].filter(Boolean).join(', ')}</span>
                  </div>
                  <div className={css.tActions}>
                    <Switch
                      checked={t.visible}
                      onChange={() => toggle(t)}
                      label={`Show testimonial from ${t.business || t.name}`}
                    />
                    <span className={css.tStatus}>{t.visible ? 'Visible' : 'Hidden'}</span>
                    <button type="button" className={cx(css.btn, css.btnXs)} onClick={() => open(t)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                      onClick={() => void del(t)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </SortableRow>
          ))}
        </SortableList>
      </div>

      <div className={cx(css.backdrop, draft && css.backdropOpen)} onClick={() => setDraft(null)} />
      <aside
        role="dialog"
        aria-label={isNew ? 'Add testimonial' : 'Edit testimonial'}
        className={cx(css.drawer, draft && css.drawerOpen)}
      >
        <div className={css.drawerHead}>
          <h2 className={css.dialogH2}>{isNew ? 'Add testimonial' : 'Edit testimonial'}</h2>
          <button type="button" className={cx(css.btn, css.btnXs)} onClick={() => setDraft(null)}>
            Close
          </button>
        </div>
        {draft && (
          <>
            <label className={css.stackLabel}>
              Quote
              <textarea
                rows={5}
                className={cx(css.textarea, errors.quote && css.invalid)}
                value={draft.quote}
                onChange={(e) => set({ quote: e.target.value })}
              />
            </label>
            {errors.quote && (
              <p className={css.err} role="alert" style={{ marginTop: -8 }}>
                {errors.quote}
              </p>
            )}
            <label className={css.stackLabel}>
              Name
              <input className={css.input} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </label>
            <label className={css.stackLabel}>
              Role
              <input className={css.input} value={draft.role} onChange={(e) => set({ role: e.target.value })} />
            </label>
            <label className={css.stackLabel}>
              Business
              <input className={css.input} value={draft.business} onChange={(e) => set({ business: e.target.value })} />
            </label>
            {errors.name && (
              <p className={css.err} role="alert" style={{ marginTop: -8 }}>
                {errors.name}
              </p>
            )}
            <div className={css.imgRow} style={{ alignItems: 'center' }}>
              <div
                className={css.tAvatar}
                style={{
                  width: 56,
                  height: 56,
                  flexBasis: 56,
                  background: 'var(--surface-deep)',
                  border: '1px solid rgba(244,242,239,0.1)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {draft.photo && <img src={draft.photo.src} alt="" />}
              </div>
              <button
                type="button"
                className={cx(css.btn, css.btnXs)}
                style={{ height: 38, fontSize: 14 }}
                onClick={() => void pickPhoto()}
              >
                Choose photo
              </button>
              {draft.photo && (
                <button
                  type="button"
                  className={cx(css.btn, css.btnXs, css.btnQuiet)}
                  style={{ height: 38, fontSize: 14 }}
                  onClick={() => set({ photo: null })}
                >
                  Remove
                </button>
              )}
            </div>
            <div className={cx(css.switchRow, css.featRow)}>
              <span id="te-vis" className={css.label}>
                Show on the site
              </span>
              <Switch checked={draft.visible} labelledBy="te-vis" onChange={() => set({ visible: !draft.visible })} />
            </div>
            <button
              type="button"
              className={cx(css.btn, css.btnPrimary, css.drawerSave)}
              onClick={save}
              disabled={pending}
            >
              Save testimonial
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
