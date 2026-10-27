'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectInputSchema, SECTION_TYPES, type MediaRecord, type ProjectInput } from '@/lib/admin/schemas';
import type { ProjectEditData } from '@/lib/admin/queries';
import { slugify } from '@/lib/text';
import { addCompany } from '../../_actions/content';
import { deleteProject, saveProject } from '../../_actions/projects';
import { useAdmin, useDirty } from '../../_components/AdminProvider';
import { useCrumb } from '../../_components/AdminShell';
import { SortableList, SortableRow } from '../../_components/Sortable';
import { BrandSelect, Chip, ErrLine, SaveState, Switch, cx } from '../../_components/ui';
import { fmtDate } from '../../_components/fmt';
import css from '../../admin.module.css';

const sanitizeSlug = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export function ProjectEditor({ data }: { data: ProjectEditData }) {
  const router = useRouter();
  const { toast, confirm, pickImages, go } = useAdmin();
  const [pending, startTransition] = useTransition();
  const isNew = !data.input.id;
  const [status, setStatus] = useState(data.status);
  const [savedAt, setSavedAt] = useState(data.updatedAt);
  const [media, setMedia] = useState<Record<string, MediaRecord>>(data.media);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectInputSchema),
    defaultValues: data.input,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'sections', keyName: 'key' });

  const title = watch('title');
  const slug = watch('slug');
  const coverId = watch('coverId');
  const categoryIds = watch('categoryIds');
  const featured = watch('featured');
  const seoDesc = watch('seoDesc');
  const sections = watch('sections');
  const client = watch('client');
  const [brands, setBrands] = useState(data.brands);

  useDirty(isDirty);
  useCrumb(title);

  const mark = { shouldDirty: true };
  const live = status === 'published';
  const firstCat = data.categories.find((c) => c.id === categoryIds[0])?.name;
  const err = (name: string) => (errors as Record<string, { message?: string }>)[name]?.message;

  const remember = (records: MediaRecord[]) =>
    setMedia((m) => ({ ...m, ...Object.fromEntries(records.map((r) => [r.id, r])) }));

  const chooseCover = async () => {
    const res = await pickImages({ multi: false, selected: [coverId], ratio: 6 / 5 });
    if (!res) return;
    remember(res);
    setValue('coverId', res[0]?.id ?? null, mark);
  };
  const chooseSectionMedia = async (i: number) => {
    const res = await pickImages({ multi: true, selected: getValues(`sections.${i}.mediaIds`) });
    if (!res) return;
    remember(res);
    setValue(
      `sections.${i}.mediaIds`,
      res.map((r) => r.id),
      mark,
    );
  };

  const save = (target: 'draft' | 'published') =>
    handleSubmit(
      (values) =>
        startTransition(async () => {
          const res = await saveProject(values, target);
          if (!res.ok) {
            for (const [k, message] of Object.entries(res.fieldErrors ?? {}))
              setError(k as keyof ProjectInput, { message });
            toast(res.error ?? 'Check the fields marked in red.', 'error');
            return;
          }
          setStatus(target);
          setSavedAt(res.updatedAt);
          reset({ ...values, id: res.id });
          toast(target === 'published' ? "Published. It's live on the site." : 'Draft saved.');
          if (isNew) router.replace(`/admin/projects/${res.id}`);
          else router.refresh();
        }),
      () => toast('Check the fields marked in red.', 'error'),
    )();

  const preview = () => {
    const v = getValues();
    if (!v.slug) {
      setError('slug', { message: 'Add a slug before previewing.' });
      return;
    }
    const item = (id: string | null) =>
      id && media[id] ? { id, src: media[id].src, alt: media[id].alt, w: media[id].w, h: media[id].h } : null;
    const project = {
      id: v.id ?? 'preview',
      slug: v.slug,
      title: v.title || 'Untitled project',
      client: v.client,
      scope: v.scope,
      tab: firstCat || '',
      cats: v.categoryIds.map((id) => data.categories.find((c) => c.id === id)?.name).filter(Boolean),
      cover: item(v.coverId),
      featured: v.featured,
      year: v.year,
      overview: v.overview,
      seoTitle: v.seoTitle,
      seoDesc: v.seoDesc,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      sections: v.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        text: s.text,
        videoUrl: s.videoUrl,
        media: s.mediaIds.map(item).filter(Boolean),
      })),
    };
    try {
      localStorage.setItem('rf-preview', JSON.stringify({ project, at: Date.now() }));
    } catch {
      toast('The preview could not be prepared in this browser.', 'error');
      return;
    }
    window.open('/preview/project', '_blank');
  };

  const remove_ = async () => {
    const ok = await confirm({ title: 'Delete this project?', text: "This can't be undone.", label: 'Delete project' });
    if (!ok) return;
    const res = await deleteProject(data.input.id!);
    if (!res.ok) {
      toast('That could not be deleted.', 'error');
      return;
    }
    reset(getValues());
    toast('Project deleted.');
    router.push('/admin/projects');
  };

  const removeSection = async (i: number) => {
    const ok = await confirm({
      title: 'Remove this section?',
      text: 'Its title, line and media selection will be removed from the project.',
      label: 'Remove section',
    });
    if (ok) remove(i);
  };

  const reorderSections = (ids: string[]) => {
    const current = getValues('sections');
    replace(ids.map((id) => current.find((s) => s.id === id)!));
    setValue(
      'sections',
      ids.map((id) => current.find((s) => s.id === id)!),
      mark,
    );
  };

  return (
    <form className={css.page} noValidate onSubmit={(e) => e.preventDefault()}>
      {isDirty && (
        <div className={css.saveBar} role="region" aria-label="Unsaved changes">
          <span>Unsaved changes</span>
          <button
            type="button"
            className={cx(css.btn, css.btnXs)}
            onClick={() => void save('draft')}
            disabled={pending}
          >
            Save draft
          </button>
          <button
            type="button"
            className={cx(css.btn, css.btnPrimary, css.btnXs)}
            onClick={() => void save('published')}
            disabled={pending}
          >
            {pending ? 'Saving…' : 'Publish'}
          </button>
        </div>
      )}
      <div className={css.pageHead}>
        <div className={css.headText}>
          <button type="button" className={cx(css.btn, css.btnBack)} onClick={() => void go('/admin/projects')}>
            All projects
          </button>
          <h1 className={cx(css.h1, css.h1Editor)}>{title || 'New project'}</h1>
          <SaveState dirty={isDirty} />
        </div>
        <div className={css.actions}>
          <button type="button" className={css.btn} onClick={preview}>
            Preview
          </button>
          <button type="button" className={css.btn} onClick={() => void save('draft')} disabled={pending}>
            Save draft
          </button>
          <button
            type="button"
            className={cx(css.btn, css.btnPrimary)}
            onClick={() => void save('published')}
            disabled={pending}
          >
            Publish
          </button>
        </div>
      </div>

      <div className={css.editorGrid}>
        <div className={css.editorMain}>
          <section className={css.card}>
            <h2 className={css.cardTitle}>Basics</h2>
            <div className={css.row2}>
              <div className={css.field}>
                <label className={css.label} htmlFor="ed-title">
                  Title
                </label>
                <input
                  id="ed-title"
                  className={cx(css.input, err('title') && css.invalid)}
                  value={title}
                  onChange={(e) => {
                    setValue('title', e.target.value, mark);
                    if (!slugTouched) setValue('slug', slugify(e.target.value), mark);
                    clearErrors(['title', 'slug']);
                  }}
                />
                <ErrLine>{err('title')}</ErrLine>
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor="ed-slug">
                  Slug
                </label>
                <div className={cx(css.slugBox, err('slug') && css.invalid)}>
                  <span className={css.slugPrefix}>/work/</span>
                  <input
                    id="ed-slug"
                    className={css.slugInput}
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setValue('slug', sanitizeSlug(e.target.value), mark);
                      clearErrors('slug');
                    }}
                  />
                </div>
                <ErrLine>{err('slug')}</ErrLine>
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor="ed-client">
                  Brand
                </label>
                <BrandSelect
                  id="ed-client"
                  value={client}
                  options={brands}
                  invalid={!!err('client')}
                  onChange={(name) => {
                    setValue('client', name, mark);
                    clearErrors('client');
                  }}
                  onCreate={async (name) => {
                    const res = await addCompany(name);
                    if (!res.ok) {
                      toast(res.error ?? 'That brand could not be added.', 'error');
                      return null;
                    }
                    setBrands((b) => [...b, name.trim()]);
                    toast('Brand added.');
                    router.refresh(); // keeps the Brands page in step
                    return name.trim();
                  }}
                />
                <ErrLine>{err('client')}</ErrLine>
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor="ed-scope">
                  Scope
                </label>
                <input
                  id="ed-scope"
                  className={css.input}
                  placeholder="Logo design, brand guidelines"
                  {...register('scope')}
                />
              </div>
              <div className={css.field}>
                <label className={css.label} htmlFor="ed-year">
                  Year
                </label>
                <input id="ed-year" inputMode="numeric" className={css.input} {...register('year')} />
              </div>
            </div>

            <fieldset className={css.fieldset}>
              <legend className={css.legend}>Categories</legend>
              <div className={css.chips}>
                {data.categories.map((c) => {
                  const on = categoryIds.includes(c.id);
                  return (
                    <Chip
                      key={c.id}
                      on={on}
                      onClick={() =>
                        setValue(
                          'categoryIds',
                          on ? categoryIds.filter((x) => x !== c.id) : [...categoryIds, c.id],
                          mark,
                        )
                      }
                    >
                      {c.name}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>

            <div className={css.field}>
              <label className={css.label} htmlFor="ed-ov">
                Overview
              </label>
              <textarea id="ed-ov" rows={5} className={css.textarea} {...register('overview')} />
            </div>
          </section>

          <section className={cx(css.card, css.cardTight)} style={{ gap: 16 }}>
            <h2 className={css.cardTitle}>Cover image</h2>
            <div className={css.coverRow}>
              <div className={css.coverThumb}>
                {coverId && media[coverId] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media[coverId].src} alt="" />
                ) : (
                  <span className={css.coverNone}>No cover yet</span>
                )}
              </div>
              <div className={css.stack}>
                <p className={css.cardNote} style={{ maxWidth: '30em' }}>
                  Shown on the folder card and as the full-width header of the project page.
                </p>
                <div className={css.chips}>
                  <button type="button" className={cx(css.btn, css.btnSm)} onClick={() => void chooseCover()}>
                    Choose image
                  </button>
                  {coverId && (
                    <button
                      type="button"
                      className={cx(css.btn, css.btnSm, css.btnQuiet)}
                      onClick={() => setValue('coverId', null, mark)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={cx(css.card, css.cardTight)} style={{ gap: 16 }}>
            <div className={css.cardHead}>
              <h2 className={css.cardTitle}>Sections</h2>
              <button
                type="button"
                className={cx(css.btn, css.btnSm)}
                onClick={() =>
                  append({ id: crypto.randomUUID(), type: 'full', title: '', text: '', videoUrl: '', mediaIds: [] })
                }
              >
                Add section
              </button>
            </div>
            {fields.length === 0 && (
              <p className={css.empty}>
                No sections yet. Add one for each deliverable: a full-bleed image, a grid, a poster strip or a video.
              </p>
            )}
            <SortableList ids={fields.map((f) => f.id)} onReorder={reorderSections}>
              {fields.map((f, i) => {
                const s = sections[i] ?? f;
                const mids = s.mediaIds ?? [];
                return (
                  <SortableRow
                    key={f.key}
                    id={f.id}
                    handleLabel={`Reorder section ${i + 1}. Use arrow keys to move.`}
                    className={css.section}
                  >
                    {(handle) => (
                      <>
                        <div className={css.sectionHead}>
                          {handle}
                          <span className={css.sectionN}>Section {i + 1}</span>
                          <div role="group" aria-label="Section type" className={css.typeGroup}>
                            {SECTION_TYPES.map(([k, label]) => (
                              <Chip
                                key={k}
                                small
                                on={s.type === k}
                                onClick={() => setValue(`sections.${i}.type`, k, mark)}
                              >
                                {label}
                              </Chip>
                            ))}
                          </div>
                          <button
                            type="button"
                            className={cx(css.btn, css.btnXs, css.btnQuiet, css.removeBtn)}
                            onClick={() => void removeSection(i)}
                          >
                            Remove
                          </button>
                        </div>
                        <div
                          className={css.row2}
                          style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}
                        >
                          <input
                            aria-label="Section title"
                            placeholder="Section title"
                            className={css.input}
                            {...register(`sections.${i}.title`)}
                          />
                          <input
                            aria-label="One line description"
                            placeholder="One line about this deliverable"
                            className={css.input}
                            {...register(`sections.${i}.text`)}
                          />
                        </div>
                        {s.type === 'video' && (
                          <div className={css.field}>
                            <input
                              aria-label="Video URL"
                              placeholder="Video file URL, MP4"
                              className={cx(css.input, err(`sections.${i}.videoUrl`) && css.invalid)}
                              {...register(`sections.${i}.videoUrl`)}
                            />
                            <ErrLine>
                              {(errors.sections?.[i]?.videoUrl as { message?: string } | undefined)?.message}
                            </ErrLine>
                          </div>
                        )}
                        <div className={css.mediaStrip}>
                          {mids.map((id, j) => (
                            <div key={`${id}-${j}`} className={css.mediaTile}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {media[id] && <img src={media[id].src} alt={media[id].alt} />}
                              <button
                                type="button"
                                className={css.mediaRemove}
                                aria-label={`Remove image ${j + 1}`}
                                onClick={() =>
                                  setValue(
                                    `sections.${i}.mediaIds`,
                                    mids.filter((_, k) => k !== j),
                                    mark,
                                  )
                                }
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button type="button" className={css.mediaAdd} onClick={() => void chooseSectionMedia(i)}>
                            Add {s.type === 'video' ? 'Poster image' : 'Media'}
                          </button>
                        </div>
                        {mids.length === 0 && s.type !== 'video' && (
                          <p className={css.hint}>
                            No media yet. The section shows only its title and line until you add some.
                          </p>
                        )}
                      </>
                    )}
                  </SortableRow>
                );
              })}
            </SortableList>
          </section>
        </div>

        <div className={css.editorSide}>
          <section className={css.card}>
            <h2 className={css.cardTitle}>Status</h2>
            <div className={css.statusBox}>
              <span className={css.statusLine}>
                <span
                  className={cx(css.statusDot, live && css.statusDotLive)}
                  aria-hidden="true"
                  style={{ width: 9, height: 9 }}
                />
                {live ? 'Published' : 'Draft'}
              </span>
              <span className={css.statusText}>
                {live ? 'Live on the site.' : 'Only visible in preview.'}{' '}
                {isNew && !savedAt ? 'Not saved yet' : `Last edited ${fmtDate(savedAt)}`}
              </span>
            </div>
            <div className={cx(css.switchRow, css.featRow)}>
              <span id="ed-feat" className={css.label}>
                Featured on Home
              </span>
              <Switch checked={featured} labelledBy="ed-feat" onChange={() => setValue('featured', !featured, mark)} />
            </div>
          </section>

          <section className={cx(css.card, css.cardTight)}>
            <h2 className={css.cardTitle}>Search and sharing</h2>
            <div className={css.field}>
              <label className={css.label} htmlFor="ed-seot">
                SEO title
              </label>
              <input
                id="ed-seot"
                className={css.input}
                placeholder={title || 'Uses the project title'}
                {...register('seoTitle')}
              />
            </div>
            <div className={css.field}>
              <label className={css.label} htmlFor="ed-seod">
                SEO description
              </label>
              <textarea
                id="ed-seod"
                rows={3}
                maxLength={160}
                className={css.textarea}
                placeholder="Uses the first line of the overview"
                {...register('seoDesc')}
              />
              <span className={css.hint}>{seoDesc.length} of 160 characters</span>
            </div>
          </section>

          {!isNew && (
            <button
              type="button"
              className={cx(css.btn, css.btnDanger)}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => void remove_()}
            >
              Delete project
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
