import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CvContent, PdfHeader, TemplateName } from "@/types/api";
import { CvPreview } from "../CvPreview";

const content: CvContent = {
  summary: "Backend engineer",
  experience: [
    {
      title: "Engineer",
      organization: "CareerNav",
      start_date: "2024-01-01",
      description: ["Built APIs"],
    },
  ],
  education: [{ school: "University", degree: "BSc", description: [] }],
  certifications: [{ title: "Cloud Certificate", obtain_date: "2025-01-01" }],
  skills: ["TypeScript", "React"],
};

const header: PdfHeader = {
  full_name: "Nguyen Van A",
  headline: "Software Engineer",
  email: "a@example.com",
};

function sectionOrder(preview: HTMLElement): string[] {
  return Array.from(preview.querySelectorAll("[data-section]")).map(
    (section) => section.getAttribute("data-section") ?? "",
  );
}

describe("CvPreview", () => {
  it.each<{
    template: TemplateName;
    label: string;
    order: string[];
  }>([
    {
      template: "classic",
      label: "CV preview — Classic template",
      order: ["summary", "experience", "education", "certifications", "skills"],
    },
    {
      template: "modern",
      label: "CV preview — Modern template",
      order: ["education", "summary", "skills", "experience", "certifications"],
    },
    {
      template: "academic",
      label: "CV preview — Academic template",
      order: ["summary", "education", "experience", "certifications", "skills"],
    },
  ])("renders the $template template", ({ template, label, order }) => {
    render(<CvPreview content={content} header={header} template={template} />);

    const preview = screen.getByLabelText(label);
    expect(preview).toHaveAttribute("data-template", template);
    expect(sectionOrder(preview)).toEqual(order);
  });

  it("updates when the selected template changes", () => {
    const { rerender } = render(
      <CvPreview content={content} header={header} template="classic" />,
    );
    expect(screen.getByLabelText("CV preview — Classic template")).toBeVisible();

    rerender(<CvPreview content={content} header={header} template="modern" />);

    expect(screen.getByLabelText("CV preview — Modern template")).toBeVisible();
    expect(
      screen.queryByLabelText("CV preview — Classic template"),
    ).not.toBeInTheDocument();
  });

  it("renders a legacy CV that has no certifications field", () => {
    const legacyContent = {
      ...content,
      certifications: undefined,
    } as unknown as CvContent;

    render(
      <CvPreview content={legacyContent} header={header} template="modern" />,
    );

    expect(screen.getByLabelText("CV preview — Modern template")).toBeVisible();
    expect(screen.queryByText("Certifications")).not.toBeInTheDocument();
  });

  it("formats experience dates as month and year only", () => {
    render(<CvPreview content={content} header={header} template="classic" />);

    expect(screen.getByText("January 2024 — Present")).toBeVisible();
    expect(screen.queryByText("2024-01-01")).not.toBeInTheDocument();
  });

  it("formats certification dates as month and year only", () => {
    render(<CvPreview content={content} header={header} template="classic" />);

    expect(screen.getByText("January 2025")).toBeVisible();
    expect(screen.queryByText("2025-01-01")).not.toBeInTheDocument();
  });
});
