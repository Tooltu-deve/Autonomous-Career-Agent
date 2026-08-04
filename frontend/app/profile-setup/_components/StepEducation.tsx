"use client";

/**
 * StepEducation — Step 2: Education form list.
 */
import {
  ArrowLeftIcon,
  CheckIcon,
  EduIcon,
  PlusIcon,
  TrashIcon,
} from "./Icons";
import type { EducationEntry } from "../_types/types";

interface Props {
  education: EducationEntry[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, field: "university" | "degree", value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepEducation({
  education,
  onAdd,
  onRemove,
  onUpdate,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="ps-card ps-animate-in">
      <div className="ps-card-header">
        <div className="ps-card-title">
          <EduIcon />
          Education
        </div>
        <span className="ps-step-tag">STEP 2/4</span>
      </div>

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

      <div className="ps-footer-actions">
        <button className="ps-btn-prev" onClick={onBack} type="button">
          <ArrowLeftIcon /> Back
        </button>
        <button className="ps-btn-next" onClick={onNext} type="button">
          Next: Skills →
        </button>
      </div>
    </div>
  );
}
