"use client";

import { CheckIcon, EduIcon, PlusIcon, TrashIcon } from "./Icons";
import { MonthYearRange, type RangeField } from "./MonthYearRange";
import { FUTURE_GRADUATION_YEARS } from "./monthYear";

export interface EducationItem {
  id: number | string;
  university: string;
  degree: string;
  fieldOfStudy: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string;
}

export type EducationField =
  "university" | "degree" | "fieldOfStudy" | "description" | RangeField;

interface Props {
  education: EducationItem[];
  errors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (id: string | number) => void;
  onUpdate: (id: string | number, field: EducationField, value: string) => void;
}

export function EducationForm({ education, onAdd, onRemove, onUpdate }: Props) {
  return (
    <div>
      <div className="ps-dynamic-list">
        {education.map((edu, idx) => (
          <div key={edu.id} className="ps-dynamic-card">
            <div className="ps-dynamic-header">
              <span className="ps-dynamic-label">Education {idx + 1}</span>
              <button
                className="ps-btn-trash"
                onClick={() => onRemove(edu.id)}
                title="Remove"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="ps-grid2">
              <div className="ps-form-group">
                <label htmlFor={`edu-university-${edu.id}`}>
                  University / Institution
                </label>
                <div className="ps-input-wrap">
                  <input
                    id={`edu-university-${edu.id}`}
                    type="text"
                    value={edu.university}
                    placeholder="e.g., MIT"
                    onChange={(e) =>
                      onUpdate(edu.id, "university", e.target.value)
                    }
                  />
                  <EduIcon />
                </div>
              </div>
              <div className="ps-form-group">
                <label htmlFor={`edu-degree-${edu.id}`}>Degree</label>
                <div className="ps-input-wrap">
                  <input
                    id={`edu-degree-${edu.id}`}
                    type="text"
                    value={edu.degree}
                    placeholder="e.g., B.S. / Bachelor's"
                    onChange={(e) => onUpdate(edu.id, "degree", e.target.value)}
                  />
                  <CheckIcon />
                </div>
              </div>
            </div>

            <div className="ps-form-group" style={{ marginBottom: "12px" }}>
              <label htmlFor={`edu-field-${edu.id}`}>Field of Study</label>
              <input
                id={`edu-field-${edu.id}`}
                type="text"
                className="ps-input-bare"
                value={edu.fieldOfStudy}
                placeholder="e.g., Computer Science"
                onChange={(e) =>
                  onUpdate(edu.id, "fieldOfStudy", e.target.value)
                }
              />
            </div>

            <MonthYearRange
              idPrefix={`edu-${edu.id}`}
              startMonth={edu.startMonth}
              startYear={edu.startYear}
              endMonth={edu.endMonth}
              endYear={edu.endYear}
              futureEndYears={FUTURE_GRADUATION_YEARS}
              onChange={(field, value) => onUpdate(edu.id, field, value)}
            />

            <div className="ps-form-group">
              <label htmlFor={`edu-desc-${edu.id}`}>Notes (optional)</label>
              <textarea
                id={`edu-desc-${edu.id}`}
                className="ps-ta-bare"
                value={edu.description}
                placeholder="Honours, GPA, relevant coursework..."
                onChange={(e) =>
                  onUpdate(edu.id, "description", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button className="ps-btn-add-entry" onClick={onAdd} type="button">
        <PlusIcon /> Add Education
      </button>
    </div>
  );
}
