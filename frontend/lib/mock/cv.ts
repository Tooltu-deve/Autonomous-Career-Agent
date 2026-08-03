/* purpose of file is to define the structure for generated CV content and related types
mockGeneratedCVs are a list of mock CVs used to initialize state before connecting to a real API. */
import { isValidEmail } from '@/lib/validation';

/* About export pdf
simulating pdf export behavior: the requestCvExport function curretnly return
a pending state, allowing the UI to run the save+ export flow while the backend pdf-service is not yet connected. */
export type GeneratedCVContent = {
  name: string;
  email: string;
  location: string;
  headline: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
  skills: string[];
};

export type GeneratedCV = {
  id: string;
  title: string;
  source_job: string;
  ats_score: number;
  updated_at: string;
  edit_status: "generated" | "edited";
  cv_json: { content: GeneratedCVContent };
  matched: string[];
  missing: string[];
};

const content = (
  headline: string,
  summary: string,
  skills: string[],
): GeneratedCVContent => ({
  name: "Minh Tran",
  email: "minh.tran@email.com",
  location: "Ho Chi Minh City, Vietnam",
  headline,
  summary,
  skills,
  experience: [
    {
      company: "FPT Software",
      role: "Software Engineer Intern",
      dates: "Jan 2024 – Present",
      bullets: [
        "Built internal tooling used by three product teams.",
        "Wrote automated test plans that cut regression time by a third.",
      ],
    },
  ],
});

export const mockGeneratedCVs: GeneratedCV[] = [
  {
    id: "vng",
    title: "AI Developer — VNG",
    source_job: "AI Developer / LLM Engineer at VNG Corporation",
    ats_score: 78,
    updated_at: "8 Jul 2024",
    edit_status: "generated",
    cv_json: {
      content: content(
        "AI Developer",
        "Software engineering student with practical experience in AI, backend services, and data pipelines.",
        ["Python", "Machine Learning", "SQL", "REST APIs", "Git", "Agile"],
      ),
    },
    matched: ["Python", "Machine Learning", "SQL", "REST APIs"],
    missing: ["Docker", "CI/CD"],
  },
  {
    id: "momo",
    title: "Backend Engineer — MoMo",
    source_job: "Backend Engineer at MoMo",
    ats_score: 85,
    updated_at: "5 Jul 2024",
    edit_status: "generated",
    cv_json: {
      content: content(
        "Backend Engineer",
        "Backend-focused engineer experienced with APIs, databases, and reliable services.",
        ["Python", "REST APIs", "SQL", "Git", "Microservices", "Docker"],
      ),
    },
    matched: ["Python", "REST APIs", "SQL", "Git"],
    missing: ["Kubernetes", "Redis"],
  },
  {
    id: "tiki",
    title: "Data Analyst — Tiki",
    source_job: "Data Analyst at Tiki Vietnam",
    ats_score: 58,
    updated_at: "2 Jul 2024",
    edit_status: "generated",
    cv_json: {
      content: content(
        "Data Analyst",
        "Data-minded developer who turns ambiguous questions into useful analysis.",
        ["SQL", "Python", "Excel", "Data Visualization"],
      ),
    },
    matched: ["SQL", "Python", "Excel"],
    missing: ["Power BI", "Tableau"],
  },
];

let sessionCVs = mockGeneratedCVs.map((cv) => structuredClone(cv));

export function getMockGeneratedCVs(): GeneratedCV[] {
  return sessionCVs.map((cv) => structuredClone(cv));
}

export function updateMockGeneratedCV(id: string, content: GeneratedCVContent, title?: string): GeneratedCV {
  const index = sessionCVs.findIndex((cv) => cv.id === id);
  if (index < 0) throw new Error("CV not found in mock repository.");
  const updated: GeneratedCV = { ...sessionCVs[index], title: title?.trim() || sessionCVs[index].title, cv_json: { content: structuredClone(content) }, edit_status: "edited", updated_at: "Just now" };
  sessionCVs[index] = updated;
  return structuredClone(updated);
}

export function createMockGeneratedCV(): GeneratedCV {
  const created: GeneratedCV = { id: `cv-${Date.now()}`, title: "Untitled tailored CV", source_job: "No source job selected", ats_score: 0, updated_at: "Just now", edit_status: "generated", cv_json: { content: { name: "", email: "", location: "", headline: "", summary: "", experience: [{ company: "", role: "", dates: "", bullets: [""] }], skills: [] } }, matched: [], missing: [] };
  sessionCVs = [created, ...sessionCVs];
  return structuredClone(created);
}

export function deleteMockGeneratedCV(id: string): void {
  sessionCVs = sessionCVs.filter((cv) => cv.id !== id);
}

export function validateGeneratedCVContent(
  content: GeneratedCVContent,
): string | null {
  if (
    !content.name.trim() ||
    !content.headline.trim() ||
    !content.summary.trim()
  )
    return "Name, headline, and summary are required.";
  if (!isValidEmail(content.email)) return "Enter a valid email address.";
  if (
    !content.experience.length ||
    !content.experience.every(
      (item) =>
        item.company.trim() &&
        item.role.trim() &&
        item.dates.trim() &&
        item.bullets.some((bullet) => bullet.trim()),
    )
  )
    return "Each experience needs company, role, dates, and at least one bullet.";
  return null;
}

export async function requestCvExport(
  _: GeneratedCV,
): Promise<{ status: "pending" }> {
  return { status: "pending" };
}
