import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EducationForm } from "../EducationForm";
import type { EducationItem } from "../EducationForm";

const onAdd = vi.fn();
const onRemove = vi.fn();
const onUpdate = vi.fn();
const props = { onAdd, onRemove, onUpdate };

const empty: EducationItem = {
  id: "a",
  university: "",
  degree: "",
  fieldOfStudy: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  description: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EducationForm", () => {
  it("render các ô mới: chuyên ngành, khoảng thời gian, mô tả", () => {
    render(<EducationForm education={[empty]} {...props} />);
    expect(screen.getByLabelText(/field of study/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to year/i)).toBeInTheDocument();
  });

  it("To year chọn được năm tốt nghiệp dự kiến ở tương lai", () => {
    // Sinh viên đang học phải khai được năm tốt nghiệp; ô này trước đây chặn
    // ở năm hiện tại nên họ không có lựa chọn nào đúng.
    render(<EducationForm education={[empty]} {...props} />);
    const years = Array.from(
      screen.getByLabelText(/to year/i).querySelectorAll("option"),
    ).map((o) => o.getAttribute("value"));
    expect(years).toContain(String(new Date().getFullYear() + 1));
  });

  it("học vấn KHÔNG có checkbox 'currently'", () => {
    // Trên CV người ta không viết "hiện đang học" — bỏ trống To là đủ.
    render(<EducationForm education={[empty]} {...props} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("đổi chuyên ngành gọi onUpdate đúng field", () => {
    render(<EducationForm education={[empty]} {...props} />);
    fireEvent.change(screen.getByLabelText(/field of study/i), {
      target: { value: "Software Engineering" },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      "a",
      "fieldOfStudy",
      "Software Engineering",
    );
  });

  it("đổi năm kết thúc đi qua MonthYearRange", () => {
    render(<EducationForm education={[empty]} {...props} />);
    fireEvent.change(screen.getByLabelText(/to year/i), {
      target: { value: "2023" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "endYear", "2023");
  });

  it("vẫn giữ được hai ô cũ", () => {
    render(<EducationForm education={[empty]} {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/mit/i), {
      target: { value: "HCMUS" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "university", "HCMUS");
  });
});
