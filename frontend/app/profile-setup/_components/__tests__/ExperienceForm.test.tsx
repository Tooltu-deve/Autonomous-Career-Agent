import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExperienceForm } from "../ExperienceForm";
import type { ExperienceItem } from "../ExperienceForm";

const onAdd = vi.fn();
const onRemove = vi.fn();
const onUpdate = vi.fn();
const props = { onAdd, onRemove, onUpdate };

const empty: ExperienceItem = {
  id: "a",
  title: "",
  organization: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  isCurrent: false,
  description: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ExperienceForm", () => {
  it("render đủ các ô của một dòng", () => {
    render(<ExperienceForm experiences={[empty]} {...props} />);
    expect(
      screen.getByPlaceholderText(/backend developer/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/acme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/from month/i)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /currently work here/i }),
    ).toBeInTheDocument();
  });

  it("đổi tổ chức gọi onUpdate đúng field", () => {
    render(<ExperienceForm experiences={[empty]} {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/acme/i), {
      target: { value: "VNG" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "organization", "VNG");
  });

  it("đổi tháng bắt đầu đi qua MonthYearRange tới onUpdate", () => {
    render(<ExperienceForm experiences={[empty]} {...props} />);
    fireEvent.change(screen.getByLabelText(/from month/i), {
      target: { value: "01" },
    });
    expect(onUpdate).toHaveBeenCalledWith("a", "startMonth", "01");
  });

  it("tick 'currently work here' gọi onUpdate với boolean", () => {
    render(<ExperienceForm experiences={[empty]} {...props} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onUpdate).toHaveBeenCalledWith("a", "isCurrent", true);
  });

  it("khi isCurrent thì không render hai select To", () => {
    render(
      <ExperienceForm
        experiences={[{ ...empty, isCurrent: true }]}
        {...props}
      />,
    );
    expect(screen.queryByLabelText(/to month/i)).toBeNull();
  });

  it("hiện lỗi dưới đúng dòng", () => {
    render(
      <ExperienceForm
        experiences={[empty, { ...empty, id: "b" }]}
        errors={{ a: "Enter the company or organization." }}
        {...props}
      />,
    );
    expect(screen.getAllByText(/company or organization/i)).toHaveLength(1);
  });

  it("bấm Add và Remove gọi đúng callback", () => {
    render(<ExperienceForm experiences={[empty]} {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /add experience/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledWith("a");
  });
});
