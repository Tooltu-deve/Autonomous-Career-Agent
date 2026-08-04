"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { JobStage, JobView } from "@/types/jobs";
import type { ApplicationListItem, PipelineStage } from "@/types/api";
import {
  ApiError,
  getPreferences,
  listApplications,
  listJobs,
  searchJobs,
  selectJobs,
} from "@/lib/api";
import { daysUntil, timeAgo } from "@/lib/format";

function toStage(stage: PipelineStage): JobStage {
  if (stage === "saved") return "saved";
  if (stage === "interview") return "interview";
  if (stage === "applied" || stage === "offer") return "applied";
  return "none";
}

function buildViews(
  jobs: JobView["job"][],
  apps: ApplicationListItem[],
): JobView[] {
  const byJobId = new Map(apps.map((a) => [a.job_id, a]));
  return jobs.map((job) => {
    const app = byJobId.get(job.id);
    return {
      job,
      stage: app ? toStage(app.pipeline_stage) : "none",
      generationStatus: app?.generation_status,
      applicationId: app?.id,
    };
  });
}

const GENERATION_LABEL: Record<string, string> = {
  saved: "Saved — CV not generated yet",
  cv_queued: "CV generation queued…",
  cv_generating: "Agent is generating the CV…",
  cv_generated: "CV generated — awaiting ATS scoring",
  ats_scoring: "ATS agent is scoring the CV…",
  completed: "Tailored CV ready",
  needs_review: "CV needs your review (below ATS threshold)",
  failed: "CV generation failed",
};

export default function JobRadar() {
  const [views, setViews] = useState<JobView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "saved" | "applied">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"newest" | "deadline">("newest");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"desc" | "preview">("desc");
  const [isScanning, setIsScanning] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const load = useCallback(async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        listJobs(1, 100),
        listApplications(),
      ]);
      setViews(buildViews(jobsRes.items, appsRes.items));
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Cannot reach the server.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleScanJobs = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const prefs = await getPreferences();
      const result = await searchJobs({
        target_role: prefs.target_role,
        preferred_locations: prefs.preferred_locations,
        remote_preference: prefs.remote_preference,
      });
      await load();
      triggerToast(
        `✓ Scan finished — found ${result.total} jobs for "${prefs.target_role}".`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        triggerToast(
          "Set your Radar Settings (target role & locations) first.",
        );
      } else {
        triggerToast(
          err instanceof ApiError
            ? `Scan failed: ${err.message}`
            : "Scan failed: cannot reach the server.",
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  const tailorCV = async (view: JobView) => {
    try {
      const res = await selectJobs([view.job.id]);
      const app = res.applications[0];
      setViews((prev) =>
        prev.map((v) =>
          v.job.id === view.job.id
            ? {
                ...v,
                stage: v.stage === "none" ? "saved" : v.stage,
                generationStatus: app?.generation_status ?? "cv_queued",
                applicationId: app?.id,
              }
            : v,
        ),
      );
      triggerToast(
        `⚡ AI Agent is generating a Tailored CV for "${view.job.title}"…`,
      );
    } catch (err) {
      triggerToast(
        err instanceof ApiError
          ? `Failed: ${err.message}`
          : "Failed: cannot reach the server.",
      );
    }
  };

  // Filter & Sort Logic
  const filteredViews = useMemo(() => {
    const result = views.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.job.title.toLowerCase().includes(q) ||
        v.job.company.toLowerCase().includes(q) ||
        (v.job.location ?? "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (activeFilter === "saved") return v.stage === "saved";
      if (activeFilter === "applied")
        return v.stage === "applied" || v.stage === "interview";

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "deadline") {
        return (
          (daysUntil(a.job.expires_at) ?? Infinity) -
          (daysUntil(b.job.expires_at) ?? Infinity)
        );
      }
      // newest first
      return (
        new Date(b.job.posted_at ?? b.job.scraped_at ?? 0).getTime() -
        new Date(a.job.posted_at ?? a.job.scraped_at ?? 0).getTime()
      );
    });
  }, [views, searchQuery, activeFilter, sortBy]);

  const selectedView = useMemo(() => {
    return (
      views.find((v) => v.job.id === selectedJobId) ?? filteredViews[0] ?? null
    );
  }, [views, filteredViews, selectedJobId]);

  const stats = useMemo(() => {
    const total = views.length;
    const savedCount = views.filter((v) => v.stage === "saved").length;
    const appliedCount = views.filter(
      (v) => v.stage === "applied" || v.stage === "interview",
    ).length;
    return { total, savedCount, appliedCount };
  }, [views]);

  return (
    <>
      <div className="main-container">
        {/* Top Header */}
        <header className="top-header">
          <div className="top-header-info">
            <h1>
              <span
                className="live-dot"
                title="System is running in realtime"
              ></span>
              Job Radar
            </h1>
            <p>
              Agent scans and matches job listings against your Master Profile
              in real time.
            </p>
          </div>
          <div className="top-actions">
            <Link href="/profile-preferences" className="btn-secondary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Radar Settings
            </Link>
            <button
              className={`btn-primary ${isScanning ? "scanning" : ""}`}
              disabled={isScanning}
              onClick={handleScanJobs}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              {isScanning ? "Scanning..." : "Scan New Jobs"}
            </button>
          </div>
        </header>

        {/* Scan Progress Bar */}
        <div className={`scan-progress-bar ${isScanning ? "active" : ""}`}>
          <div className="scan-progress-fill"></div>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          <div className="stat-item">
            <div className="stat-icon si-red">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search by role, company, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-tabs">
                <button
                  className={`tab-chip ${activeFilter === "all" ? "active" : ""}`}
                  onClick={() => setActiveFilter("all")}
                >
                  All ({views.length})
                </button>
                <button
                  className={`tab-chip ${activeFilter === "saved" ? "active" : ""}`}
                  onClick={() => setActiveFilter("saved")}
                >
                  Saved ({stats.savedCount})
                </button>
                <button
                  className={`tab-chip ${activeFilter === "applied" ? "active" : ""}`}
                  onClick={() => setActiveFilter("applied")}
                >
                  Applied ({stats.appliedCount})
                </button>
                <select
                  className="tab-chip"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "newest" | "deadline")
                  }
                  aria-label="Sort jobs"
                >
                  <option value="newest">Newest</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>

            {/* Scrollable Job Cards */}
            <div className="cards-scroll-container">
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--ink-subtle)",
                    fontSize: "13px",
                  }}
                >
                  Loading jobs…
                </div>
              ) : loadError ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--ink-subtle)",
                    fontSize: "13px",
                  }}
                >
                  {loadError}
                </div>
              ) : filteredViews.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--ink-subtle)",
                    fontSize: "13px",
                  }}
                >
                  No jobs yet. Press &ldquo;Scan New Jobs&rdquo; to let the
                  agent search for you.
                </div>
              ) : (
                filteredViews.map((view) => {
                  const { job } = view;
                  const isSelected = selectedView?.job.id === job.id;
                  const deadline = daysUntil(job.expires_at);
                  return (
                    <div
                      key={job.id}
                      className={`job-card ${isSelected ? "selected" : ""}`}
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
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          {job.location ?? "—"}
                        </span>
                      </div>

                      <div className="card-footer">
                        {view.stage === "saved" && (
                          <span className="status-tag st-saved">
                            Saved target
                          </span>
                        )}
                        {view.stage === "applied" && (
                          <span className="status-tag st-applied">Applied</span>
                        )}
                        {view.stage === "interview" && (
                          <span className="status-tag st-interview">
                            Interviewing
                          </span>
                        )}
                        {view.stage === "none" && (
                          <span className="time-ago">
                            {timeAgo(job.posted_at ?? job.scraped_at)}
                          </span>
                        )}
                        {deadline !== null && (
                          <span className="time-ago">{deadline} days left</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Interactive Detail Panel */}
          {selectedView ? (
            <div className="detail-pane">
              {/* Detail Banner */}
              <div className="detail-banner">
                <div className="detail-header-top">
                  <div className="detail-company-wrapper">
                    <div className="detail-title-group">
                      <h2>{selectedView.job.title}</h2>
                      <div className="detail-company-name">
                        {selectedView.job.company}
                        {selectedView.job.seniority_level
                          ? ` · ${selectedView.job.seniority_level}`
                          : ""}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-quick-meta">
                  <div className="meta-pill-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {selectedView.job.location ?? "Location unknown"}
                  </div>
                  {selectedView.job.employment_type && (
                    <div className="meta-pill-item">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="2"
                          y="7"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      {selectedView.job.employment_type.toUpperCase()}
                    </div>
                  )}
                  {selectedView.job.url && (
                    <a
                      className="meta-pill-item"
                      href={selectedView.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Original posting ({selectedView.job.source}) ↗
                    </a>
                  )}
                </div>

                <div className="detail-actions">
                  <button
                    className="btn-tailor"
                    onClick={() => tailorCV(selectedView)}
                    disabled={Boolean(
                      selectedView.generationStatus &&
                      !["needs_review", "failed", "saved"].includes(
                        selectedView.generationStatus,
                      ),
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                    {selectedView.generationStatus
                      ? GENERATION_LABEL[selectedView.generationStatus]
                      : " Generate Tailored CV for this role"}
                  </button>
                </div>
              </div>

              {/* Detail Tabs Navigator */}
              <div className="detail-tabs-nav">
                <button
                  className={`d-tab ${detailTab === "desc" ? "active" : ""}`}
                  onClick={() => setDetailTab("desc")}
                >
                  Job Description
                </button>
                <button
                  className={`d-tab ${detailTab === "preview" ? "active" : ""}`}
                  onClick={() => setDetailTab("preview")}
                >
                  Tailored CV Status
                </button>
              </div>

              {/* Detail Content Body */}
              <div className="detail-body-content">
                {detailTab === "desc" && (
                  <div className="content-block">
                    <div className="block-heading">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                      Job details from the employer
                    </div>
                    <div
                      className="block-text"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {selectedView.job.description ??
                        "No description provided by the source."}
                    </div>
                  </div>
                )}

                {detailTab === "preview" && (
                  <div className="content-block">
                    <div className="ai-preview-box">
                      <div
                        className="block-heading"
                        style={{ marginBottom: "8px" }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        Tailored CV for {selectedView.job.company}
                      </div>
                      <div className="ai-summary-highlight">
                        {selectedView.generationStatus
                          ? GENERATION_LABEL[selectedView.generationStatus]
                          : 'No tailored CV yet — press "Generate Tailored CV" to start the AI pipeline.'}
                      </div>
                      {selectedView.generationStatus === "completed" && (
                        <Link
                          href="/cv-tailoring"
                          className="btn-secondary"
                          style={{ marginTop: 12, display: "inline-flex" }}
                        >
                          Open in CV Manager →
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="detail-pane"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-subtle)",
              }}
            >
              Select a job to view details
            </div>
          )}
        </div>
      </div>

      {/* Toast Component */}
      <div className={`toast ${toastMsg ? "show" : ""}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
