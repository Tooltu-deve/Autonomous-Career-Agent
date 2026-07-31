'use client';

import { useState } from 'react';
import { AuthHero } from '@/components/auth/AuthHero';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import s from '@/components/auth/auth.module.css';

export default function SignIn() {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className={s.authPage}>
      <AuthHero />
      <main className={s.right}>
        <div className={s['form-box']}>
          <div className={s.tabs} role="tablist">
            <button
              className={`${s.tab} ${tab === 'login' ? s.active : ''}`}
              role="tab"
              aria-selected={tab === 'login'}
              onClick={() => setTab('login')}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={`${s.tab} ${tab === 'register' ? s.active : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              onClick={() => setTab('register')}
              type="button"
            >
              Tạo tài khoản
            </button>
          </div>

          {tab === 'login' ? (
            <LoginForm onSwitchToRegister={() => setTab('register')} />
          ) : (
            <RegisterForm
              onSuccess={() => setTab('login')}
              onSwitchToLogin={() => setTab('login')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
