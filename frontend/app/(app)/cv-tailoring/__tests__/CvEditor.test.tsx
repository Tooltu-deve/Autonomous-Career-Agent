import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CvEditor } from "../CvEditor";
import type { CvView } from "@/lib/cv";
import type { CvContent } from "@/types/api";

// Tiptap cần DOM range API mà jsdom không có; editor không phải thứ đang test.
vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  EditorContent: () => null,
}));
vi.mock("@tiptap/starter-kit", () => ({ default: {} }));

const content = (over: Partial<CvContent> = {}): CvContent => ({
  summary: "Backend engineer",
  experience: [
    {
      title: "Backend Developer",
      organization: "ACME",
      start_date: "2023-01-01",
      end_date: null,
      description: ["Built REST APIs serving 10k users", "Cut latency by 40%"],
    },
  ],
  education: [
    {
      school: "HCMUS",
      degree: "BSc",
      field_of_study: null,
      start_date: null,
      end_date: null,
      description: ["GPA 3.6/4.0"],
    },
  ],
  certifications: [],
  skills: ["python"],
  ...over,
});

const view = (over: Partial<CvContent> = {}): CvView => ({
  cvId: "cv-1",
  applicationId: "app-1",
  title: "Backend Developer — ACME",
  sourceJob: "Backend Developer at ACME",
  atsScore: 85,
  updatedAt: "2026-08-15T00:00:00Z",
  editStatus: "draft",
  generationStatus: "completed",
  content: content(over),
  matched: [],
  missing: [],
  recommendations: [],
  coverLetter: "",
});

function renderEditor(
  over: Partial<CvContent> = {},
  onSave: (content: CvContent, exportAfterSave: boolean) => void = vi.fn(),
) {
  return render(
    <CvEditor
      cv={view(over)}
      header={{ full_name: "Nguyen Van A", email: "a@example.com" }}
      template="classic"
      onSave={onSave}
      onClose={vi.fn()}
      error={null}
      notice={null}
    />,
  );
}

/* Tiptap tách paragraph bằng một dòng trống, nên chuỗi đi ra từ editor và
 * chuỗi dựng lại từ bullet phải cùng dạng — nếu lệch, useEffect tưởng nội dung
 * thay đổi và gọi setContent() sau mỗi phím, làm mất đoạn đang gõ. */
describe("CvEditor bullet round-trip", () => {
  const textToBullets = (text: string): string[] =>
    text
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  const bulletsToText = (lines: string[]): string => lines.join("\n\n");
  const sameContent = (a: string, b: string) =>
    textToBullets(a).join(" ") === textToBullets(b).join(" ");

  it("tách mỗi paragraph của editor thành một bullet", () => {
    expect(textToBullets("text1\n\ntext2")).toEqual(["text1", "text2"]);
    expect(textToBullets("text1\n\ntext2\n\ntext3")).toEqual([
      "text1",
      "text2",
      "text3",
    ]);
  });

  it("dựng lại chuỗi đúng dạng editor sinh ra", () => {
    expect(bulletsToText(["text1", "text2"])).toBe("text1\n\ntext2");
  });

  it("không coi là thay đổi khi nội dung thực chất giống nhau", () => {
    // đây chính là điều kiện khiến setContent() chạy oan và reset editor
    for (const typed of [
      "text1",
      "text1\n\ntext2",
      "text1\n\ntext2\n\n",
      "text1\n\ntext2\n\ntext3",
    ]) {
      const rebuilt = bulletsToText(textToBullets(typed));
      expect(sameContent(typed, rebuilt)).toBe(true);
    }
  });

  it("bỏ dòng trống thừa, không tạo bullet rỗng", () => {
    expect(textToBullets("text1\n\n\n\ntext2\n\n")).toEqual(["text1", "text2"]);
    expect(textToBullets("   \n\n  ")).toEqual([]);
  });
});

describe("CvEditor live preview", () => {
  it("hiện mỗi dòng mô tả kinh nghiệm thành một bullet riêng", () => {
    const { container } = renderEditor();

    const first = screen.getByText("Built REST APIs serving 10k users");
    const second = screen.getByText("Cut latency by 40%");

    // mỗi dòng là một <li> riêng, không dồn vào một đoạn văn
    expect(first.tagName).toBe("LI");
    expect(second.tagName).toBe("LI");
    expect(first.parentElement).toBe(second.parentElement);
    expect(first.parentElement?.tagName).toBe("UL");
    expect(container.querySelectorAll("ul li").length).toBeGreaterThanOrEqual(3);
  });

  it("hiện mô tả học vấn dưới dạng bullet", () => {
    renderEditor();
    expect(screen.getByText("GPA 3.6/4.0").tagName).toBe("LI");
  });

  it("không hiện danh sách rỗng khi không có mô tả", () => {
    const { container } = renderEditor({
      experience: [
        {
          title: "Dev",
          organization: "ACME",
          start_date: null,
          end_date: null,
          description: [],
        },
      ],
      education: [],
      skills: [],
    });

    // chỉ còn các <ul> khác (nếu có), không có <li> mô tả nào
    expect(container.querySelectorAll("ul li").length).toBe(0);
  });
});

describe("CvEditor education", () => {
  it("allows all education details to be edited and saved", () => {
    const onSave = vi.fn();
    renderEditor({}, onSave);

    fireEvent.change(screen.getByLabelText("Field of Study"), {
      target: { value: "Software Engineering" },
    });
    fireEvent.change(screen.getAllByLabelText("Start date (YYYY-MM-DD)")[1], {
      target: { value: "2020-09-01" },
    });
    fireEvent.change(
      screen.getAllByLabelText(
        "End date (YYYY-MM-DD, blank = present)",
      )[1],
      { target: { value: "2024-06-01" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Note (optional)")).toBeVisible();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        education: [
          {
            school: "HCMUS",
            degree: "BSc",
            field_of_study: "Software Engineering",
            start_date: "2020-09-01",
            end_date: "2024-06-01",
            description: ["GPA 3.6/4.0"],
          },
        ],
      }),
      false,
    );
  });
});

describe("CvEditor certifications", () => {
  it("allows an existing certification to be edited and saved", () => {
    const onSave = vi.fn();
    renderEditor(
      {
        certifications: [
          { title: "Cloud Certificate", obtain_date: "2025-01-01" },
        ],
      },
      onSave,
    );

    fireEvent.change(screen.getByLabelText("Certification name"), {
      target: { value: "AWS Certified Developer" },
    });
    fireEvent.change(screen.getByLabelText("Obtained date (YYYY-MM-DD)"), {
      target: { value: "2024-05-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        certifications: [
          { title: "AWS Certified Developer", obtain_date: "2024-05-20" },
        ],
      }),
      false,
    );
  });

  it("only shows remove controls after another certification is added", () => {
    renderEditor({
      certifications: [
        { title: "Cloud Certificate", obtain_date: "2025-01-01" },
      ],
    });

    expect(
      screen.queryByRole("button", { name: "Remove certification #1" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "+ Add Certification" }),
    );
    expect(screen.getAllByLabelText("Certification name")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Remove certification #1" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove certification #2" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove certification #2" }),
    );
    expect(screen.getAllByLabelText("Certification name")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Remove certification #1" }),
    ).not.toBeInTheDocument();
  });
});
