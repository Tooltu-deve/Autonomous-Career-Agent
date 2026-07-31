'use client';

import { useCallback, useEffect, useState } from 'react';
import { KEYS, readJSON, writeJSON } from '@/lib/storage';
import type { SessionUser } from '@/types/auth';

export function useAuth(): {
  session: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
} {
  const [session, setSession] = useState<SessionUser | null>(null);

  // Read persisted session after mount only, so server-rendered HTML and the
  // first client render agree (avoids a Next.js hydration mismatch).
  useEffect(() => {
    setSession(readJSON<SessionUser | null>(KEYS.session, null));
  }, []);

  const login = useCallback((user: SessionUser) => {
    writeJSON(KEYS.session, user);
    setSession(user);
  }, []);

  const logout = useCallback(() => {
    // Purge any stale pre-refactor session that used sessionStorage; guarded
    // because storage access can throw in restricted (e.g. private) contexts.
    try {
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(KEYS.session);
    } catch {
      /* ignore storage-restricted contexts */
    }
    writeJSON(KEYS.session, null);
    setSession(null);
  }, []);

  return { session, login, logout };
}
