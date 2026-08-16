import { describe, it, expect, vi, beforeEach } from "vitest";
import { cloneCvContent, loadCvViews, validateCvContent } from "@/lib/cv";
import { getApplication, listApplications } from "@/lib/api";
import type {
  ApplicationDetail,
  ApplicationListItem,
  CvContent,
} from "@/types/api";

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
        cv_json: {
          summary: "",
          experience: [],
          education: [],
          certifications: [],
          skill_groups: [],
        },
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

describe("cloneCvContent", () => {
  it("normalizes collection fields missing from a legacy CV", () => {
    const legacyContent = {
      summary: "Legacy CV",
      experience: [],
      education: [],
      skills: [],
    } as unknown as CvContent;

    expect(cloneCvContent(legacyContent)).toEqual({
      summary: "Legacy CV",
      experience: [],
      education: [],
      certifications: [],
      skill_groups: [],
    });
  });

  it("folds legacy flat skills into one group and drops the legacy key", () => {
    const legacyContent = {
      summary: "Legacy CV",
      experience: [],
      education: [],
      certifications: [],
      skills: ["python", "sql"],
    } as unknown as CvContent;

    const cloned = cloneCvContent(legacyContent);

    expect(cloned.skill_groups).toEqual([
      { category: "Skills", skills: ["python", "sql"] },
    ]);
    // The draft is saved verbatim and then exported, so the legacy key must
    // not survive the round-trip.
    expect(cloned).not.toHaveProperty("skills");
  });

  it("prefers existing skill_groups over legacy flat skills", () => {
    const mixed = {
      summary: "Mixed CV",
      experience: [],
      education: [],
      certifications: [],
      skill_groups: [{ category: "Cloud", skills: ["AWS"] }],
      skills: ["python"],
    } as unknown as CvContent;

    expect(cloneCvContent(mixed).skill_groups).toEqual([
      { category: "Cloud", skills: ["AWS"] },
    ]);
  });
});

describe("validateCvContent", () => {
  const validContent = (): CvContent => ({
    summary: "Backend engineer",
    experience: [],
    education: [],
    certifications: [],
    skill_groups: [],
  });

  it("rejects a skill group without a category name", () => {
    expect(
      validateCvContent({
        ...validContent(),
        skill_groups: [{ category: "  ", skills: ["AWS"] }],
      }),
    ).toBe("Each skill group needs a category name.");
  });

  it("accepts a named skill group that has no skills yet", () => {
    expect(
      validateCvContent({
        ...validContent(),
        skill_groups: [{ category: "Cloud Platforms", skills: [] }],
      }),
    ).toBeNull();
  });

  it("accepts a complete certification", () => {
    expect(
      validateCvContent({
        ...validContent(),
        certifications: [
          { title: "AWS Certified Developer", obtain_date: "2024-05-01" },
        ],
      }),
    ).toBeNull();
  });

  it("requires both the certification name and obtained date", () => {
    expect(
      validateCvContent({
        ...validContent(),
        certifications: [{ title: "AWS Certified Developer", obtain_date: "" }],
      }),
    ).toBe("Each certification needs a name and an obtained date.");
  });
});
