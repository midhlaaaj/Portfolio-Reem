'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { AdminMediaItem } from '@/lib/admin/queries';
import { deleteMedia, updateMediaAlt } from '../../_actions/content';
import { useAdmin } from '../../_components/AdminProvider';
import { Chip, cx } from '../../_components/ui';
import css from '../../admin.module.css';

type Filter = 'all' | 'used' | 'unused';

export function MediaLibrary({ items }: { items: AdminMediaItem[] }) {
  const router = useRouter();
  const { toast, confirm, uploadFiles } = useAdmin();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [over, setOver] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; src: string; alt: string; err: string } | null>(
    null,
  );
  const file = useRef<HTMLInputElement>(null);

  const needle = q.trim().toLowerCase();
  const shown = items.filter(
    (m) =>
      (!needle || `${m.name} ${m.alt}`.toLowerCase().includes(needle)) &&
      (filter === 'all' || (filter === 'used' ? m.used.length > 0 : m.used.length === 0)),
  );

  const saveAlt = async () => {
    if (!editing) return;
    const res = await updateMediaAlt(editing.id, editing.alt);
    if (!res.ok) {
      setEditing({ ...editing, err: res.error ?? 'That could not be saved.' });
      return;
    }
    setEditing(null);
    toast('Alt text saved.');
    router.refresh();
  };

  const del = async (m: AdminMediaItem) => {
    const ok = await confirm({
      title: 'Delete this image?',
      text: m.used.length
        ? `It is used in ${m.used.join(', ')}. Deleting it removes it from those places too.`
        : "It isn't used anywhere on the site.",
      label: 'Delete image',
    });
    if (!ok) return;
    const res = await deleteMedia(m.id);
    if (!res.ok) {
      toast('That could not be deleted.', 'error');
      return;
    }
    toast('Image deleted.');
    router.refresh();
  };

  return (
    <div className={css.page}>
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Media</h1>
          <p className={css.sub}>
            {items.length} {items.length === 1 ? 'image' : 'images'}
          </p>
        </div>
        <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={() => file.current?.click()}>
          Upload images
        </button>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div
        className={cx(css.drop, over && css.dropOver)}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
      >
        <span className={css.dropText}>Drop images here to upload. You&apos;ll add alt text for each one.</span>
        <button
          type="button"
          className={cx(css.btn, css.btnSm)}
          style={{ height: 38 }}
          onClick={() => file.current?.click()}
        >
          Choose files
        </button>
      </div>

      <div className={css.filterRow}>
        <input
          type="search"
          aria-label="Search media"
          placeholder="Search by file name or alt text"
          className={css.search}
          style={{ flexBasis: 340, height: 42 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div role="tablist" aria-label="Filter media" className={css.chips} style={{ gap: 6 }}>
          {(
            [
              ['all', 'All'],
              ['used', 'Used'],
              ['unused', 'Not used'],
            ] as const
          ).map(([k, label]) => (
            <Chip
              key={k}
              tab
              small
              on={filter === k}
              onClick={() => setFilter(k)}
              style={{ height: 38, padding: '0 14px', fontSize: 14 }}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <p className={css.empty} style={{ fontSize: 15 }}>
          No images match. Try another search or filter.
        </p>
      )}

      <div className={css.mediaGrid}>
        {shown.map((m) => (
          <div key={m.id} className={css.mediaCard}>
            <div className={css.mediaCardImg}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.src} alt={m.alt} loading="lazy" />
            </div>
            <div className={css.mediaCardBody}>
              <span className={css.mediaName}>{m.name}</span>
              <span className={css.mediaAlt}>{m.alt || 'No alt text'}</span>
              <span className={css.mediaUsed}>
                {m.used.length
                  ? `Used in ${m.used.slice(0, 2).join(', ')}${m.used.length > 2 ? ` and ${m.used.length - 2} more` : ''}`
                  : 'Not used yet'}
              </span>
              <div className={css.mediaBtns}>
                <button
                  type="button"
                  className={cx(css.btn, css.btnXs)}
                  style={{ height: 34, padding: '0 12px' }}
                  aria-label={`Edit alt text for ${m.name}`}
                  onClick={() => setEditing({ id: m.id, name: m.name, src: m.src, alt: m.alt, err: '' })}
                >
                  Alt text
                </button>
                <button
                  type="button"
                  className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                  style={{ height: 34, padding: '0 12px' }}
                  aria-label={`Delete ${m.name}`}
                  onClick={() => void del(m)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className={cx(css.overlay, css.z70)} onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}>
          <div role="dialog" aria-modal="true" aria-label="Edit alt text" className={cx(css.dialog, css.dialogMd)}>
            <h2 className={cx(css.dialogH2, css.dialogH2Sm)}>Edit alt text</h2>
            <div className={css.upPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={editing.src} alt="" />
            </div>
            <span className={css.upName}>{editing.name}</span>
            <label className={css.field}>
              <span className={css.label}>Alt text, required</span>
              <input
                className={cx(css.input, editing.err && css.invalid)}
                value={editing.alt}
                onChange={(e) => setEditing({ ...editing, alt: e.target.value, err: '' })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void saveAlt())}
                autoFocus
              />
            </label>
            {editing.err && (
              <p className={css.err} role="alert">
                {editing.err}
              </p>
            )}
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={() => void saveAlt()}>
                Save alt text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
