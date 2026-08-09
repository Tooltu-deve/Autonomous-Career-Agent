"use client";

import { PlusIcon, TrashIcon } from "./Icons";
import { MonthYearRange, type RangeField } from "./MonthYearRange";

export interface ExperienceItem {
  id: number | string;
  title: string;
  organization: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
  description: string;
}

export type ExperienceField =
  "title" | "organization" | "description" | "isCurrent" | RangeField;

interface Props {
  experiences: ExperienceItem[];
  errors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (id: number | string) => void;
  onUpdate: (
    id: number | string,
    field: ExperienceField,
    value: string | boolean,
  ) => void;
}

export function ExperienceForm({
  experiences,
  errors = {},
  onAdd,
  onRemove,
  onUpdate,
}: Props) {
  return (
    <div>
      <div className="ps-dynamic-list">
        {experiences.map((exp, idx) => {
          const error = errors[String(exp.id)];
          return (
            <div key={exp.id} className="ps-dynamic-card">
              <div className="ps-dynamic-header">
                <span className="ps-dynamic-label">Experience {idx + 1}</span>
                <button
                  className="ps-btn-trash"
                  onClick={() => onRemove(exp.id)}
                  title="Remove"
                  type="button"
                >
                  <TrashIcon />
                </button>
              </div>

              <div className="ps-grid2">
                <div
                  className={`ps-form-group${error ? " ps-field-error-state" : ""}`}
                >
                  <label htmlFor={`exp-title-${exp.id}`}>Job Title</label>
                  <input
                    id={`exp-title-${exp.id}`}
                    type="text"
                    className="ps-input-bare"
                    value={exp.title}
                    placeholder="e.g., Backend Developer"
                    onChange={(e) => onUpdate(exp.id, "title", e.target.value)}
                  />
                </div>
                <div
                  className={`ps-form-group${error ? " ps-field-error-state" : ""}`}
                >
                  <label htmlFor={`exp-org-${exp.id}`}>
                    Company / Organization
                  </label>
                  <input
                    id={`exp-org-${exp.id}`}
                    type="text"
                    className="ps-input-bare"
                    value={exp.organization}
                    placeholder="e.g., ACME Corp"
                    onChange={(e) =>
                      onUpdate(exp.id, "organization", e.target.value)
                    }
                  />
                </div>
              </div>

              <MonthYearRange
                idPrefix={`exp-${exp.id}`}
                startMonth={exp.startMonth}
                startYear={exp.startYear}
                endMonth={exp.endMonth}
                endYear={exp.endYear}
                isCurrent={exp.isCurrent}
                currentLabel="I currently work here"
                onChange={(field, value) => onUpdate(exp.id, field, value)}
                onToggleCurrent={(checked) =>
                  onUpdate(exp.id, "isCurrent", checked)
                }
              />

              <div className="ps-form-group">
                <label htmlFor={`exp-desc-${exp.id}`}>
                  Details &amp; Technologies Used
                </label>
                <textarea
                  id={`exp-desc-${exp.id}`}
                  className="ps-ta-bare"
                  value={exp.description}
                  placeholder="What you built, achievements, and tech stack..."
                  onChange={(e) =>
                    onUpdate(exp.id, "description", e.target.value)
                  }
                />
              </div>

              {error && <p className="ps-field-error">{error}</p>}
            </div>
          );
        })}
      </div>

      <button className="ps-btn-add-entry" onClick={onAdd} type="button">
        <PlusIcon /> Add Experience
      </button>
    </div>
  );
}
