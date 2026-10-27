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
import { Chip, cx } from './ui';

type ToastKind = 'ok' | 'error';
type ConfirmOpts = { title: string; text: string; label: string };
type PickOpts = {
  multi: boolean;
  selected: (string | null)[];
  title?: string;
  /** Width / height the image is displayed at. A single chosen image is cropped to it before it is used. */
  ratio?: number;
};

type CropState = {
  m: MediaRecord;
  ratio: number;
  zoom: number;
  ox: number;
  oy: number;
  busy: boolean;
  err: string;
  resolve: (r: MediaRecord | null | 'cancel') => void;
};

const CROP_MAX_W = 470;
const CROP_MAX_H = 320;
/** Frame size in px for a target ratio, fitted inside the dialog. */
const cropFrame = (ratio: number) =>
  ratio >= CROP_MAX_W / CROP_MAX_H
    ? { fw: CROP_MAX_W, fh: CROP_MAX_W / ratio }
    : { fw: CROP_MAX_H * ratio, fh: CROP_MAX_H };

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

const MAX_EDGE = 3200;
const MAX_SEND_BYTES = 3.9 * 1024 * 1024;

/** Resizes in the browser first so the upload stays small enough for a serverless request. */
async function prepareImage(file: File): Promise<{ blob: Blob; src: string; w: number; h: number }> {
  const bmp = await createImageBitmap(file);
  // Files that already fit go up untouched, so the browser never adds a lossy pass of its own.
  if (file.size <= MAX_SEND_BYTES && Math.max(bmp.width, bmp.height) <= MAX_EDGE) {
    const { width: w, height: h } = bmp;
    bmp.close();
    return { blob: file, src: URL.createObjectURL(file), w, h };
  }
  const k = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k);
  const h = Math.round(bmp.height * k);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  // Highest quality that still fits a serverless request body.
  let blob: Blob | null = null;
  for (const q of [0.97, 0.92, 0.86, 0.8]) {
    blob = (await toBlob('image/webp', q)) ?? (await toBlob('image/jpeg', q));
    if (blob && blob.size <= MAX_SEND_BYTES) break;
  }
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
    tab: 'library' | 'upload';
    over: boolean;
    resolve: (r: MediaRecord[] | null) => void;
  } | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);
  const askCrop = useCallback(
    (m: MediaRecord, ratio: number) =>
      new Promise<MediaRecord | null | 'cancel'>((resolve) =>
        setCrop({ m, ratio, zoom: 1, ox: 0, oy: 0, busy: false, err: '', resolve }),
      ),
    [],
  );
  const pickFromLibrary = useCallback(
    async (opts: PickOpts) => {
      await ensureLibrary();
      return new Promise<MediaRecord[] | null>((resolve) =>
        setPicker({
          title: opts.title ?? (opts.multi ? 'Choose images' : 'Choose an image'),
          multi: opts.multi,
          sel: opts.selected.filter((x): x is string => !!x),
          q: '',
          tab: 'library',
          over: false,
          resolve,
        }),
      );
    },
    [ensureLibrary],
  );
  const pickImages = useCallback(
    async (opts: PickOpts) => {
      const picked = await pickFromLibrary(opts);
      const [one] = picked ?? [];
      const ratio = opts.ratio;
      // No crop for several images, or when the image is already the right shape or was already in use.
      if (!picked || !one || !ratio || opts.multi || picked.length !== 1) return picked;
      if (Math.abs(one.w / one.h / ratio - 1) < 0.02 || opts.selected[0] === one.id) return picked;
      const out = await askCrop(one, ratio);
      return out === 'cancel' ? null : [out ?? one];
    },
    [pickFromLibrary, askCrop],
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
      toast('Image added to Media.');
      if (picker && !picker.multi && queue.current.length === 0) {
        // A direct upload for a single-image field is used straight away.
        picker.resolve([added]);
        setPicker(null);
      } else {
        setPicker((p) => (p ? { ...p, tab: 'library', sel: p.multi ? [...p.sel, added.id] : [added.id] } : p));
      }
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

  // ---- cropper: pan and zoom the image under a frame that has the display ratio ----
  const cropGeo = (c: CropState) => {
    const { fw, fh } = cropFrame(c.ratio);
    const s = Math.max(fw / c.m.w, fh / c.m.h) * c.zoom;
    const iw = c.m.w * s;
    const ih = c.m.h * s;
    const mx = (iw - fw) / 2;
    const my = (ih - fh) / 2;
    return { fw, fh, s, iw, ih, ox: Math.min(mx, Math.max(-mx, c.ox)), oy: Math.min(my, Math.max(-my, c.oy)) };
  };
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const finishCrop = (out: MediaRecord | null | 'cancel') => {
    crop?.resolve(out);
    setCrop(null);
  };
  const applyCrop = async () => {
    if (!crop || crop.busy) return;
    const g = cropGeo(crop);
    setCrop({ ...crop, busy: true, err: '' });
    try {
      const img = new Image();
      img.src = crop.m.src;
      await img.decode();
      // The region under the frame, in the image's own pixels.
      const sw = g.fw / g.s;
      const sh = g.fh / g.s;
      const sx = crop.m.w / 2 - g.ox / g.s - sw / 2;
      const sy = crop.m.h / 2 - g.oy / g.s - sh / 2;
      const k = Math.min(1, MAX_EDGE / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw * k);
      canvas.height = Math.round(sh * k);
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const toBlob = (type: string, q?: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
      let blob = await toBlob('image/png');
      if (blob && blob.size > MAX_SEND_BYTES) blob = await toBlob('image/webp', 0.95);
      if (!blob) throw new Error('encode');
      const base = crop.m.name.replace(/\.[^.]+$/, '');
      const body = new FormData();
      body.set('file', new File([blob], `${base}-crop`, { type: blob.type }));
      body.set('kind', 'image');
      body.set('alt', crop.m.alt);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = (await res.json()) as { ok: boolean; error?: string; media?: MediaRecord };
      if (!data.ok || !data.media) {
        setCrop((c) => c && { ...c, busy: false, err: data.error ?? 'The crop could not be saved. Try again.' });
        return;
      }
      const added = data.media;
      setLibrary((l) => [added, ...(l ?? [])]);
      toast('Cropped copy added to Media.');
      router.refresh();
      finishCrop(added);
    } catch {
      setCrop((c) => c && { ...c, busy: false, err: 'The crop could not be saved. Try again.' });
    }
  };

  // Escape closes the topmost dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (crop) finishCrop('cancel');
      else if (pending) cancelUpload();
      else if (picker) cancelPicker();
      else if (confirmState) closeConfirm(false);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, pending, picker, confirmState]);

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
          <div
            role="dialog"
            aria-modal="true"
            aria-label={picker.title}
            className={cx(css.dialog, css.dialogLg, css.dialogPick)}
          >
            <div className={css.pickHead}>
              <h2 className={css.pickTitle}>{picker.title}</h2>
              {picker.tab === 'library' && (
                <input
                  type="search"
                  aria-label="Search images"
                  placeholder="Search"
                  className={css.pickSearch}
                  value={picker.q}
                  onChange={(e) => setPicker({ ...picker, q: e.target.value })}
                />
              )}
            </div>
            <div className={css.pickTabs} role="tablist">
              <Chip tab small on={picker.tab === 'library'} onClick={() => setPicker({ ...picker, tab: 'library' })}>
                Select from media
              </Chip>
              <Chip tab small on={picker.tab === 'upload'} onClick={() => setPicker({ ...picker, tab: 'upload' })}>
                Upload new
              </Chip>
            </div>
            {picker.tab === 'upload' ? (
              <div className={css.pickBody}>
                <div
                  className={css.pickDrop}
                  data-over={picker.over}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!picker.over) setPicker({ ...picker, over: true });
                  }}
                  onDragLeave={() => setPicker({ ...picker, over: false })}
                  onDrop={(e) => {
                    e.preventDefault();
                    setPicker({ ...picker, over: false });
                    uploadFiles(e.dataTransfer.files);
                  }}
                >
                  <span>Drop {picker.multi ? 'images' : 'an image'} here</span>
                  <button
                    type="button"
                    className={cx(css.btn, css.btnPrimary)}
                    onClick={() => fileInput.current?.click()}
                  >
                    Choose {picker.multi ? 'files' : 'a file'}
                  </button>
                  <span className={css.pickFootNote}>JPG, PNG, WebP or AVIF. Resized automatically.</span>
                </div>
              </div>
            ) : (
              <div className={css.pickGrid}>
                {pickItems.length === 0 && (
                  <p className={css.pickEmpty}>
                    {pq ? 'No images match that search.' : 'No images yet. Use Upload new.'}
                  </p>
                )}
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
                      <span className={css.pickCap}>{m.name}</span>
                      {k > -1 && <span className={css.pickBadge}>{picker.multi ? k + 1 : 'Selected'}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div className={css.pickFoot}>
              {picker.multi && picker.sel.length > 0 && (
                <span className={css.pickFootNote}>{picker.sel.length} selected</span>
              )}
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

      {crop &&
        (() => {
          const g = cropGeo(crop);
          return (
            <div className={cx(css.overlay, css.z70)}>
              <div role="dialog" aria-modal="true" aria-label="Crop image" className={cx(css.dialog, css.dialogMd)}>
                <h2 className={cx(css.dialogH2, css.dialogH2Sm)}>Crop image</h2>
                <p className={css.cropHint}>
                  Drag to position and use the slider to zoom. The frame is the shape this image is shown in on the
                  site.
                </p>
                <div
                  className={css.cropFrame}
                  style={{ width: g.fw, height: g.fh }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drag.current = { x: e.clientX, y: e.clientY, ox: g.ox, oy: g.oy };
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (d) setCrop({ ...crop, ox: d.ox + e.clientX - d.x, oy: d.oy + e.clientY - d.y });
                  }}
                  onPointerUp={() => (drag.current = null)}
                  onPointerCancel={() => (drag.current = null)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crop.m.src}
                    alt=""
                    draggable={false}
                    className={css.cropImg}
                    style={{
                      width: g.iw,
                      height: g.ih,
                      left: g.fw / 2 - g.iw / 2 + g.ox,
                      top: g.fh / 2 - g.ih / 2 + g.oy,
                    }}
                  />
                </div>
                <label className={css.cropZoom}>
                  <span className={css.label}>Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.01}
                    value={crop.zoom}
                    onChange={(e) => setCrop({ ...crop, zoom: Number(e.target.value) })}
                  />
                </label>
                {crop.err && (
                  <p className={css.err} role="alert">
                    {crop.err}
                  </p>
                )}
                <div className={css.dialogActions}>
                  <button type="button" className={css.btn} onClick={() => finishCrop('cancel')} disabled={crop.busy}>
                    Cancel
                  </button>
                  <button type="button" className={css.btn} onClick={() => finishCrop(null)} disabled={crop.busy}>
                    Use original
                  </button>
                  <button
                    type="button"
                    className={cx(css.btn, css.btnPrimary)}
                    onClick={() => void applyCrop()}
                    disabled={crop.busy}
                  >
                    {crop.busy ? 'Saving…' : 'Use crop'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
