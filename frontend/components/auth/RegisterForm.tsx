'use client';

import { useState, FormEvent } from 'react';
import { TextField } from '@/components/ui/TextField';
import { EmailIcon, UserIcon, LockIcon, GoogleIcon } from '@/components/icons';
import { saveUser, emailExists, hashPassword } from '@/lib/auth';
import { isValidEmail, isValidPassword } from '@/lib/validation';
import s from './auth.module.css';

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    terms: false,
  });
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    const fnValid = form.firstName.trim().length > 0;
    const lnValid = form.lastName.trim().length > 0;
    const emailValid = isValidEmail(form.email.trim());
    const passwordValid = isValidPassword(form.password);

    setErrors({
      firstName: fnValid ? undefined : 'Required.',
      lastName: lnValid ? undefined : 'Required.',
      email: emailValid ? undefined : 'Please enter a valid email.',
      password: passwordValid ? undefined : 'Password must be at least 8 characters.',
    });

    if (!form.terms) {
      setServerError('You must agree to the Terms of Service to continue.');
      return;
    }
    if (!fnValid || !lnValid || !emailValid || !passwordValid) return;

    if (emailExists(form.email.trim().toLowerCase())) {
      setErrors((p) => ({ ...p, email: 'This email is already registered. Try logging in.' }));
      setServerError('This email is already registered. Try logging in.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const email = form.email.trim().toLowerCase();
      saveUser({
        email,
        passwordHash: hashPassword(form.password),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        createdAt: new Date().toISOString(),
      });
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => onSuccess(email), 1500);
    }, 900);
  };

  return (
    <div className={s.panel}>
      <div className={s['form-title']}>Create an account</div>
      <div className={s['form-sub']}>Free forever — no credit card required.</div>

      {success && (
        <div className={s['server-success']}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Registration successful! Redirecting to login…
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={s['name-row']}>
          <TextField
            id="r-firstname"
            label="First Name"
            placeholder="John"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(v) => { set({ firstName: v }); setErrors((e) => ({ ...e, firstName: undefined })); }}
            error={errors.firstName}
            icon={<UserIcon />}
          />
          <TextField
            id="r-lastname"
            label="Last Name"
            placeholder="Doe"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(v) => { set({ lastName: v }); setErrors((e) => ({ ...e, lastName: undefined })); }}
            error={errors.lastName}
            icon={<UserIcon />}
          />
        </div>

        <TextField
          id="r-email"
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          value={form.email}
          onChange={(v) => { set({ email: v }); setErrors((e) => ({ ...e, email: undefined })); setServerError(null); }}
          error={errors.email}
          icon={<EmailIcon />}
        />

        <TextField
          id="r-password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={form.password}
          onChange={(v) => { set({ password: v }); setErrors((e) => ({ ...e, password: undefined })); }}
          error={errors.password}
          icon={<LockIcon />}
        />

        <div className={s['check-row']}>
          <input
            type="checkbox"
            id="r-terms"
            checked={form.terms}
            onChange={(e) => set({ terms: e.target.checked })}
          />
          <label className={s['check-label']} htmlFor="r-terms">
            I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </label>
        </div>

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

        <button className={s['btn-submit']} type="submit" disabled={submitting || success}>
          {submitting ? 'Creating account…' : 'Create free account →'}
        </button>
      </form>

      <div className={s['switch-row']}>
        Already have an account?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin();
          }}
        >
          Log in
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
          onClick={() => alert('Sign up with Google — (demo, OAuth feature in development)')}
        >
          <div className={s['oauth-icon']}>
            <GoogleIcon />
          </div>
          Sign up with Google
        </button>
      </div>
    </div>
  );
}
