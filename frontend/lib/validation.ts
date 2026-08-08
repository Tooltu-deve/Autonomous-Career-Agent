export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPassword(v: string): boolean {
  return v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
}
