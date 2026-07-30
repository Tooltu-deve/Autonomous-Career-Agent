'use client';

import { useState, FormEvent } from 'react';

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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form Controlled States
  const [loginState, setLoginState] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: false, password: false });
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

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
  const [isSubmittingRegister, setIsSubmittingRegister] = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);

  // Login Submit Handler
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailValid = isValidEmail(loginState.email.trim());
    const passwordValid = loginState.password.length > 0;

    setLoginErrors({
      email: !emailValid,
      password: !passwordValid,
    });

    if (!emailValid || !passwordValid) return;

    setIsSubmittingLogin(true);
    setTimeout(() => {
      setIsSubmittingLogin(false);
      alert('✓ Logged in successfully! (demo)');
    }, 1200);
  };

  // Register Submit Handler
  const handleRegisterSubmit = (e: FormEvent) => {
    e.preventDefault();
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
      alert('Please agree to the Terms of Service to continue.');
      return;
    }

    if (!fnValid || !lnValid || !emailValid || !passwordValid) return;

    setIsSubmittingRegister(true);
    setTimeout(() => {
      setIsSubmittingRegister(false);
      alert('✓ Account created! Redirecting to profile setup… (demo)');
    }, 1400);
  };

  const handleForgot = () => {
    if (!isValidEmail(loginState.email.trim())) {
      setLoginErrors(prev => ({ ...prev, email: true }));
      return;
    }
    alert(`We'll send a password reset link to ${loginState.email.trim()}.\n\n(demo — email not actually sent)`);
  };

  const handleOAuth = (provider: string) => {
    alert(`Continue with ${provider} — (demo, OAuth integration pending)`);
  };

  return (
    <div className="page">
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
          <div className="vc-label">ATS Match Score</div>
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
              Sign in
            </button>
            <button
              className={`tab ${activeTab === 'register' ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
              type="button"
            >
              Create account
            </button>
          </div>

          {/* ══ SIGN IN PANEL ══ */}
          {activeTab === 'login' && (
            <div className="panel active" id="panel-login">
              <div className="form-title">Welcome back</div>
              <div className="form-sub">Sign in to continue your job search.</div>

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
                        setLoginState(s => ({ ...s, email: e.target.value }));
                        setLoginErrors(err => ({ ...err, email: false }));
                      }}
                    />
                    <EmailIcon />
                  </div>
                  {loginErrors.email && <div className="field-error">Please enter a valid email.</div>}
                </div>

                {/* Password */}
                <div className={`field ${loginErrors.password ? 'has-error' : ''}`}>
                  <div className="field-row">
                    <label htmlFor="l-password">Password</label>
                    <button
                      type="button"
                      className="field-hint"
                      onClick={handleForgot}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-wrap">
                    <input
                      type={showLoginPw ? 'text' : 'password'}
                      id="l-password"
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={loginState.password}
                      onChange={(e) => {
                        setLoginState(s => ({ ...s, password: e.target.value }));
                        setLoginErrors(err => ({ ...err, password: false }));
                      }}
                    />
                    <LockIcon />
                    <button
                      className="eye-btn"
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPw ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {loginErrors.password && <div className="field-error">Password is required.</div>}
                </div>

                <button className="btn-submit" type="submit" disabled={isSubmittingLogin}>
                  {isSubmittingLogin ? 'Signing in…' : 'Sign in to CareerNav'}
                </button>
              </form>

              <div className="switch-row">
                Don&apos;t have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('register'); }}>
                  Create one
                </a>
              </div>

              <div className="divider">
                <div className="divider-line"></div>
                <span>or continue with</span>
                <div className="divider-line"></div>
              </div>

              {/* OAuth */}
              <div className="oauth-row single">
                <button className="btn-oauth" type="button" onClick={() => handleOAuth('Google')}>
                  <div className="oauth-icon">
                    <GoogleIcon />
                  </div>
                  Continue with Google
                </button>
              </div>
            </div>
          )}

          {/* ══ CREATE ACCOUNT PANEL ══ */}
          {activeTab === 'register' && (
            <div className="panel active" id="panel-register">
              <div className="form-title">Create your account</div>
              <div className="form-sub">Free forever — no credit card needed.</div>

              <form onSubmit={handleRegisterSubmit} noValidate>
                {/* Name Row */}
                <div className="name-row">
                  <div className={`field ${registerErrors.firstName ? 'has-error' : ''}`}>
                    <label htmlFor="r-firstname">First name</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="r-firstname"
                        placeholder="Văn A"
                        autoComplete="given-name"
                        value={registerState.firstName}
                        onChange={(e) => {
                          setRegisterState(s => ({ ...s, firstName: e.target.value }));
                          setRegisterErrors(err => ({ ...err, firstName: false }));
                        }}
                      />
                      <UserIcon />
                    </div>
                    {registerErrors.firstName && <div className="field-error">Required.</div>}
                  </div>

                  <div className={`field ${registerErrors.lastName ? 'has-error' : ''}`}>
                    <label htmlFor="r-lastname">Last name</label>
                    <div className="input-wrap">
                      <input
                        type="text"
                        id="r-lastname"
                        placeholder="Nguyễn"
                        autoComplete="family-name"
                        value={registerState.lastName}
                        onChange={(e) => {
                          setRegisterState(s => ({ ...s, lastName: e.target.value }));
                          setRegisterErrors(err => ({ ...err, lastName: false }));
                        }}
                      />
                      <UserIcon />
                    </div>
                    {registerErrors.lastName && <div className="field-error">Required.</div>}
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
                        setRegisterState(s => ({ ...s, email: e.target.value }));
                        setRegisterErrors(err => ({ ...err, email: false }));
                      }}
                    />
                    <EmailIcon />
                  </div>
                  {registerErrors.email && <div className="field-error">Please enter a valid email.</div>}
                </div>

                {/* Password */}
                <div className={`field ${registerErrors.password ? 'has-error' : ''}`}>
                  <label htmlFor="r-password">Password</label>
                  <div className="input-wrap">
                    <input
                      type={showRegisterPw ? 'text' : 'password'}
                      id="r-password"
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      value={registerState.password}
                      onChange={(e) => {
                        setRegisterState(s => ({ ...s, password: e.target.value }));
                        setRegisterErrors(err => ({ ...err, password: false }));
                      }}
                    />
                    <LockIcon />
                    <button
                      className="eye-btn"
                      type="button"
                      onClick={() => setShowRegisterPw(!showRegisterPw)}
                      aria-label={showRegisterPw ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPw ? <EyeOffIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                  {registerErrors.password && <div className="field-error">Password must be at least 8 characters.</div>}
                </div>

                {/* Terms Checkbox */}
                <div className="check-row">
                  <input
                    type="checkbox"
                    id="r-terms"
                    checked={registerState.terms}
                    onChange={(e) => setRegisterState(s => ({ ...s, terms: e.target.checked }))}
                  />
                  <label className="check-label" htmlFor="r-terms">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. No spam, ever.
                  </label>
                </div>

                <button className="btn-submit" type="submit" disabled={isSubmittingRegister}>
                  {isSubmittingRegister ? 'Creating account…' : 'Create free account →'}
                </button>
              </form>

              <div className="switch-row">
                Already have an account?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('register'); }}>
                  Sign in
                </a>
              </div>

              <div className="divider">
                <div className="divider-line"></div>
                <span>or continue with</span>
                <div className="divider-line"></div>
              </div>

              {/* OAuth */}
              <div className="oauth-row single">
                <button className="btn-oauth" type="button" onClick={() => handleOAuth('Google')}>
                  <div className="oauth-icon">
                    <GoogleIcon />
                  </div>
                  Sign up with Google
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
