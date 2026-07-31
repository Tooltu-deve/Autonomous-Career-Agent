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
      firstName: fnValid ? undefined : 'Bắt buộc.',
      lastName: lnValid ? undefined : 'Bắt buộc.',
      email: emailValid ? undefined : 'Vui lòng nhập email hợp lệ.',
      password: passwordValid ? undefined : 'Mật khẩu phải có ít nhất 8 ký tự.',
    });

    if (!form.terms) {
      setServerError('Bạn cần đồng ý với Điều khoản Dịch vụ để tiếp tục.');
      return;
    }
    if (!fnValid || !lnValid || !emailValid || !passwordValid) return;

    if (emailExists(form.email.trim().toLowerCase())) {
      setErrors((p) => ({ ...p, email: 'Email này đã được đăng ký. Hãy thử đăng nhập.' }));
      setServerError('Email này đã được đăng ký. Hãy thử đăng nhập.');
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
      <div className={s['form-title']}>Tạo tài khoản</div>
      <div className={s['form-sub']}>Miễn phí mãi mãi — không cần thẻ tín dụng.</div>

      {success && (
        <div className={s['server-success']}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Đăng ký thành công! Đang chuyển sang trang đăng nhập…
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={s['name-row']}>
          <TextField
            id="r-firstname"
            label="Tên"
            placeholder="Văn A"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(v) => { set({ firstName: v }); setErrors((e) => ({ ...e, firstName: undefined })); }}
            error={errors.firstName}
            icon={<UserIcon />}
          />
          <TextField
            id="r-lastname"
            label="Họ"
            placeholder="Nguyễn"
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
          label="Mật khẩu"
          type="password"
          placeholder="Ít nhất 8 ký tự"
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
            Tôi đồng ý với <a href="#">Điều khoản Dịch vụ</a> và <a href="#">Chính sách Bảo mật</a>.
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
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản miễn phí →'}
        </button>
      </form>

      <div className={s['switch-row']}>
        Đã có tài khoản?{' '}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSwitchToLogin();
          }}
        >
          Đăng nhập
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
          Đăng ký với Google
        </button>
      </div>
    </div>
  );
}
