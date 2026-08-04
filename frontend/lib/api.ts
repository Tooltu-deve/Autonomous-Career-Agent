/**
 * Single API layer for the frontend — every backend call goes through here
 * (see docs/CODING_CONVENTION.md). Talks to the api-gateway which proxies
 * to the microservices (docs/API_CONTRACT.md).
 */
import { KEYS } from "@/lib/storage";
import type {
  ApplicationDetail,
  ApplicationListResponse,
  CvContent,
  CvResponse,
  JobListResponse,
  PdfExportRequest,
  PipelineStage,
  PreferencesResponse,
  PreferencesUpdate,
  ProfileResponse,
  ProfileUpdate,
  RegisterRequest,
  RemotePreference,
  SelectResponse,
  TokenResponse,
  UserResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Token storage ── */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEYS.token);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.token, token);
  // Presence cookie so middleware.ts can gate protected routes server-side.
  document.cookie = "careernav_session=1; path=/; SameSite=Lax";
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.token);
  document.cookie = "careernav_session=; Max-Age=0; path=/";
}

/* ── Error type ── */
export class ApiError extends Error {
  status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail) && body.detail[0]?.msg)
      detail = body.detail[0].msg;
  } catch {
    /* keep default detail */
  }
  return new ApiError(res.status, detail);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

/* ── A1. Auth ── */
export function register(data: RegisterRequest): Promise<UserResponse> {
  return request<UserResponse>("/auth/register", {
    method: "POST",
    body: data,
    auth: false,
  });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/auth/me");
}

/* ── A2/A3. Profile & preferences ── */
export function getProfile(): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile");
}

export function putProfile(data: ProfileUpdate): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile", { method: "PUT", body: data });
}

export function getPreferences(): Promise<PreferencesResponse> {
  return request<PreferencesResponse>("/profile/preferences");
}

export function putPreferences(
  data: PreferencesUpdate,
): Promise<PreferencesResponse> {
  return request<PreferencesResponse>("/profile/preferences", {
    method: "PUT",
    body: data,
  });
}

/* ── A4. Jobs ── */
export function listJobs(page = 1, limit = 30): Promise<JobListResponse> {
  return request<JobListResponse>(`/jobs?page=${page}&limit=${limit}`);
}

export function searchJobs(criteria: {
  target_role: string;
  preferred_locations: string[];
  remote_preference?: RemotePreference | null;
}): Promise<JobListResponse> {
  return request<JobListResponse>("/jobs/search", {
    method: "POST",
    body: criteria,
  });
}

export function selectJobs(jobIds: string[]): Promise<SelectResponse> {
  return request<SelectResponse>("/jobs/select", {
    method: "POST",
    body: { job_ids: jobIds },
  });
}

/* ── A5. Applications ── */
export function listApplications(
  page = 1,
  limit = 100,
): Promise<ApplicationListResponse> {
  return request<ApplicationListResponse>(
    `/applications?page=${page}&limit=${limit}`,
  );
}

export function getApplication(id: string): Promise<ApplicationDetail> {
  return request<ApplicationDetail>(`/applications/${id}`);
}

export function updateApplicationStage(
  id: string,
  stage: PipelineStage,
): Promise<{ id: string; pipeline_stage: PipelineStage }> {
  return request<{ id: string; pipeline_stage: PipelineStage }>(
    `/applications/${id}`,
    { method: "PATCH", body: { pipeline_stage: stage } },
  );
}

/* ── A6. CVs ── */
export function getCv(cvId: string): Promise<CvResponse> {
  return request<CvResponse>(`/cvs/${cvId}`);
}

export function putCv(cvId: string, cvJson: CvContent): Promise<CvResponse> {
  return request<CvResponse>(`/cvs/${cvId}`, {
    method: "PUT",
    body: { cv_json: cvJson },
  });
}

/* ── A7. PDF export (binary response) ── */
export async function exportPdf(data: PdfExportRequest): Promise<Blob> {
  const token = getToken();
  const res = await fetch(`${API_URL}/pdf/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}
