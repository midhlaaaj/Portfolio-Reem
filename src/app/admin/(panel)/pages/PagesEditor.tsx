'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import type { SeoOverride } from '@/lib/content';
import type { adminPagesData } from '@/lib/admin/queries';
import type { MediaRecord } from '@/lib/admin/schemas';
import { reorderFeatured } from '../../_actions/projects';
import { savePageSeo, savePages } from '../../_actions/content';
import { useAdmin, useDirty } from '../../_components/AdminProvider';
import { SortableList, SortableRow } from '../../_components/Sortable';
import { Chip, ErrLine, SaveState, Switch, cx, SaveBar } from '../../_components/ui';
import css from '../../admin.module.css';

type Data = Awaited<ReturnType<typeof adminPagesData>>;
type PageKey = 'home' | 'about' | 'services';

type Form = {
  home: Data['home'];
  about: Data['about'] & { toolsDesignText: string; toolsAIText: string };
  services: {
    intro: string;
    pricingOn: boolean;
    items: (Data['services']['items'][number] & { delText: string })[];
    process: Data['services']['process'];
  };
  seo: Record<PageKey, SeoOverride>;
};

const toForm = (d: Data): Form => ({
  home: d.home,
  about: { ...d.about, toolsDesignText: d.about.toolsDesign.join(', '), toolsAIText: d.about.toolsAI.join(', ') },
  services: { ...d.services, items: d.services.items.map((i) => ({ ...i, delText: i.deliverables.join('\n') })) },
  seo: d.seo,
});

const list = (text: string, sep: RegExp) =>
  text
    .split(sep)
    .map((x) => x.trim())
    .filter(Boolean);

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

function Thumb({ m, cls }: { m?: MediaRecord | null; cls: string }) {
  return (
    <div className={cls}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {m && <img src={m.src} alt="" />}
    </div>
  );
}

export function PagesEditor({ data }: { data: Data }) {
  const router = useRouter();
  const { toast, pickImages, confirm } = useAdmin();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<PageKey>('home');
  const [media, setMedia] = useState<Record<string, MediaRecord>>(data.media);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [featured, setFeatured] = useState(data.featured);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm<Form>({ defaultValues: toForm(data) });
  useDirty(isDirty);

  const [openSvc, setOpenSvc] = useState<Set<string>>(new Set());
  const toggleSvc = (id: string) =>
    setOpenSvc((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  /** True if anything inside this part of the form has been edited since the last save. */
  const touched = (v: unknown): boolean =>
    !!v && (v === true || (typeof v === 'object' && Object.values(v as object).some(touched)));
  const svcDirty = (i: number) => touched((dirtyFields.services?.items as unknown[] | undefined)?.[i]);
  const brandDirty = (i: number) => touched((dirtyFields.home?.brands as unknown[] | undefined)?.[i]);
  const addService = () => {
    const id = crypto.randomUUID();
    setOpenSvc((o) => new Set(o).add(id));
    addServiceRow(id);
  };
  const addServiceRow = (id: string) =>
    setValue(
      'services.items',
      [
        ...getValues('services.items'),
        {
          id,
          name: '',
          short: '',
          desc: '',
          deliverables: [],
          delText: '',
          projectSlug: '',
          imageId: null,
          price: '',
        },
      ],
      { shouldDirty: true },
    );
  const removeService = async (i: number) => {
    const name = getValues(`services.items.${i}.name`) || `Service ${i + 1}`;
    const ok = await confirm({
      title: `Remove ${name}?`,
      text: 'It disappears from Home and the Services page once you save.',
      label: 'Remove service',
    });
    if (ok)
      setValue(
        'services.items',
        getValues('services.items').filter((_, k) => k !== i),
        { shouldDirty: true },
      );
  };

  const mark = { shouldDirty: true };
  const remember = (rs: MediaRecord[]) => setMedia((m) => ({ ...m, ...Object.fromEntries(rs.map((r) => [r.id, r])) }));
  const choose = async (current: string | null, apply: (id: string | null) => void) => {
    const res = await pickImages({ multi: false, selected: [current] });
    if (!res) return;
    remember(res);
    apply(res[0]?.id ?? null);
  };

  const home = watch('home');
  const about = watch('about');
  const pricingOn = watch('services.pricingOn');
  const items = watch('services.items');
  const seo = watch('seo');

  const save = handleSubmit((v) =>
    startTransition(async () => {
      const payload = {
        home: v.home,
        about: {
          ...v.about,
          toolsDesign: list(v.about.toolsDesignText, /,/),
          toolsAI: list(v.about.toolsAIText, /,/),
        },
        services: {
          ...v.services,
          items: v.services.items.map(({ delText, ...i }) => ({ ...i, deliverables: list(delText, /\n/) })),
        },
      };
      const res = await savePages(payload);
      if (!res.ok) {
        setServerErrors(res.fieldErrors ?? {});
        toast(res.error ?? 'That could not be saved.', 'error');
        return;
      }
      for (const key of ['home', 'about', 'services'] as const) await savePageSeo(key, v.seo[key]);
      setServerErrors({});
      reset(v);
      toast('Pages saved. Changes are live.');
      router.refresh();
    }),
  );

  const reorder = (ids: string[]) => {
    const byId = new Map(featured.map((f) => [f.id, f]));
    setFeatured(ids.map((id) => byId.get(id)!));
    startTransition(async () => {
      const res = await reorderFeatured(ids);
      if (res.ok) toast('Featured order saved.');
    });
  };

  const seoCard = (key: PageKey) => (
    <section className={cx(css.card, css.cardTight)}>
      <h2 className={css.cardTitle}>Search and sharing</h2>
      <p className={css.cardNote}>Leave blank to use the defaults from the page content and Settings.</p>
      <Text label="SEO title" reg={register(`seo.${key}.title`)} placeholder="Uses the page name" />
      <Text
        label="SEO description"
        reg={register(`seo.${key}.description`)}
        rows={3}
        placeholder="Uses the page intro"
      />
      <div className={css.imgRow} style={{ alignItems: 'center' }}>
        <div className={css.imgThumb} style={{ width: 160, aspectRatio: '1.91 / 1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {seo[key].imageId && media[seo[key].imageId!] && <img src={media[seo[key].imageId!].src} alt="" />}
        </div>
        <button
          type="button"
          className={cx(css.btn, css.btnSm)}
          onClick={() => void choose(seo[key].imageId, (id) => setValue(`seo.${key}.imageId`, id, mark))}
        >
          Choose share image
        </button>
      </div>
    </section>
  );

  const paper = (label: string, field: 'heroLeftId' | 'showreelPosterId' | 'heroRightId') => (
    <div className={css.paper}>
      <span className={css.label}>{label}</span>
      <Thumb m={home[field] ? media[home[field]!] : null} cls={css.paperThumb} />
      <button
        type="button"
        className={cx(css.btn, css.btnXs)}
        style={{ height: 38 }}
        onClick={() => void choose(home[field], (id) => setValue(`home.${field}`, id, mark))}
      >
        Change
      </button>
    </div>
  );

  return (
    <div className={cx(css.page, css.medium)}>
      <SaveBar dirty={isDirty} pending={pending} onSave={() => void save()} onDiscard={() => reset(toForm(data))} />
      <div className={css.pageHead}>
        <div className={css.headText}>
          <h1 className={css.h1}>Pages</h1>
          <SaveState dirty={isDirty} />
        </div>
        <div className={css.actions}>
          <button
            type="button"
            className={css.btn}
            style={{ opacity: isDirty ? 1 : 0.5 }}
            onClick={() => reset(toForm(data))}
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

      <div role="tablist" aria-label="Page" className={css.pageTabs}>
        {(['home', 'about', 'services'] as const).map((k) => (
          <Chip key={k} tab on={tab === k} onClick={() => setTab(k)}>
            {k === 'home' ? 'Home' : k === 'about' ? 'About' : 'Services'}
          </Chip>
        ))}
      </div>

      {tab === 'home' && (
        <>
          <section className={css.card} style={{ gap: 16 }}>
            <h2 className={css.cardTitle}>Hero text</h2>
            <Text label="Tagline" reg={register('home.tagline')} rows={2} />
            <Text label="Small line" reg={register('home.smallLine')} />
          </section>
          <section className={css.card} style={{ gap: 16 }}>
            <h2 className={css.cardTitle} style={{ marginBottom: 4 }}>
              Brands I&apos;ve worked with
            </h2>
            {home.brands.map((b, i) => (
              <div
                key={b.id}
                className={css.featItem}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) auto',
                  alignItems: 'end',
                  gap: 14,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Thumb m={b.imageId ? media[b.imageId] : null} cls={css.featThumb} />
                  <button
                    type="button"
                    className={cx(css.btn, css.btnXs)}
                    onClick={() => void choose(b.imageId, (id) => setValue(`home.brands.${i}.imageId`, id, mark))}
                  >
                    Image
                  </button>
                </div>
                <label className={css.stackLabel}>
                  Name
                  <input className={css.input} {...register(`home.brands.${i}.name`)} />
                </label>
                <label className={css.stackLabel}>
                  What they do
                  <input className={css.input} {...register(`home.brands.${i}.kind`)} />
                </label>
                <label className={css.stackLabel}>
                  Project
                  <select className={css.select} {...register(`home.brands.${i}.projectSlug`)}>
                    <option value="">Choose a project</option>
                    {data.projectOptions.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {brandDirty(i) && (
                    <>
                      <span className={css.hint}>Unsaved</span>
                      <button
                        type="button"
                        className={cx(css.btn, css.btnPrimary, css.btnXs)}
                        disabled={pending}
                        onClick={() => void save()}
                      >
                        Save
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                    onClick={() =>
                      setValue(
                        'home.brands',
                        getValues('home.brands').filter((_, k) => k !== i),
                        mark,
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className={cx(css.btn, css.btnSm)}
              style={{ alignSelf: 'flex-start' }}
              onClick={() =>
                setValue(
                  'home.brands',
                  [
                    ...getValues('home.brands'),
                    { id: crypto.randomUUID(), projectSlug: '', name: '', kind: '', imageId: null },
                  ],
                  mark,
                )
              }
            >
              Add brand
            </button>
          </section>
          <section className={css.card} style={{ gap: 16 }}>
            <h2 className={css.cardTitle}>Hero folder</h2>
            <p className={css.cardNote}>
              The three papers peeking out of the red folder. As visitors scroll, the folder opens and these three
              spread out under “A little bit of everything.”
            </p>
            <div className={css.heroPapers}>
              {paper('Left paper', 'heroLeftId')}
              {paper('Middle paper', 'showreelPosterId')}
              {paper('Right paper', 'heroRightId')}
            </div>
            <label className={css.stackLabel}>
              Showreel video file URL, optional
              <input className={css.input} placeholder="https://… .mp4" {...register('home.showreelUrl')} />
              <span className={css.hint}>
                When set, the middle paper plays this video, muted, once the folder has fully opened.
              </span>
            </label>
          </section>
          <section className={cx(css.card, css.cardTight)} style={{ gap: 12 }}>
            <h2 className={css.cardTitle}>Selected work order</h2>
            <p className={css.cardNote}>
              Drag to reorder. Saves straight away. Turn Featured on Home on or off in each project.
            </p>
            {featured.length === 0 && <p className={css.empty}>No featured projects yet.</p>}
            <SortableList ids={featured.map((f) => f.id)} onReorder={reorder}>
              {featured.map((f, k) => (
                <SortableRow
                  key={f.id}
                  id={f.id}
                  handleLabel="Reorder. Use arrow keys to move."
                  className={css.featItem}
                >
                  {(handle) => (
                    <>
                      {handle}
                      <span className={css.featN}>{k + 1}</span>
                      <Thumb m={f.thumb ? ({ src: f.thumb } as MediaRecord) : null} cls={css.featThumb} />
                      <div className={css.two} style={{ flex: 1 }}>
                        <span className={css.twoMain}>{f.title}</span>
                        <span className={css.rowTitleSub}>
                          {k < 4 ? (f.published ? 'Shown on Home' : 'Draft, not shown') : 'Not shown, Home fits 4'}
                        </span>
                      </div>
                    </>
                  )}
                </SortableRow>
              ))}
            </SortableList>
          </section>
          {seoCard('home')}
        </>
      )}

      {tab === 'about' && (
        <>
          <section className={css.card} style={{ gap: 16 }}>
            <h2 className={css.cardTitle}>Story</h2>
            <Text label="Lead paragraph" reg={register('about.lead')} rows={3} />
            <Text label="Second paragraph" reg={register('about.story')} rows={3} />
            <div className={css.imgRow} style={{ alignItems: 'center' }}>
              <Thumb m={about.portraitId ? media[about.portraitId] : null} cls={css.imgThumb} />
              <button
                type="button"
                className={cx(css.btn, css.btnSm)}
                onClick={() => void choose(about.portraitId, (id) => setValue('about.portraitId', id, mark))}
              >
                Choose portrait
              </button>
            </div>
          </section>
          <section className={css.card} style={{ gap: 16 }}>
            <h2 className={css.cardTitle}>Tools and experience</h2>
            <Text label="Design and video tools, separated by commas" reg={register('about.toolsDesignText')} />
            <Text label="AI tools, separated by commas" reg={register('about.toolsAIText')} />
            <div className={css.row2}>
              <Text label="Role" reg={register('about.expRole')} />
              <div className={css.field}>
                <Text label="Start year" reg={register('about.expStart')} inputMode="numeric" placeholder="2021" />
                <ErrLine>{serverErrors['about.expStart']}</ErrLine>
              </div>
            </div>
            <Text label="What the work covers" reg={register('about.expText')} rows={2} />
            <p className={css.cardNote}>Upload the CV in Settings.</p>
          </section>
          {seoCard('about')}
        </>
      )}

      {tab === 'services' && (
        <>
          <section className={css.card} style={{ gap: 16 }}>
            <Text label="Intro" reg={register('services.intro')} rows={2} />
            <div className={css.switchRow}>
              <span id="pr-lbl" className={css.label}>
                Show starting prices
              </span>
              <Switch
                checked={pricingOn}
                labelledBy="pr-lbl"
                onChange={() => setValue('services.pricingOn', !pricingOn, mark)}
              />
            </div>
          </section>
          {items.map((it, i) => (
            <section key={it.id} className={cx(css.card, css.cardTight)}>
              <div className={css.cardHead}>
                <span className={css.svcN}>
                  Service {i + 1}
                  {svcDirty(i) ? ' · Unsaved' : ''}
                </span>
                <span style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  {(svcDirty(i) || openSvc.has(it.id)) && (
                    <button
                      type="button"
                      className={cx(css.btn, css.btnPrimary, css.btnXs)}
                      disabled={pending || !svcDirty(i)}
                      onClick={() => void save()}
                    >
                      Save
                    </button>
                  )}
                  <button type="button" className={cx(css.btn, css.btnXs)} onClick={() => toggleSvc(it.id)}>
                    {openSvc.has(it.id) ? 'Done' : 'Edit'}
                  </button>
                </span>
                <button
                  type="button"
                  className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                  onClick={() => void removeService(i)}
                >
                  Remove
                </button>
              </div>
              {!openSvc.has(it.id) && (
                <p className={css.cardNote} style={{ margin: 0 }}>
                  <strong style={{ color: 'var(--paper)' }}>{it.name || 'Untitled service'}</strong>
                  {it.short ? ` · ${it.short}` : ''}
                </p>
              )}
              {openSvc.has(it.id) && (
                <>
                  <div className={css.row2} style={{ gap: 14 }}>
                    <Text label="Name" reg={register(`services.items.${i}.name`)} />
                    <label className={css.stackLabel}>
                      Linked project
                      <select className={css.select} {...register(`services.items.${i}.projectSlug`)}>
                        <option value="">No linked project</option>
                        {data.projectOptions.map((o) => (
                          <option key={o.slug} value={o.slug}>
                            {o.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <Text label="One line for Home" reg={register(`services.items.${i}.short`)} />
                  <Text label="Description" reg={register(`services.items.${i}.desc`)} rows={3} />
                  <Text label="Deliverables, one per line" reg={register(`services.items.${i}.delText`)} rows={3} />
                  <div className={css.imgRow}>
                    <Thumb m={it.imageId ? media[it.imageId] : null} cls={cx(css.imgThumb, css.imgThumb43)} />
                    <button
                      type="button"
                      className={cx(css.btn, css.btnSm)}
                      onClick={() => void choose(it.imageId, (id) => setValue(`services.items.${i}.imageId`, id, mark))}
                    >
                      Choose image
                    </button>
                    {pricingOn && (
                      <label className={css.stackLabel} style={{ flex: '1 1 200px' }}>
                        Starting price
                        <input
                          className={css.input}
                          placeholder="From ₹8,000"
                          {...register(`services.items.${i}.price`)}
                        />
                      </label>
                    )}
                  </div>
                </>
              )}
            </section>
          ))}
          <button
            type="button"
            className={cx(css.btn, css.btnSm)}
            style={{ alignSelf: 'flex-start' }}
            onClick={addService}
          >
            Add service
          </button>
          <section className={cx(css.card, css.cardTight)}>
            <h2 className={css.cardTitle}>How I work</h2>
            {watch('services.process').map((p, i) => (
              <div key={i} className={css.procRow}>
                <span className={css.procN}>{String(i + 1).padStart(2, '0')}</span>
                <input aria-label="Step title" className={css.input} {...register(`services.process.${i}.title`)} />
                <input
                  aria-label="Step description"
                  className={css.input}
                  {...register(`services.process.${i}.text`)}
                />
                <button
                  type="button"
                  className={cx(css.btn, css.btnXs, css.btnDangerQuiet)}
                  style={{ gridColumn: '2 / -1', justifySelf: 'start' }}
                  onClick={() =>
                    setValue(
                      'services.process',
                      getValues('services.process').filter((_, k) => k !== i),
                      { shouldDirty: true },
                    )
                  }
                >
                  Remove step
                </button>
              </div>
            ))}
            <button
              type="button"
              className={cx(css.btn, css.btnSm)}
              style={{ alignSelf: 'flex-start' }}
              onClick={() =>
                setValue('services.process', [...getValues('services.process'), { title: '', text: '' }], {
                  shouldDirty: true,
                })
              }
            >
              Add step
            </button>
          </section>
          {seoCard('services')}
        </>
      )}
    </div>
  );
}
