"use client";

/**
 * ProfileSetupPage — Page Orchestrator (~90 dòng).
 * Quản lý layout chung (Navbar, Hero, Step Track, Live Preview) và render từng bước.
 * Tách biệt hoàn toàn logic (useProfileSetup), types, icons và các step components.
 */
import "./profile-setup.css";
import {
  CheckIcon,
  EduIcon,
  LayersIcon,
  TrendIcon,
  UserIcon,
} from "./_components/Icons";
import { ProfilePreview } from "./_components/ProfilePreview";
import { StepBasicInfo } from "./_components/StepBasicInfo";
import { StepEducation } from "./_components/StepEducation";
import { StepOther } from "./_components/StepOther";
import { StepSkills } from "./_components/StepSkills";
import {
  calcCompleteness,
  getInitials,
  useProfileSetup,
} from "./_hooks/useProfileSetup";

export default function ProfileSetupPage() {
  const {
    data,
    setData,
    step,
    goToStep,
    toast,
    isFinishing,
    customSkill,
    setCustomSkill,
    showToast,
    addSkill,
    removeSkill,
    handleCustomSkillAdd,
    addEducation,
    removeEducation,
    updateEducation,
    addProject,
    removeProject,
    updateProject,
    skipAndFinish,
    completeSetup,
  } = useProfileSetup();

  const completeness = calcCompleteness(data);
  const initials = getInitials(data.name || "?");

  const STEPS = [
    { num: 1, label: "Personal Info", icon: <UserIcon /> },
    { num: 2, label: "Education", icon: <EduIcon /> },
    { num: 3, label: "Skills", icon: <TrendIcon /> },
    { num: 4, label: "Other", icon: <LayersIcon /> },
  ];

  return (
    <div className="ps-root">
      {/* ── Top Navbar ── */}
      <header className="ps-navbar">
        <div className="ps-brand">
          <div className="ps-brand-mark">
            <span />
            <span />
            <span />
          </div>
          <span className="ps-brand-text">CareerNav</span>
        </div>
        <button
          className="ps-skip-top"
          onClick={skipAndFinish}
          disabled={isFinishing}
          type="button"
        >
          Skip for now →
        </button>
      </header>

      <div className="ps-shell">
        {/* ── Hero Banner ── */}
        <div className="ps-hero">
          <div className="ps-hero-text">
            <h1>
              <span className="ps-sparkle">✨</span> Set up your profile
            </h1>
            <p>
              Fill in your info so our AI can find suitable jobs and
              auto-generate ATS-friendly CVs for you.
            </p>
          </div>
          {/* Completeness gauge */}
          <div className="ps-meter-card">
            <div
              className="ps-gauge"
              style={{ "--pct": completeness } as React.CSSProperties}
            >
              <span>{completeness}%</span>
            </div>
            <div>
              <div className="ps-gauge-title">
                {completeness >= 90
                  ? "Profile complete ✓"
                  : completeness >= 60
                    ? "Making good progress"
                    : "Setting up…"}
              </div>
              <div className="ps-gauge-sub">Real-time ATS readiness</div>
            </div>
          </div>
        </div>

        {/* ── Wizard Step Track ── */}
        <nav className="ps-step-track" aria-label="Setup steps">
          {STEPS.map((s) => (
            <button
              key={s.num}
              className={`ps-step-btn ${step === s.num ? "active" : ""} ${step > s.num ? "completed" : ""}`}
              onClick={() => goToStep(s.num)}
              type="button"
            >
              <span className="ps-step-badge">
                {step > s.num ? <CheckIcon /> : s.num}
              </span>
              <span className="ps-step-label">{s.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Workspace Grid ── */}
        <div className="ps-workspace">
          {/* Left: Active Step Form */}
          <div className="ps-forms-col">
            {step === 1 && (
              <StepBasicInfo
                data={data}
                setData={setData}
                initials={initials}
                onSkip={skipAndFinish}
                onNext={() => goToStep(2)}
                onShowToast={showToast}
              />
            )}

            {step === 2 && (
              <StepEducation
                education={data.education}
                onAdd={addEducation}
                onRemove={removeEducation}
                onUpdate={updateEducation}
                onBack={() => goToStep(1)}
                onNext={() => goToStep(3)}
              />
            )}

            {step === 3 && (
              <StepSkills
                skills={data.skills}
                customSkill={customSkill}
                setCustomSkill={setCustomSkill}
                onAddSkill={addSkill}
                onRemoveSkill={removeSkill}
                onCustomAdd={handleCustomSkillAdd}
                onBack={() => goToStep(2)}
                onNext={() => goToStep(4)}
              />
            )}

            {step === 4 && (
              <StepOther
                selectedTemplate={data.preferred_template}
                onSelectTemplate={(t) =>
                  setData((d) => ({ ...d, preferred_template: t }))
                }
                projects={data.projects}
                onAddProject={addProject}
                onRemoveProject={removeProject}
                onUpdateProject={updateProject}
                onBack={() => goToStep(3)}
                onFinish={completeSetup}
                isFinishing={isFinishing}
              />
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="ps-preview-col">
            <ProfilePreview data={data} initials={initials} />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`ps-toast ${toast ? "show" : ""}`} aria-live="polite">
        <CheckIcon />
        <span>{toast}</span>
      </div>
    </div>
  );
}
