'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import './auth.css';

/* ── Types ── */
interface StoredUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

/* ── Simple hash (NOT for production — demo only) ── */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/* ── localStorage helpers ── */
const STORAGE_KEY = 'careernav_users';

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUser(user: StoredUser) {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function findUser(email: string, password: string): StoredUser | null {
  const users = getUsers();
  const hash = simpleHash(password);
  return users.find((u) => u.email === email && u.passwordHash === hash) ?? null;
}

function emailExists(email: string): boolean {
  return getUsers().some((u) => u.email === email);
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ── Reusable SVG Icons ── */
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 8l10 7 10-7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function SignIn() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  /* ── Login state ── */
  const [loginState, setLoginState] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
  const [loginServerError, setLoginServerError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  /* ── Register state ── */
  const [registerState, setRegisterState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    terms: false,
  });
  const [registerErrors, setRegisterErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });
  const [registerServerError, setRegisterServerError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);

  /* ── Login Submit Handler ── */
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoginServerError(null);
    const emailValid = isValidEmail(loginState.email.trim());
    const passwordValid = loginState.password.length > 0;

    setLoginErrors({ email: !emailValid, password: !passwordValid });
    if (!emailValid || !passwordValid) return;

    setIsSubmittingLogin(true);
    setTimeout(() => {
      const user = findUser(loginState.email.trim().toLowerCase(), loginState.password);
      setIsSubmittingLogin(false);
      if (user) {
        // Lưu session
        sessionStorage.setItem('careernav_session', JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }));
        // Onboarding 1 lần duy nhất: profile-setup -> profile-preferences -> dashboard
        const profileDone = localStorage.getItem('careernav_profile_completed');
        const prefsDone = localStorage.getItem('careernav_preferences_completed');
        if (profileDone !== 'true') {
          router.push('/profile-setup');
        } else if (prefsDone !== 'true') {
          router.push('/profile-preferences');
        } else {
          router.push('/dashboard');
        }
      } else {
        setLoginServerError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.');
      }
    }, 900);
  };

  /* ── Register Submit Handler ── */
  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRegisterServerError(null);
    setRegisterSuccess(false);

    const fnValid = registerState.firstName.trim().length > 0;
    const lnValid = registerState.lastName.trim().length > 0;
    const emailValid = isValidEmail(registerState.email.trim());
    const passwordValid = registerState.password.length >= 8;

    setRegisterErrors({
      firstName: !fnValid,
      lastName: !lnValid,
      email: !emailValid,
      password: !passwordValid,
    });

    if (!registerState.terms) {
      setRegisterServerError('Bạn cần đồng ý với Điều khoản Dịch vụ để tiếp tục.');
      return;
    }

    if (!fnValid || !lnValid || !emailValid || !passwordValid) return;

    // Kiểm tra email trùng
    if (emailExists(registerState.email.trim().toLowerCase())) {
      setRegisterErrors((err) => ({ ...err, email: true }));
      setRegisterServerError('Email này đã được đăng ký. Hãy thử đăng nhập.');
      return;
    }

    setIsSubmittingRegister(true);
    setTimeout(() => {
      saveUser({
        email: registerState.email.trim().toLowerCase(),
        passwordHash: simpleHash(registerState.password),
        firstName: registerState.firstName.trim(),
        lastName: registerState.lastName.trim(),
        createdAt: new Date().toISOString(),
      });
      setIsSubmittingRegister(false);
      setRegisterSuccess(true);
      // Sau 1.5s chuyển sang tab login
      setTimeout(() => {
        setActiveTab('login');
        setLoginState({ email: registerState.email.trim().toLowerCase(), password: '' });
        setRegisterSuccess(false);
        setRegisterState({ firstName: '', lastName: '', email: '', password: '', terms: false });
      }, 1500);
    }, 900);
  };

  const handleForgot = () => {
    if (!isValidEmail(loginState.email.trim())) {
      setLoginErrors((prev) => ({ ...prev, email: true }));
      return;
    }
    alert(`Nếu email ${loginState.email.trim()} tồn tại, chúng tôi sẽ gửi link đặt lại mật khẩu.\n\n(demo — email chưa thực sự gửi)`);
  };

  const handleOAuth = (provider: string) => {
    alert(`Đăng nhập với ${provider} — (demo, tính năng OAuth đang phát triển)`);
  };

  return (
    <div className="auth-page">
      {/* ══ LEFT PANEL (Hero Decorative) ══ */}
      <aside className="left">
        <div className="brand">
          <div className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="brand-name">CareerNav</div>
        </div>

        <div className="left-body">
          <h2>
            Your career,<br />
            <em>on autopilot.</em>
          </h2>
          <p>
            AI finds the jobs, tailors your CV for each one, and scores your ATS match — all while you focus on what matters.
          </p>
        </div>

        {/* Floating ATS Score Card */}
        <div className="visual-card">
          <div className="vc-label">ATS MATCH SCORE</div>
          <div className="vc-score">84%</div>
          <div className="vc-sub">↑ 6% from last week</div>
          <div className="vc-bar-wrap">
            <div className="vc-bar-row">
              <div className="vc-bar-label">Keywords</div>
              <div className="vc-bar-track">
                <div className="vc-bar-fill" style={{ width: '88%', background: 'var(--accent-green)' }}></div>
              </div>
            </div>
            <div className="vc-bar-row">
              <div className="vc-bar-label">Skills</div>
              <div className="vc-bar-track">
                <div className="vc-bar-fill" style={{ width: '74%', background: 'var(--accent-blue)' }}></div>
              </div>
            </div>
            <div className="vc-bar-row">
              <div className="vc-bar-label">Experience</div>
              <div className="vc-bar-track">
                <div className="vc-bar-fill" style={{ width: '80%', background: 'var(--primary)' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats">
          <div className="stat-chip">
            <div className="stat-dot sd-red"></div>
            <div className="stat-text"><b>120%</b> more interview invites on average</div>
          </div>
          <div className="stat-chip">
            <div className="stat-dot sd-blue"></div>
            <div className="stat-text">CVs tailored to <b>each JD</b> in under 30s</div>
          </div>
          <div className="stat-chip">
            <div className="stat-dot sd-green"></div>
            <div className="stat-text">Supports <b>LinkedIn, TopCV, ITViec</b> &amp; more</div>
          </div>
        </div>
      </aside>

      {/* ══ RIGHT PANEL (Form Container) ══ */}
      <main className="right">
        <div className="form-box">
          {/* Tab Switcher */}
          <div className="tabs" role="tablist">
            <button
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              type="button"
            >
              Đăng nhập
            </button>
            <button
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
              type="button"
            >
              Tạo tài khoản
            </button>
          </div>

          {/* ══ SIGN IN PANEL ══ */}
          {activeTab === 'login' && (
            <div className="panel active" id="panel-login">
              <div className="form-title">Chào mừng trở lại</div>
              <div className="form-sub">Đăng nhập để tiếp tục tìm việc của bạn.</div>

              <form onSubmit={handleLoginSubmit} noValidate>
                {/* Email */}
                <div className={`field ${loginErrors.email ? 'has-error' : ''}`}>
                  <label htmlFor="l-email">Email</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      id="l-email"
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={loginState.email}
                      onChange={(e) => {
                        setLoginState((s) => ({ ...s, email: e.target.value }));
                        setLoginErrors((err) => ({ ...err, email: false }));
                        setLoginServerError(null);
                      }}
                    />
                    <EmailIcon />
                  </div>
                  {loginErrors.email && <div className="field-error">Vui lòng nhập email hợp lệ.</div>}
                </div>

                {/* Password */}
                <div className={`field ${loginErrors.password ? 'has-error' : ''}`}>
                  <div className="field-row">
                    <label htmlFor="l-password">Mật khẩu</label>
                    <button type="button" className="field-hint" onClick={handleForgot}>
                      Quên mật khẩu?
                    </button>
                  </div>
                  <div className="input-wrap">
                    <input
                      type={showLoginPw ? 'text' : 'password'}
                      id="l-password"
                      placeholder="Mật khẩu của bạn"
                      autoComplete="current-password"
                      value={loginState.password}
                      onChange={(e) => {
                        setLoginState((s) => ({ ...s, password: e.target.value }));
                        setLoginErrors((err) => ({ ...err, password: false }));
                        setLoginServerError(null);
                      }}
                    />
                    <LockIcon />
                    <button
                      className="eye-btn"
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      aria-label={showLoginPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showLoginPw ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {loginErrors.password && <div className="field-error">Vui lòng nhập mật khẩu.</div>}
                </div>

                {loginServerError && (
                  <div className="server-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {loginServerError}
                  </div>
                )}

                <button className="btn-submit" type="submit" disabled={isSubmittingLogin}>
                  {isSubmittingLogin ? 'Đang đăng nhập…' : 'Đăng nhập vào CareerNav'}
                </button>
              </form>

              <div className="switch-row">
                Chưa có tài khoản?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('register'); }}>
                  Tạo tài khoản
                </a>
              </div>

              <div className="divider">
                <div className="divider-line"></div>
                <span>hoặc tiếp tục với</span>
                <div className="divider-line"></div>
              </div>

              {/* OAuth */}
              <div className="oauth-row single">
                <button className="btn-oauth" type="button" onClick={() => handleOAuth('Google')}>
                  <div className="oauth-icon">
                    <GoogleIcon />
                  </div>
                  Tiếp tục với Google
                </button>
              </div>
            </div>
          )}

          {/* ══ CREATE ACCOUNT PANEL ══ */}
          {activeTab === 'register' && (
            <div className="panel active" id="panel-register">
              <div className="form-title">Tạo tài khoản</div>
              <div className="form-sub">Miễn phí mãi mãi — không cần thẻ tín dụng.</div>

              {registerSuccess && (
                <div className="server-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Đăng ký thành công! Đang chuyển sang trang đăng nhập…
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} noValidate>
                {/* Name Row */}
                <div className="name-row">
                  <div className={`field ${registerErrors.firstName ? 'has-error' : ''}`}>
                    <label htmlFor="r-firstname">Tên</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="r-firstname"
                        placeholder="Văn A"
                        autoComplete="given-name"
                        value={registerState.firstName}
                        onChange={(e) => {
                          setRegisterState((s) => ({ ...s, firstName: e.target.value }));
                          setRegisterErrors((err) => ({ ...err, firstName: false }));
                        }}
                      />
                      <UserIcon />
                    </div>
                    {registerErrors.firstName && <div className="field-error">Bắt buộc.</div>}
                  </div>

                  <div className={`field ${registerErrors.lastName ? 'has-error' : ''}`}>
                    <label htmlFor="r-lastname">Họ</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="r-lastname"
                        placeholder="Nguyễn"
                        autoComplete="family-name"
                        value={registerState.lastName}
                        onChange={(e) => {
                          setRegisterState((s) => ({ ...s, lastName: e.target.value }));
                          setRegisterErrors((err) => ({ ...err, lastName: false }));
                        }}
                      />
                      <UserIcon />
                    </div>
                    {registerErrors.lastName && <div className="field-error">Bắt buộc.</div>}
                  </div>
                </div>

                {/* Email */}
                <div className={`field ${registerErrors.email ? 'has-error' : ''}`}>
                  <label htmlFor="r-email">Email</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      id="r-email"
                      placeholder="you@email.com"
                      autoComplete="email"
                      value={registerState.email}
                      onChange={(e) => {
                        setRegisterState((s) => ({ ...s, email: e.target.value }));
                        setRegisterErrors((err) => ({ ...err, email: false }));
                        setRegisterServerError(null);
                      }}
                    />
                    <EmailIcon />
                  </div>
                  {registerErrors.email && <div className="field-error">Vui lòng nhập email hợp lệ.</div>}
                </div>

                {/* Password */}
                <div className={`field ${registerErrors.password ? 'has-error' : ''}`}>
                  <label htmlFor="r-password">Mật khẩu</label>
                  <div className="input-wrap">
                    <input
                      type={showRegisterPw ? 'text' : 'password'}
                      id="r-password"
                      placeholder="Ít nhất 8 ký tự"
                      autoComplete="new-password"
                      value={registerState.password}
                      onChange={(e) => {
                        setRegisterState((s) => ({ ...s, password: e.target.value }));
                        setRegisterErrors((err) => ({ ...err, password: false }));
                      }}
                    />
                    <LockIcon />
                    <button
                      className="eye-btn"
                      type="button"
                      onClick={() => setShowRegisterPw(!showRegisterPw)}
                      aria-label={showRegisterPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showRegisterPw ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {registerErrors.password && <div className="field-error">Mật khẩu phải có ít nhất 8 ký tự.</div>}
                </div>

                {/* Terms Checkbox */}
                <div className="check-row">
                  <input
                    type="checkbox"
                    id="r-terms"
                    checked={registerState.terms}
                    onChange={(e) => setRegisterState((s) => ({ ...s, terms: e.target.checked }))}
                  />
                  <label className="check-label" htmlFor="r-terms">
                    Tôi đồng ý với <a href="#">Điều khoản Dịch vụ</a> và <a href="#">Chính sách Bảo mật</a>.
                  </label>
                </div>

                {registerServerError && (
                  <div className="server-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {registerServerError}
                  </div>
                )}

                <button className="btn-submit" type="submit" disabled={isSubmittingRegister || registerSuccess}>
                  {isSubmittingRegister ? 'Đang tạo tài khoản…' : 'Tạo tài khoản miễn phí →'}
                </button>
              </form>

              <div className="switch-row">
                Đã có tài khoản?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('login'); }}>
                  Đăng nhập
                </a>
              </div>

              <div className="divider">
                <div className="divider-line"></div>
                <span>hoặc tiếp tục với</span>
                <div className="divider-line"></div>
              </div>

              {/* OAuth */}
              <div className="oauth-row single">
                <button className="btn-oauth" type="button" onClick={() => handleOAuth('Google')}>
                  <div className="oauth-icon">
                    <GoogleIcon />
                  </div>
                  Đăng ký với Google
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
