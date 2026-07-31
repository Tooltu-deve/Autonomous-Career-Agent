import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, getUsers, saveUser, findUser, emailExists } from '@/lib/auth';
import type { StoredUser } from '@/types/auth';

function makeUser(email: string, password: string): StoredUser {
  return {
    email,
    passwordHash: hashPassword(password),
    firstName: 'A',
    lastName: 'B',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('auth', () => {
  beforeEach(() => localStorage.clear());

  it('hashPassword is deterministic and non-empty', () => {
    expect(hashPassword('secret')).toBe(hashPassword('secret'));
    expect(hashPassword('secret')).not.toBe(hashPassword('other'));
    expect(hashPassword('secret').length).toBeGreaterThan(0);
  });

  it('saves and reads users', () => {
    saveUser(makeUser('a@b.co', 'password1'));
    expect(getUsers()).toHaveLength(1);
  });

  it('finds a user by email + correct password', () => {
    saveUser(makeUser('a@b.co', 'password1'));
    expect(findUser('a@b.co', 'password1')?.email).toBe('a@b.co');
    expect(findUser('a@b.co', 'wrong')).toBeNull();
  });

  it('reports whether an email exists', () => {
    saveUser(makeUser('a@b.co', 'password1'));
    expect(emailExists('a@b.co')).toBe(true);
    expect(emailExists('none@b.co')).toBe(false);
  });
});
