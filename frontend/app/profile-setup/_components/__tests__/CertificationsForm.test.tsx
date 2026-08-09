import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CertificationsForm } from "../CertificationsForm";

const onAdd = vi.fn();
const onRemove = vi.fn();
const onUpdate = vi.fn();

const props = { onAdd, onRemove, onUpdate };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CertificationsForm", () => {
  it("hiện empty state khi chưa có dòng nào", () => {
    render(<CertificationsForm certifications={[]} {...props} />);
    expect(screen.getByText(/no certifications yet/i)).toBeInTheDocument();
  });

  it("render từng dòng với giá trị hiện có", () => {
    render(
      <CertificationsForm
        certifications={[
          {
            id: "a",
            title: "AWS Certified Developer",
            month: "05",
            year: "2024",
          },
        ]}
        {...props}
      />,
    );
    expect(
      screen.getByDisplayValue("AWS Certified Developer"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("May")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
  });

  it("bấm Add gọi onAdd", () => {
    render(<CertificationsForm certifications={[]} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /add certification/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("bấm xoá gọi onRemove đúng id", () => {
    render(
      <CertificationsForm
        certifications={[{ id: "row-1", title: "AWS", month: "", year: "" }]}
        {...props}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("row-1");
  });

  it("đổi tên gọi onUpdate với field title", () => {
    render(
      <CertificationsForm
        certifications={[{ id: "a", title: "", month: "", year: "" }]}
        {...props}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/aws certified/i), {
      target: { value: "GCP ACE" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "title", "GCP ACE");
  });

  it("chọn tháng khi chưa có năm KHÔNG làm mất tháng", () => {
    // Hồi quy: nếu state gộp month+year thành một chuỗi ISO thì join() trả rỗng
    // và select tháng nhảy về trống, buộc người dùng phải chọn năm trước.
    const { rerender } = render(
      <CertificationsForm
        certifications={[{ id: "a", title: "AWS", month: "", year: "" }]}
        {...props}
      />,
    );

    fireEvent.change(screen.getByLabelText(/month/i), {
      target: { value: "05" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "month", "05");

    // Tầng cha cập nhật chỉ riêng month; year vẫn rỗng.
    rerender(
      <CertificationsForm
        certifications={[{ id: "a", title: "AWS", month: "05", year: "" }]}
        {...props}
      />,
    );
    expect(screen.getByLabelText(/month/i)).toHaveValue("05");
  });

  it("đổi năm gọi onUpdate với field year, không đụng đến month", () => {
    render(
      <CertificationsForm
        certifications={[{ id: "a", title: "AWS", month: "05", year: "" }]}
        {...props}
      />,
    );
    fireEvent.change(screen.getByLabelText(/year/i), {
      target: { value: "2020" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "year", "2020");
    expect(onUpdate).not.toHaveBeenCalledWith("a", "month", expect.anything());
  });

  it("hiện lỗi dưới đúng dòng", () => {
    render(
      <CertificationsForm
        certifications={[
          { id: "a", title: "AWS", month: "", year: "" },
          { id: "b", title: "Azure", month: "01", year: "2023" },
        ]}
        errors={{ a: "Select the month and year this was obtained." }}
        {...props}
      />,
    );
    expect(screen.getAllByText(/select the month and year/i)).toHaveLength(1);
  });

  it("bọc select tháng/năm bằng ps-field-error-state khi dòng có lỗi", () => {
    render(
      <CertificationsForm
        certifications={[
          { id: "a", title: "AWS", month: "", year: "" },
          { id: "b", title: "Azure", month: "01", year: "2023" },
        ]}
        errors={{ a: "Select the month and year this was obtained." }}
        {...props}
      />,
    );

    const monthSelects = screen.getAllByLabelText(/month/i);
    // Dòng "a" có lỗi -> wrapper .ps-form-group phải có thêm ps-field-error-state.
    expect(monthSelects[0].closest(".ps-form-group")).toHaveClass(
      "ps-field-error-state",
    );
    // Dòng "b" không có lỗi -> wrapper giữ nguyên, không có class lỗi.
    expect(monthSelects[1].closest(".ps-form-group")).not.toHaveClass(
      "ps-field-error-state",
    );

    const yearSelects = screen.getAllByLabelText(/year/i);
    expect(yearSelects[0].closest(".ps-form-group")).toHaveClass(
      "ps-field-error-state",
    );
    expect(yearSelects[1].closest(".ps-form-group")).not.toHaveClass(
      "ps-field-error-state",
    );
  });
});
