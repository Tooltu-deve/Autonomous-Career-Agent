"use client";

import { PlusIcon, TrashIcon } from "./Icons";
import type { CertificationRow } from "@/lib/validation";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

/** Năm hiện tại lùi về 1970 — đủ cho mọi chứng chỉ thực tế. */
function yearOptions(): string[] {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let y = now; y >= 1970; y--) years.push(String(y));
  return years;
}

interface Props {
  certifications: CertificationRow[];
  errors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (id: number | string) => void;
  onUpdate: (
    id: number | string,
    field: "title" | "month" | "year",
    value: string,
  ) => void;
}

export function CertificationsForm({
  certifications,
  errors = {},
  onAdd,
  onRemove,
  onUpdate,
}: Props) {
  const years = yearOptions();

  return (
    <div>
      <div className="ps-dynamic-list">
        {certifications.length === 0 && (
          <p className="ps-skills-empty">
            No certifications yet — add one below.
          </p>
        )}
        {certifications.map((cert, idx) => {
          const error = errors[String(cert.id)];
          return (
            <div key={cert.id} className="ps-dynamic-card">
              <div className="ps-dynamic-header">
                <span className="ps-dynamic-label">
                  Certification {idx + 1}
                </span>
                <button
                  className="ps-btn-trash"
                  onClick={() => onRemove(cert.id)}
                  title="Remove"
                  type="button"
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="ps-form-group" style={{ marginBottom: "12px" }}>
                <label htmlFor={`cert-title-${cert.id}`}>
                  Certification Name
                </label>
                <input
                  id={`cert-title-${cert.id}`}
                  type="text"
                  className="ps-input-bare"
                  value={cert.title}
                  placeholder="e.g., AWS Certified Developer"
                  onChange={(e) => onUpdate(cert.id, "title", e.target.value)}
                />
              </div>

              <div className="ps-grid2">
                <div
                  className={`ps-form-group${error ? " ps-field-error-state" : ""}`}
                >
                  <label htmlFor={`cert-month-${cert.id}`}>
                    Month obtained
                  </label>
                  <select
                    id={`cert-month-${cert.id}`}
                    className="ps-select"
                    value={cert.month}
                    onChange={(e) => onUpdate(cert.id, "month", e.target.value)}
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={`ps-form-group${error ? " ps-field-error-state" : ""}`}
                >
                  <label htmlFor={`cert-year-${cert.id}`}>Year obtained</label>
                  <select
                    id={`cert-year-${cert.id}`}
                    className="ps-select"
                    value={cert.year}
                    onChange={(e) => onUpdate(cert.id, "year", e.target.value)}
                  >
                    <option value="">—</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="ps-field-error">{error}</p>}
            </div>
          );
        })}
      </div>

      <button className="ps-btn-add-entry" onClick={onAdd} type="button">
        <PlusIcon /> Add Certification
      </button>
    </div>
  );
}
