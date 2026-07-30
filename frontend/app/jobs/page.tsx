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
    description: `
      <p>VNG đang tìm kiếm <strong>AI Developer / LLM Engineer</strong> nhiệt huyết để gia nhập đội ngũ R&D AI, trực tiếp xây dựng hệ thống AI Agent thế hệ mới.</p>
      <br/>
      <h4>Trách nhiệm công việc:</h4>
      <ul>
        <li>Nghiên cứu và triển khai các mô hình Large Language Models (LLMs), RAG &amp; Agentic Workflows.</li>
        <li>Xây dựng Backend REST API hiệu năng cao với Python &amp; FastAPI.</li>
        <li>Tối ưu hóa vector search và lưu trữ tri thức doanh nghiệp.</li>
      </ul>
      <br/>
      <h4>Yêu cầu ứng viên:</h4>
      <ul>
        <li>Tốt nghiệp hoặc sinh viên năm cuối chuyên ngành Khoa học Máy tính / CNTT.</li>
        <li>Thành thạo Python, kinh nghiệm với LangChain/LlamaIndex hoặc các AI Frameworks.</li>
        <li>Tư duy thuật toán tốt, chủ động học hỏi công nghệ mới.</li>
      </ul>
    `,
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
    description: `
      <p>MoMo tuyển dụng <strong>Backend Engineer</strong> tham gia xây dựng hệ thống microservices có độ tin cậy và hiệu năng cao cho hàng triệu người dùng.</p>
      <br/>
      <h4>Trách nhiệm công việc:</h4>
      <ul>
        <li>Phát triển các tính năng thanh toán cốt lõi sử dụng Python &amp; FastAPI.</li>
        <li>Thiết kế cơ sở dữ liệu PostgreSQL chuẩn hóa, xử lý giao dịch tải cao.</li>
      </ul>
    `,
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
    description: `
      <p>Tiki đang mở rộng đội ngũ Data &amp; Product Analytics. Bạn sẽ biến dữ liệu thô thành các quyết định kinh doanh đột phá.</p>
    `,
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
    description: `
      <p>FPT Software tuyển dụng <strong>ML Intern / Fresher</strong> xuất sắc, làm việc trực tiếp với các chuyên gia AI hàng đầu.</p>
    `,
    aiSummary: 'Sinh viên năm cuối ngành Khoa học Máy tính / Khoa học Dữ liệu có nền tảng Toán, Thuật toán và Lập trình C++/Python vững chắc. Thành thạo PyTorch.'
  }
];

export default function JobRadar() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'saved' | 'applied'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'deadline'>('newest');
  const [selectedJobId, setSelectedJobId] = useState<number>(1);
  const [detailTab, setDetailTab] = useState<'desc' | 'ai' | 'preview'>('desc');
  const [isScanning, setIsScanning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleScanJobs = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      triggerToast('✓ Đã quét 24 nguồn việc làm mới. Tìm thấy 2 công việc có độ khớp > 85%!');
    }, 2200);
  };

  const toggleSaveJob = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
  };

  const addSkillToProfile = (skill: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id === selectedJobId) {
          return {
            ...j,
            missingSkills: j.missingSkills.filter(s => s !== skill),
            matchedSkills: [...j.matchedSkills, skill],
            match: Math.min(99, j.match + 3)
          };
        }
        return j;
      })
    );
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

  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || jobs[0] || null;
  }, [jobs, selectedJobId]);

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
          <Link href="/dashboard" className="nav-item">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link href="/profile-setup" className="nav-item">
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
          <Link href="/profile-preferences" className="nav-item">
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

      {/* MAIN CONTAINER */}
      <div className="main-container">
        {/* Top Header */}
        <header className="top-header">
          <div className="top-header-info">
            <h1>
              <span className="live-dot" title="Hệ thống đang hoạt động realtime"></span>
              Job Radar
            </h1>
            <p>Agent quét và ghép nối vị trí tuyển dụng với Master Profile của bạn theo thời gian thực.</p>
          </div>
          <div className="top-actions">
            <Link href="/profile-preferences" className="btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Thiết lập radar
            </Link>
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
        </header>

        {/* Scan Progress Bar */}
        <div className={`scan-progress-bar ${isScanning ? 'active' : ''}`}>
          <div className="scan-progress-fill"></div>
        </div>

        {/* Stats Strip */}
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

        {/* Split Workspace */}
        <div className="split-workspace">
          {/* Left Pane: Job List Feed */}
          <div className="feed-pane">
            <div className="feed-filter-header">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo vị trí, công ty, kỹ năng..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-tabs">
                <button
                  className={`tab-chip ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  Tất cả ({jobs.length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === 'high' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('high')}
                >
                  Độ khớp cao ({jobs.filter(j => j.match >= 85).length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('saved')}
                >
                  Đã lưu ({jobs.filter(j => j.isSaved).length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === 'applied' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('applied')}
                >
                  Đã nộp ({jobs.filter(j => j.stage === 'applied' || j.stage === 'interview').length})
                </button>
              </div>
            </div>

            {/* Scrollable Job Cards */}
            <div className="cards-scroll-container">
              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-subtle)', fontSize: '13px' }}>
                  Không tìm thấy công việc phù hợp với tiêu chí của bạn.
                </div>
              ) : (
                filteredJobs.map(job => {
                  const isSelected = selectedJob?.id === job.id;
                  return (
                    <div
                      key={job.id}
                      className={`job-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <div className="card-top">
                        <div className="card-meta">
                          <div className="card-title">{job.title}</div>
                          <div className="card-company">{job.company}</div>
                        </div>
                      </div>

                      <div className="card-sub-info">
                        <span>
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {job.location}
                        </span>
                      </div>

                      <div className="card-tags">
                        {job.tags.map((t, idx) => (
                          <span key={idx} className="tag-badge">{t}</span>
                        ))}
                      </div>

                      <div className="card-footer">
                        {job.stage === 'saved' && <span className="status-tag st-saved">Mục tiêu lưu</span>}
                        {job.stage === 'applied' && <span className="status-tag st-applied">Đã ứng tuyển</span>}
                        {job.stage === 'interview' && <span className="status-tag st-interview">Vào Phỏng vấn</span>}
                        {job.stage === 'none' && <span className="time-ago">{job.postedAgo}</span>}
                        <span className="time-ago">Hạn còn {job.deadlineDays} ngày</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Interactive Detail Panel */}
          {selectedJob ? (
            <div className="detail-pane">
              {/* Detail Banner */}
              <div className="detail-banner">
                <div className="detail-header-top">
                  <div className="detail-company-wrapper">
                    <div className="detail-title-group">
                      <h2>{selectedJob.title}</h2>
                      <div className="detail-company-name">{selectedJob.company} · {selectedJob.tagline}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-quick-meta">
                  <div className="meta-pill-item">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {selectedJob.address}
                  </div>
                  <div className="meta-pill-item">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    {selectedJob.format.toUpperCase()}
                  </div>
                </div>

                <div className="detail-actions">
                  <button
                    className="btn-tailor"
                    onClick={() => tailorCV(selectedJob.title)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    Tạo CV Tailored cho vị trí này
                  </button>

                  <button
                    className={`btn-bookmark ${selectedJob.isSaved ? 'saved' : ''}`}
                    onClick={(e) => toggleSaveJob(selectedJob.id, e)}
                  >
                    <svg viewBox="0 0 24 24" fill={selectedJob.isSaved ? 'currentColor' : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {selectedJob.isSaved ? 'Đã lưu mục tiêu' : 'Lưu mục tiêu'}
                  </button>
                </div>
              </div>

              {/* Detail Tabs Navigator */}
              <div className="detail-tabs-nav">
                <button
                  className={`d-tab ${detailTab === 'desc' ? 'active' : ''}`}
                  onClick={() => setDetailTab('desc')}
                >
                  Mô tả công việc
                </button>
                <button
                  className={`d-tab ${detailTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setDetailTab('preview')}
                >
                  Xem trước CV Tailored
                </button>
              </div>

              {/* Detail Content Body */}
              <div className="detail-body-content">
                {detailTab === 'desc' && (
                  <div className="content-block">
                    <div className="block-heading">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      Chi tiết tuyển dụng từ nhà tuyển dụng
                    </div>
                    <div
                      className="block-text"
                      dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                    />
                  </div>
                )}



                {detailTab === 'preview' && (
                  <div className="content-block">
                    <div className="ai-preview-box">
                      <div className="block-heading" style={{ marginBottom: '8px' }}>
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        AI Executive Summary được tạo riêng cho {selectedJob.company}
                      </div>
                      <div className="ai-summary-highlight">
                        &quot;{selectedJob.aiSummary}&quot;
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="detail-pane" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-subtle)' }}>
              Chọn một công việc để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Toast Component */}
      <div className={`toast ${toastMsg ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
