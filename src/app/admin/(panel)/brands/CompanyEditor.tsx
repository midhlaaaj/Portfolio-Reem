'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { adminCompany } from '@/lib/admin/queries';
import type { CompanyDetailsInput, MediaRecord } from '@/lib/admin/schemas';
import { saveCompany } from '../../_actions/content';
import { useAdmin, useDirty } from '../../_components/AdminProvider';
import { ErrLine, cx } from '../../_components/ui';
import css from '../../admin.module.css';

type Data = NonNullable<Awaited<ReturnType<typeof adminCompany>>>;

export function CompanyEditor({ data }: { data: Data }) {
  const router = useRouter();
  const { toast, pickImages, go } = useAdmin();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<CompanyDetailsInput>(data.input);
  const [v, setV] = useState<CompanyDetailsInput>(data.input);
  const [media, setMedia] = useState<Record<string, MediaRecord>>(data.media);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);

  useDirty(dirty);

  const set = <K extends keyof CompanyDetailsInput>(k: K, val: CompanyDetailsInput[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const chooseCover = async () => {
    const res = await pickImages({ multi: false, selected: [v.coverId], ratio: 16 / 9 });
    if (!res) return;
    setMedia((m) => ({ ...m, ...Object.fromEntries(res.map((r) => [r.id, r])) }));
    set('coverId', res[0]?.id ?? null);
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveCompany(v);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast(res.error ?? 'Check the fields marked in red.', 'error');
        return;
      }
      setSaved(v);
      toast('Brand saved.');
      router.refresh();
    });

  const newProject = `/admin/projects/new?client=${encodeURIComponent(saved.name)}`;

  return (
    <div className={cx(css.page, css.narrow)}>
      <div className={css.pageHead}>
        <div className={css.headText}>
          <button type="button" className={cx(css.btn, css.btnBack)} onClick={() => void go('/admin/brands')}>
            All brands
          </button>
          <h1 className={css.h1}>{v.name || 'Brand'}</h1>
          <p className={css.sub}>
            Shown on the brand page. Images from its projects are added there automatically.
          </p>
        </div>
        <div className={css.actions}>
          <button type="button" className={css.btn} onClick={() => void go(newProject)}>
            New project
          </button>
          <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={save} disabled={pending || !dirty}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <section className={css.card}>
        <h2 className={css.cardTitle}>Details</h2>
        <div className={css.field}>
          <label className={css.label} htmlFor="co-name">
            Name
          </label>
          <input
            id="co-name"
            className={cx(css.input, errors.name && css.invalid)}
            value={v.name}
            onChange={(e) => set('name', e.target.value)}
          />
          <ErrLine>{errors.name}</ErrLine>
        </div>
        <div className={css.field}>
          <label className={css.label} htmlFor="co-kind">
            What you did for them
          </label>
          <input
            id="co-kind"
            className={css.input}
            placeholder="Brand identity and packaging"
            value={v.kind}
            onChange={(e) => set('kind', e.target.value)}
          />
        </div>
        <div className={css.field}>
          <label className={css.label} htmlFor="co-desc">
            About the brand
          </label>
          <textarea
            id="co-desc"
            rows={5}
            className={css.textarea}
            value={v.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div className={css.field}>
          <label className={css.label} htmlFor="co-web">
            Website
          </label>
          <input
            id="co-web"
            className={cx(css.input, errors.website && css.invalid)}
            placeholder="https://"
            value={v.website}
            onChange={(e) => set('website', e.target.value)}
          />
          <ErrLine>{errors.website}</ErrLine>
        </div>
      </section>

      <section className={cx(css.card, css.cardTight)} style={{ gap: 16 }}>
        <h2 className={css.cardTitle}>Cover image</h2>
        <div className={css.coverRow}>
          <div className={css.coverThumb}>
            {v.coverId && media[v.coverId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media[v.coverId].src} alt="" />
            ) : (
              <span className={css.coverNone}>No cover yet</span>
            )}
          </div>
          <div className={css.stack}>
            <p className={css.cardNote} style={{ maxWidth: '30em' }}>
              The wide header of the brand page. Without one, the cover of its first project is used.
            </p>
            <div className={css.chips}>
              <button type="button" className={cx(css.btn, css.btnSm)} onClick={() => void chooseCover()}>
                Choose image
              </button>
              {v.coverId && (
                <button
                  type="button"
                  className={cx(css.btn, css.btnSm, css.btnQuiet)}
                  onClick={() => set('coverId', null)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={cx(css.card, css.cardTight)} style={{ gap: 12 }}>
        <h2 className={css.cardTitle}>Projects</h2>
        {data.projects.length === 0 && <p className={css.cardNote}>No projects for this brand yet.</p>}
        <div className={css.chips}>
          {data.projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.id}`} className={cx(css.btn, css.btnXs)}>
              {p.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
