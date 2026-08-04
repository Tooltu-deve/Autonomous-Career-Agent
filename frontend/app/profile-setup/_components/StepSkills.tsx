"use client";

/**
 * StepSkills — Step 3: Skill Set form with pills, custom input, and suggestions.
 */
import { ArrowLeftIcon, TrendIcon, XSmallIcon } from "./Icons";
import { SUGGESTED_SKILLS } from "../_types/types";

interface Props {
  skills: string[];
  customSkill: string;
  setCustomSkill: (val: string) => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  onCustomAdd: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepSkills({
  skills,
  customSkill,
  setCustomSkill,
  onAddSkill,
  onRemoveSkill,
  onCustomAdd,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="ps-card ps-animate-in">
      <div className="ps-card-header">
        <div className="ps-card-title">
          <TrendIcon />
          Skill Set
        </div>
        <span className="ps-step-tag">STEP 3/4</span>
      </div>

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

      {/* Suggested skills */}
      <div className="ps-suggested-label">POPULAR SKILL SUGGESTIONS</div>
      <div className="ps-suggested-chips">
        {SUGGESTED_SKILLS.map((s) => (
          <button
            key={s}
            type="button"
            className="ps-chip-suggest"
            disabled={skills.includes(s)}
            onClick={() => onAddSkill(s)}
          >
            + {s}
          </button>
        ))}
      </div>

      <div className="ps-footer-actions">
        <button className="ps-btn-prev" onClick={onBack} type="button">
          <ArrowLeftIcon /> Back
        </button>
        <button className="ps-btn-next" onClick={onNext} type="button">
          Next: Projects →
        </button>
      </div>
    </div>
  );
}
