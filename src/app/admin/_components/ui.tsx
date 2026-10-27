'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import css from '../admin.module.css';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Switch({
  checked,
  onChange,
  label,
  labelledBy,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={css.switch}
      onClick={onChange}
    >
      <span className={css.knob} />
    </button>
  );
}

export function Chip({
  on,
  children,
  small,
  tab,
  ...rest
}: { on: boolean; children: ReactNode; small?: boolean; tab?: boolean } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
>) {
  return (
    <button
      type="button"
      {...(tab ? { role: 'tab', 'aria-selected': on } : { 'aria-pressed': on })}
      className={cx(css.chip, small && css.chipSm, tab && css.chipTab)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Inline error with the red dot, as used under fields in the design. */
export function ErrLine({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className={css.errLine} role="alert">
      <span className={css.errDot} aria-hidden="true" />
      {children}
    </p>
  );
}

export function SaveState({ dirty }: { dirty: boolean }) {
  return (
    <span className={css.saveState}>
      <span className={cx(css.dot, dirty && css.dotDirty)} aria-hidden="true" />
      {dirty ? 'Unsaved changes' : 'All changes saved'}
    </span>
  );
}

/** Sticks to the bottom of the screen while a form has unsaved changes, so Save is always in reach. */
export function SaveBar({
  dirty,
  pending,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  pending?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!dirty) return null;
  return (
    <div className={css.saveBar} role="region" aria-label="Unsaved changes">
      <span>Unsaved changes</span>
      <button type="button" className={cx(css.btn, css.btnXs)} onClick={onDiscard} disabled={pending}>
        Discard
      </button>
      <button type="button" className={cx(css.btn, css.btnPrimary, css.btnXs)} onClick={onSave} disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

/**
 * A styled dropdown for choosing a brand: arrow keys and type-ahead via the list, Escape or an outside click closes it,
 * and a new brand can be added from the bottom of the menu.
 */
export function BrandSelect({
  id,
  value,
  options,
  invalid,
  onChange,
  onCreate,
}: {
  id: string;
  value: string;
  options: string[];
  invalid?: boolean;
  onChange: (name: string) => void;
  /** Adds a new brand; resolves to its name, or null when it could not be added. */
  onCreate: (name: string) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // A brand typed on an older project may not be in the list yet; keep it selectable.
  const all = value && !options.some((o) => o.toLowerCase() === value.toLowerCase()) ? [value, ...options] : options;

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
  };

  const toggle = () => {
    setActive(Math.max(0, all.findIndex((o) => o === value)));
    setOpen((o) => !o);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return toggle();
      setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % Math.max(all.length, 1));
    } else if ((e.key === 'Enter' || e.key === ' ') && open && all[active] && document.activeElement?.tagName === 'BUTTON') {
      e.preventDefault();
      choose(all[active]);
    }
  };

  const add = async () => {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    const made = await onCreate(name);
    setBusy(false);
    if (made) {
      setDraft('');
      choose(made);
    }
  };

  return (
    <div className={css.pick} ref={root} onKeyDown={onKey}>
      <button
        id={id}
        type="button"
        className={cx(css.pickBtn, invalid && css.invalid)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className={cx(css.pickValue, !value && css.pickEmpty)}>{value || 'Choose a brand'}</span>
        <span className={css.pickChevron} aria-hidden="true" />
      </button>
      {open && (
        <div className={css.pickMenu}>
          <div role="listbox" aria-labelledby={id} className={css.pickList}>
            {all.length === 0 && <p className={css.pickNone}>No brands yet. Add one below.</p>}
            {all.map((o, i) => (
              <button
                key={o}
                type="button"
                role="option"
                aria-selected={o === value}
                data-active={i === active}
                className={css.pickOpt}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o)}
              >
                {o}
              </button>
            ))}
          </div>
          <div className={css.pickAdd}>
            <input
              className={css.input}
              placeholder="Add a new brand"
              aria-label="New brand name"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                e.stopPropagation();
                void add();
              }}
            />
            <button type="button" className={cx(css.btn, css.btnSm)} onClick={() => void add()} disabled={busy || !draft.trim()}>
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
