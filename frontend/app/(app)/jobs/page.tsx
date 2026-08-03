'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Job } from '@/types/jobs';
import { INITIAL_JOBS } from '@/lib/mock/jobs';

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
      triggerToast('✓ Scanned 24 new job sources. Found 2 jobs with match > 85%!');
    }, 2200);
  };

  const toggleSaveJob = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJobs(prev =>
      prev.map(j => {
        if (j.id === id) {
          const nextSaved = !j.isSaved;
          triggerToast(nextSaved ? '✓ Target position saved' : 'Target removed from saved');
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
    triggerToast(`✓ Added "${skill}" to Master Profile`);
  };

  const tailorCV = (jobTitle: string) => {
    triggerToast(`⚡ Activating AI Agent to generate Tailored CV for "${jobTitle}"…`);
  };

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    const result = jobs.filter(j => {
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
    <>
      <div className="main-container">

        {/* Top Header */}
        <header className="top-header">
          <div className="top-header-info">
            <h1>
              <span className="live-dot" title="System is running in realtime"></span>
              Job Radar
            </h1>
            <p>Agent scans and matches job listings against your Master Profile in real time.</p>
          </div>
          <div className="top-actions">
            <Link href="/profile-preferences" className="btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Radar Settings
            </Link>
            <button
              className={`btn-primary ${isScanning ? 'scanning' : ''}`}
              onClick={handleScanJobs}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              {isScanning ? 'Scanning...' : 'Scan New Jobs'}
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
              <div className="stat-val">{stats.total} Jobs</div>
              <div className="stat-lbl">Matched on Radar</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon si-blue">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-val">{stats.savedCount} Saved</div>
              <div className="stat-lbl">Tracked targets</div>
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
              <div className="stat-val">{stats.appliedCount} Applied</div>
              <div className="stat-lbl">Tailored CVs sent</div>
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
                  placeholder="Search by role, company, skill..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-tabs">
                <button
                  className={`tab-chip ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All ({jobs.length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('saved')}
                >
                  Saved ({jobs.filter(j => j.isSaved).length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === 'applied' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('applied')}
                >
                  Applied ({jobs.filter(j => j.stage === 'applied' || j.stage === 'interview').length})
                </button>
              </div>
            </div>

            {/* Scrollable Job Cards */}
            <div className="cards-scroll-container">
              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-subtle)', fontSize: '13px' }}>
                  No jobs found matching your criteria.
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

                      <div className="card-footer">
                        {job.stage === 'saved' && <span className="status-tag st-saved">Saved target</span>}
                        {job.stage === 'applied' && <span className="status-tag st-applied">Applied</span>}
                        {job.stage === 'interview' && <span className="status-tag st-interview">Interviewing</span>}
                        {job.stage === 'none' && <span className="time-ago">{job.postedAgo}</span>}
                        <span className="time-ago">{job.deadlineDays} days left</span>
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
                     Generate Tailored CV for this role
                  </button>

                  <button
                    className={`btn-bookmark ${selectedJob.isSaved ? 'saved' : ''}`}
                    onClick={(e) => toggleSaveJob(selectedJob.id, e)}
                  >
                    <svg viewBox="0 0 24 24" fill={selectedJob.isSaved ? 'currentColor' : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                     {selectedJob.isSaved ? 'Saved' : 'Save target'}
                  </button>
                </div>
              </div>

              {/* Detail Tabs Navigator */}
              <div className="detail-tabs-nav">
                <button
                  className={`d-tab ${detailTab === 'desc' ? 'active' : ''}`}
                  onClick={() => setDetailTab('desc')}
                >
                  Job Description
                </button>
                <button
                  className={`d-tab ${detailTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setDetailTab('preview')}
                >
                  Tailored CV Preview
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
                      Job details from the employer
                    </div>
                    <div
                      className="block-text"
                      // eslint-disable-next-line react/no-danger
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
                        AI Executive Summary generated specifically for {selectedJob.company}
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
              Select a job to view details
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
    </>
  );
}
