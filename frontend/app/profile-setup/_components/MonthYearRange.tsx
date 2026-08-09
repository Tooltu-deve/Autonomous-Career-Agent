"use client";

import { MONTHS, yearOptions } from "./monthYear";

export type RangeField = "startMonth" | "startYear" | "endMonth" | "endYear";

interface Props {
  /** Tiền tố tạo id duy nhất cho mỗi dòng — bắt buộc để label ghép đúng ô. */
  idPrefix: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  /** undefined = không hiện checkbox (học vấn không dùng "hiện tại"). */
  isCurrent?: boolean;
  currentLabel?: string;
  /** Số năm tương lai mở cho ô "To year". Mặc định 0. Học vấn truyền
   * FUTURE_GRADUATION_YEARS để khai được năm tốt nghiệp dự kiến. */
  futureEndYears?: number;
  onChange: (field: RangeField, value: string) => void;
  onToggleCurrent?: (checked: boolean) => void;
}

export function MonthYearRange({
  idPrefix,
  startMonth,
  startYear,
  endMonth,
  endYear,
  isCurrent,
  currentLabel,
  futureEndYears = 0,
  onChange,
  onToggleCurrent,
}: Props) {
  const showCheckbox = isCurrent !== undefined;

  const select = (
    field: RangeField,
    id: string,
    label: string,
    value: string,
    options: { value: string; label: string }[],
  ) => (
    <div className="ps-form-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="ps-select"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const toOption = (y: string) => ({ value: y, label: y });
  const startYearOpts = yearOptions().map(toOption);
  const endYearOpts = yearOptions(futureEndYears).map(toOption);

  return (
    <div>
      <div className="ps-grid2">
        {select(
          "startMonth",
          `${idPrefix}-start-month`,
          "From month",
          startMonth,
          MONTHS,
        )}
        {select(
          "startYear",
          `${idPrefix}-start-year`,
          "From year",
          startYear,
          startYearOpts,
        )}
      </div>

      {showCheckbox && (
        <label className="ps-checkbox-row">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => onToggleCurrent?.(e.target.checked)}
          />
          {currentLabel}
        </label>
      )}

      {!isCurrent && (
        <div className="ps-grid2">
          {select(
            "endMonth",
            `${idPrefix}-end-month`,
            "To month",
            endMonth,
            MONTHS,
          )}
          {select(
            "endYear",
            `${idPrefix}-end-year`,
            "To year",
            endYear,
            endYearOpts,
          )}
        </div>
      )}
    </div>
  );
}
