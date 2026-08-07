/**
 * View models + helpers for the CV Manager.
 * A "CV" in the UI = an application's cv_generation joined with its ats_report
 * (backend: GET /applications → GET /applications/{id}, PUT /cvs/{id}).
 */
import { getApplication, listApplications } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type {
  ApplicationListItem,
  AtsRecommendation,
  CvContent,
  CvEditStatus,
  GenerationStatus,
} from "@/types/api";

export interface CvView {
  /** cv_generations.id — used for PUT /cvs/{id}.
   *  Với card placeholder (cv_queued/cv_generating, CV chưa sinh) đây là
   *  application id — card đó bị khoá click nên không bao giờ dùng để PUT. */
  cvId: string;
  applicationId: string;
  title: string;
  sourceJob: string;
  atsScore: number | null;
  updatedAt: string;
  editStatus: CvEditStatus;
  generationStatus: GenerationStatus;
  content: CvContent;
  matched: string[];
  missing: string[];
  recommendations: AtsRecommendation[];
  coverLetter: string;
}

/** Statuses in which a cv_generations row exists for the application. */
const HAS_CV: GenerationStatus[] = [
  "cv_generated",
  "ats_scoring",
  "completed",
  "needs_review",
];

/** CV chưa sinh nhưng pipeline đã nhận việc → hiện card placeholder loading. */
const PIPELINE_QUEUED: GenerationStatus[] = ["cv_queued", "cv_generating"];

const EMPTY_CONTENT: CvContent = {
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

function titleOf(item: ApplicationListItem): string {
  return `${item.job_title} — ${item.company}`.replace(/ — $/, "");
}

/** Card loading cho application vừa bấm "Tạo CV" — chưa có cv_generation row. */
function placeholderView(item: ApplicationListItem): CvView {
  return {
    cvId: item.id,
    applicationId: item.id,
    title: titleOf(item),
    sourceJob: `${item.job_title} at ${item.company}`,
    atsScore: null,
    updatedAt: formatDate(item.created_at),
    editStatus: "draft",
    generationStatus: item.generation_status,
    content: structuredClone(EMPTY_CONTENT),
    matched: [],
    missing: [],
    recommendations: [],
    coverLetter: "",
  };
}

export async function loadCvViews(): Promise<CvView[]> {
  const { items } = await listApplications();

  const detailsById = new Map<
    string,
    Awaited<ReturnType<typeof getApplication>> | null
  >();
  await Promise.all(
    items
      .filter((item) => HAS_CV.includes(item.generation_status))
      .map(async (item) => {
        detailsById.set(
          item.id,
          await getApplication(item.id).catch(() => null),
        );
      }),
  );

  const views: CvView[] = [];
  for (const item of items) {
    if (PIPELINE_QUEUED.includes(item.generation_status)) {
      views.push(placeholderView(item));
      continue;
    }
    const detail = detailsById.get(item.id);
    if (!detail?.cv_generation) continue;
    const cv = detail.cv_generation;
    const report = detail.ats_report;
    views.push({
      cvId: cv.id,
      applicationId: detail.id,
      title: titleOf(item),
      sourceJob: `${item.job_title} at ${item.company}`,
      atsScore: report?.overall_score ?? null,
      updatedAt: formatDate(cv.generated_at),
      editStatus: cv.edit_status,
      generationStatus: detail.generation_status,
      content: cv.cv_json,
      matched: report?.matched_keywords ?? [],
      missing: report?.missing_keywords ?? [],
      recommendations: report?.recommendations ?? [],
      coverLetter: report?.cover_letter_text ?? "",
    });
  }
  return views;
}

export function cloneCvContent(content: CvContent): CvContent {
  return structuredClone(content);
}

export function validateCvContent(content: CvContent): string | null {
  if (!content.summary.trim()) return "Summary is required.";
  if (
    !content.experience.every(
      (item) => item.title.trim() && item.organization.trim(),
    )
  )
    return "Each experience needs a title and an organization.";
  if (!content.education.every((item) => item.school.trim()))
    return "Each education entry needs a school.";
  return null;
}
