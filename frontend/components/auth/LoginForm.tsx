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
      email: emailValid ? undefined : 'Vui lòng nhập email hợp lệ.',
      password: passwordValid ? undefined : 'Vui lòng nhập mật khẩu.',
    });
    if (!emailValid || !passwordValid) return;

    setSubmitting(true);
    setTimeout(() => {
      const user = findUser(form.email.trim().toLowerCase(), form.password);
      setSubmitting(false);
      if (!user) {
        setServerError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
        return;
      }
      login({ email: user.email, firstName: user.firstName, lastName: user.lastName });
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
      `Nếu email ${form.email.trim()} tồn tại, chúng tôi sẽ gửi link đặt lại mật khẩu.\n\n(demo — email chưa thực sự gửi)`,
    );
  };

  return (
    <div className={s.panel}>
      <div className={s['form-title']}>Chào mừng trở lại</div>
      <div className={s['form-sub']}>Đăng nhập để tiếp tục tìm việc của bạn.</div>

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
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu của bạn"
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
              Quên mật khẩu?
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
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập vào CareerNav'}
        </button>
      </form>

      <div className={s['switch-row']}>
        Chưa có tài khoản?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToRegister();
          }}
        >
          Tạo tài khoản
        </a>
      </div>

      <div className={s['divider']}>
        <div className={s['divider-line']}></div>
        <span>hoặc tiếp tục với</span>
        <div className={s['divider-line']}></div>
      </div>

      <div className={`${s['oauth-row']} ${s.single ?? ''}`}>
        <button
          className={s['btn-oauth']}
          type="button"
          onClick={() => alert('Đăng nhập với Google — (demo, tính năng OAuth đang phát triển)')}
        >
          <div className={s['oauth-icon']}>
            <GoogleIcon />
          </div>
          Tiếp tục với Google
        </button>
      </div>
    </div>
  );
}
