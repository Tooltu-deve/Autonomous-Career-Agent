"use client";

import { CheckIcon, EduIcon, PlusIcon, TrashIcon } from "./Icons";

export interface EducationItem {
  id: number | string;
  university: string;
  degree: string;
}

interface Props {
  education: EducationItem[];
  onAdd: () => void;
  onRemove: (id: string | number) => void;
  onUpdate: (id: string | number, field: "university" | "degree", value: string) => void;
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
                <label>University / Institution</label>
                <div className="ps-input-wrap">
                  <input
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
                <label>Degree / Major</label>
                <div className="ps-input-wrap">
                  <input
                    type="text"
                    value={edu.degree}
                    placeholder="e.g., B.S. in Computer Science"
                    onChange={(e) => onUpdate(edu.id, "degree", e.target.value)}
                  />
                  <CheckIcon />
                </div>
              </div>
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
