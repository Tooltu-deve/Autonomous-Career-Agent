"use client";

import { PlusIcon, TrashIcon } from "./Icons";

export interface ProjectItem {
  id: number | string;
  name: string;
  description: string;
}

interface Props {
  projects: ProjectItem[];
  onAddProject: () => void;
  onRemoveProject: (id: string | number) => void;
  onUpdateProject: (
    id: string | number,
    field: "name" | "description",
    value: string,
  ) => void;
}

export function ProjectsForm({
  projects,
  onAddProject,
  onRemoveProject,
  onUpdateProject,
}: Props) {
  return (
    <div>
      <div className="ps-dynamic-list">
        {projects.map((proj, idx) => (
          <div key={proj.id} className="ps-dynamic-card">
            <div className="ps-dynamic-header">
              <span className="ps-dynamic-label">Project {idx + 1}</span>
              <button
                className="ps-btn-trash"
                onClick={() => onRemoveProject(proj.id)}
                title="Remove"
                type="button"
              >
                <TrashIcon />
              </button>
            </div>
            <div className="ps-form-group" style={{ marginBottom: "12px" }}>
              <label>Project Name / Role</label>
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
        <PlusIcon /> Add project
      </button>
    </div>
  );
}
