export interface DashboardStats {
  avgAtsScore: number;
  atsTrend: number; // delta %, positive = increase
  tailoredCvCount: number;
  totalApplied: number;
  interviewsScheduled: number;
}

export type ApplicationStatus =
  | 'not_applied'
  | 'pending'
  | 'under_review'
  | 'scheduled'
  | 'final_round'
  | 'offer'
  | 'rejected';

export interface PipelineItem {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  applicationStatus: ApplicationStatus;
  interviewDate?: string; // ISO date string, e.g. "2026-07-14"
}

export interface PipelineData {
  saved: PipelineItem[];
  applied: PipelineItem[];
  interviewing: PipelineItem[];
}

export type RecommendationType = 'warning' | 'action' | 'info';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  body: string; // may contain <b> HTML tags
  actionLabel: string;
  actionHref: string;
}
