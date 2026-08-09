"use client";

import type { TemplateName } from "@/types/api";
import { ArrowLeftIcon, LayersIcon } from "./Icons";
import {
  ExperienceForm,
  type ExperienceField,
  type ExperienceItem,
} from "./ExperienceForm";
import { TemplatePicker } from "./TemplatePicker";

interface Props {
  selectedTemplate: TemplateName;
  onSelectTemplate: (t: TemplateName) => void;
  experiences: ExperienceItem[];
  experienceErrors?: Record<string, string>;
  onAddExperience: () => void;
  onRemoveExperience: (id: number | string) => void;
  onUpdateExperience: (
    id: number | string,
    field: ExperienceField,
    value: string | boolean,
  ) => void;
  onBack: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}

export function StepOther({
  selectedTemplate,
  onSelectTemplate,
  experiences,
  experienceErrors,
  onAddExperience,
  onRemoveExperience,
  onUpdateExperience,
  onBack,
  onFinish,
  isFinishing,
}: Props) {
  return (
    <div className="ps-card ps-animate-in">
      <div className="ps-card-header">
        <div className="ps-card-title">
          <LayersIcon />
          Other Information
        </div>
        <span className="ps-step-tag">STEP 4/4</span>
      </div>

      {/* Template selection grid */}
      <TemplatePicker
        selectedTemplate={selectedTemplate}
        onSelect={onSelectTemplate}
      />

      {/* Work Experience Section */}
      <div className="ps-projects-heading">
        <span
          style={{
            width: 16,
            height: 16,
            display: "inline-flex",
            flexShrink: 0,
          }}
        >
          <LayersIcon />
        </span>
        Work Experience
      </div>

      <ExperienceForm
        experiences={experiences}
        errors={experienceErrors}
        onAdd={onAddExperience}
        onRemove={onRemoveExperience}
        onUpdate={onUpdateExperience}
      />

      <div className="ps-footer-actions">
        <button className="ps-btn-prev" onClick={onBack} type="button">
          <ArrowLeftIcon /> Back
        </button>
        <button
          className="ps-btn-next ps-btn-finish"
          onClick={onFinish}
          disabled={isFinishing}
          type="button"
        >
          {isFinishing ? "Saving..." : "Save & Complete Profile →"}
        </button>
      </div>
    </div>
  );
}
