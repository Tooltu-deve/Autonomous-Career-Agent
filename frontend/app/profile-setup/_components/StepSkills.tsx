"use client";

import { ArrowLeftIcon, TrendIcon } from "./Icons";
import { SkillsForm } from "./SkillsForm";

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

      <SkillsForm
        skills={skills}
        customSkill={customSkill}
        setCustomSkill={setCustomSkill}
        onAddSkill={onAddSkill}
        onRemoveSkill={onRemoveSkill}
        onCustomAdd={onCustomAdd}
      />

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
