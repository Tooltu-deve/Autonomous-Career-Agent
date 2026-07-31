'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './profile-setup.css';

/* ── Types ── */
interface EducationEntry { id: number; university: string; degree: string; }
interface ProjectEntry { id: number; name: string; description: string; }

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

const SUGGESTED_SKILLS = ['React', 'Git', 'Docker', 'PostgreSQL', 'English', 'TypeScript', 'Node.js', 'AWS'];

/* ── SVG Icons ── */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M9 12h6M9 16h6" />
  </svg>
);
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 8l10 7 10-7" />
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const EduIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const TrendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l6-6 4 4 8-8" /><path d="M17 7h4v4" />
  </svg>
);
const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XSmallIcon = () => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
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
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

let nextId = 100;
function uid() { return ++nextId; }

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const [data, setData] = useState<ProfileData>({
    name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    github: '',
    summary: '',
    education: [{ id: uid(), university: '', degree: '' }],
    skills: ['Python', 'C++', 'SQL', 'FastAPI'],
    projects: [{ id: uid(), name: '', description: '' }],
  });

  const [customSkill, setCustomSkill] = useState('');

  /* ── Guard: check session & 1-time onboarding completion ── */
  useEffect(() => {
    const raw = sessionStorage.getItem('careernav_session');
    if (!raw) { router.replace('/'); return; }

    const completed = localStorage.getItem('careernav_profile_completed');
    if (completed === 'true') {
      const prefsDone = localStorage.getItem('careernav_preferences_completed');
      if (prefsDone !== 'true') {
        router.replace('/profile-preferences');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // Pre-fill email from session
    try {
      const activeRaw = sessionStorage.getItem('careernav_session') || '{}';
      const session = JSON.parse(activeRaw);
      setData((d) => ({
        ...d,
        email: session.email || '',
        name: `${session.firstName || ''} ${session.lastName || ''}`.trim() || d.name,
      }));
    } catch { /* ignore */ }
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
    setCustomSkill('');
  };

  /* ── Education ── */
  const addEducation = () => {
    setData((d) => ({ ...d, education: [...d.education, { id: uid(), university: '', degree: '' }] }));
    showToast('Added new education entry');
  };
  const removeEducation = (id: number) => {
    setData((d) => ({ ...d, education: d.education.filter((e) => e.id !== id) }));
    showToast('Entry removed');
  };
  const updateEducation = (id: number, field: 'university' | 'degree', value: string) => {
    setData((d) => ({
      ...d,
      education: d.education.map((e) => e.id === id ? { ...e, [field]: value } : e),
    }));
  };

  /* ── Projects ── */
  const addProject = () => {
    setData((d) => ({ ...d, projects: [...d.projects, { id: uid(), name: '', description: '' }] }));
    showToast('Added new project entry');
  };
  const removeProject = (id: number) => {
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
    showToast('Entry removed');
  };
  const updateProject = (id: number, field: 'name' | 'description', value: string) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => p.id === id ? { ...p, [field]: value } : p),
    }));
  };

  /* ── Navigation ── */
  const goToStep = (s: number) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skipAndFinish = () => {
    // Mark profile done and go to preferences
    localStorage.setItem('careernav_profile_completed', 'true');
    router.push('/profile-preferences');
  };

  const completeSetup = () => {
    setIsFinishing(true);
    // Save profile to localStorage
    localStorage.setItem('careernav_profile', JSON.stringify(data));
    localStorage.setItem('careernav_profile_completed', 'true');
    showToast('Profile đã lưu! Chuyển sang thiết lập preferences…');
    setTimeout(() => router.push('/profile-preferences'), 1200);
  };

  const completeness = calcCompleteness(data);
  const initials = getInitials(data.name || '?');

  /* ── Step tab state ── */
  const STEPS = [
    { num: 1, label: 'Thông tin cá nhân', icon: <UserIcon /> },
    { num: 2, label: 'Học vấn', icon: <EduIcon /> },
    { num: 3, label: 'Kỹ năng', icon: <TrendIcon /> },
    { num: 4, label: 'Dự án', icon: <LayersIcon /> },
  ];

  return (
    <div className="ps-root">
      {/* ── Top Navbar ── */}
      <header className="ps-navbar">
        <div className="ps-brand">
          <div className="ps-brand-mark">
            <span /><span /><span />
          </div>
          <span className="ps-brand-text">CareerNav</span>
        </div>
        <button className="ps-skip-top" onClick={skipAndFinish} disabled={isFinishing}>
          Bỏ qua, làm sau →
        </button>
      </header>

      <div className="ps-shell">
        {/* ── Hero Banner ── */}
        <div className="ps-hero">
          <div className="ps-hero-text">
            <h1><span className="ps-sparkle">✨</span> Thiết lập hồ sơ của bạn</h1>
            <p>Điền thông tin để AI có thể tìm việc phù hợp và tạo CV chuẩn ATS tự động cho bạn.</p>
          </div>
          {/* Completeness gauge */}
          <div className="ps-meter-card">
            <div
              className="ps-gauge"
              style={{ '--pct': completeness } as React.CSSProperties}
            >
              <span>{completeness}%</span>
            </div>
            <div>
              <div className="ps-gauge-title">
                {completeness >= 90 ? 'Hồ sơ hoàn chỉnh ✓' : completeness >= 60 ? 'Đang tiến triển tốt' : 'Đang thiết lập…'}
              </div>
              <div className="ps-gauge-sub">Độ sẵn sàng ATS theo thời gian thực</div>
            </div>
          </div>
        </div>

        {/* ── Wizard Step Track ── */}
        <nav className="ps-step-track" aria-label="Các bước thiết lập">
          {STEPS.map((s) => (
            <button
              key={s.num}
              className={`ps-step-btn ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
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
                  <div className="ps-card-title"><UserIcon />Thông tin cá nhân</div>
                  <span className="ps-step-tag">BƯỚC 1/4</span>
                </div>

                {/* Avatar row */}
                <div className="ps-avatar-row">
                  <div className="ps-avatar-lg">{initials}</div>
                  <div>
                    <button className="ps-btn-upload" type="button" onClick={() => showToast('Tính năng upload ảnh sẽ sớm có!')}>
                      Tải lên ảnh đại diện
                    </button>
                    <div className="ps-upload-hint">Định dạng JPG hoặc PNG, tối đa 5MB</div>
                  </div>
                </div>

                <div className="ps-grid2">
                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-name">Họ và tên đầy đủ</label>
                    <div className="ps-input-wrap">
                      <input id="ps-name" type="text" value={data.name} placeholder="Nguyễn Văn A"
                        onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
                      <UserIcon />
                    </div>
                  </div>

                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-headline">Tiêu đề nghề nghiệp</label>
                    <div className="ps-input-wrap">
                      <input id="ps-headline" type="text" value={data.headline} placeholder="Sinh viên Khoa học Máy tính · HCMUS"
                        onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))} />
                      <FileIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-email">Email</label>
                    <div className="ps-input-wrap">
                      <input id="ps-email" type="email" value={data.email} placeholder="you@email.com"
                        onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))} />
                      <EmailIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-phone">Số điện thoại</label>
                    <div className="ps-input-wrap">
                      <input id="ps-phone" type="tel" value={data.phone} placeholder="+84 901 234 567"
                        onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))} />
                      <PhoneIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-location">Địa điểm</label>
                    <div className="ps-input-wrap">
                      <input id="ps-location" type="text" value={data.location} placeholder="TP. Hồ Chí Minh, Việt Nam"
                        onChange={(e) => setData((d) => ({ ...d, location: e.target.value }))} />
                      <MapPinIcon />
                    </div>
                  </div>

                  <div className="ps-form-group">
                    <label htmlFor="ps-github">GitHub / Portfolio</label>
                    <div className="ps-input-wrap">
                      <input id="ps-github" type="text" value={data.github} placeholder="github.com/username"
                        onChange={(e) => setData((d) => ({ ...d, github: e.target.value }))} />
                      <LinkIcon />
                    </div>
                  </div>

                  <div className="ps-form-group ps-span-full">
                    <label htmlFor="ps-summary">Tóm tắt nghề nghiệp</label>
                    <textarea id="ps-summary" value={data.summary}
                      placeholder="Giới thiệu ngắn gọn 2–3 câu mà AI sẽ dùng trong mỗi CV được tạo tự động…"
                      onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))} />
                  </div>
                </div>

                <div className="ps-footer-actions">
                  <span className="ps-skip-link" onClick={skipAndFinish}>Bỏ qua tất cả</span>
                  <button className="ps-btn-next" onClick={() => goToStep(2)}>
                    Tiếp: Học vấn →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Education */}
            {step === 2 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title"><EduIcon />Học vấn</div>
                  <span className="ps-step-tag">BƯỚC 2/4</span>
                </div>

                <div className="ps-dynamic-list">
                  {data.education.map((edu, idx) => (
                    <div key={edu.id} className="ps-dynamic-card">
                      <div className="ps-dynamic-header">
                        <span className="ps-dynamic-label">Học vấn {idx + 1}</span>
                        <button className="ps-btn-trash" onClick={() => removeEducation(edu.id)}
                          title="Xóa">
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="ps-grid2">
                        <div className="ps-form-group">
                          <label>Trường / Cơ sở đào tạo</label>
                          <div className="ps-input-wrap">
                            <input type="text" value={edu.university} placeholder="VD: HCMUS"
                              onChange={(e) => updateEducation(edu.id, 'university', e.target.value)} />
                            <EduIcon />
                          </div>
                        </div>
                        <div className="ps-form-group">
                          <label>Ngành / Bằng cấp</label>
                          <div className="ps-input-wrap">
                            <input type="text" value={edu.degree} placeholder="VD: Cử nhân Khoa học Máy tính"
                              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
                            <CheckIcon />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="ps-btn-add-entry" onClick={addEducation}>
                  <PlusIcon /> Thêm học vấn
                </button>

                <div className="ps-footer-actions">
                  <button className="ps-btn-prev" onClick={() => goToStep(1)}>
                    <ArrowLeftIcon /> Quay lại
                  </button>
                  <button className="ps-btn-next" onClick={() => goToStep(3)}>
                    Tiếp: Kỹ năng →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Skills */}
            {step === 3 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title"><TrendIcon />Bộ kỹ năng</div>
                  <span className="ps-step-tag">BƯỚC 3/4</span>
                </div>

                {/* Skills pill wall */}
                <div className="ps-skills-wall">
                  {data.skills.length === 0 && (
                    <span className="ps-skills-empty">Chưa có kỹ năng nào — thêm bên dưới!</span>
                  )}
                  {data.skills.map((skill) => (
                    <span key={skill} className="ps-skill-chip">
                      {skill}
                      <button onClick={() => removeSkill(skill)} aria-label={`Xóa ${skill}`}>
                        <XSmallIcon />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Custom add row */}
                <div className="ps-add-skill-row">
                  <div className="ps-input-wrap ps-input-noicon">
                    <input type="text" value={customSkill} placeholder="Nhập kỹ năng và nhấn Enter…"
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomSkillAdd(); } }}
                    />
                  </div>
                  <button className="ps-btn-upload" type="button" onClick={handleCustomSkillAdd}>
                    Thêm
                  </button>
                </div>

                {/* Suggested skills */}
                <div className="ps-suggested-label">GỢI Ý KỸ NĂNG PHỔ BIẾN</div>
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
                    <ArrowLeftIcon /> Quay lại
                  </button>
                  <button className="ps-btn-next" onClick={() => goToStep(4)}>
                    Tiếp: Dự án →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Projects */}
            {step === 4 && (
              <div className="ps-card ps-animate-in">
                <div className="ps-card-header">
                  <div className="ps-card-title"><LayersIcon />Dự án nổi bật</div>
                  <span className="ps-step-tag">BƯỚC 4/4</span>
                </div>

                <div className="ps-dynamic-list">
                  {data.projects.map((proj, idx) => (
                    <div key={proj.id} className="ps-dynamic-card">
                      <div className="ps-dynamic-header">
                        <span className="ps-dynamic-label">Dự án {idx + 1}</span>
                        <button className="ps-btn-trash" onClick={() => removeProject(proj.id)} title="Xóa">
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="ps-form-group" style={{ marginBottom: '12px' }}>
                        <label>Tên dự án</label>
                        <input type="text" className="ps-input-bare" value={proj.name} placeholder="VD: Autonomous Career Agent"
                          onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
                      </div>
                      <div className="ps-form-group">
                        <label>Chi tiết & Công nghệ sử dụng</label>
                        <textarea className="ps-ta-bare" value={proj.description}
                          placeholder="Mô tả ngắn gọn về những gì bạn xây dựng, kết quả đạt được và công nghệ sử dụng…"
                          onChange={(e) => updateProject(proj.id, 'description', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="ps-btn-add-entry" onClick={addProject}>
                  <PlusIcon /> Thêm dự án
                </button>

                <div className="ps-footer-actions">
                  <button className="ps-btn-prev" onClick={() => goToStep(3)}>
                    <ArrowLeftIcon /> Quay lại
                  </button>
                  <button
                    className="ps-btn-next ps-btn-finish"
                    onClick={completeSetup}
                    disabled={isFinishing}
                  >
                    {isFinishing ? 'Đang lưu…' : 'Lưu & Hoàn tất hồ sơ →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div className="ps-preview-col">
            <div className="ps-preview-card">
              <div className="ps-preview-header">
                <h3><EyeIcon /> Live Resume Preview</h3>
                <span className="ps-live-pill">🟢 Realtime</span>
              </div>

              <div className="ps-pv-user">
                <div className="ps-pv-avatar">{initials}</div>
                <div>
                  <div className="ps-pv-name">{data.name || 'Tên của bạn'}</div>
                  <div className="ps-pv-headline">{data.headline || 'Tiêu đề nghề nghiệp'}</div>
                </div>
              </div>

              <div className="ps-pv-meta">
                {data.location && <span className="ps-pv-chip">📍 {data.location}</span>}
                {data.email && <span className="ps-pv-chip">✉️ {data.email}</span>}
                {data.phone && <span className="ps-pv-chip">📞 {data.phone}</span>}
                {data.github && <span className="ps-pv-chip">🔗 {data.github}</span>}
              </div>

              {data.summary && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">TÓM TẮT NGHỀ NGHIỆP</div>
                  <div className="ps-pv-block-text">{data.summary}</div>
                </div>
              )}

              {data.skills.length > 0 && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">KỸ NĂNG</div>
                  <div className="ps-pv-skills">
                    {data.skills.map((s) => (
                      <span key={s} className="ps-pv-skill-tag">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.education.some((e) => e.university) && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">HỌC VẤN</div>
                  {data.education.filter((e) => e.university).map((e) => (
                    <div key={e.id} className="ps-pv-block-text" style={{ marginBottom: '6px' }}>
                      <strong>{e.university}</strong>
                      {e.degree && <> — {e.degree}</>}
                    </div>
                  ))}
                </div>
              )}

              {data.projects.some((p) => p.name) && (
                <div className="ps-pv-block">
                  <div className="ps-pv-block-title">DỰ ÁN</div>
                  {data.projects.filter((p) => p.name).map((p) => (
                    <div key={p.id} className="ps-pv-block-text" style={{ marginBottom: '8px' }}>
                      <strong>{p.name}</strong>
                      {p.description && <><br />{p.description}</>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`ps-toast ${toast ? 'show' : ''}`} aria-live="polite">
        <CheckIcon />
        <span>{toast}</span>
      </div>
    </div>
  );
}
