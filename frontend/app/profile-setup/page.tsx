"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getPreferences,
  getProfile,
  getToken,
  putProfile,
} from "@/lib/api";
import type { ProfileUpdate } from "@/types/api";
import "./profile-setup.css";

/* ── Types ── */
interface EducationEntry {
  id: number;
  university: string;
  degree: string;
}
interface ProjectEntry {
  id: number;
  name: string;
  description: string;
}

interface ProfileData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  summary: string;
  education: EducationEntry[];
  skills: string[];
  projects: ProjectEntry[];
}

const SUGGESTED_SKILLS = [
  "React",
  "Git",
  "Docker",
  "PostgreSQL",
  "English",
  "TypeScript",
  "Node.js",
  "AWS",
];

/* ── SVG Icons ── */
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M9 12h6M9 16h6" />
  </svg>
);
const EmailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 8l10 7 10-7" />
  </svg>
);
const PhoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const LinkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const EduIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const TrendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);
const LayersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XSmallIcon = () => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/* ── Completeness calc ── */
function calcCompleteness(data: ProfileData): number {
  let score = 0;
  if (data.name.trim()) score += 20;
  if (data.headline.trim()) score += 15;
  if (data.summary.trim()) score += 20;
  if (data.skills.length > 0) score += 20;
  if (data.education.length > 0 && data.education[0].university) score += 15;
  if (data.projects.length > 0 && data.projects[0].name) score += 10;
  return Math.min(score, 100);
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let nextId = 100;
function uid() {
  return ++nextId;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const [data, setData] = useState<ProfileData>({
    name: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    github: "",
    summary: "",
    education: [{ id: uid(), university: "", degree: "" }],
    skills: ["Python", "C++", "SQL", "FastAPI"],
    projects: [{ id: uid(), name: "", description: "" }],
  });

  const [customSkill, setCustomSkill] = useState("");

  /* ── Guard: token required; profile already on server → skip onboarding ── */
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await getProfile();
        if (cancelled) return;
        // Profile exists — onboarding continues at preferences (or is done).
        try {
          await getPreferences();
          if (!cancelled) router.replace("/dashboard");
        } catch (err) {
          if (!cancelled && err instanceof ApiError && err.status === 404) {
            router.replace("/profile-preferences");
          }
        }
      } catch {
        /* 404 (no profile yet) or network error — stay on this page */
      }
    })();

    // Pre-fill email/name from the local session
    try {
      const raw = sessionStorage.getItem("careernav_session") || "{}";
      const session = JSON.parse(raw);
      setData((d) => ({
        ...d,
        email: session.email || "",
        name: (session.fullName || "").trim() || d.name,
      }));
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Skills ── */
  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || data.skills.includes(trimmed)) return;
    setData((d) => ({ ...d, skills: [...d.skills, trimmed] }));
    showToast(`Added skill "${trimmed}"`);
  };
  const removeSkill = (skill: string) => {
    setData((d) => ({ ...d, skills: d.skills.filter((s) => s !== skill) }));
  };
  const handleCustomSkillAdd = () => {
    addSkill(customSkill);
    setCustomSkill("");
  };

  /* ── Education ── */
  const addEducation = () => {
    setData((d) => ({
      ...d,
      education: [...d.education, { id: uid(), university: "", degree: "" }],
    }));
    showToast("Added new education entry");
  };
  const removeEducation = (id: number) => {
    setData((d) => ({
      ...d,
      education: d.education.filter((e) => e.id !== id),
    }));
    showToast("Entry removed");
  };
  const updateEducation = (
    id: number,
    field: "university" | "degree",
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e,
      ),
    }));
  };

  /* ── Projects ── */
  const addProject = () => {
    setData((d) => ({
      ...d,
      projects: [...d.projects, { id: uid(), name: "", description: "" }],
    }));
    showToast("Added new project entry");
  };
  const removeProject = (id: number) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
    showToast("Entry removed");
  };
  const updateProject = (
    id: number,
    field: "name" | "description",
    value: string,
  ) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  };

  /* ── Navigation ── */
  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Map the wizard state to the backend `PUT /profile` body. */
  const toProfileUpdate = (): ProfileUpdate => ({
    headline: data.headline.trim() || null,
    summary: data.summary.trim() || null,
    location: data.location.trim() || null,
    phone: data.phone.trim() || null,
    github_url: data.github.trim() || null,
    preferred_template: "classic",
    experiences: data.projects
      .filter((p) => p.name.trim())
      .map((p, i) => ({
        title: p.name.trim(),
        organization: "Personal Project",
        description: p.description.trim() || null,
        display_order: i,
      })),
    educations: data.education
      .filter((e) => e.university.trim())
      .map((e, i) => ({
        school: e.university.trim(),
        degree: e.degree.trim() || null,
        display_order: i,
      })),
    skills: data.skills,
  });

  const saveProfile = async (afterSaveMsg: string) => {
    setIsFinishing(true);
    try {
      await putProfile(toProfileUpdate());
      showToast(afterSaveMsg);
      setTimeout(() => router.push("/profile-preferences"), 800);
    } catch (err) {
      setIsFinishing(false);
      showToast(
        err instanceof ApiError
          ? err.message
          : "Cannot reach the server — profile not saved.",
      );
    }
  };

  // Preferences requires a profile row to exist, so "skip" still saves what we have.
  const skipAndFinish = () => {
    void saveProfile("Proceeding to preferences setup...");
  };

  const completeSetup = () => {
    void saveProfile("Profile saved! Proceeding to preferences setup...");
  };

  const completeness = calcCompleteness(data);
  const initials = getInitials(data.name || "?");

  /* ── Step tab state ── */
  const STEPS = [
    { num: 1, label: "Personal Info", icon: <UserIcon /> },
    { num: 2, label: "Education", icon: <EduIcon /> },
    { num: 3, label: "Skills", icon: <TrendIcon /> },
    { num: 4, label: "Projects", icon: <LayersIcon /> },
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
          {/* Left: Forms */}
          <div className="ps-forms-col">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title">
                    <UserIcon />
                    Personal Info
                  </div>
                  <span className="ps-step-tag">STEP 1/4</span>
                </div>

                {/* Avatar row */}
                <div className="ps-avatar-row">
                  <div className="ps-avatar-lg">{initials}</div>
                  <div>
                    <button
                      className="ps-btn-upload"
                      type="button"
                      onClick={() =>
                        showToast("Avatar upload feature coming soon!")
                      }
                    >
                      Upload avatar
                    </button>
                    <div className="ps-upload-hint">
                      JPG or PNG format, max 5MB
                    </div>
                  </div>
                </div>

                <div className="ps-grid2">
                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-name">Full Name</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-name"
                        type="text"
                        value={data.name}
                        placeholder="Nguyễn Văn A"
                        onChange={(e) =>
                          setData((d) => ({ ...d, name: e.target.value }))
                        }
                      />
                      <UserIcon />
                    </div>
                  </div>

                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-headline">Professional Headline</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-headline"
                        type="text"
                        value={data.headline}
                        placeholder="Computer Science Student · MIT"
                        onChange={(e) =>
                          setData((d) => ({ ...d, headline: e.target.value }))
                        }
                      />
                      <FileIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-email">Email</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-email"
                        type="email"
                        value={data.email}
                        placeholder="you@email.com"
                        onChange={(e) =>
                          setData((d) => ({ ...d, email: e.target.value }))
                        }
                      />
                      <EmailIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-phone">Phone Number</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-phone"
                        type="tel"
                        value={data.phone}
                        placeholder="+84 901 234 567"
                        onChange={(e) =>
                          setData((d) => ({ ...d, phone: e.target.value }))
                        }
                      />
                      <PhoneIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-location">Location</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-location"
                        type="text"
                        value={data.location}
                        placeholder="Ho Chi Minh City, Vietnam"
                        onChange={(e) =>
                          setData((d) => ({ ...d, location: e.target.value }))
                        }
                      />
                      <MapPinIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-github">GitHub / Portfolio</label>
                    <div className="ps-input-wrap">
                      <input
                        id="ps-github"
                        type="text"
                        value={data.github}
                        placeholder="github.com/username"
                        onChange={(e) =>
                          setData((d) => ({ ...d, github: e.target.value }))
                        }
                      />
                      <LinkIcon />
                    </div>
                  </div>

                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-summary">Professional Summary</label>
                    <textarea
                      id="ps-summary"
                      value={data.summary}
                      placeholder="A short 2-3 sentence introduction that AI will use in every auto-generated CV..."
                      onChange={(e) =>
                        setData((d) => ({ ...d, summary: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="ps-footer-actions">
                  <span className="ps-skip-link" onClick={skipAndFinish}>
                    Skip all
                  </span>
                  <button className="ps-btn-next" onClick={() => goToStep(2)}>
                    Tiếp: Education →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Education */}
            {step === 2 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title">
                    <EduIcon />
                    Education
                  </div>
                  <span className="ps-step-tag">STEP 2/4</span>
                </div>

                <div className="ps-dynamic-list">
                  {data.education.map((edu, idx) => (
                    <div key={edu.id} className="ps-dynamic-card">
                      <div className="ps-dynamic-header">
                        <span className="ps-dynamic-label">
                          Education {idx + 1}
                        </span>
                        <button
                          className="ps-btn-trash"
                          onClick={() => removeEducation(edu.id)}
                          title="Xóa"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="ps-grid2">
                        <div className="ps-form-group">
                          <label>University / Institution</label>
                          <div className="ps-input-wrap">
                            <input
                              type="text"
                              value={edu.university}
                              placeholder="e.g., MIT"
                              onChange={(e) =>
                                updateEducation(
                                  edu.id,
                                  "university",
                                  e.target.value,
                                )
                              }
                            />
                            <EduIcon />
                          </div>
                        </div>
                        <div className="ps-form-group">
                          <label>Degree / Major</label>
                          <div className="ps-input-wrap">
                            <input
                              type="text"
                              value={edu.degree}
                              placeholder="e.g., B.S. in Computer Science"
                              onChange={(e) =>
                                updateEducation(
                                  edu.id,
                                  "degree",
                                  e.target.value,
                                )
                              }
                            />
                            <CheckIcon />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="ps-btn-add-entry" onClick={addEducation}>
                  <PlusIcon /> Add Education
                </button>

                <div className="ps-footer-actions">
                  <button className="ps-btn-prev" onClick={() => goToStep(1)}>
                    <ArrowLeftIcon /> Back
                  </button>
                  <button className="ps-btn-next" onClick={() => goToStep(3)}>
                    Tiếp: Skills →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Skills */}
            {step === 3 && (
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
                  {data.skills.length === 0 && (
                    <span className="ps-skills-empty">
                      No skills yet — add below!
                    </span>
                  )}
                  {data.skills.map((skill) => (
                    <span key={skill} className="ps-skill-chip">
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        aria-label={`Xóa ${skill}`}
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
                          handleCustomSkillAdd();
                        }
                      }}
                    />
                  </div>
                  <button
                    className="ps-btn-upload"
                    type="button"
                    onClick={handleCustomSkillAdd}
                  >
                    Add
                  </button>
                </div>

                {/* Suggested skills */}
                <div className="ps-suggested-label">
                  POPULAR SKILL SUGGESTIONS
                </div>
                <div className="ps-suggested-chips">
                  {SUGGESTED_SKILLS.map((s) => (
                    <button
                      key={s}
                      className="ps-chip-suggest"
                      disabled={data.skills.includes(s)}
                      onClick={() => addSkill(s)}
                    >
                      + {s}
                    </button>
                  ))}
                </div>

                <div className="ps-footer-actions">
                  <button className="ps-btn-prev" onClick={() => goToStep(2)}>
                    <ArrowLeftIcon /> Back
                  </button>
                  <button className="ps-btn-next" onClick={() => goToStep(4)}>
                    Tiếp: Projects →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Projects */}
            {step === 4 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title">
                    <LayersIcon />
                    Projects nổi bật
                  </div>
                  <span className="ps-step-tag">STEP 4/4</span>
                </div>

                <div className="ps-dynamic-list">
                  {data.projects.map((proj, idx) => (
                    <div key={proj.id} className="ps-dynamic-card">
                      <div className="ps-dynamic-header">
                        <span className="ps-dynamic-label">
                          Projects {idx + 1}
                        </span>
                        <button
                          className="ps-btn-trash"
                          onClick={() => removeProject(proj.id)}
                          title="Xóa"
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
                            updateProject(proj.id, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="ps-form-group">
                        <label>Details & Technologies Used</label>
                        <textarea
                          className="ps-ta-bare"
                          value={proj.description}
                          placeholder="Brief description of what you built, achievements, and tech stack..."
                          onChange={(e) =>
                            updateProject(
                              proj.id,
                              "description",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="ps-btn-add-entry" onClick={addProject}>
                  <PlusIcon /> Add dự án
                </button>

                <div className="ps-footer-actions">
                  <button className="ps-btn-prev" onClick={() => goToStep(3)}>
                    <ArrowLeftIcon /> Back
                  </button>
                  <button
                    className="ps-btn-next ps-btn-finish"
                    onClick={completeSetup}
                    disabled={isFinishing}
                  >
                    {isFinishing ? "Saving..." : "Save & Complete Profile →"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="ps-preview-col">
            <div className="ps-preview-card">
              <div className="ps-preview-header">
                <h3>
                  <EyeIcon /> Live Resume Preview
                </h3>
                <span className="ps-live-pill">🟢 Realtime</span>
              </div>

              <div className="ps-pv-user">
                <div className="ps-pv-avatar">{initials}</div>
                <div>
                  <div className="ps-pv-name">{data.name || "Your Name"}</div>
                  <div className="ps-pv-headline">
                    {data.headline || "Professional Headline"}
                  </div>
                </div>
              </div>

              <div className="ps-pv-meta">
                {data.location && (
                  <span className="ps-pv-chip">📍 {data.location}</span>
                )}
                {data.email && (
                  <span className="ps-pv-chip">✉️ {data.email}</span>
                )}
                {data.phone && (
                  <span className="ps-pv-chip">📞 {data.phone}</span>
                )}
                {data.github && (
                  <span className="ps-pv-chip">🔗 {data.github}</span>
                )}
              </div>

              {data.summary && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">PROFESSIONAL SUMMARY</div>
                  <div className="ps-pv-block-text">{data.summary}</div>
                </div>
              )}

              {data.skills.length > 0 && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">SKILLS</div>
                  <div className="ps-pv-skills">
                    {data.skills.map((s) => (
                      <span key={s} className="ps-pv-skill-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.education.some((e) => e.university) && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">EDUCATION</div>
                  {data.education
                    .filter((e) => e.university)
                    .map((e) => (
                      <div
                        key={e.id}
                        className="ps-pv-block-text"
                        style={{ marginBottom: "6px" }}
                      >
                        <strong>{e.university}</strong>
                        {e.degree && <> — {e.degree}</>}
                      </div>
                    ))}
                </div>
              )}

              {data.projects.some((p) => p.name) && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">PROJECTS</div>
                  {data.projects
                    .filter((p) => p.name)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="ps-pv-block-text"
                        style={{ marginBottom: "8px" }}
                      >
                        <strong>{p.name}</strong>
                        {p.description && (
                          <>
                            <br />
                            {p.description}
                          </>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`ps-toast ${toast ? "show" : ""}`} aria-live="polite">
        <CheckIcon />
        <span>{toast}</span>
      </div>
    </div>
  );
}
