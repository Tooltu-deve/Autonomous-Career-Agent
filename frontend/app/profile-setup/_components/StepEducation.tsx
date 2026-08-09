"use client";

import { ArrowLeftIcon, EduIcon } from "./Icons";
import { EducationForm } from "./EducationForm";
import { CertificationsForm } from "./CertificationsForm";
import type { CertificationEntry, EducationEntry } from "../_types/types";

interface Props {
  education: EducationEntry[];
  onAdd: () => void;
  onRemove: (id: number | string) => void;
  onUpdate: (
    id: number | string,
    field: "university" | "degree",
    value: string,
  ) => void;
  certifications: CertificationEntry[];
  certificationErrors?: Record<string, string>;
  onAddCertification: () => void;
  onRemoveCertification: (id: number | string) => void;
  onUpdateCertification: (
    id: number | string,
    field: "title" | "month" | "year",
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
  certifications,
  certificationErrors,
  onAddCertification,
  onRemoveCertification,
  onUpdateCertification,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="ps-card ps-animate-in">
      <div className="ps-card-header">
        <div className="ps-card-title">
          <EduIcon />
          Education &amp; Certifications
        </div>
        <span className="ps-step-tag">STEP 2/4</span>
      </div>

      <EducationForm
        education={education}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={onUpdate}
      />

      <div className="ps-section-divider">Certifications</div>

      <CertificationsForm
        certifications={certifications}
        errors={certificationErrors}
        onAdd={onAddCertification}
        onRemove={onRemoveCertification}
        onUpdate={onUpdateCertification}
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
