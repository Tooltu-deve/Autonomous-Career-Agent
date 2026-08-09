"use client";

import { XSmallIcon } from "./Icons";

interface Props {
  skills: string[];
  customSkill: string;
  setCustomSkill: (val: string) => void;
  onRemoveSkill: (skill: string) => void;
  onCustomAdd: () => void;
}

export function SkillsForm({
  skills,
  customSkill,
  setCustomSkill,
  onRemoveSkill,
  onCustomAdd,
}: Props) {
  return (
    <div>
      {/* Skills pill wall */}
      <div className="ps-skills-wall">
        {skills.length === 0 && (
          <span className="ps-skills-empty">No skills yet — add below!</span>
        )}
        {skills.map((skill) => (
          <span key={skill} className="ps-skill-chip">
            {skill}
            <button
              type="button"
              onClick={() => onRemoveSkill(skill)}
              aria-label={`Remove ${skill}`}
            >
              <XSmallIcon />
            </button>
          </span>
        ))}
      </div>

      {/* Custom add row */}
      <div className="ps-add-skill-row">
        <div className="ps-input-wrap ps-input-noicon">
          <input
            type="text"
            value={customSkill}
            placeholder="Type a skill and press Enter..."
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onCustomAdd();
              }
            }}
          />
        </div>
        <button className="ps-btn-upload" type="button" onClick={onCustomAdd}>
          Add
        </button>
      </div>
    </div>
  );
}
