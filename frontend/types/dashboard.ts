export interface DashboardStats {
  avgAtsScore: number;
  atsTrend: number; // delta %, positive = increase
  tailoredCvCount: number;
  totalApplied: number;
  interviewsScheduled: number;
}

export type ApplicationStatus =
  | "not_applied"
  | "pending"
  | "under_review"
  | "scheduled"
  | "final_round"
  | "offer"
  | "rejected";

export interface PipelineItem {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  logoColor?: string; // background color for letter avatar
  logoLetter?: string; // single letter for avatar
  applicationStatus: ApplicationStatus;
  interviewDate?: string; // ISO date string, e.g. "2026-07-14"
  atsScore?: number; // 0–100
  cvLabel?: string; // e.g. "View CV →" | "+ Create CV"
  dateLabel?: string; // Human-readable label shown in footer
}

export interface PipelineData {
  saved: PipelineItem[];
  applied: PipelineItem[];
  interviewing: PipelineItem[];
  offer: PipelineItem[];
  rejected: PipelineItem[];
}

export type RecommendationType = "warning" | "action" | "info";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  body: string; // may contain <b> HTML tags
  actionLabel: string;
  actionHref: string;
}
