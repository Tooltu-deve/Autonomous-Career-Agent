import { KEYS, readJSON, writeJSON } from '@/lib/storage';
import type { StoredUser } from '@/types/auth';

export function hashPassword(password: string): string {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = (hash * 33) ^ password.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function getUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(KEYS.users, []);
}

export function saveUser(user: StoredUser): void {
  const users = getUsers();
  users.push(user);
  writeJSON(KEYS.users, users);
}

export function findUser(email: string, password: string): StoredUser | null {
  const hash = hashPassword(password);
  return getUsers().find((u) => u.email === email && u.passwordHash === hash) ?? null;
}

export function emailExists(email: string): boolean {
  return getUsers().some((u) => u.email === email);
}
