import { describe, it, expect } from "vitest";
import {
  validateGeneratedCVContent,
  type GeneratedCVContent,
} from "@/lib/mock/cv";

function makeContent(
  overrides: Partial<GeneratedCVContent> = {},
): GeneratedCVContent {
  return {
    name: "Minh Tran",
    email: "minh@example.com",
    location: "Hanoi",
    headline: "Backend Engineer",
    summary: "Experienced backend engineer.",
    experience: [
      {
        company: "VNG",
        role: "Engineer",
        dates: "2020-2023",
        bullets: ["Built services"],
      },
    ],
    skills: ["Python"],
    ...overrides,
  };
}

describe("validateGeneratedCVContent", () => {
  it("returns null for valid content", () => {
    expect(validateGeneratedCVContent(makeContent())).toBeNull();
  });

  it("requires name, headline, and summary", () => {
    const msg = "Name, headline, and summary are required.";
    expect(validateGeneratedCVContent(makeContent({ name: "  " }))).toBe(msg);
    expect(validateGeneratedCVContent(makeContent({ headline: "" }))).toBe(msg);
    expect(validateGeneratedCVContent(makeContent({ summary: "" }))).toBe(msg);
  });

  it("requires a valid email (must contain @)", () => {
    expect(validateGeneratedCVContent(makeContent({ email: "minh.example.com" }))).toBe(
      "Enter a valid email address.",
    );
  });

  it("requires at least one fully-filled experience with a bullet", () => {
    const msg =
      "Each experience needs company, role, dates, and at least one bullet.";
    expect(validateGeneratedCVContent(makeContent({ experience: [] }))).toBe(msg);
    expect(
      validateGeneratedCVContent(
        makeContent({
          experience: [
            { company: "VNG", role: "Engineer", dates: "2020", bullets: ["  "] },
          ],
        }),
      ),
    ).toBe(msg);
    expect(
      validateGeneratedCVContent(
        makeContent({
          experience: [
            { company: "", role: "Engineer", dates: "2020", bullets: ["x"] },
          ],
        }),
      ),
    ).toBe(msg);
  });
});
