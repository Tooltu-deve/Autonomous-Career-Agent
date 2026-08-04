"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPreferences, getProfile } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { KEYS } from "@/lib/storage";
import type {
  PreferencesResponse,
  ProfileResponse,
  TemplateName,
} from "@/types/api";
import s from "./profile.module.css";

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
  experiences: {
    id: string;
    title: string;
    organization: string;
    description: string;
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
  }[];
  skills: string[];
  // Chỉ các field backend thực sự lưu (GET /profile/preferences)
  preferences: {
    targetRole: string;
    workType: string;
    preferredLocations: string[];
  };
}

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

export default function MasterProfilePage() {
  // Giá trị rỗng = "chưa có dữ liệu thật" — KHÔNG điền dữ liệu bịa vào state,
  // vì calculateCompletion và UI đều đọc từ đây; placeholder chỉ thêm lúc render.
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
    preferences: {
      targetRole: "",
      workType: "",
      preferredLocations: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAllData() {
      try {
        // 1. Session info (Name & Email)
        let sessionName = "";
        let sessionEmail = "";
        try {
          const session = JSON.parse(
            sessionStorage.getItem(KEYS.session) || "{}",
          );
          sessionName = session.fullName || "";
          sessionEmail = session.email || "";
        } catch {
          /* ignore */
        }

        // 2. Profile + preferences song song — hai request độc lập
        const [profRes, prefRes] = await Promise.allSettled([
          getProfile(),
          getPreferences(),
        ]);
        const prof: ProfileResponse | null =
          profRes.status === "fulfilled" ? profRes.value : null;
        const pref: PreferencesResponse | null =
          prefRes.status === "fulfilled" ? prefRes.value : null;

        if (cancelled) return;

        // Preferences chỉ từ server — không còn bản sao localStorage
        const workTypeStr = pref?.remote_preference
          ? pref.remote_preference.toUpperCase()
          : "";
        const targetRoleStr = pref?.target_role || "";
        const locationsList = pref?.preferred_locations ?? [];

        // Chỉ dữ liệu thật — field trống giữ nguyên trống để completion %
        // trung thực; placeholder "Chưa cập nhật" thêm ở tầng render.
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
              title: exp.title,
              organization: exp.organization || "",
              description: exp.description || "",
            })) ?? [],
          education:
            prof?.educations?.map((edu) => ({
              id: edu.id,
              school: edu.school,
              degree: edu.degree || "",
            })) ?? [],
          skills: prof?.skills?.map((s) => s.skill_name) ?? [],
          preferences: {
            targetRole: targetRoleStr,
            workType: workTypeStr,
            preferredLocations: locationsList,
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

  const handleExportCV = () => {
    setExporting(true);
    alert(
      `✓ Đang tiến hành kết xuất Master Profile (${profile.preferredTemplate.toUpperCase()} Template) thành bản CV chuẩn PDF tiêu chuẩn quốc tế...`,
    );
    setTimeout(() => {
      setExporting(false);
    }, 1000);
  };

  const completionPercent = calculateCompletion(profile);

  if (loading) {
    return (
      <main className={s.mainWrapper}>
        <div style={{ padding: "60px 0", textAlign: "center", color: "#666" }}>
          Đang tải dữ liệu Master Profile...
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
              <div className={s.editAvatarBadge} title="Đổi ảnh đại diện">
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
              <h1>{profile.name || "Chưa cập nhật tên"}</h1>
              <div className={s.profileHeadline}>
                {profile.headline || "Chưa cập nhật headline"}
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
                  📄 Mẫu CV: {profile.preferredTemplate.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className={s.headerActions}>
            <Link href="/profile-setup" className={s.btnEditProfile}>
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
              Chỉnh sửa Profile Setup
            </Link>
            <button
              className={s.btnExportCv}
              onClick={handleExportCV}
              disabled={exporting}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Đang xuất PDF..." : "Xuất PDF Master CV"}
            </button>
          </div>
        </div>

        <div className={s.completionStrip}>
          <div className={s.completionInfo}>
            <span className={s.compTag}>Hoàn thiện {completionPercent}%</span>
            <span className={s.compText}>
              Hồ sơ Master Profile của bạn đã được kết nối trực tiếp với hệ
              thống AI Agent!
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
        {/* Left Column: Profile Setup Data */}
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
                Tóm tắt bản thân (Executive Summary)
              </div>
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: 1.7,
                color: "var(--ink-muted)",
              }}
            >
              {profile.summary ||
                "Chưa có thông tin tóm tắt — bấm 'Chỉnh sửa Profile Setup' để bổ sung."}
            </p>
          </div>

          {/* Featured Projects / Experience */}
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
                Dự án &amp; Kinh nghiệm (Projects &amp; Experience)
              </div>
              <Link href="/profile-setup" className={s.btnAddItem}>
                + Thêm / Sửa
              </Link>
            </div>

            <div className={s.projectGrid}>
              {profile.experiences.length > 0 ? (
                profile.experiences.map((exp) => (
                  <div key={exp.id} className={s.projectCard}>
                    <div>
                      <div className={s.pTitle}>
                        {exp.title}
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
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Chưa có dự án nào. Thêm dự án tại phần Profile Setup.
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
                Học vấn (Education)
              </div>
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
                      <div className={s.itemRole}>{edu.school}</div>
                      <div className={s.itemCompany}>{edu.degree}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#888", fontSize: "13px" }}>
                  Chưa có thông tin học vấn.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Skills & Preferences Data */}
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
                Kỹ năng (Master Skills)
              </div>
              <Link
                href="/profile-setup"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--primary-hover)",
                }}
              >
                Sửa
              </Link>
            </div>

            <div className={s.skillChipsWrap}>
              {profile.skills.length === 0 && (
                <span className={s.prefVal}>Chưa thêm kỹ năng nào.</span>
              )}
              {profile.skills.map((skill) => (
                <span key={skill} className={s.masterSkillPill}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Career Preferences Summary (From Profile Preferences) */}
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
                Định hướng &amp; Sở thích
              </div>
              <Link
                href="/profile-preferences"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--primary-hover)",
                }}
              >
                Sửa
              </Link>
            </div>

            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Vị trí mong muốn:</span>
              <span className={s.prefVal}>
                {profile.preferences.targetRole || "Chưa cập nhật"}
              </span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Hình thức làm việc:</span>
              <span className={s.prefVal}>
                {profile.preferences.workType || "Chưa chọn"}
              </span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Địa điểm ưu tiên:</span>
              <span className={s.prefVal}>
                {profile.preferences.preferredLocations.length > 0
                  ? profile.preferences.preferredLocations.join(", ")
                  : "Chưa chọn"}
              </span>
            </div>
          </div>

          {/* ATS Health Audit Card */}
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
              Hồ sơ của bạn đạt{" "}
              <strong>{completionPercent}% tiêu chuẩn quét ATS</strong>. Thông
              tin đã kết nối đầy đủ giữa Profile Setup và Career Preferences.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
