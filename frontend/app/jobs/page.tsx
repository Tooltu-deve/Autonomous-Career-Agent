'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export interface Job {
  id: number;
  title: string;
  company: string;
  tagline: string;
  logoText: string;
  logoBg: string;
  location: string;
  address: string;
  salary: string;
  format: 'remote' | 'onsite' | 'hybrid';
  match: number;
  stage: 'saved' | 'applied' | 'interview' | 'none';
  isSaved: boolean;
  postedAgo: string;
  deadlineDays: number;
  tags: string[];
  skills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  description: string;
  aiSummary: string;
}

const INITIAL_JOBS: Job[] = [
  {
    id: 1,
    title: 'AI Developer / LLM Engineer',
    company: 'VNG Corporation',
    tagline: 'Internet & Technology',
    logoText: 'VNG',
    logoBg: 'linear-gradient(135deg, #F06A6A, #E5544F)',
    location: 'TP. Hồ Chí Minh',
    address: '182 Lê Đại Hành, Quận 11, TP.HCM',
    salary: '30M – 45M ₫',
    format: 'hybrid',
    match: 94,
    stage: 'saved',
    isSaved: true,
    postedAgo: '1 giờ trước',
    deadlineDays: 14,
    tags: ['Python', 'LangChain', 'FastAPI', 'Agentic AI'],
    skills: ['Python', 'LangChain', 'FastAPI', 'Docker', 'PostgreSQL', 'Vector DB'],
    matchedSkills: ['Python', 'LangChain', 'FastAPI', 'Git', 'REST API'],
    missingSkills: ['Docker', 'VectorDB (Qdrant)'],
    description: '<p>VNG đang tìm kiếm <strong>AI Developer / LLM Engineer</strong> nhiệt huyết để gia nhập đội ngũ R&D AI, trực tiếp xây dựng hệ thống AI Agent thế thế mới.</p>',
    aiSummary: 'Lập trình viên Computer Science có kinh nghiệm thiết kế AI Agentic Workflows và làm việc với Python, FastAPI, LangChain. Sẵn sàng đóng góp vào hệ thống AI Agent tại VNG Corporation.'
  },
  {
    id: 2,
    title: 'Backend Engineer (Python / FastAPI)',
    company: 'MoMo (M-Service)',
    tagline: 'Fintech & Digital Wallet',
    logoText: 'MM',
    logoBg: 'linear-gradient(135deg, #A50064, #D82D8B)',
    location: 'TP. Hồ Chí Minh',
    address: 'MoMo Tower, Cộng Hòa, Tân Bình, TP.HCM',
    salary: '25M – 38M ₫',
    format: 'onsite',
    match: 89,
    stage: 'applied',
    isSaved: false,
    postedAgo: '3 giờ trước',
    deadlineDays: 10,
    tags: ['Python', 'FastAPI', 'Microservices', 'PostgreSQL'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'Docker'],
    matchedSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Git'],
    missingSkills: ['Redis Cache', 'Kafka'],
    description: '<p>MoMo tuyển dụng <strong>Backend Engineer</strong> tham gia xây dựng hệ thống microservices có độ tin cậy và hiệu năng cao.</p>',
    aiSummary: 'Sinh viên Computer Science có nền tảng Python vững chắc, kinh nghiệm xây dựng REST API bằng FastAPI và làm việc với PostgreSQL.'
  },
  {
    id: 3,
    title: 'Data Analyst / Product Analyst',
    company: 'Tiki Vietnam',
    tagline: 'E-commerce',
    logoText: 'TK',
    logoBg: 'linear-gradient(135deg, #1A94FF, #0D5CB6)',
    location: 'Remote',
    address: 'Làm việc từ xa — toàn quốc',
    salary: '20M – 30M ₫',
    format: 'remote',
    match: 82,
    stage: 'none',
    isSaved: true,
    postedAgo: '5 giờ trước',
    deadlineDays: 8,
    tags: ['SQL', 'Python', 'Power BI', 'A/B Testing'],
    skills: ['SQL', 'Python', 'Power BI', 'Tableau', 'BigQuery'],
    matchedSkills: ['SQL', 'Python', 'Power BI'],
    missingSkills: ['Tableau', 'BigQuery'],
    description: '<p>Tiki đang mở rộng đội ngũ Data & Product Analytics. Bạn sẽ biến dữ liệu thô thành các quyết định kinh doanh đột phá.</p>',
    aiSummary: 'Có kinh nghiệm truy vấn SQL và trực quan hóa dữ liệu bằng Power BI, cùng nền tảng Python cho phân tích.'
  },
  {
    id: 4,
    title: 'Machine Learning Intern / Fresher',
    company: 'FPT Software',
    tagline: 'AI & Software Outsourcing',
    logoText: 'FPT',
    logoBg: 'linear-gradient(135deg, #F36F21, #BA4A00)',
    location: 'TP. Hồ Chí Minh',
    address: 'Lô T2, Khu Công nghệ cao, TP. Thủ Đức, TP.HCM',
    salary: '12M – 18M ₫',
    format: 'hybrid',
    match: 95,
    stage: 'interview',
    isSaved: false,
    postedAgo: '1 ngày trước',
    deadlineDays: 20,
    tags: ['Python', 'C++', 'PyTorch', 'Computer Vision'],
    skills: ['Python', 'C++', 'PyTorch', 'OpenCV', 'Linear Algebra'],
    matchedSkills: ['Python', 'C++', 'AI / Algorithm', 'First-Order Logic'],
    missingSkills: ['OpenCV'],
    description: '<p>FPT Software tuyển dụng <strong>ML Intern / Fresher</strong> xuất sắc, làm việc trực tiếp với các chuyên gia AI hàng đầu.</p>',
    aiSummary: 'Sinh viên năm cuối ngành Khoa học Máy tính / Khoa học Dữ liệu có nền tảng Toán, Thuật toán và Lập trình C++/Python vững chắc. Thành thạo PyTorch.'
  }
];

function daysToClass(d: number) {
  if (d <= 5) return 'urgent';
  if (d <= 10) return 'soon';
  return 'plenty';
}

export default function JobRadar() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'saved' | 'applied'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'deadline'>('newest');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalTab, setModalTab] = useState<'desc' | 'ai' | 'preview'>('desc');
  const [isScanning, setIsScanning] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3200);
  };

  const handleScanJobs = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      triggerToast('✓ Đã quét 24 nguồn việc làm mới. Tìm thấy 2 công việc có độ khớp > 85%!');
    }, 2200);
  };

  const toggleSaveJob = (id: number) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id === id) {
          const nextSaved = !j.isSaved;
          triggerToast(nextSaved ? '✓ Đã lưu vị trí mục tiêu' : 'Đã bỏ lưu mục tiêu');
          return { ...j, isSaved: nextSaved };
        }
        return j;
      })
    );
    if (selectedJob && selectedJob.id === id) {
      setSelectedJob(prev => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  const addSkillToProfile = (skill: string) => {
    if (!selectedJob) return;
    setSelectedJob(prev => {
      if (!prev) return null;
      return {
        ...prev,
        missingSkills: prev.missingSkills.filter(s => s !== skill),
        matchedSkills: [...prev.matchedSkills, skill],
        match: Math.min(99, prev.match + 3)
      };
    });
    triggerToast(`✓ Đã thêm "${skill}" vào Master Profile`);
  };

  const tailorCV = (jobTitle: string) => {
    triggerToast(`⚡ Đang kích hoạt AI Agent tạo CV Tailored cho "${jobTitle}"…`);
  };

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    let result = jobs.filter(j => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (activeFilter === 'high') return j.match >= 85;
      if (activeFilter === 'saved') return j.isSaved;
      if (activeFilter === 'applied') return j.stage === 'applied' || j.stage === 'interview';

      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'match') return b.match - a.match;
      if (sortBy === 'deadline') return a.deadlineDays - b.deadlineDays;
      return a.id - b.id; // Default newest
    });
  }, [jobs, searchQuery, activeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const avgMatch = Math.round(jobs.reduce((acc, curr) => acc + curr.match, 0) / total);
    const savedCount = jobs.filter(j => j.isSaved).length;
    const appliedCount = jobs.filter(j => j.stage === 'applied' || j.stage === 'interview').length;

    return { total, avgMatch, savedCount, appliedCount };
  }, [jobs]);

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="brand-name">CareerNav</span>
        </div>

        <div className="nav-section-label">WORKSPACE</div>
        <nav className="nav">
          <Link href="/" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link href="/" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>Profile</span>
          </Link>

          <Link href="/jobs" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span>Jobs</span>
          </Link>

          <Link href="/jobs" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>CV Manager</span>
          </Link>

          <Link href="/jobs" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>Reports</span>
          </Link>
        </nav>

        <div className="nav-section-label">ACCOUNT</div>
        <nav className="nav">
          <Link href="/" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span>Settings</span>
          </Link>
        </nav>

        <div className="sidebar-spacer"></div>

        <div className="profile-card">
          <div className="avatar">MT</div>
          <div className="profile-meta">
            <div className="profile-name">Minh Tran</div>
            <div className="profile-id">ID 24127489</div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main">
        {/* HEADER */}
        <header className="page-header">
          <div className="page-header-top">
            <h1>
              <span className="live-dot" title="Hệ thống đang hoạt động realtime"></span>
              Job Radar
            </h1>
            <div className="header-actions">
              <button className="btn-secondary">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Thiết lập radar
              </button>
              <button
                className={`btn-primary ${isScanning ? 'scanning' : ''}`}
                onClick={handleScanJobs}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                </svg>
                {isScanning ? 'Đang quét...' : 'Quét Job Mới'}
              </button>
            </div>
          </div>
          <p>
            Agent tự động quét tin tuyển dụng phù hợp nhất với Master Profile của bạn từ LinkedIn, Indeed và các kênh tuyển dụng trong nước.
          </p>
        </header>

        {/* SCAN PROGRESS ANIMATION */}
        <div className={`scan-progress-bar ${isScanning ? 'active' : ''}`}>
          <div className="scan-progress-fill"></div>
        </div>

        {/* STATS STRIP */}
        <div className="stats-strip">
          <div className="stat-item">
            <div className="stat-icon si-red">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-val">{stats.total} Job</div>
              <div className="stat-lbl">Phù hợp trên Radar</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon si-green">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-val">{stats.avgMatch}%</div>
              <div className="stat-lbl">Độ khớp trung bình</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon si-blue">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-val">{stats.savedCount} Mục tiêu</div>
              <div className="stat-lbl">Đã lưu theo dõi</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon si-purple">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-val">{stats.appliedCount} Đã nộp</div>
              <div className="stat-lbl">CV đã tailored</div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="search-row">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo vị trí, công ty, hoặc kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-row">
          <button
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả <span className="count">{jobs.length}</span>
          </button>
          <button
            className={`filter-chip ${activeFilter === 'high' ? 'active' : ''}`}
            onClick={() => setActiveFilter('high')}
          >
            Match &gt; 85% <span className="count">{jobs.filter(j => j.match >= 85).length}</span>
          </button>
          <button
            className={`filter-chip ${activeFilter === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveFilter('saved')}
          >
            Đã lưu <span className="count">{stats.savedCount}</span>
          </button>
          <button
            className={`filter-chip ${activeFilter === 'applied' ? 'active' : ''}`}
            onClick={() => setActiveFilter('applied')}
          >
            Đã ứng tuyển <span className="count">{stats.appliedCount}</span>
          </button>

          <div style={{ flex: 1 }}></div>

          <div className="sort-select">
            <svg className="icon-sort" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="16" y2="6"></line>
              <line x1="4" y1="12" x2="11" y2="12"></line>
              <line x1="4" y1="18" x2="8" y2="18"></line>
            </svg>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="match">Sắp xếp: Độ khớp</option>
              <option value="deadline">Sắp xếp: Hạn nộp</option>
            </select>
            <svg className="icon-chevron" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        {/* JOB CARDS LIST */}
        <div className="job-list">
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>Không tìm thấy công việc phù hợp</p>
              <p>Thử thay đổi từ khóa hoặc bộ lọc của bạn</p>
            </div>
          ) : (
            filteredJobs.map(job => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => setSelectedJob(job)}
              >
                <div className="logo" style={{ background: job.logoBg }}>
                  {job.logoText}
                </div>

                <div className="job-main">
                  <div className="job-title-row">
                    <span className="job-title">{job.title}</span>
                    <span className={`match-chip ${job.match >= 90 ? '' : 'mid'}`}>
                      {job.match}% match
                    </span>
                  </div>

                  <div className="job-sub">
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      {job.company}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"></path>
                        <circle cx="12" cy="9" r="2.5"></circle>
                      </svg>
                      {job.location}
                    </span>
                    <span>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      {job.salary}
                    </span>
                  </div>

                  <div className="job-tags">
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className="tag-badge">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="job-side">
                  {job.stage !== 'none' ? (
                    <span className={`stage-pill stage-${job.stage}`}>
                      {job.stage}
                    </span>
                  ) : job.isSaved ? (
                    <span className="stage-pill stage-saved">SAVED</span>
                  ) : null}

                  <div className={`deadline ${daysToClass(job.deadlineDays)}`}>
                    <span className="d-label">Hạn nộp</span>
                    <span className="d-value">Còn {job.deadlineDays} ngày</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* JOB DETAIL POPUP MODAL */}
      {selectedJob && (
        <div
          className="modal-overlay open"
          onClick={() => setSelectedJob(null)}
        >
          <div className="modal-popup" onClick={(e) => e.stopPropagation()}>
            {/* Left Panel */}
            <div className="modal-left">
              <div className="modal-company-header">
                <div className="modal-logo" style={{ background: selectedJob.logoBg }}>
                  {selectedJob.logoText}
                </div>
                <div className="modal-company-text">
                  <div className="modal-company-name">{selectedJob.company}</div>
                  <div className="modal-company-tagline">{selectedJob.tagline}</div>
                </div>
              </div>

              <div className="modal-info-list">
                <div className="modal-info-item">
                  <div className="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="info-text">
                    <div className="info-label">Vị trí</div>
                    <div className="info-value">{selectedJob.title}</div>
                  </div>
                </div>

                <div className="modal-info-item">
                  <div className="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"></path>
                      <circle cx="12" cy="9" r="2.5"></circle>
                    </svg>
                  </div>
                  <div className="info-text">
                    <div className="info-label">Địa chỉ</div>
                    <div className="info-value">{selectedJob.address}</div>
                  </div>
                </div>

                <div className="modal-info-item">
                  <div className="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                  </div>
                  <div className="info-text">
                    <div className="info-label">Mức lương</div>
                    <div className="info-value">{selectedJob.salary}</div>
                  </div>
                </div>

                <div className="modal-info-item">
                  <div className="info-icon">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"></path>
                    </svg>
                  </div>
                  <div className="info-text">
                    <div className="info-label">Hình thức</div>
                    <div>
                      <span className={`work-format-badge ${selectedJob.format}`}>
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"></path>
                        </svg>
                        {selectedJob.format}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-match-score">
                <div
                  className="score-circle"
                  style={{ ['--score' as any]: selectedJob.match }}
                >
                  <span>{selectedJob.match}%</span>
                </div>
                <div className="score-details">
                  <span className="score-title">Độ phù hợp</span>
                  <span className="score-sub">
                    {selectedJob.match >= 90
                      ? 'Rất cao cho hồ sơ của bạn'
                      : selectedJob.match >= 80
                        ? 'Khá phù hợp với hồ sơ'
                        : 'Cần bổ sung thêm kỹ năng'}
                  </span>
                </div>
              </div>

              <div className="modal-cta-group">
                <button
                  className="modal-cta-btn"
                  onClick={() => tailorCV(selectedJob.title)}
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"></path>
                    <path d="M9 15l2 2 4-4"></path>
                  </svg>
                  Tạo CV Tailored cho vị trí này
                </button>
                <button
                  className={`modal-save-btn ${selectedJob.isSaved ? 'saved' : ''}`}
                  onClick={() => toggleSaveJob(selectedJob.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>{selectedJob.isSaved ? 'Đã lưu mục tiêu' : 'Lưu mục tiêu'}</span>
                </button>
              </div>
            </div>

            {/* Right Panel */}
            <div className="modal-right">
              <div className="modal-right-header">
                <div className="modal-job-title">{selectedJob.title}</div>
                <button className="modal-close-btn" onClick={() => setSelectedJob(null)} aria-label="Đóng">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div className="modal-tags">
                <span className="modal-tag">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  Full-time
                </span>
                <span className="modal-tag">
                  {selectedJob.stage === 'applied'
                    ? 'Applied'
                    : selectedJob.stage === 'interview'
                      ? 'Interview'
                      : selectedJob.isSaved
                        ? 'Saved'
                        : 'Mới'}
                </span>
                <span className={`modal-tag ${daysToClass(selectedJob.deadlineDays)}`}>
                  Còn {selectedJob.deadlineDays} ngày
                </span>
              </div>

              <div className="modal-tabs-nav">
                <button
                  className={`m-tab ${modalTab === 'desc' ? 'active' : ''}`}
                  onClick={() => setModalTab('desc')}
                >
                  Mô tả công việc
                </button>
                <button
                  className={`m-tab ${modalTab === 'ai' ? 'active' : ''}`}
                  onClick={() => setModalTab('ai')}
                >
                  Phân tích Kỹ năng AI
                </button>
                <button
                  className={`m-tab ${modalTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setModalTab('preview')}
                >
                  Xem trước CV Tailored
                </button>
              </div>

              <div className="modal-tab-body">
                {modalTab === 'desc' && (
                  <div className="m-tab-panel active">
                    <div className="modal-section-title">Mô tả công việc</div>
                    <div
                      className="modal-description"
                      dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                    />
                    <div className="modal-section-title" style={{ marginTop: 24 }}>Yêu cầu kỹ năng</div>
                    <div className="modal-skill-chips" style={{ marginTop: 0 }}>
                      {selectedJob.skills.map((s, i) => (
                        <span key={i} className="modal-skill-chip">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {modalTab === 'ai' && (
                  <div className="m-tab-panel active">
                    <div className="skill-gap-card">
                      <div className="gap-header">
                        <div className="gap-title">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          AI Skill Match &amp; Gap Analysis
                        </div>
                        <span className="gap-sub">
                          Khớp {selectedJob.matchedSkills.length}/{selectedJob.matchedSkills.length + selectedJob.missingSkills.length} kỹ năng
                        </span>
                      </div>

                      <div>
                        <div className="skill-group-label" style={{ color: 'var(--success)' }}>
                          Kỹ năng đã khớp trong Master Profile
                        </div>
                        <div className="skill-pills-group">
                          {selectedJob.matchedSkills.map((s, i) => (
                            <span key={i} className="sk-pill sk-matched">✓ {s}</span>
                          ))}
                        </div>
                      </div>

                      {selectedJob.missingSkills.length > 0 && (
                        <div style={{ marginTop: 14 }}>
                          <div className="skill-group-label" style={{ color: 'var(--primary-hover)' }}>
                            Kỹ năng còn thiếu trong JD
                          </div>
                          <div className="skill-pills-group">
                            {selectedJob.missingSkills.map((s, i) => (
                              <span key={i} className="sk-pill sk-missing">
                                ! {s}
                                <button
                                  title="Thêm kỹ năng này vào Master Profile"
                                  onClick={() => addSkillToProfile(s)}
                                >
                                  +
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                      Bổ sung các kỹ năng còn thiếu vào Master Profile để agent tăng độ khớp và ưu tiên vị trí này khi quét job mới.
                    </p>
                  </div>
                )}

                {modalTab === 'preview' && (
                  <div className="m-tab-panel active">
                    <div className="ai-preview-box">
                      <div className="modal-section-title" style={{ marginBottom: 0 }}>
                        Tóm tắt hồ sơ AI đề xuất cho vị trí này
                      </div>
                      <div className="ai-summary-highlight">
                        &quot;{selectedJob.aiSummary}&quot;
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST BANNER */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
