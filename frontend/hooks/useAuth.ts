'use client';

import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '@/lib/storage';
import type { SessionUser } from '@/types/auth';

function readSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEYS.session);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function useAuth(): {
  session: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
} {
  const [session, setSession] = useState<SessionUser | null>(null);

  // Read the persisted session after mount only, so the server-rendered HTML
  // and the first client render agree (avoids a Next.js hydration mismatch).
  useEffect(() => {
    setSession(readSession());
  }, []);

  const login = useCallback((user: SessionUser) => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(KEYS.session, JSON.stringify(user));
      } catch {
        /* ignore storage-restricted contexts */
      }
    }
    setSession(user);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(KEYS.session);
      } catch {
        /* ignore storage-restricted contexts */
      }
    }
    setSession(null);
  }, []);

  return { session, login, logout };
}
