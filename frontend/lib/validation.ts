export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPassword(v: string): boolean {
  return v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
}

/* ── Profile field validation ── */

export interface ProfileFormErrors {
  headline?: string;
  phone?: string;
}

/** E.164: starts with '+' followed by 8–15 digits */
const E164_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Validate the editable fields of a user's profile.
 * - headline: required
 * - phone: optional, but must be E.164 when provided
 * Returns an empty object when everything is valid.
 */
export function validateProfile(fields: {
  headline: string;
  phone: string;
}): ProfileFormErrors {
  const errs: ProfileFormErrors = {};
  if (!fields.headline.trim())
    errs.headline = "Professional Headline is required.";
  if (fields.phone.trim() && !E164_RE.test(fields.phone.trim()))
    errs.phone = "Phone must be in E.164 format (e.g. +84912345678).";
  return errs;
}
