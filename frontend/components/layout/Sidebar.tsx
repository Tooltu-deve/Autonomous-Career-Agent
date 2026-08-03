'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  DashboardIcon,
  RadarIcon,
  CVIcon,
  UserIcon,
  LogoutIcon,
} from '@/components/icons';
import s from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/jobs', label: 'Smart Radar', icon: <RadarIcon /> },
  { href: '/cv-tailoring', label: 'CV Tailoring', icon: <CVIcon /> },
  { href: '/profile-setup', label: 'Profile', icon: <UserIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const initials = session
    ? `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  const displayName = session
    ? `${session.firstName} ${session.lastName}`.trim()
    : 'Guest';

  const handleLogout = () => {
    logout();
    // Also clear the cookie used by middleware
    document.cookie = 'careernav_session=; Max-Age=0; path=/';
    router.push('/');
  };

  return (
    <aside className={s.sidebar}>
      {/* Brand */}
      <Link href="/dashboard" className={s.brand}>
        <div className={s.brandMark}>
          <span />
          <span />
          <span />
        </div>
        <div className={s.brandName}>CareerNav</div>
      </Link>

      {/* Workspace nav */}
      <div className={s.sectionLabel}>Workspace</div>
      <nav className={s.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`${s.navItem} ${active ? s.active : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {icon}
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={s.spacer} />

      {/* Profile card */}
      <div className={s.profileCard}>
        <div className={s.avatar} aria-hidden="true">
          {initials}
        </div>
        <div className={s.profileMeta}>
          <div className={s.profileName} title={displayName}>
            {displayName}
          </div>
          <div className={s.profileSub}>Your Account</div>
        </div>
        <button
          className={s.logoutBtn}
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          type="button"
        >
          <LogoutIcon />
        </button>
      </div>
    </aside>
  );
}
