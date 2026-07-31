export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPassword(v: string): boolean {
  return v.length >= 8;
}
