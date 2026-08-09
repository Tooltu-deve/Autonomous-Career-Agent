import { describe, it, expect } from "vitest";
import { joinMonthYear, splitMonthYear } from "@/lib/format";

describe("splitMonthYear", () => {
  it("tách ngày ISO thành tháng và năm", () => {
    expect(splitMonthYear("2024-05-01")).toEqual({
      month: "05",
      year: "2024",
    });
  });

  it("giữ tháng 2 chữ số ở cả hai biên", () => {
    expect(splitMonthYear("2024-01-01").month).toBe("01");
    expect(splitMonthYear("2024-12-01").month).toBe("12");
  });

  it("trả rỗng cho giá trị rỗng hoặc không hợp lệ", () => {
    expect(splitMonthYear("")).toEqual({ month: "", year: "" });
    expect(splitMonthYear("khong-phai-ngay")).toEqual({
      month: "",
      year: "",
    });
    expect(splitMonthYear("2024")).toEqual({ month: "", year: "" });
  });
});

describe("joinMonthYear", () => {
  it("ghép thành ISO với ngày 01", () => {
    expect(joinMonthYear("05", "2024")).toBe("2024-05-01");
  });

  it("trả rỗng khi thiếu một trong hai", () => {
    expect(joinMonthYear("05", "")).toBe("");
    expect(joinMonthYear("", "2024")).toBe("");
    expect(joinMonthYear("", "")).toBe("");
  });

  it("round-trip giữ nguyên giá trị", () => {
    const iso = "2019-09-01";
    const { month, year } = splitMonthYear(iso);
    expect(joinMonthYear(month, year)).toBe(iso);
  });
});
