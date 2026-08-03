'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TextField } from '@/components/ui/TextField';
import { EmailIcon, LockIcon, GoogleIcon } from '@/components/icons';
import { findUser } from '@/lib/auth';
import { isValidEmail } from '@/lib/validation';
import { useAuth } from '@/hooks/useAuth';
import { KEYS } from '@/lib/storage';
import s from './auth.module.css';

export function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const emailValid = isValidEmail(form.email.trim());
    const passwordValid = form.password.length > 0;
    setErrors({
      email: emailValid ? undefined : 'Please enter a valid email.',
      password: passwordValid ? undefined : 'Please enter a password.',
    });
    if (!emailValid || !passwordValid) return;

    setSubmitting(true);
    setTimeout(() => {
      const user = findUser(form.email.trim().toLowerCase(), form.password);
      setSubmitting(false);
      if (!user) {
        setServerError('Incorrect email or password. Please try again.');
        return;
      }
      login({ email: user.email, firstName: user.firstName, lastName: user.lastName });
      // Set cookie so middleware (middleware.ts) can detect auth on server side
      document.cookie = 'careernav_session=1; path=/; SameSite=Lax';
      const profileDone =
        typeof window !== 'undefined' ? window.localStorage.getItem(KEYS.profileDone) : null;
      const prefsDone =
        typeof window !== 'undefined' ? window.localStorage.getItem(KEYS.prefsDone) : null;
      if (profileDone !== 'true') router.push('/profile-setup');
      else if (prefsDone !== 'true') router.push('/profile-preferences');
      else router.push('/dashboard');
    }, 900);
  };

  const handleForgot = () => {
    if (!isValidEmail(form.email.trim())) {
      setErrors((p) => ({ ...p, email: 'Vui lòng nhập email hợp lệ.' }));
      return;
    }
    alert(
      `If the email ${form.email.trim()} exists, we will send a password reset link.\n\n(demo — email not actually sent)`,
    );
  };

  return (
    <div className={s.panel}>
      <div className={s['form-title']}>Welcome back</div>
      <div className={s['form-sub']}>Log in to continue your job search.</div>

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="l-email"
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          value={form.email}
          onChange={(v) => {
            setForm((s) => ({ ...s, email: v }));
            setErrors((e) => ({ ...e, email: undefined }));
            setServerError(null);
          }}
          error={errors.email}
          icon={<EmailIcon />}
        />
        <TextField
          id="l-password"
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={form.password}
          onChange={(v) => {
            setForm((s) => ({ ...s, password: v }));
            setErrors((e) => ({ ...e, password: undefined }));
            setServerError(null);
          }}
          error={errors.password}
          icon={<LockIcon />}
          hint={
            <button type="button" className={s['field-hint']} onClick={handleForgot}>
              Forgot password?
            </button>
          }
        />

        {serverError && (
          <div className={s['server-error']}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {serverError}
          </div>
        )}

        <button className={s['btn-submit']} type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in to CareerNav'}
        </button>
      </form>

      <div className={s['switch-row']}>
        Don&apos;t have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToRegister();
          }}
        >
          Create an account
        </a>
      </div>

      <div className={s['divider']}>
        <div className={s['divider-line']}></div>
        <span>or continue with</span>
        <div className={s['divider-line']}></div>
      </div>

      <div className={`${s['oauth-row']} ${s.single ?? ''}`}>
        <button
          className={s['btn-oauth']}
          type="button"
          onClick={() => alert('Sign in with Google — (demo, OAuth feature in development)')}
        >
          <div className={s['oauth-icon']}>
            <GoogleIcon />
          </div>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
