"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { getPreferences, getProfile, putProfile } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { KEYS } from "@/lib/storage";
import type {
  PreferencesResponse,
  ProfileResponse,
  TemplateName,
} from "@/types/api";
import { EducationForm } from "@/app/profile-setup/_components/EducationForm";
import { ProjectsForm } from "@/app/profile-setup/_components/ProjectsForm";
import { SkillsForm } from "@/app/profile-setup/_components/SkillsForm";
import { TemplatePicker } from "@/app/profile-setup/_components/TemplatePicker";
import "@/app/profile-setup/profile-setup.css";
import s from "./profile.module.css";

/* ═══════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════ */
interface EducationEntry {
  id: string;
  university: string;
  degree: string;
  server?: {
    field_of_study?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
  };
}

interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  server?: {
    organization?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
}

interface DisplayProfile {
  name: string;
  avatarInitials: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
  preferredTemplate: TemplateName;
  summary: string;
  experiences: ProjectEntry[];
  education: EducationEntry[];
  skills: string[];
  preferences: {
    targetRole: string;
    workType: string;
    preferredLocations: string[];
  };
}

type ActiveModal =
  "basic" | "summary" | "projects" | "education" | "skills" | null;

let _uid = 1000;
function uid() {
  return String(++_uid);
}

/* ═══════════════════════════════════════════════════
   Completion
═══════════════════════════════════════════════════ */
function calculateCompletion(p: DisplayProfile): number {
  let score = 0;
  if (p.name) score += 10;
  if (p.headline) score += 10;
  if (p.summary) score += 15;
  if (p.location) score += 5;
  if (p.email) score += 5;
  if (p.phone) score += 5;
  if (p.github) score += 5;
  if (p.skills.length > 0) score += 15;
  if (p.education.length > 0) score += 15;
  if (p.experiences.length > 0) score += 10;
  if (p.preferences.targetRole) score += 5;
  return Math.min(score, 100);
}

/* ═══════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════ */
export default function MasterProfilePage() {
  const [profile, setProfile] = useState<DisplayProfile>({
    name: "",
    avatarInitials: "?",
    headline: "",
    location: "",
    email: "",
    phone: "",
    github: "",
    linkedin: "",
    preferredTemplate: "classic",
    summary: "",
    experiences: [],
    education: [],
    skills: [],
    preferences: { targetRole: "", workType: "", preferredLocations: [] },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Toast helper ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  /* ── Load profile + preferences ── */
  useEffect(() => {
    let cancelled = false;
    async function loadAllData() {
      try {
        let sessionName = "",
          sessionEmail = "";
        try {
          const session = JSON.parse(
            sessionStorage.getItem(KEYS.session) || "{}",
          );
          sessionName = session.fullName || "";
          sessionEmail = session.email || "";
        } catch {
          /* ignore */
        }

        const [profRes, prefRes] = await Promise.allSettled([
          getProfile(),
          getPreferences(),
        ]);
        const prof: ProfileResponse | null =
          profRes.status === "fulfilled" ? profRes.value : null;
        const pref: PreferencesResponse | null =
          prefRes.status === "fulfilled" ? prefRes.value : null;

        if (cancelled) return;

        setProfile({
          name: sessionName,
          avatarInitials: getInitials(sessionName),
          headline: prof?.headline || "",
          location: prof?.location || "",
          email: sessionEmail,
          phone: prof?.phone || "",
          github: prof?.github_url || "",
          linkedin: prof?.linkedin_url || "",
          preferredTemplate: prof?.preferred_template || "classic",
          summary: prof?.summary || "",
          experiences:
            prof?.experiences?.map((exp) => ({
              id: exp.id,
              name: exp.title,
              description: exp.description || "",
              server: {
                organization: exp.organization,
                start_date: exp.start_date,
                end_date: exp.end_date,
              },
            })) ?? [],
          education:
            prof?.educations?.map((edu) => ({
              id: edu.id,
              university: edu.school,
              degree: edu.degree || "",
              server: {
                field_of_study: edu.field_of_study,
                start_date: edu.start_date,
                end_date: edu.end_date,
                description: edu.description,
              },
            })) ?? [],
          skills: prof?.skills?.map((s) => s.skill_name) ?? [],
          preferences: {
            targetRole: pref?.target_role || "",
            workType: pref?.remote_preference
              ? pref.remote_preference.toUpperCase()
              : "",
            preferredLocations: pref?.preferred_locations ?? [],
          },
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAllData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Save helper ── */
  const saveProfile = useCallback(
    async (
      patch: Partial<{
        headline: string;
        location: string;
        phone: string;
        github: string;
        linkedin: string;
        preferredTemplate: TemplateName;
        summary: string;
        experiences: ProjectEntry[];
        education: EducationEntry[];
        skills: string[];
      }>,
    ) => {
      setSaving(true);
      try {
        const mergedHeadline =
          patch.headline !== undefined ? patch.headline : profile.headline;
        const mergedLocation =
          patch.location !== undefined ? patch.location : profile.location;
        const mergedPhone =
          patch.phone !== undefined ? patch.phone : profile.phone;
        const mergedGithub =
          patch.github !== undefined ? patch.github : profile.github;
        const mergedLinkedin =
          patch.linkedin !== undefined ? patch.linkedin : profile.linkedin;
        const mergedTemplate =
          patch.preferredTemplate ?? profile.preferredTemplate;
        const mergedSummary =
          patch.summary !== undefined ? patch.summary : profile.summary;
        const mergedExp = patch.experiences ?? profile.experiences;
        const mergedEdu = patch.education ?? profile.education;
        const mergedSkills = patch.skills ?? profile.skills;

        // Filter once — use for both PUT and setProfile so UI stays in sync
        const filteredExp = mergedExp.filter((e) => e.name.trim());
        const filteredEdu = mergedEdu.filter((e) => e.university.trim());

        await putProfile({
          headline: mergedHeadline.trim() || null,
          summary: mergedSummary.trim() || null,
          location: mergedLocation.trim() || null,
          phone: mergedPhone.trim() || null,
          github_url: mergedGithub.trim() || null,
          linkedin_url: mergedLinkedin.trim() || null,
          preferred_template: mergedTemplate,
          experiences: filteredExp.map((e, i) => ({
            title: e.name.trim(),
            organization: e.server?.organization || "Personal Project",
            start_date: e.server?.start_date ?? null,
            end_date: e.server?.end_date ?? null,
            description: e.description.trim() || null,
            display_order: i,
          })),
          educations: filteredEdu.map((e, i) => ({
            school: e.university.trim(),
            degree: e.degree.trim() || null,
            field_of_study: e.server?.field_of_study ?? null,
            start_date: e.server?.start_date ?? null,
            end_date: e.server?.end_date ?? null,
            description: e.server?.description ?? null,
            display_order: i,
          })),
          skills: mergedSkills,
        });

        setProfile((prev) => ({
          ...prev,
          headline: mergedHeadline,
          location: mergedLocation,
          phone: mergedPhone,
          github: mergedGithub,
          linkedin: mergedLinkedin,
          preferredTemplate: mergedTemplate,
          summary: mergedSummary,
          experiences: filteredExp,
          education: filteredEdu,
          skills: mergedSkills,
        }));

        setActiveModal(null);
        showToast("✓ Changes saved successfully!");
      } catch {
        showToast("✗ Save failed — please try again.");
      } finally {
        setSaving(false);
      }
    },
    [profile, showToast],
  );

  const completionPercent = calculateCompletion(profile);

  if (loading) {
    return (
      <main className={s.mainWrapper}>
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Loading Master Profile data...
        </div>
      </main>
    );
  }

  return (
    <main className={s.mainWrapper}>
      {/* Cover & Profile Header Card */}
      <div className={s.profileHeaderCard}>
        <div className={s.coverBanner} />
        <div className={s.headerContent}>
          <div className={s.profileAvatarGroup}>
            <div className={s.largeAvatar}>
              {profile.avatarInitials}
              <div
                className={s.editAvatarBadge}
                title="Edit Personal Information"
                onClick={() => setActiveModal("basic")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <div className={s.profileTitleDetails}>
              <h1>{profile.name || "Name not updated"}</h1>
              <div className={s.profileHeadline}>
                {profile.headline || "Headline not updated"}
              </div>
              <div className={s.profileBadgesRow}>
                {profile.location && (
                  <span className={s.pBadge}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    {profile.location}
                  </span>
                )}
                {profile.email && (
                  <span className={s.pBadge}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                    {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className={s.pBadge}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {profile.phone}
                  </span>
                )}
                {profile.github && (
                  <span className={s.pBadge}>
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
                    {profile.github}
                  </span>
                )}
                {profile.linkedin && (
                  <span className={s.pBadge}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                    {profile.linkedin}
                  </span>
                )}
                <span
                  className={s.pBadge}
                  style={{ color: "#E5544F", fontWeight: 600 }}
                >
                  📄 CV Template: {profile.preferredTemplate.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={s.headerActions}>
            <button
              className={s.btnEditProfile}
              onClick={() => setActiveModal("basic")}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Personal Information
            </button>
          </div>
        </div>

        <div className={s.completionStrip}>
          <div className={s.completionInfo}>
            <span className={s.compTag}>{completionPercent}% Complete</span>
            <span className={s.compText}>
              Your Master Profile is directly connected to the AI Agent system!
            </span>
          </div>
          <div className={s.compBarContainer}>
            <div
              className={s.compBarFill}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dual Column Layout */}
      <div className={s.profileGrid}>
        {/* Left Column */}
        <div className={s.profileMainCol}>
          {/* Executive Summary */}
          <div className={s.sectionCard}>
            <div className={s.cardHeader}>
              <div className={s.cardTitle}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Executive Summary
              </div>
              <button
                className={s.btnAddItem}
                onClick={() => setActiveModal("summary")}
                type="button"
              >
                + Add / Edit
              </button>
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "var(--ink-muted)",
              }}
            >
              {profile.summary ||
                "No summary provided — click 'Edit' to add one."}
            </p>
          </div>

          {/* Projects & Experience */}
          <div className={s.sectionCard}>
            <div className={s.cardHeader}>
              <div className={s.cardTitle}>
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
                Projects &amp; Experience
              </div>
              <button
                className={s.btnAddItem}
                onClick={() => setActiveModal("projects")}
                type="button"
              >
                + Add / Edit
              </button>
            </div>

            <div className={s.projectGrid}>
              {profile.experiences.length > 0 ? (
                profile.experiences.map((exp) => (
                  <div key={exp.id} className={s.projectCard}>
                    <div>
                      <div className={s.pTitle}>
                        {exp.name}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </div>
                      <div className={s.pDesc}>{exp.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    color: "#888",
                    fontSize: "13px",
                    gridColumn: "1/-1",
                  }}
                >
                  No projects added yet — click &apos;+ Add / Edit&apos; to add
                  one.
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          <div className={s.sectionCard}>
            <div className={s.cardHeader}>
              <div className={s.cardTitle}>
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
                Education
              </div>
              <button
                className={s.btnAddItem}
                onClick={() => setActiveModal("education")}
                type="button"
              >
                + Add / Edit
              </button>
            </div>

            <div className={s.timelineList}>
              {profile.education.length > 0 ? (
                profile.education.map((edu) => (
                  <div key={edu.id} className={s.timelineItem}>
                    <div
                      className={s.itemLogo}
                      style={{ background: "var(--surface-2)" }}
                    >
                      🎓
                    </div>
                    <div className={s.itemBody}>
                      <div className={s.itemRole}>{edu.university}</div>
                      <div className={s.itemCompany}>{edu.degree}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#888", fontSize: "13px" }}>
                  No education entries — click &apos;+ Add / Edit&apos; to add
                  one.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={s.profileSideCol}>
          {/* Master Skills */}
          <div className={s.sectionCard}>
            <div className={s.cardHeader}>
              <div className={s.cardTitle}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Master Skills
              </div>
              <button
                onClick={() => setActiveModal("skills")}
                type="button"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--primary-hover)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            </div>
            <div className={s.skillChipsWrap}>
              {profile.skills.length === 0 && (
                <span className={s.prefVal}>No skills added yet.</span>
              )}
              {profile.skills.map((skill) => (
                <span key={skill} className={s.masterSkillPill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Career Preferences */}
          <div className={s.sectionCard}>
            <div className={s.cardHeader}>
              <div className={s.cardTitle}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="12" cy="12" r="0.5" fill="currentColor" />
                </svg>
                Career Preferences
              </div>
              <Link
                href="/profile-preferences"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--primary-hover)",
                }}
              >
                Edit
              </Link>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Target Role:</span>
              <span className={s.prefVal}>
                {profile.preferences.targetRole || "Not updated"}
              </span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Work Type:</span>
              <span className={s.prefVal}>
                {profile.preferences.workType || "Not selected"}
              </span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Preferred Locations:</span>
              <span className={s.prefVal}>
                {profile.preferences.preferredLocations.length > 0
                  ? profile.preferences.preferredLocations.join(", ")
                  : "Not selected"}
              </span>
            </div>
          </div>

          {/* ATS Health Card */}
          <div
            className={s.sectionCard}
            style={{
              background: "linear-gradient(135deg, #FFFDFD 0%, #FAF6F6 100%)",
              borderColor: "#F5C7C5",
            }}
          >
            <div
              className={s.cardTitle}
              style={{ color: "var(--primary-hover)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              ATS Profile Readiness
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--ink-muted)",
                marginTop: "8px",
                lineHeight: 1.5,
              }}
            >
              Your profile reaches{" "}
              <strong>{completionPercent}% ATS compliance standard</strong>.
              Information is fully connected between Profile Setup and Career
              Preferences.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}

      {/* Basic Info Modal */}
      {activeModal === "basic" && (
        <BasicInfoModal
          initialProfile={profile}
          saving={saving}
          onSave={(patch) => void saveProfile(patch)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Summary Modal */}
      {activeModal === "summary" && (
        <SummaryModal
          initialValue={profile.summary}
          saving={saving}
          onSave={(val) => void saveProfile({ summary: val })}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Projects Modal */}
      {activeModal === "projects" && (
        <ProjectsModal
          initialProjects={profile.experiences}
          saving={saving}
          onSave={(projects) => void saveProfile({ experiences: projects })}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Education Modal */}
      {activeModal === "education" && (
        <EducationModal
          initialEducation={profile.education}
          saving={saving}
          onSave={(edu) => void saveProfile({ education: edu })}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Skills Modal */}
      {activeModal === "skills" && (
        <SkillsModal
          initialSkills={profile.skills}
          saving={saving}
          onSave={(skills) => void saveProfile({ skills })}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Toast */}
      <div className={`${s.toastBar} ${toast ? s.toastShow : ""}`}>{toast}</div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════
   Modal Wrapper
═══════════════════════════════════════════════════ */
function ModalWrapper({
  title,
  onClose,
  onSave,
  saving,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={s.modalBackdrop} onClick={handleBackdrop}>
      <div className={s.modalDialog}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>{title}</span>
          <button
            className={s.modalClose}
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
        <div className={s.modalFooter}>
          <button
            className={s.modalBtnCancel}
            onClick={onClose}
            type="button"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className={s.modalBtnSave}
            onClick={onSave}
            type="button"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Basic Info Modal
═══════════════════════════════════════════════════ */
function BasicInfoModal({
  initialProfile,
  saving,
  onSave,
  onClose,
}: {
  initialProfile: DisplayProfile;
  saving: boolean;
  onSave: (patch: {
    headline: string;
    location: string;
    phone: string;
    github: string;
    linkedin: string;
    preferredTemplate: TemplateName;
  }) => void;
  onClose: () => void;
}) {
  const [headline, setHeadline] = useState(initialProfile.headline);
  const [location, setLocation] = useState(initialProfile.location);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [github, setGithub] = useState(initialProfile.github);
  const [linkedin, setLinkedin] = useState(initialProfile.linkedin);
  const [preferredTemplate, setPreferredTemplate] = useState<TemplateName>(
    initialProfile.preferredTemplate,
  );

  return (
    <ModalWrapper
      title="👤 Personal Information & CV Template"
      onClose={onClose}
      onSave={() =>
        onSave({
          headline,
          location,
          phone,
          github,
          linkedin,
          preferredTemplate,
        })
      }
      saving={saving}
    >
      <div className={s.formGroup}>
        <label className={s.formLabel}>Professional Headline</label>
        <input
          className={s.formInput}
          type="text"
          value={headline}
          placeholder="e.g., Computer Science Student · MIT"
          onChange={(e) => setHeadline(e.target.value)}
          autoFocus
        />
      </div>
      <div className={s.formGrid2}>
        <div className={s.formGroup}>
          <label className={s.formLabel}>Location</label>
          <input
            className={s.formInput}
            type="text"
            value={location}
            placeholder="e.g., Ho Chi Minh City, Vietnam"
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className={s.formGroup}>
          <label className={s.formLabel}>Phone Number</label>
          <input
            className={s.formInput}
            type="text"
            value={phone}
            placeholder="e.g., +84 901 234 567"
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className={s.formGrid2}>
        <div className={s.formGroup}>
          <label className={s.formLabel}>GitHub / Portfolio</label>
          <input
            className={s.formInput}
            type="text"
            value={github}
            placeholder="e.g., github.com/username"
            onChange={(e) => setGithub(e.target.value)}
          />
        </div>
        <div className={s.formGroup}>
          <label className={s.formLabel}>LinkedIn</label>
          <input
            className={s.formInput}
            type="text"
            value={linkedin}
            placeholder="e.g., linkedin.com/in/username"
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <TemplatePicker
          selectedTemplate={preferredTemplate}
          onSelect={setPreferredTemplate}
        />
      </div>
    </ModalWrapper>
  );
}

/* ═══════════════════════════════════════════════════
   Summary Modal
═══════════════════════════════════════════════════ */
function SummaryModal({
  initialValue,
  saving,
  onSave,
  onClose,
}: {
  initialValue: string;
  saving: boolean;
  onSave: (val: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <ModalWrapper
      title="Executive Summary"
      onClose={onClose}
      onSave={() => onSave(value)}
      saving={saving}
    >
      <div className={s.formGroup}>
        <label className={s.formLabel}>Summary Content</label>
        <textarea
          className={s.formTextarea}
          value={value}
          rows={6}
          placeholder="Write a short 2-3 sentence introduction highlighting your skills and career goals..."
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div className={s.formHint}>{value.length} characters</div>
      </div>
    </ModalWrapper>
  );
}

/* ═══════════════════════════════════════════════════
   Projects Modal (uses shared ProjectsForm component)
═══════════════════════════════════════════════════ */
function ProjectsModal({
  initialProjects,
  saving,
  onSave,
  onClose,
}: {
  initialProjects: ProjectEntry[];
  saving: boolean;
  onSave: (projects: ProjectEntry[]) => void;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<ProjectEntry[]>(
    initialProjects.length > 0
      ? initialProjects
      : [{ id: uid(), name: "", description: "" }],
  );

  const addProject = () =>
    setProjects((p) => [...p, { id: uid(), name: "", description: "" }]);
  const removeProject = (id: string | number) =>
    setProjects((p) => p.filter((x) => x.id !== id));
  const updateProject = (
    id: string | number,
    field: "name" | "description",
    val: string,
  ) =>
    setProjects((p) =>
      p.map((x) => (x.id === id ? { ...x, [field]: val } : x)),
    );

  return (
    <ModalWrapper
      title="📁 Projects & Experience"
      onClose={onClose}
      onSave={() => onSave(projects)}
      saving={saving}
    >
      <ProjectsForm
        projects={projects}
        onAddProject={addProject}
        onRemoveProject={removeProject}
        onUpdateProject={updateProject}
      />
    </ModalWrapper>
  );
}

/* ═══════════════════════════════════════════════════
   Education Modal (uses shared EducationForm component)
═══════════════════════════════════════════════════ */
function EducationModal({
  initialEducation,
  saving,
  onSave,
  onClose,
}: {
  initialEducation: EducationEntry[];
  saving: boolean;
  onSave: (edu: EducationEntry[]) => void;
  onClose: () => void;
}) {
  const [education, setEducation] = useState<EducationEntry[]>(
    initialEducation.length > 0
      ? initialEducation
      : [{ id: uid(), university: "", degree: "" }],
  );

  const addEdu = () =>
    setEducation((e) => [...e, { id: uid(), university: "", degree: "" }]);
  const removeEdu = (id: string | number) =>
    setEducation((e) => e.filter((x) => x.id !== id));
  const updateEdu = (
    id: string | number,
    field: "university" | "degree",
    val: string,
  ) =>
    setEducation((e) =>
      e.map((x) => (x.id === id ? { ...x, [field]: val } : x)),
    );

  return (
    <ModalWrapper
      title="🎓 Education"
      onClose={onClose}
      onSave={() => onSave(education)}
      saving={saving}
    >
      <EducationForm
        education={education}
        onAdd={addEdu}
        onRemove={removeEdu}
        onUpdate={updateEdu}
      />
    </ModalWrapper>
  );
}

/* ═══════════════════════════════════════════════════
   Skills Modal (uses shared SkillsForm component)
═══════════════════════════════════════════════════ */
function SkillsModal({
  initialSkills,
  saving,
  onSave,
  onClose,
}: {
  initialSkills: string[];
  saving: boolean;
  onSave: (skills: string[]) => void;
  onClose: () => void;
}) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [custom, setCustom] = useState("");

  const addSkill = (name: string) => {
    const t = name.trim();
    if (!t || skills.includes(t)) return;
    setSkills((s) => [...s, t]);
  };

  const removeSkill = (name: string) =>
    setSkills((s) => s.filter((x) => x !== name));

  const handleCustomAdd = () => {
    addSkill(custom);
    setCustom("");
  };

  return (
    <ModalWrapper
      title="⭐ Master Skills"
      onClose={onClose}
      onSave={() => onSave(skills)}
      saving={saving}
    >
      <SkillsForm
        skills={skills}
        customSkill={custom}
        setCustomSkill={setCustom}
        onAddSkill={addSkill}
        onRemoveSkill={removeSkill}
        onCustomAdd={handleCustomAdd}
      />
    </ModalWrapper>
  );
}
