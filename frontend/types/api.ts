/**
 * Types mirroring backend response/request schemas (docs/API_CONTRACT.md).
 * Keep field names snake_case to match the API payloads exactly.
 */

/* ── A1. Auth ── */
export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/* ── A2. Profile ── */
export type TemplateName = "classic" | "modern" | "academic";

export interface ExperienceIn {
  title: string;
  organization: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  display_order?: number;
}

export interface EducationIn {
  school: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  display_order?: number;
}

export interface ExperienceOut extends ExperienceIn {
  id: string;
}

export interface EducationOut extends EducationIn {
  id: string;
}

export interface SkillOut {
  id: string;
  skill_name: string;
}

export interface CertificationIn {
  title: string;
  obtain_date: string;
  display_order?: number;
}

export interface CertificationOut extends CertificationIn {
  id: string;
}

export interface ProfileUpdate {
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  phone?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  preferred_template?: TemplateName;
  experiences: ExperienceIn[];
  educations: EducationIn[];
  certifications: CertificationIn[];
  skills: string[];
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  phone?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  preferred_template: TemplateName;
  experiences: ExperienceOut[];
  educations: EducationOut[];
  certifications: CertificationOut[];
  skills: SkillOut[];
}

/* ── A3. Preferences ── */
export type RemotePreference = "remote" | "hybrid" | "onsite";

export interface PreferencesUpdate {
  target_role: string;
  preferred_locations: string[];
  remote_preference?: RemotePreference | null;
}

export interface PreferencesResponse extends PreferencesUpdate {
  id: string;
  profile_id: string;
}

/* ── A4. Jobs ── */
export interface JobOut {
  id: string;
  source: "linkedin" | "indeed" | "manual";
  external_job_id?: string | null;
  title: string;
  company: string;
  location?: string | null;
  employment_type?: string | null;
  seniority_level?: string | null;
  url?: string | null;
  description?: string | null;
  posted_at?: string | null;
  scraped_at?: string | null;
  status: "active" | "expired" | "closed";
  expires_at?: string | null;
}

export interface JobListResponse {
  items: JobOut[];
  page: number;
  limit: number;
  total: number;
}

export interface SelectResponse {
  applications: {
    id: string;
    job_id: string;
    generation_status: GenerationStatus;
  }[];
}

/* ── A5. Applications ── */
export type GenerationStatus =
  | "saved"
  | "cv_queued"
  | "cv_generating"
  | "cv_generated"
  | "ats_scoring"
  | "completed"
  | "needs_review"
  | "failed";

export type PipelineStage =
  "saved" | "applied" | "interview" | "offer" | "rejected";

export interface ApplicationListItem {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  generation_status: GenerationStatus;
  pipeline_stage: PipelineStage;
  overall_score?: number | null;
  created_at: string;
}

export interface ApplicationListResponse {
  items: ApplicationListItem[];
  page: number;
  limit: number;
  total: number;
}

/** Một khuyến nghị của ats-agent — khớp `Recommendation` trong libs/schemas. */
export interface AtsRecommendation {
  type: string;
  title: string;
  body: string;
}

export interface AtsReport {
  id: string;
  overall_score: number;
  score_breakdown?: Record<string, number> | null;
  matched_keywords: string[];
  missing_keywords: string[];
  recommendations: AtsRecommendation[];
  cover_letter_text?: string | null;
  model_used?: string | null;
  generated_at?: string | null;
}

export interface ApplicationDetail {
  id: string;
  user_id: string;
  job_id: string;
  generation_status: GenerationStatus;
  pipeline_stage: PipelineStage;
  cv_generation?: CvResponse | null;
  ats_report?: AtsReport | null;
  created_at: string;
}

/* ── A6. CVs ── */
export interface CvExperienceItem {
  title: string;
  organization: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export interface CvEducationItem {
  school: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
}

export interface CvCertificationItem {
  title: string;
  obtain_date: string;
}

export interface CvContent {
  summary: string;
  experience: CvExperienceItem[];
  education: CvEducationItem[];
  certifications: CvCertificationItem[];
  skills: string[];
}

export type CvEditStatus = "draft" | "edited";

export interface CvResponse {
  id: string;
  application_id: string;
  cv_json: CvContent;
  edit_status: CvEditStatus;
  model_used: string;
  generated_at: string;
}

/* ── A7. PDF export ── */
export interface PdfHeader {
  full_name?: string;
  email?: string;
  phone?: string;
  headline?: string;
  location?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface PdfExportRequest {
  template: TemplateName;
  cv_data: CvContent;
  header: PdfHeader;
}
