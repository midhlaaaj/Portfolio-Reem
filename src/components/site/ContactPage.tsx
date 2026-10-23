'use client';

import type { Copy } from '@/content/copy';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import type { z } from 'zod';
import { BUDGETS, PROJECT_TYPES, TIMELINES, contactFormSchema, type SiteSettings } from '@/lib/content';
import css from './ContactPage.module.css';

type FormInput = z.input<typeof contactFormSchema>;
type FormOutput = z.output<typeof contactFormSchema>;
type Phase = 'idle' | 'sending' | 'closing' | 'sent';
type Settings = Pick<SiteSettings, 'email' | 'phone' | 'whatsapp' | 'instagram' | 'behance' | 'linkedin' | 'replyTime'>;

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const EMPTY: FormInput = { name: '', email: '', phone: '', budget: '', type: '', timeline: '', message: '' };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className={css.p2} role="alert">
      <span className={css.span5} aria-hidden="true"></span>
      {message}
    </p>
  );
}

export function ContactPage({ settings: s, copy: c }: { settings: Settings; copy: Copy }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: EMPTY,
    // The design validates on submit, clears a field's error as you type, and re-checks on the next submit.
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });
  const [phase, setPhase] = useState<Phase>('idle');
  const [serverError, setServerError] = useState('');
  const trap = useRef<HTMLInputElement>(null);
  const turnstile = useRef<TurnstileInstance>(null);
  const type = watch('type');
  const timeline = watch('timeline');
  const hasErrors = Object.keys(errors).length > 0 && phase === 'idle';
  const tel = `tel:${s.phone.replace(/[^+0-9]/g, '')}`;

  // Clears the field's error as soon as the person edits it.
  const field = (name: 'name' | 'email' | 'phone' | 'budget' | 'message') =>
    register(name, { onChange: () => clearErrors(name) });

  const submit = handleSubmit(async (values) => {
    if (phase !== 'idle') return;
    setPhase('sending');
    setServerError('');
    try {
      const token = SITE_KEY ? await turnstile.current?.getResponsePromise() : undefined;
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, website: trap.current?.value ?? '', token }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setPhase('closing');
      setTimeout(() => setPhase('sent'), reduced ? 150 : 860);
    } catch {
      turnstile.current?.reset();
      setPhase('idle');
      setServerError(`That didn't send. Try again, or email ${s.email}.`);
    }
  });

  return (
    <>
      <section className={css.section1} data-light-zone="">
        <div
          className={css.div1}
          data-light=""
          data-light-x="0.62"
          data-light-y="0.5"
          data-light-o="0.55"
          aria-hidden="true"
        ></div>
        <div className={css.div2}>
          <h1 className={css.h11} data-rv="lines" data-rv-dur="900" data-rv-stagger="90">
            <span className={css.span1}>
              <span className={css.span2} data-line="">
                {c['contact.line1']}
              </span>
            </span>
            <span className={css.span3}>
              <span className={css.span2} data-line="">
                {c['contact.line2']}
              </span>
            </span>
          </h1>
          <p className={css.p1} data-rv="up" data-rv-delay="300">
            {c['contact.lead']} {s.replyTime}
          </p>
        </div>
      </section>

      <section className={css.section2}>
        <div className={css.div3}>
          <div className={css.div4} data-rv="up">
            {phase !== 'sent' && (
              <form className={css.form1} noValidate onSubmit={submit}>
                <div className={css.div5}>
                  <div className={css.div6}>
                    <label className={css.label1} htmlFor="f-name">
                      Name
                    </label>
                    <div className={css.div7}>
                      <input
                        className={css.input1}
                        id="f-name"
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        {...field('name')}
                      />
                      <span className={css.span4} aria-hidden="true"></span>
                    </div>
                    <FieldError message={errors.name?.message} />
                  </div>
                  <div className={css.div6}>
                    <label className={css.label1} htmlFor="f-email">
                      Email
                    </label>
                    <div className={css.div7}>
                      <input
                        className={css.input1}
                        id="f-email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        {...field('email')}
                      />
                      <span className={css.span4} aria-hidden="true"></span>
                    </div>
                    <FieldError message={errors.email?.message} />
                  </div>
                  <div className={css.div6}>
                    <label className={css.label1} htmlFor="f-phone">
                      Phone <span className={css.span6}>(optional)</span>
                    </label>
                    <div className={css.div7}>
                      <input className={css.input1} id="f-phone" type="tel" autoComplete="tel" {...field('phone')} />
                      <span className={css.span4} aria-hidden="true"></span>
                    </div>
                  </div>
                  <div className={css.div6}>
                    <label className={css.label1} htmlFor="f-budget">
                      Budget
                    </label>
                    <div className={css.div7}>
                      <select className={css.select1} id="f-budget" {...field('budget')}>
                        <option value="">Choose a range</option>
                        {BUDGETS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <span className={css.span7} aria-hidden="true"></span>
                      <span className={css.span4} aria-hidden="true"></span>
                    </div>
                  </div>
                </div>

                <fieldset className={css.fieldset1}>
                  <legend className={css.legend1}>Project type</legend>
                  <div className={css.div8}>
                    {PROJECT_TYPES.map((t) => (
                      <button
                        key={t}
                        className={css.button1}
                        type="button"
                        aria-pressed={type === t}
                        onClick={() => {
                          setValue('type', type === t ? '' : t);
                          clearErrors('type');
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <FieldError message={errors.type?.message} />
                </fieldset>

                <fieldset className={css.fieldset1}>
                  <legend className={css.legend1}>Timeline</legend>
                  <div className={css.div8}>
                    {TIMELINES.map((t) => (
                      <button
                        key={t}
                        className={css.button1}
                        type="button"
                        aria-pressed={timeline === t}
                        onClick={() => setValue('timeline', timeline === t ? '' : t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className={css.div6}>
                  <label className={css.label1} htmlFor="f-msg">
                    Message
                  </label>
                  <div className={css.div7}>
                    <textarea
                      className={css.textarea1}
                      id="f-msg"
                      rows={6}
                      placeholder="What are you launching, and when?"
                      aria-invalid={!!errors.message}
                      {...field('message')}
                    ></textarea>
                    <span className={css.span4} aria-hidden="true"></span>
                  </div>
                  <FieldError message={errors.message?.message} />
                </div>

                <input
                  ref={trap}
                  className={css.trap}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                {SITE_KEY && (
                  <Turnstile
                    ref={turnstile}
                    siteKey={SITE_KEY}
                    options={{ appearance: 'interaction-only', theme: 'dark' }}
                  />
                )}

                <div className={css.div9}>
                  <button
                    className={css.button2}
                    type="submit"
                    aria-label="Send message"
                    data-closing={phase === 'closing'}
                    disabled={phase !== 'idle'}
                    aria-busy={phase === 'sending'}
                  >
                    <span className={css.span8}>Send message</span>
                    <span className={css.span9} aria-hidden="true">
                      <span className={css.span10}></span>
                      <span className={css.span11}></span>
                      <span className={css.span12}></span>
                      <span className={css.span13}></span>
                    </span>
                  </button>
                  {hasErrors && (
                    <span className={css.span14} role="status">
                      Check the fields marked above.
                    </span>
                  )}
                  {serverError && (
                    <span className={css.span14} role="status">
                      {serverError}
                    </span>
                  )}
                </div>
              </form>
            )}
            {phase === 'sent' && (
              <div className={css.div10} role="status">
                <h2 className={css.h21}>{c['contact.sentTitle']}</h2>
                <p className={css.p3}>{c['contact.sentText']}</p>
                <button
                  className={css.button3}
                  type="button"
                  onClick={() => {
                    reset(EMPTY);
                    setPhase('idle');
                  }}
                >
                  {c['contact.sendAnother']}
                </button>
              </div>
            )}
          </div>

          <aside className={css.aside1} data-rv="up" data-rv-delay="120">
            <div className={css.div6}>
              <span className={css.span15}>Email</span>
              <a className={css.a1} href={`mailto:${s.email}`}>
                {s.email}
              </a>
            </div>
            <div className={css.div6}>
              <span className={css.span15}>Phone</span>
              <a className={css.a2} href={tel}>
                {s.phone}
              </a>
            </div>
            <a className={css.a3} target="_blank" rel="noopener" href={`https://wa.me/${s.whatsapp}`}>
              <span className={css.span16} aria-hidden="true"></span>
              {c['contact.whatsapp']}
            </a>
            {(s.instagram || s.behance || s.linkedin) && (
              <div className={css.div11}>
                <span className={css.span15}>Elsewhere</span>
                <div className={css.div12}>
                  {s.instagram && (
                    <a className={css.a4} target="_blank" rel="noopener" href={s.instagram}>
                      Instagram
                    </a>
                  )}
                  {s.behance && (
                    <a className={css.a4} target="_blank" rel="noopener" href={s.behance}>
                      Behance
                    </a>
                  )}
                  {s.linkedin && (
                    <a className={css.a4} target="_blank" rel="noopener" href={s.linkedin}>
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
