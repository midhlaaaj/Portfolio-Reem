'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '../_actions/auth';
import css from '../admin.module.css';
import { ErrLine } from '../_components/ui';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: '', email: '' });
  return (
    <div className={css.loginWrap}>
      <form action={action} className={css.loginCard} noValidate>
        <span className={css.loginBrand}>Reem Fathima</span>
        <div>
          <h1 className={css.loginH1}>Log in</h1>
          <p className={css.loginP}>Manage projects, pages and inquiries for the site.</p>
        </div>
        <div className={css.field}>
          <label className={css.label} htmlFor="lg-email">
            Email
          </label>
          <input
            id="lg-email"
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            className={css.loginInput}
            required
          />
        </div>
        <div className={css.field}>
          <label className={css.label} htmlFor="lg-pw">
            Password
          </label>
          <input
            id="lg-pw"
            name="password"
            type="password"
            autoComplete="current-password"
            className={css.loginInput}
            required
          />
        </div>
        <ErrLine>{state.error}</ErrLine>
        <button type="submit" className={css.loginSubmit} disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
