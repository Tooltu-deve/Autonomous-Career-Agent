"use client";

import { ArrowLeftIcon, EduIcon } from "./Icons";
import { EducationForm } from "./EducationForm";
import type { EducationEntry } from "../_types/types";

interface Props {
  education: EducationEntry[];
  onAdd: () => void;
  onRemove: (id: number | string) => void;
  onUpdate: (
    id: number | string,
    field: "university" | "degree",
    value: string,
  ) => void;
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

      <EducationForm
        education={education}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={onUpdate}
      />

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
