"use client";

import { useMemo, useState } from "react";
import styles from "./cv-manager.module.css";
import {
  deleteMockGeneratedCV,
  getMockGeneratedCVs,
  requestCvExport,
  updateMockGeneratedCV,
  validateGeneratedCVContent,
  type GeneratedCV,
  type GeneratedCVContent,
} from "@/lib/mock/cv";
import { CvEditor } from "./CvEditor";


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
      className={styles["cm-overlay"]}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <div className={styles["cm-modal"]}>{children}</div>
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
    <section className={styles["cm-resume-section"]}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function DeleteConfirmModal({
  cv,
  onCancel,
  onConfirm,
}: {
  cv: GeneratedCV;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal close={onCancel}>
      <section className={styles["cm-confirm"]}>
        <h2>Delete &ldquo;{cv.title}&rdquo;?</h2>
        <p>This removes the CV from the local mock session. This action cannot be undone.</p>
        <div>
          <button className={styles["cm-secondary"]} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles["cm-danger"]} onClick={onConfirm}>
            Delete CV
          </button>
        </div>
      </section>
    </Modal>
  );
}
function AtsReport({ cv, close }: { cv: GeneratedCV; close: () => void }) {
  const color =
    cv.ats_score >= 75 ? "#37a66b" : cv.ats_score >= 60 ? "#c98a2c" : "#e8384f";
  const offset = 389.6 * (1 - cv.ats_score / 100);
  return (
    <Modal close={close}>
      <header className={styles["cm-modal-header"]}>
        <div>
          <h2>ATS Report — {cv.title}</h2>
          <p>Scanned against the target role</p>
        </div>
        <button onClick={close} aria-label="Close">
          ×
        </button>
      </header>
      <div className={styles["cm-ats-content"]}>
        <section className={styles["cm-score-panel"]}>
          <div className={styles["cm-gauge"]}>
            <svg viewBox="0 0 148 148">
              <circle cx="74" cy="74" r="62" />
              <circle
                className={styles.value}
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
          <h3 className={styles["cm-section-title"]}>Keyword Match</h3>
          <div className={styles["cm-keywords"]}>
            <KeywordCard good title="Matching Keywords" words={cv.matched} />
            <KeywordCard title="Missing Keywords" words={cv.missing} />
          </div>
        </section>
        <section>
          <h3 className={styles["cm-section-title"]}>Recommendations</h3>
          <div className={styles["cm-recommendations"]}>
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
      <footer className={styles["cm-modal-footer"]}>
        <span>Formatted for ATS scanning</span>
        <div>
          <button className={styles["cm-secondary"]}>View Full Report</button>
          <button className={styles["cm-primary"]} onClick={close}>
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
    <article
      className={
        good
          ? `${styles["cm-keyword"]} ${styles.good}`
          : `${styles["cm-keyword"]} ${styles.missing}`
      }
    >
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
  const [sortBy, setSortBy] = useState<"recent" | "ats">("recent");
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
  const visible = useMemo(() => {
    const filtered = cvs.filter((cv) =>
      `${cv.title} ${cv.source_job}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    if (sortBy === "ats") {
      return [...filtered].sort((a, b) => b.ats_score - a.ats_score);
    }
    return filtered;
  }, [cvs, query, sortBy]);
  return (
    <div className={styles["cv-manager"]}>
        <main className={styles["cm-main"]}>
          <header className={styles["cm-page-header"]}>
            <div>
              <h1>CV Manager</h1>
              <p>
                Every tailored CV your agent has generated, in one place —
                preview, edit, or export any version.
              </p>
            </div>
          </header>
          <div className={styles["cm-toolbar"]}>
            <label>
              ⌕
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search CVs..."
              />
            </label>
            <select
              className={styles["cm-filter"]}
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "recent" | "ats")
              }
              aria-label="Sort CVs"
            >
              <option value="recent">Sort: Recently updated</option>
              <option value="ats">Sort: ATS score</option>
            </select>
          </div>
          <section className={styles["cm-cv-list"]}>
            {visible.map((cv) => (
              <article
                className={styles["cm-cv-card"]}
                key={cv.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setError(null);
                  setNotice(null);
                  setPreview(cv);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setError(null);
                    setNotice(null);
                    setPreview(cv);
                  }
                }}
              >
                <span className={styles["cm-document"]}>▤</span>
                <div className={styles["cm-cv-title"]}>
                  <h2>{cv.title}</h2>
                  <p>{cv.source_job}</p>
                  <small>
                    Last updated {cv.updated_at} · {cv.edit_status}
                  </small>
                </div>
                <strong
                  className={`${styles["cm-score"]} ${styles[scoreClass(cv.ats_score)]}`}
                >
                  {cv.ats_score}%
                </strong>
                <div className={styles["cm-actions"]}>
                  <button
                    className={styles["cm-ats"]}
                    onClick={(event) => {
                      event.stopPropagation();
                      setReport(cv);
                    }}
                  >
                    ✓ &nbsp; ATS Report
                  </button>
                  <button
                    className={styles["cm-danger"]}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete(cv);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        </main>
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
      {pendingDelete && (
        <DeleteConfirmModal
          cv={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteMockGeneratedCV(pendingDelete.id);
            setCvs(getMockGeneratedCVs());
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
