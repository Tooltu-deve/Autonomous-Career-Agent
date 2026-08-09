import { describe, it, expect } from "vitest";
import { joinObtainDate, splitObtainDate } from "@/lib/format";

describe("splitObtainDate", () => {
  it("tách ngày ISO thành tháng và năm", () => {
    expect(splitObtainDate("2024-05-01")).toEqual({
      month: "05",
      year: "2024",
    });
  });

  it("giữ tháng 2 chữ số ở cả hai biên", () => {
    expect(splitObtainDate("2024-01-01").month).toBe("01");
    expect(splitObtainDate("2024-12-01").month).toBe("12");
  });

  it("trả rỗng cho giá trị rỗng hoặc không hợp lệ", () => {
    expect(splitObtainDate("")).toEqual({ month: "", year: "" });
    expect(splitObtainDate("khong-phai-ngay")).toEqual({
      month: "",
      year: "",
    });
    expect(splitObtainDate("2024")).toEqual({ month: "", year: "" });
  });
});

describe("joinObtainDate", () => {
  it("ghép thành ISO với ngày 01", () => {
    expect(joinObtainDate("05", "2024")).toBe("2024-05-01");
  });

  it("trả rỗng khi thiếu một trong hai", () => {
    expect(joinObtainDate("05", "")).toBe("");
    expect(joinObtainDate("", "2024")).toBe("");
    expect(joinObtainDate("", "")).toBe("");
  });

  it("round-trip giữ nguyên giá trị", () => {
    const iso = "2019-09-01";
    const { month, year } = splitObtainDate(iso);
    expect(joinObtainDate(month, year)).toBe(iso);
  });
});
