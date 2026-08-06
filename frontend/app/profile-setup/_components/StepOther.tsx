"use client";

import type { TemplateName } from "@/types/api";
import { ArrowLeftIcon, LayersIcon } from "./Icons";
import { ProjectsForm } from "./ProjectsForm";
import { TemplatePicker } from "./TemplatePicker";
import type { ProjectEntry } from "../_types/types";

interface Props {
  selectedTemplate: TemplateName;
  onSelectTemplate: (t: TemplateName) => void;
  projects: ProjectEntry[];
  onAddProject: () => void;
  onRemoveProject: (id: number) => void;
  onUpdateProject: (
    id: number,
    field: "name" | "description",
    value: string,
  ) => void;
  onBack: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}

export function StepOther({
  selectedTemplate,
  onSelectTemplate,
  projects,
  onAddProject,
  onRemoveProject,
  onUpdateProject,
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

      {/* Projects Section */}
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
        Projects &amp; Highlights
      </div>

      <ProjectsForm
        projects={projects}
        onAddProject={onAddProject}
        onRemoveProject={onRemoveProject}
        onUpdateProject={onUpdateProject}
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
