'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
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
