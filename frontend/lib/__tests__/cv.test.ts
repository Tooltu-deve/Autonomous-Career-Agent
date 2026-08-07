import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadCvViews } from "@/lib/cv";
import { getApplication, listApplications } from "@/lib/api";
import type { ApplicationDetail, ApplicationListItem } from "@/types/api";

vi.mock("@/lib/api", () => ({
  listApplications: vi.fn(),
  getApplication: vi.fn(),
}));

const mockedListApplications = vi.mocked(listApplications);
const mockedGetApplication = vi.mocked(getApplication);

const DISTINCTIVE_LETTER = "ZEBRA-STRIPE-COVER-LETTER-TEXT-42";

function baseListItem(
  overrides: Partial<ApplicationListItem>,
): ApplicationListItem {
  return {
    id: "app-1",
    job_id: "job-1",
    job_title: "Backend Engineer",
    company: "Acme Corp",
    generation_status: "completed",
    pipeline_stage: "applied",
    overall_score: 80,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  mockedListApplications.mockReset();
  mockedGetApplication.mockReset();
});

describe("loadCvViews — cover letter mapping", () => {
  it("maps ats_report.cover_letter_text to CvView.coverLetter", async () => {
    const item = baseListItem({});
    const detail: ApplicationDetail = {
      id: "app-1",
      user_id: "user-1",
      job_id: "job-1",
      generation_status: "completed",
      pipeline_stage: "applied",
      cv_generation: {
        id: "cv-1",
        application_id: "app-1",
        cv_json: { summary: "", experience: [], education: [], skills: [] },
        edit_status: "draft",
        model_used: "claude-opus-4-8",
        generated_at: "2026-01-02T00:00:00Z",
      },
      ats_report: {
        id: "ats-1",
        overall_score: 80,
        matched_keywords: [],
        missing_keywords: [],
        recommendations: [],
        cover_letter_text: DISTINCTIVE_LETTER,
        model_used: "claude-opus-4-8",
      },
      created_at: "2026-01-01T00:00:00Z",
    };

    mockedListApplications.mockResolvedValue({
      items: [item],
      page: 1,
      limit: 100,
      total: 1,
    });
    mockedGetApplication.mockResolvedValue(detail);

    const views = await loadCvViews();

    expect(views).toHaveLength(1);
    expect(views[0].coverLetter).toBe(DISTINCTIVE_LETTER);
  });

  it("gives placeholder views (cv_queued/cv_generating) an empty coverLetter", async () => {
    const queued = baseListItem({
      id: "app-2",
      generation_status: "cv_queued",
      overall_score: null,
    });
    const generating = baseListItem({
      id: "app-3",
      generation_status: "cv_generating",
      overall_score: null,
    });

    mockedListApplications.mockResolvedValue({
      items: [queued, generating],
      page: 1,
      limit: 100,
      total: 2,
    });

    const views = await loadCvViews();

    expect(views).toHaveLength(2);
    expect(views[0].coverLetter).toBe("");
    expect(views[1].coverLetter).toBe("");
    // Placeholder path never needs the detail endpoint.
    expect(mockedGetApplication).not.toHaveBeenCalled();
  });
});
