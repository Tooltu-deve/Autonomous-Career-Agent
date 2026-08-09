export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isValidPassword(v: string): boolean {
  return v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
}

/* ── Profile field validation ── */

export interface ProfileFormErrors {
  phone?: string;
  github?: string;
  linkedin?: string;
}

/** E.164: '+' followed by 8–15 digits, first digit non-zero. */
const E164_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Validate the editable fields of a user's profile.
 *
 * Every profile field is optional — `PUT /profile` accepts null for all of
 * them (API_CONTRACT §A2), and the setup wizard has a "Skip for now" path.
 * The only rule is a format check on phone, and only when one is entered.
 *
 * Separators the user typed (spaces, dots, dashes, parentheses) are stripped
 * before the check, so "+84 901 234 567" is accepted and stored as typed.
 * Returns an empty object when everything is valid.
 */
/* Chấp nhận mọi domain: field là "GitHub / Portfolio", nên trang cá nhân
 * (thomastu.dev) cũng hợp lệ. Scheme và www đều tuỳ chọn — pdf-service tự thêm
 * https:// khi dựng link trong CV. */
const URL_LIKE_RE = /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i;

/** LinkedIn cá nhân: /in/ (hoặc /pub/ với tài khoản cũ). */
const LINKEDIN_RE =
  /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[^\s/]+\/?$/i;

export function validateProfile(fields: {
  phone: string;
  github?: string;
  linkedin?: string;
}): ProfileFormErrors {
  const errs: ProfileFormErrors = {};

  const phone = fields.phone.replace(/[\s.()-]/g, "");
  if (phone && !E164_RE.test(phone))
    errs.phone = "Phone must be in international format, e.g. +84 901 234 567.";

  const github = (fields.github ?? "").trim();
  if (github) {
    if (!URL_LIKE_RE.test(github))
      errs.github = "Enter a valid link, e.g. github.com/username.";
    else if (/(^|\.)linkedin\.com/i.test(github))
      errs.github = "That looks like LinkedIn — use the LinkedIn field below.";
  }

  const linkedin = (fields.linkedin ?? "").trim();
  if (linkedin && !LINKEDIN_RE.test(linkedin))
    errs.linkedin =
      "Enter your LinkedIn profile link, e.g. linkedin.com/in/username.";

  return errs;
}

/* ── Chứng chỉ ── */

export interface CertificationRow {
  id: number | string;
  title: string;
  month: string;
  year: string;
}

/**
 * Kiểm tra từng dòng chứng chỉ, trả map `id` -> thông điệp lỗi.
 *
 * Dòng trống hoàn toàn KHÔNG phải lỗi: người dùng bấm "Add" rồi đổi ý là chuyện
 * bình thường, và những dòng đó bị lọc bỏ trước khi gửi API.
 */
export function validateCertifications(
  list: CertificationRow[],
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const c of list) {
    const title = c.title.trim();
    const hasDate = Boolean(c.month && c.year);
    if (!title && !c.month && !c.year) continue;
    if (title && !hasDate) {
      errs[String(c.id)] = "Select the month and year this was obtained.";
    } else if (!title) {
      errs[String(c.id)] = "Enter the certification name.";
    }
  }
  return errs;
}

/* ── Kinh nghiệm làm việc ── */

/**
 * `organization` là `str` bắt buộc ở backend (ExperienceIn), nên dòng nào có
 * chức danh thì phải có tổ chức, và ngược lại. Ngày tháng KHÔNG bắt buộc —
 * backend khai Optional, siết chặt hơn sẽ làm hỏng luồng Skip.
 */
export function validateExperiences(
  list: { id: number | string; title: string; organization: string }[],
): Record<string, string> {
  const errs: Record<string, string> = {};
  for (const e of list) {
    const title = e.title.trim();
    const org = e.organization.trim();
    if (!title && !org) continue;
    if (title && !org) {
      errs[String(e.id)] = "Enter the company or organization.";
    } else if (!title) {
      errs[String(e.id)] = "Enter the job title.";
    }
  }
  return errs;
}
