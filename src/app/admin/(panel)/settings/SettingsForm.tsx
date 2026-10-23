'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { siteSettingsSchema, type SiteSettings } from '@/lib/content';
import type { adminSettingsData } from '@/lib/admin/queries';
import type { MediaRecord } from '@/lib/admin/schemas';
import { saveSettings } from '../../_actions/content';
import { useAdmin, useDirty } from '../../_components/AdminProvider';
import { ErrLine, SaveState, cx, SaveBar } from '../../_components/ui';
import css from '../../admin.module.css';

type Data = Awaited<ReturnType<typeof adminSettingsData>>;

function Text({
  label,
  reg,
  rows,
  ...rest
}: {
  label: string;
  reg: UseFormRegisterReturn;
  rows?: number;
  placeholder?: string;
  type?: string;
  inputMode?: 'numeric';
}) {
  return (
    <label className={css.stackLabel}>
      {label}
      {rows ? (
        <textarea rows={rows} className={css.textarea} {...reg} {...rest} />
      ) : (
        <input className={css.input} {...reg} {...rest} />
      )}
    </label>
  );
}

export function SettingsForm({ data }: { data: Data }) {
  const router = useRouter();
  const { toast, pickImages } = useAdmin();
  const [pending, startTransition] = useTransition();
  const [media, setMedia] = useState<Record<string, MediaRecord>>(data.media);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const cvInput = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<SiteSettings>({ defaultValues: data.settings });
  useDirty(isDirty);
  const mark = { shouldDirty: true };
  const cvUrl = watch('cvUrl');
  const cvName = watch('cvName');
  const seoImageId = watch('seoImageId');

  const save = handleSubmit((v) =>
    startTransition(async () => {
      // Keep digits only for WhatsApp, as in the design.
      const values = { ...v, whatsapp: v.whatsapp.replace(/\D/g, '') };
      const parsed = siteSettingsSchema.safeParse(values);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
        setErrors(next);
        toast('Check the fields marked in red.', 'error');
        return;
      }
      const res = await saveSettings(values);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast(res.error ?? 'That could not be saved.', 'error');
        return;
      }
      setErrors({});
      reset(values);
      toast('Settings saved.');
      router.refresh();
    }),
  );

  const uploadCv = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return toast('Upload the CV as a PDF.', 'error');
    if (file.size > 2.5 * 1024 * 1024)
      return toast('That PDF is over 2.5 MB. Export a smaller version and try again.', 'error');
    setUploading(true);
    try {
      const body = new FormData();
      body.set('file', file);
      body.set('kind', 'pdf');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const out = (await res.json()) as { ok: boolean; url?: string; name?: string; error?: string };
      if (!out.ok || !out.url) return toast(out.error ?? 'That upload failed.', 'error');
      setValue('cvUrl', out.url, mark);
      setValue('cvName', out.name ?? file.name, mark);
    } catch {
      toast('That upload failed. Check your connection and try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const chooseSeo = async () => {
    const res = await pickImages({ multi: false, selected: [seoImageId] });
    if (!res) return;
    setMedia((m) => ({ ...m, ...Object.fromEntries(res.map((r) => [r.id, r])) }));
    setValue('seoImageId', res[0]?.id ?? null, mark);
  };

  return (
    <div className={cx(css.page, css.narrow)} style={{ maxWidth: 880 }}>
      <SaveBar
        dirty={isDirty}
        pending={pending}
        onSave={() => void save()}
        onDiscard={() => (reset(data.settings), setErrors({}))}
      />
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Settings</h1>
          <SaveState dirty={isDirty} />
        </div>
        <div className={css.actions}>
          <button
            type="button"
            className={css.btn}
            style={{ opacity: isDirty ? 1 : 0.5 }}
            onClick={() => (reset(data.settings), setErrors({}))}
            disabled={!isDirty}
          >
            Discard
          </button>
          <button
            type="button"
            className={cx(css.btn, css.btnPrimary)}
            style={{ opacity: isDirty ? 1 : 0.5 }}
            onClick={() => void save()}
            disabled={pending || !isDirty}
          >
            Save changes
          </button>
        </div>
      </div>

      <section className={css.card} style={{ gap: 16 }}>
        <h2 className={css.cardTitle}>Contact</h2>
        <div className={css.row2}>
          <div className={css.field}>
            <label className={css.label} htmlFor="s-email">
              Email
            </label>
            <input
              id="s-email"
              type="email"
              className={cx(css.input, errors.email && css.invalid)}
              {...register('email')}
            />
            <ErrLine>{errors.email}</ErrLine>
          </div>
          <Text label="Phone, as shown" reg={register('phone')} />
          <div className={css.field}>
            <label className={css.label} htmlFor="s-wa">
              WhatsApp number, with country code
            </label>
            <input
              id="s-wa"
              inputMode="numeric"
              className={cx(css.input, errors.whatsapp && css.invalid)}
              {...register('whatsapp')}
            />
            <ErrLine>{errors.whatsapp}</ErrLine>
          </div>
          <Text label="Reply time line" reg={register('replyTime')} />
        </div>
      </section>

      <section className={css.card} style={{ gap: 16 }}>
        <h2 className={css.cardTitle}>Social links</h2>
        <div className={css.row2}>
          <div className={css.field}>
            <Text label="Instagram" reg={register('instagram')} placeholder="https://instagram.com/…" />
            <ErrLine>{errors.instagram}</ErrLine>
          </div>
          <div className={css.field}>
            <Text label="Behance" reg={register('behance')} placeholder="https://behance.net/…" />
            <ErrLine>{errors.behance}</ErrLine>
          </div>
          <div className={css.field}>
            <Text label="LinkedIn" reg={register('linkedin')} placeholder="https://linkedin.com/in/…" />
            <ErrLine>{errors.linkedin}</ErrLine>
          </div>
        </div>
        <p className={css.cardNote}>Empty links are hidden on the site.</p>
      </section>

      <section className={css.card} style={{ gap: 16 }}>
        <h2 className={css.cardTitle}>CV</h2>
        {cvUrl ? (
          <p style={{ margin: 0, font: '500 15px/1.4 var(--font-body)', color: 'var(--paper)' }}>
            {cvName || 'CV.pdf'}
          </p>
        ) : (
          <p className={css.cardNote} style={{ fontSize: 15 }}>
            No CV uploaded. The Download CV button is hidden until you add one.
          </p>
        )}
        <div className={css.chips}>
          <button
            type="button"
            className={cx(css.btn, css.btnSm)}
            onClick={() => cvInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>
          {cvUrl && (
            <button
              type="button"
              className={cx(css.btn, css.btnSm, css.btnDangerQuiet)}
              onClick={() => (setValue('cvUrl', '', mark), setValue('cvName', '', mark))}
            >
              Remove
            </button>
          )}
        </div>
        <input
          ref={cvInput}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => (void uploadCv(e.target.files?.[0]), (e.target.value = ''))}
        />
      </section>

      <section className={css.card} style={{ gap: 16 }}>
        <h2 className={css.cardTitle}>Search and sharing</h2>
        <Text label="Site title" reg={register('siteTitle')} />
        <Text label="Site description" reg={register('siteDesc')} rows={3} />
        <div className={css.imgRow} style={{ alignItems: 'center' }}>
          <div className={css.imgThumb} style={{ width: 160, aspectRatio: '1.91 / 1' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {seoImageId && media[seoImageId] && <img src={media[seoImageId].src} alt="" />}
          </div>
          <button type="button" className={cx(css.btn, css.btnSm)} onClick={() => void chooseSeo()}>
            Choose default share image
          </button>
        </div>
      </section>
    </div>
  );
}
