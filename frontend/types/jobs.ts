/**
 * View model for the Job Radar page: a backend job (`GET /jobs`) merged with
 * the user's application state for that job (`GET /applications`).
 */
import type { GenerationStatus, JobOut } from "@/types/api";

export type JobStage = "saved" | "applied" | "interview" | "none";

export interface JobView {
  job: JobOut;
  /** Derived from the matching application's pipeline_stage, if any. */
  stage: JobStage;
  /** CV pipeline status of the matching application, if any. */
  generationStatus?: GenerationStatus;
  applicationId?: string;
}
