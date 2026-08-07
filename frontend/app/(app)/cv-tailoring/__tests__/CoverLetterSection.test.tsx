import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CoverLetterSection } from "../CoverLetterSection";

const LETTER = "Dear Hiring Manager,\n\nI am writing to express my interest.";

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
});

describe("CoverLetterSection", () => {
  it("hiện toàn văn thư và nút copy khi có nội dung", () => {
    render(<CoverLetterSection text={LETTER} />);

    expect(
      screen.getByText(/I am writing to express my interest/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("hiện empty state và ẩn nút copy khi thư rỗng", () => {
    render(<CoverLetterSection text="   " />);

    expect(
      screen.getByText("No cover letter — the ATS agent did not produce one."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("copy đúng chuỗi và đổi nhãn thành Copied!", async () => {
    render(<CoverLetterSection text={LETTER} />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith(LETTER);
    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Copied!"),
    );
  });

  it("báo Copy failed khi clipboard lỗi", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    render(<CoverLetterSection text={LETTER} />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));

    await waitFor(() =>
      expect(screen.getByRole("button")).toHaveTextContent("Copy failed"),
    );
  });
});
