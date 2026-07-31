import { describe, it, expect, beforeEach } from 'vitest';
import { KEYS, readJSON, writeJSON } from '@/lib/storage';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('exposes the fixed storage keys', () => {
    expect(KEYS.users).toBe('careernav_users');
    expect(KEYS.session).toBe('careernav_session');
    expect(KEYS.profileDone).toBe('careernav_profile_completed');
    expect(KEYS.prefsDone).toBe('careernav_preferences_completed');
  });

  it('round-trips a value', () => {
    writeJSON('k', { a: 1 });
    expect(readJSON('k', null)).toEqual({ a: 1 });
  });

  it('returns fallback when key is missing', () => {
    expect(readJSON('missing', [])).toEqual([]);
  });

  it('returns fallback when value is corrupt JSON', () => {
    localStorage.setItem('bad', '{not json');
    expect(readJSON('bad', 'fallback')).toBe('fallback');
  });
});
