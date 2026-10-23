'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import type { MediaRecord } from '@/lib/admin/schemas';
import { listMedia } from '../_actions/media';
import css from '../admin.module.css';
import { cx } from './ui';

type ToastKind = 'ok' | 'error';
type ConfirmOpts = { title: string; text: string; label: string };
type PickOpts = { multi: boolean; selected: (string | null)[]; title?: string };

type AdminApi = {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
  /** Opens the media picker. Resolves with the chosen images in order, or null if cancelled. */
  pickImages: (opts: PickOpts) => Promise<MediaRecord[] | null>;
  /** Queues files through the "Add image" dialog (alt text required for each). */
  uploadFiles: (files: FileList | File[]) => void;
  /** Navigates inside the admin, asking first when the screen has unsaved changes. */
  go: (href: string) => Promise<void>;
  setDirty: (dirty: boolean) => void;
};

const Ctx = createContext<AdminApi | null>(null);
export const useAdmin = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdmin must be used inside AdminProvider');
  return v;
};

/** Marks the current screen as having unsaved edits: warns on navigation and on closing the tab. */
export function useDirty(dirty: boolean) {
  const { setDirty } = useAdmin();
  useEffect(() => {
    setDirty(dirty);
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty, setDirty]);
  useEffect(() => () => setDirty(false), [setDirty]);
}

type Pending = {
  name: string;
  file: File;
  blob: Blob;
  src: string;
  w: number;
  h: number;
  alt: string;
  err: string;
  busy: boolean;
};

const MAX_EDGE = 2400;

/** Resizes in the browser first so the upload stays small enough for a serverless request. */
async function prepareImage(file: File): Promise<{ blob: Blob; src: string; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  const blob = (await toBlob('image/webp', 0.88)) ?? (await toBlob('image/jpeg', 0.88));
  if (!blob) throw new Error('encode');
  return { blob, src: URL.createObjectURL(blob), w, h };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // ---- toast ----
  const [toastState, setToastState] = useState<{ text: string; kind: ToastKind; show: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    clearTimeout(toastTimer.current);
    setToastState({ text, kind, show: true });
    toastTimer.current = setTimeout(() => setToastState((t) => (t ? { ...t, show: false } : t)), 2800);
  }, []);

  // ---- confirm ----
  const [confirmState, setConfirmState] = useState<(ConfirmOpts & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ ...opts, resolve })),
    [],
  );
  const closeConfirm = (ok: boolean) => {
    confirmState?.resolve(ok);
    setConfirmState(null);
  };

  // ---- unsaved changes ----
  const dirty = useRef(false);
  const setDirty = useCallback((d: boolean) => {
    dirty.current = d;
  }, []);
  const go = useCallback(
    async (href: string) => {
      if (dirty.current) {
        const ok = await confirm({
          title: 'Leave without saving?',
          text: 'Your unsaved changes on this screen will be lost.',
          label: 'Leave',
        });
        if (!ok) return;
        dirty.current = false;
      }
      router.push(href);
    },
    [confirm, router],
  );

  // ---- media library, picker, uploader ----
  const [library, setLibrary] = useState<MediaRecord[] | null>(null);
  const loading = useRef<Promise<MediaRecord[]> | null>(null);
  const ensureLibrary = useCallback(async () => {
    if (library) return library;
    loading.current ??= listMedia().then((items) => {
      setLibrary(items);
      return items;
    });
    return loading.current;
  }, [library]);

  const [picker, setPicker] = useState<{
    title: string;
    multi: boolean;
    sel: string[];
    q: string;
    resolve: (r: MediaRecord[] | null) => void;
  } | null>(null);
  const pickImages = useCallback(
    async (opts: PickOpts) => {
      await ensureLibrary();
      return new Promise<MediaRecord[] | null>((resolve) =>
        setPicker({
          title: opts.title ?? (opts.multi ? 'Choose images' : 'Choose an image'),
          multi: opts.multi,
          sel: opts.selected.filter((x): x is string => !!x),
          q: '',
          resolve,
        }),
      );
    },
    [ensureLibrary],
  );
  const applyPicker = () => {
    if (!picker) return;
    const byId = new Map((library ?? []).map((m) => [m.id, m]));
    picker.resolve(picker.sel.map((id) => byId.get(id)).filter((m): m is MediaRecord => !!m));
    setPicker(null);
  };
  const cancelPicker = () => {
    picker?.resolve(null);
    setPicker(null);
  };

  const queue = useRef<File[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [left, setLeft] = useState(0);
  /** True while the "Add image" dialog is showing a file; new files just join the queue. */
  const active = useRef(false);
  const next = useCallback(async () => {
    const file = queue.current.shift();
    setLeft(queue.current.length);
    if (!file) {
      active.current = false;
      setPending(null);
      return;
    }
    active.current = true;
    try {
      const prepared = await prepareImage(file);
      setPending({ name: file.name, file, ...prepared, alt: '', err: '', busy: false });
    } catch {
      toast('That file could not be read as an image.', 'error');
      void next();
    }
  }, [toast]);
  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => /^image\//.test(f.type));
      if (!list.length) {
        if (files.length) toast('Only image files can be added to Media.', 'error');
        return;
      }
      queue.current.push(...list);
      setLeft(queue.current.length);
      if (!active.current) void next();
    },
    [next, toast],
  );
  const confirmUpload = async () => {
    if (!pending || pending.busy) return;
    if (!pending.alt.trim()) {
      setPending({ ...pending, err: 'Add alt text. Describe what the image shows for people using screen readers.' });
      return;
    }
    setPending({ ...pending, busy: true, err: '' });
    const body = new FormData();
    body.set('file', new File([pending.blob], pending.name, { type: pending.blob.type }));
    body.set('kind', 'image');
    body.set('alt', pending.alt.trim());
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = (await res.json()) as { ok: boolean; error?: string; media?: MediaRecord };
      if (!data.ok || !data.media) {
        setPending((p) => p && { ...p, busy: false, err: data.error ?? 'That upload failed. Try again.' });
        return;
      }
      const added = data.media;
      setLibrary((l) => [added, ...(l ?? [])]);
      setPicker((p) => (p ? { ...p, sel: p.multi ? [...p.sel, added.id] : [added.id] } : p));
      toast('Image added to Media.');
      URL.revokeObjectURL(pending.src);
      router.refresh();
      void next();
    } catch {
      setPending((p) => p && { ...p, busy: false, err: 'That upload failed. Check your connection and try again.' });
    }
  };
  const cancelUpload = () => {
    if (pending) URL.revokeObjectURL(pending.src);
    void next();
  };

  // Escape closes the topmost dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pending) cancelUpload();
      else if (picker) cancelPicker();
      else if (confirmState) closeConfirm(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, picker, confirmState]);

  const api = useMemo<AdminApi>(
    () => ({ toast, confirm, pickImages, uploadFiles, go, setDirty }),
    [toast, confirm, pickImages, uploadFiles, go, setDirty],
  );

  const pq = picker?.q.trim().toLowerCase() ?? '';
  const pickItems = (library ?? []).filter((m) => !pq || `${m.name} ${m.alt}`.toLowerCase().includes(pq));
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Ctx.Provider value={api}>
      {children}

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {picker && (
        <div className={cx(css.overlay, css.z60)}>
          <div role="dialog" aria-modal="true" aria-label={picker.title} className={cx(css.dialog, css.dialogLg)}>
            <div className={css.pickHead}>
              <h2 className={css.pickTitle}>{picker.title}</h2>
              <input
                type="search"
                aria-label="Search images"
                placeholder="Search"
                className={css.pickSearch}
                value={picker.q}
                onChange={(e) => setPicker({ ...picker, q: e.target.value })}
              />
              <button type="button" className={cx(css.btn, css.btnSm)} onClick={() => fileInput.current?.click()}>
                Upload
              </button>
            </div>
            <div className={css.pickGrid}>
              {pickItems.map((m) => {
                const k = picker.sel.indexOf(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={k > -1}
                    className={css.pickItem}
                    onClick={() =>
                      setPicker({
                        ...picker,
                        sel: picker.multi
                          ? k > -1
                            ? picker.sel.filter((x) => x !== m.id)
                            : [...picker.sel, m.id]
                          : k > -1
                            ? []
                            : [m.id],
                      })
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.src} alt={m.alt} loading="lazy" />
                    {k > -1 && <span className={css.pickBadge}>{picker.multi ? k + 1 : 'Selected'}</span>}
                  </button>
                );
              })}
            </div>
            <div className={css.pickFoot}>
              <button type="button" className={css.btn} onClick={cancelPicker}>
                Cancel
              </button>
              <button type="button" className={cx(css.btn, css.btnPrimary)} onClick={applyPicker}>
                {picker.multi
                  ? picker.sel.length
                    ? `Use ${picker.sel.length} ${picker.sel.length === 1 ? 'image' : 'images'}`
                    : 'Use no images'
                  : picker.sel.length
                    ? 'Use image'
                    : 'Use no image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pending && (
        <div className={cx(css.overlay, css.z70)}>
          <div role="dialog" aria-modal="true" aria-label="Add image" className={cx(css.dialog, css.dialogMd)}>
            <h2 className={cx(css.dialogH2, css.dialogH2Sm)}>Add image</h2>
            <div className={css.upPreview}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pending.src} alt="" />
            </div>
            <span className={css.upName}>{pending.name}</span>
            <label className={css.field}>
              <span className={css.label}>Alt text, required</span>
              <input
                className={cx(css.input, pending.err && css.invalid)}
                value={pending.alt}
                placeholder="What the image shows, for example: roll-up banner for studying in the UK"
                onChange={(e) => setPending({ ...pending, alt: e.target.value, err: '' })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void confirmUpload())}
                autoFocus
              />
            </label>
            {pending.err && (
              <p className={css.err} role="alert">
                {pending.err}
              </p>
            )}
            {left > 0 && (
              <p className={css.upLeft}>
                {left} more {left === 1 ? 'image' : 'images'} after this one
              </p>
            )}
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={cancelUpload} disabled={pending.busy}>
                Cancel
              </button>
              <button
                type="button"
                className={cx(css.btn, css.btnPrimary)}
                onClick={() => void confirmUpload()}
                disabled={pending.busy}
              >
                {pending.busy ? 'Adding…' : 'Add to Media'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div className={cx(css.overlay, css.z80)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={confirmState.title}
            className={cx(css.dialog, css.dialogSm)}
          >
            <h2 className={css.dialogH2}>{confirmState.title}</h2>
            <p className={css.dialogText}>{confirmState.text}</p>
            <div className={css.dialogActions}>
              <button type="button" className={css.btn} onClick={() => closeConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={cx(css.btn, css.btnPrimary)}
                onClick={() => closeConfirm(true)}
                autoFocus
              >
                {confirmState.label}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        role="status"
        aria-live="polite"
        className={cx(css.toast, toastState?.show && css.toastShow, toastState?.kind === 'error' && css.toastError)}
      >
        <span className={css.toastDot} aria-hidden="true" />
        {toastState?.text}
      </div>
    </Ctx.Provider>
  );
}
