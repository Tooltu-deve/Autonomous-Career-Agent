import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MonthYearRange } from "../MonthYearRange";
import { FUTURE_GRADUATION_YEARS } from "../monthYear";

const onChange = vi.fn();
const onToggleCurrent = vi.fn();

const base = {
  idPrefix: "exp-1",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  onChange,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MonthYearRange", () => {
  it("render đủ bốn select khi không có checkbox", () => {
    render(<MonthYearRange {...base} />);
    expect(screen.getByLabelText(/from month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to month/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to year/i)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("đổi tháng bắt đầu chỉ gọi đúng field đó", () => {
    render(<MonthYearRange {...base} />);
    fireEvent.change(screen.getByLabelText(/from month/i), {
      target: { value: "05" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("startMonth", "05");
  });

  it("đổi năm kết thúc chỉ gọi đúng field đó", () => {
    render(<MonthYearRange {...base} />);
    fireEvent.change(screen.getByLabelText(/to year/i), {
      target: { value: "2024" },
    });
    expect(onChange).toHaveBeenCalledWith("endYear", "2024");
  });

  it("chọn tháng khi chưa có năm không làm mất tháng", () => {
    // Cùng hồi quy đã khoá ở CertificationsForm: state phải giữ month/year
    // tách rời, không được gộp thành chuỗi ISO.
    const { rerender } = render(<MonthYearRange {...base} />);
    fireEvent.change(screen.getByLabelText(/from month/i), {
      target: { value: "05" },
    });
    rerender(<MonthYearRange {...base} startMonth="05" />);
    expect(screen.getByLabelText(/from month/i)).toHaveValue("05");
  });

  it("hiện checkbox và ẩn hai select To khi isCurrent = true", () => {
    render(
      <MonthYearRange
        {...base}
        isCurrent={true}
        currentLabel="I currently work here"
        onToggleCurrent={onToggleCurrent}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: /currently work here/i }),
    ).toBeChecked();
    expect(screen.queryByLabelText(/to month/i)).toBeNull();
    expect(screen.queryByLabelText(/to year/i)).toBeNull();
  });

  it("bỏ tick checkbox thì hiện lại hai select To", () => {
    render(
      <MonthYearRange
        {...base}
        isCurrent={false}
        currentLabel="I currently work here"
        onToggleCurrent={onToggleCurrent}
      />,
    );
    expect(screen.getByLabelText(/to month/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggleCurrent).toHaveBeenCalledWith(true);
  });

  it("mặc định không có năm tương lai ở cả hai ô năm", () => {
    render(<MonthYearRange {...base} />);
    const next = String(new Date().getFullYear() + 1);
    for (const label of [/from year/i, /to year/i]) {
      const opts = Array.from(
        screen.getByLabelText(label).querySelectorAll("option"),
      ).map((o) => o.getAttribute("value"));
      expect(opts).not.toContain(next);
    }
  });

  it("futureEndYears mở năm tương lai cho ô To year, không đụng From year", () => {
    // Năm tốt nghiệp dự kiến nằm ở tương lai; ngày bắt đầu thì không.
    render(
      <MonthYearRange {...base} futureEndYears={FUTURE_GRADUATION_YEARS} />,
    );
    const now = new Date().getFullYear();
    // Bỏ option placeholder "—" (value rỗng) đứng đầu mỗi select.
    const values = (label: RegExp) =>
      Array.from(screen.getByLabelText(label).querySelectorAll("option"))
        .map((o) => o.getAttribute("value"))
        .filter(Boolean);

    const to = values(/to year/i);
    expect(to[0]).toBe(String(now + FUTURE_GRADUATION_YEARS));
    expect(to).toContain(String(now + 1));
    expect(to).toContain("1970");

    expect(values(/from year/i)[0]).toBe(String(now));
  });

  it("id của các select là duy nhất theo idPrefix", () => {
    render(<MonthYearRange {...base} idPrefix="edu-9" />);
    expect(screen.getByLabelText(/from month/i)).toHaveAttribute(
      "id",
      "edu-9-start-month",
    );
  });
});
