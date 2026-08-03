'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_PROFILE_DATA } from '@/lib/mock/profile';
import { MasterProfileData } from '@/types/profile';
import s from './profile.module.css';

export default function MasterProfilePage() {
  const [profile, setProfile] = useState<MasterProfileData>(MOCK_PROFILE_DATA);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Try reading profile data from storage if available
    try {
      const stored = localStorage.getItem('careernav_profile_data');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<MasterProfileData>;
        setProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Fallback to mock data
    }
  }, []);

  const handleExportCV = () => {
    setExporting(true);
    alert('✓ Đang tiến hành kết xuất Master Profile thành bản CV chuẩn PDF tiêu chuẩn quốc tế...');
    setTimeout(() => {
      setExporting(false);
    }, 1000);
  };

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
              <h1>{profile.name}</h1>
              <div className={s.profileHeadline}>{profile.headline}</div>
              <div className={s.profileBadgesRow}>
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
                <span className={s.pBadge}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  {profile.institution}
                </span>
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
              Chỉnh sửa Hồ sơ
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
              {exporting ? 'Đang xuất PDF...' : 'Xuất PDF Master CV'}
            </button>
          </div>
        </div>

        <div className={s.completionStrip}>
          <div className={s.completionInfo}>
            <span className={s.compTag}>Hoàn thiện {profile.completionPercent}%</span>
            <span className={s.compText}>
              Hồ sơ Master Profile của bạn đã rất sẵn sàng để AI tự động ứng tuyển!
            </span>
          </div>
          <div className={s.compBarContainer}>
            <div
              className={s.compBarFill}
              style={{ width: `${profile.completionPercent}%` }}
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
                Tóm tắt bản thân (Executive Summary)
              </div>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--ink-muted)' }}>
              {profile.summary}
            </p>
          </div>

          {/* Work Experience */}
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
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Kinh nghiệm làm việc (Experience)
              </div>
              <Link href="/profile-setup" className={s.btnAddItem}>
                + Thêm kinh nghiệm
              </Link>
            </div>

            <div className={s.timelineList}>
              {profile.experiences.map((exp) => (
                <div key={exp.id} className={s.timelineItem}>
                  <div
                    className={s.itemLogo}
                    style={{ background: exp.logoBg, color: exp.logoColor }}
                  >
                    {exp.logoText}
                  </div>
                  <div className={s.itemBody}>
                    <div className={s.itemRole}>{exp.role}</div>
                    <div className={s.itemCompany}>{exp.company}</div>
                    <div className={s.itemPeriod}>{exp.period}</div>
                    <div className={s.itemDesc}>
                      <ul>
                        {exp.bullets.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={s.tagList}>
                      {exp.tags.map((t) => (
                        <span key={t} className={s.tagItem}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects */}
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
                Dự án nổi bật (Projects)
              </div>
              <Link href="/profile-setup" className={s.btnAddItem}>
                + Thêm dự án
              </Link>
            </div>

            <div className={s.projectGrid}>
              {profile.projects.map((proj) => (
                <div key={proj.id} className={s.projectCard}>
                  <div>
                    <div className={s.pTitle}>
                      {proj.title}
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
                    <div className={s.pDesc}>{proj.description}</div>
                  </div>
                  <div className={s.tagList} style={{ marginTop: '12px' }}>
                    {proj.tags.map((t) => (
                      <span key={t} className={s.tagItem}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
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
                Học vấn & Chứng chỉ (Education)
              </div>
            </div>

            <div className={s.timelineList}>
              {profile.education.map((edu) => (
                <div key={edu.id} className={s.timelineItem}>
                  <div className={s.itemLogo} style={{ background: 'var(--surface-2)' }}>
                    {edu.icon}
                  </div>
                  <div className={s.itemBody}>
                    <div className={s.itemRole}>{edu.degree}</div>
                    <div className={s.itemCompany}>{edu.institution}</div>
                    <div className={s.itemPeriod}>
                      {edu.period}
                      {edu.details ? ` · ${edu.details}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className={s.profileSideCol}>
          {/* Skills Matrix */}
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
            </div>

            <div className={s.skillsGroup}>
              {profile.skills.map((cat, i) => (
                <div key={cat.title}>
                  <div
                    className={s.skillCategoryTitle}
                    style={{ marginTop: i > 0 ? '8px' : '0' }}
                  >
                    {cat.title}
                  </div>
                  <div className={s.skillChipsWrap} style={{ marginTop: '6px' }}>
                    {cat.skills.map((skill) => (
                      <span
                        key={skill}
                        className={`${s.masterSkillPill} ${
                          cat.level === 'expert'
                            ? s.expert
                            : cat.level === 'advanced'
                              ? s.advanced
                              : ''
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Career Preferences Summary */}
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
                Định hướng & Sở thích
              </div>
              <Link
                href="/profile-preferences"
                style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-hover)' }}
              >
                Sửa
              </Link>
            </div>

            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Vị trí mong muốn:</span>
              <span className={s.prefVal}>{profile.preferences.targetRole}</span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Hình thức làm việc:</span>
              <span className={s.prefVal}>{profile.preferences.workType}</span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Mức lương kỳ vọng:</span>
              <span className={s.prefVal}>{profile.preferences.salaryExpectation}</span>
            </div>
            <div className={s.prefItemRow}>
              <span className={s.prefLbl}>Địa điểm:</span>
              <span className={s.prefVal}>{profile.preferences.location}</span>
            </div>
          </div>

          {/* ATS Health Audit Card */}
          <div
            className={s.sectionCard}
            style={{
              background: 'linear-gradient(135deg, #FFFDFD 0%, #FAF6F6 100%)',
              borderColor: '#F5C7C5',
            }}
          >
            <div className={s.cardTitle} style={{ color: 'var(--primary-hover)' }}>
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
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '8px', lineHeight: 1.5 }}>
              Hồ sơ của bạn đạt <strong>{profile.atsScorePercent}% tiêu chuẩn quét ATS</strong>. Các từ khóa cốt lõi đã được tối ưu cho vị trí AI Engineer.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
