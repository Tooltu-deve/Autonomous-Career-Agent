"use client";

/**
 * StepOther — Step 4: Template Selection & Projects list.
 */
import type { TemplateName } from "@/types/api";
import { ArrowLeftIcon, LayersIcon, PlusIcon, TrashIcon } from "./Icons";
import { TemplatePicker } from "./TemplatePicker";
import type { ProjectEntry } from "../_types/types";

interface Props {
  selectedTemplate: TemplateName;
  onSelectTemplate: (t: TemplateName) => void;
  projects: ProjectEntry[];
  onAddProject: () => void;
  onRemoveProject: (id: number) => void;
  onUpdateProject: (id: number, field: "name" | "description", value: string) => void;
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
        <span style={{ width: 16, height: 16, display: "inline-flex", flexShrink: 0 }}>
          <LayersIcon />
        </span>
        Projects &amp; Sản phẩm nổi bật
      </div>

      <div className="ps-dynamic-list">
        {projects.map((proj, idx) => (
          <div key={proj.id} className="ps-dynamic-card">
            <div className="ps-dynamic-header">
              <span className="ps-dynamic-label">
                Project {idx + 1}
              </span>
              <button
                className="ps-btn-trash"
                onClick={() => onRemoveProject(proj.id)}
                title="Xóa"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
            <div
              className="ps-form-group"
              style={{ marginBottom: "12px" }}
            >
              <label>Project Name</label>
              <input
                type="text"
                className="ps-input-bare"
                value={proj.name}
                placeholder="e.g., Autonomous Career Agent"
                onChange={(e) =>
                  onUpdateProject(proj.id, "name", e.target.value)
                }
              />
            </div>
            <div className="ps-form-group">
              <label>Details &amp; Technologies Used</label>
              <textarea
                className="ps-ta-bare"
                value={proj.description}
                placeholder="Brief description of what you built, achievements, and tech stack..."
                onChange={(e) =>
                  onUpdateProject(proj.id, "description", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button className="ps-btn-add-entry" onClick={onAddProject} type="button">
        <PlusIcon /> Add dự án
      </button>

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
