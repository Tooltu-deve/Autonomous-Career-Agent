'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthHero } from '@/components/auth/AuthHero';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import s from '@/components/auth/auth.module.css';

function SignInContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'login' | 'register'>(tabParam === 'register' ? 'register' : 'login');

  useEffect(() => {
    setTab(tabParam === 'register' ? 'register' : 'login');
  }, [tabParam]);

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
              Log in
            </button>
            <button
              className={`${s.tab} ${tab === 'register' ? s.active : ''}`}
              role="tab"
              aria-selected={tab === 'register'}
              onClick={() => setTab('register')}
              type="button"
            >
              Register
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

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
