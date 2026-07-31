"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import "./animation.css";
import {
  createMockGeneratedCV,
  deleteMockGeneratedCV,
  getMockGeneratedCVs,
  requestCvExport,
  updateMockGeneratedCV,
  validateGeneratedCVContent,
  type GeneratedCV,
  type GeneratedCVContent,
} from "@/lib/mock/cv";
import { CvEditor } from "./CvEditor";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <span className="brand-name">CareerNav</span>
      </div>

      <div className="nav-section-label">WORKSPACE</div>
      <nav className="nav">
        <Link href="/dashboard" className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Dashboard</span>
        </Link>
        <Link href="/profile-setup" className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Profile</span>
        </Link>
        <Link href="/jobs" className="nav-item">
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
          <span>Jobs</span>
        </Link>
        <Link href="/cv-manager" className="nav-item active">
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
          <span>CV Manager</span>
        </Link>
        <Link href="/jobs" className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Reports</span>
        </Link>
      </nav>

      <div className="nav-section-label">ACCOUNT</div>
      <nav className="nav">
        <Link href="/profile-preferences" className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </Link>
      </nav>

      <div className="sidebar-spacer" />
      <div className="profile-card">
        <div className="avatar">MT</div>
        <div className="profile-meta">
          <div className="profile-name">Minh Tran</div>
          <div className="profile-id">ID 24127489</div>
        </div>
      </div>
    </aside>
  );
}
function scoreClass(score: number) {
  return score >= 80 ? "high" : score >= 70 ? "mid" : "low";
}

function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="cm-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <div className="cm-modal">{children}</div>
    </div>
  );
}
function Resume({
  cv,
  close,
  onSave,
  error,
  notice,
}: {
  cv: GeneratedCV;
  close: () => void;
  onSave: (content: GeneratedCVContent, exportAfterSave: boolean, title: string) => void;
  error: string | null;
  notice: string | null;
}) {
  return (
    <Modal close={close}>
      <CvEditor
        cv={cv}
        onClose={close}
        onSave={onSave}
        error={error}
        notice={notice}
      />
    </Modal>
  );
}
function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cm-resume-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function AtsReport({ cv, close }: { cv: GeneratedCV; close: () => void }) {
  const color =
    cv.ats_score >= 75 ? "#37a66b" : cv.ats_score >= 60 ? "#c98a2c" : "#e8384f";
  const offset = 389.6 * (1 - cv.ats_score / 100);
  return (
    <Modal close={close}>
      <header className="cm-modal-header">
        <div>
          <h2>ATS Report — {cv.title}</h2>
          <p>Scanned against the target role</p>
        </div>
        <button onClick={close} aria-label="Close">
          ×
        </button>
      </header>
      <div className="cm-ats-content">
        <section className="cm-score-panel">
          <div className="cm-gauge">
            <svg viewBox="0 0 148 148">
              <circle cx="74" cy="74" r="62" />
              <circle
                className="value"
                cx="74"
                cy="74"
                r="62"
                style={{ stroke: color }}
                strokeDasharray="389.6"
                strokeDashoffset={offset}
              />
            </svg>
            <b>{cv.ats_score}%</b>
            <small>ATS score</small>
          </div>
          <div>
            <h3>
              {cv.ats_score >= 75
                ? "Good match — a few tweaks would push this into the top tier"
                : "Needs work — several core keywords are missing"}
            </h3>
            <p>
              This CV clears ATS parsing checks and matches many of the role’s
              core keywords. Closing the gaps below is the fastest way to raise
              its score.
            </p>
          </div>
        </section>
        <section>
          <h3 className="cm-section-title">Keyword Match</h3>
          <div className="cm-keywords">
            <KeywordCard good title="Matching Keywords" words={cv.matched} />
            <KeywordCard title="Missing Keywords" words={cv.missing} />
          </div>
        </section>
        <section>
          <h3 className="cm-section-title">Recommendations</h3>
          <div className="cm-recommendations">
            <p>
              <b>△ Add missing tools to your Skills section</b>Most listings
              you’re tracking mention several missing terms.
            </p>
            <p>
              <b>✦ Quantify your experience bullets</b>Bullets with numbers
              score higher on parsing confidence.
            </p>
            <p>
              <b>✓ Mirror the job title in your headline</b>Using the target
              role title improves matching on most ATS parsers.
            </p>
          </div>
        </section>
      </div>
      <footer className="cm-modal-footer">
        <span>Formatted for ATS scanning</span>
        <div>
          <button className="cm-secondary">View Full Report</button>
          <button className="cm-primary" onClick={close}>
            Close
          </button>
        </div>
      </footer>
    </Modal>
  );
}
function KeywordCard({
  title,
  words,
  good = false,
}: {
  title: string;
  words: string[];
  good?: boolean;
}) {
  return (
    <article className={good ? "cm-keyword good" : "cm-keyword missing"}>
      <h4>
        <i />
        {title}
        <b>{words.length}</b>
      </h4>
      <div>
        {words.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </article>
  );
}

export function CvManager() {
  const [query, setQuery] = useState("");
  const [cvs, setCvs] = useState(getMockGeneratedCVs);
  const [preview, setPreview] = useState<GeneratedCV | null>(null);
  const [report, setReport] = useState<GeneratedCV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GeneratedCV | null>(null);
  const save = async (
    content: GeneratedCVContent,
    exportAfterSave: boolean,
    title: string,
  ) => {
    if (!preview) return;
    const message = validateGeneratedCVContent(content);
    if (message) {
      setError(message);
      setNotice(null);
      return;
    }
    const updated = updateMockGeneratedCV(preview.id, content, title);
    setCvs(getMockGeneratedCVs());
    setPreview(updated);
    setError(null);
    if (exportAfterSave) {
      await requestCvExport(updated);
      setNotice("Saved. PDF export is pending the pdf-service backend.");
    } else setNotice("Saved in this session.");
  };
  const visible = useMemo(
    () =>
      cvs.filter((cv) =>
        `${cv.title} ${cv.source_job}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [cvs, query],
  );
  return (
    <div className="cv-manager">
      <div className="cm-app">
        <Sidebar />
        <main className="cm-main">
          <header className="cm-page-header">
            <div>
              <h1>CV Manager</h1>
              <p>
                Every tailored CV your agent has generated, in one place —
                preview, edit, or export any version.
              </p>
            </div>
            <button className="cm-primary" type="button" onClick={() => { const created = createMockGeneratedCV(); setCvs(getMockGeneratedCVs()); setError(null); setNotice(null); setPreview(created); }}>
              + New CV
            </button>
          </header>
          <div className="cm-toolbar">
            <label>
              ⌕
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search CVs..."
              />
            </label>
            <button className="cm-filter">
              ☰ &nbsp; Sort: Recently updated
            </button>
          </div>
          <section className="cm-cv-list">
            {visible.map((cv) => (
              <article className="cm-cv-card" key={cv.id}>
                <span className="cm-document">▤</span>
                <div className="cm-cv-title">
                  <h2>{cv.title}</h2>
                  <p>{cv.source_job}</p>
                  <small>
                    Last updated {cv.updated_at} · {cv.edit_status}
                  </small>
                </div>
                <strong className={`cm-score ${scoreClass(cv.ats_score)}`}>
                  {cv.ats_score}%
                </strong>
                <div className="cm-actions">
                  <button
                    onClick={() => {
                      setError(null);
                      setNotice(null);
                      setPreview(cv);
                    }}
                  >
                    Preview & Edit
                  </button>
                  <button onClick={() => setReport(cv)}>
                    ✓ &nbsp; ATS Report
                  </button>
                  <button className="cm-danger" onClick={() => setPendingDelete(cv)}>Delete</button>
                </div>
              </article>
            ))}
            <button className="cm-new-cv" id="new-cv" type="button" onClick={() => { const created = createMockGeneratedCV(); setCvs(getMockGeneratedCVs()); setError(null); setNotice(null); setPreview(created); }}>
              ＋ <span>Add New CV</span>
            </button>
          </section>
        </main>
      </div>
      {preview && (
        <Resume
          cv={preview}
          close={() => setPreview(null)}
          onSave={save}
          error={error}
          notice={notice}
        />
      )}
      {report && <AtsReport cv={report} close={() => setReport(null)} />}
      {pendingDelete && <Modal close={() => setPendingDelete(null)}><section className="cm-confirm"><h2>Delete “{pendingDelete.title}”?</h2><p>This removes the CV from the local mock session. This action cannot be undone.</p><div><button className="cm-secondary" onClick={() => setPendingDelete(null)}>Cancel</button><button className="cm-danger" onClick={() => { deleteMockGeneratedCV(pendingDelete.id); setCvs(getMockGeneratedCVs()); setPendingDelete(null); }}>Delete CV</button></div></section></Modal>}
    </div>
  );
}
