"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./cv-manager.module.css";
import { ApiError, exportPdf, getProfile, putCv } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { loadCvViews, validateCvContent, type CvView } from "@/lib/cv";
import type {
  CvContent,
  PdfHeader,
  ProfileResponse,
  TemplateName,
} from "@/types/api";
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
  header,
  close,
  onSave,
  error,
  notice,
}: {
  cv: CvView;
  header: PdfHeader;
  close: () => void;
  onSave: (content: CvContent, exportAfterSave: boolean) => void;
  error: string | null;
  notice: string | null;
}) {
  return (
    <Modal close={close}>
      <CvEditor
        cv={cv}
        header={header}
        onClose={close}
        onSave={onSave}
        error={error}
        notice={notice}
      />
    </Modal>
  );
}

function AtsReport({ cv, close }: { cv: CvView; close: () => void }) {
  const score = cv.atsScore ?? 0;
  const color = score >= 75 ? "#37a66b" : score >= 60 ? "#c98a2c" : "#e8384f";
  const offset = 389.6 * (1 - score / 100);
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
            <b>{score}%</b>
            <small>ATS score</small>
          </div>
          <div>
            <h3>
              {score >= 75
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
            {cv.recommendations.length === 0 ? (
              <p>No recommendations — the ATS agent had nothing to flag.</p>
            ) : (
              cv.recommendations.map((rec, i) => (
                <p key={i}>
                  <b>
                    {rec.type === "improve" ? "✦" : "△"} {rec.title}
                  </b>
                  {rec.body}
                </p>
              ))
            )}
          </div>
        </section>
      </div>
      <footer className={styles["cm-modal-footer"]}>
        <span>Formatted for ATS scanning</span>
        <div>
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

function headerFromProfile(profile: ProfileResponse | null): PdfHeader {
  if (!profile) return {};
  return {
    headline: profile.headline ?? undefined,
    location: profile.location ?? undefined,
    phone: profile.phone ?? undefined,
    github_url: profile.github_url ?? undefined,
    linkedin_url: profile.linkedin_url ?? undefined,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** CV còn đang chạy pipeline (chưa completed / needs_review) → khoá tương tác.
 *  needs_review vẫn mở được vì user PHẢI vào editor sửa CV đó. */
function isPending(cv: CvView): boolean {
  return (
    cv.generationStatus !== "completed" &&
    cv.generationStatus !== "needs_review"
  );
}

const PENDING_LABEL: Record<string, string> = {
  cv_queued: "Queued…",
  cv_generating: "Generating CV…",
  cv_generated: "Waiting for ATS…",
  ats_scoring: "Scoring ATS…",
};

export function CvManager() {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "ats">("recent");
  const [cvs, setCvs] = useState<CvView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [preview, setPreview] = useState<CvView | null>(null);
  const [report, setReport] = useState<CvView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadCvViews(), getProfile().catch(() => null)])
      .then(([views, prof]) => {
        if (cancelled) return;
        setCvs(views);
        setProfile(prof);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "Cannot reach the server.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Còn card đang chạy pipeline → poll lại danh sách để card tự mở khoá
  // khi ats-agent chấm xong.
  const hasPending = cvs.some(isPending);
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => {
      loadCvViews()
        .then(setCvs)
        .catch(() => {
          /* giữ danh sách hiện tại, thử lại ở tick sau */
        });
    }, 5000);
    return () => clearInterval(timer);
  }, [hasPending]);

  const pdfHeader: PdfHeader = {
    full_name: session?.fullName,
    email: session?.email,
    ...headerFromProfile(profile),
  };

  const save = async (content: CvContent, exportAfterSave: boolean) => {
    if (!preview) return;
    const message = validateCvContent(content);
    if (message) {
      setError(message);
      setNotice(null);
      return;
    }
    try {
      const saved = await putCv(preview.cvId, content);
      const updated: CvView = {
        ...preview,
        content: saved.cv_json,
        editStatus: saved.edit_status,
        updatedAt: "Just now",
      };
      setCvs((prev) =>
        prev.map((cv) => (cv.cvId === updated.cvId ? updated : cv)),
      );
      setPreview(updated);
      setError(null);

      if (exportAfterSave) {
        const template: TemplateName = profile?.preferred_template ?? "classic";
        const blob = await exportPdf({
          template,
          cv_data: saved.cv_json,
          header: pdfHeader,
        });
        downloadBlob(blob, "cv.pdf");
        setNotice("Saved and exported to PDF.");
      } else {
        setNotice("Saved.");
      }
    } catch (err) {
      setNotice(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "Cannot reach the server — not saved.",
      );
    }
  };

  const visible = useMemo(() => {
    const filtered = cvs.filter((cv) =>
      `${cv.title} ${cv.sourceJob}`.toLowerCase().includes(query.toLowerCase()),
    );
    if (sortBy === "ats") {
      return [...filtered].sort(
        (a, b) => (b.atsScore ?? 0) - (a.atsScore ?? 0),
      );
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
          {loading && <p>Loading CVs…</p>}
          {loadError && <p>{loadError}</p>}
          {!loading && !loadError && visible.length === 0 && (
            <p>
              No tailored CVs yet — select jobs on the Job Radar and press
              &ldquo;Generate Tailored CV&rdquo; to let the agent create one.
            </p>
          )}
          {visible.map((cv) => {
            const pending = isPending(cv);
            const open = () => {
              if (pending) return;
              setError(null);
              setNotice(null);
              setPreview(cv);
            };
            return (
              <article
                className={`${styles["cm-cv-card"]}${pending ? ` ${styles["cm-cv-card--pending"]}` : ""}`}
                key={cv.cvId}
                role="button"
                tabIndex={pending ? -1 : 0}
                aria-disabled={pending}
                onClick={open}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                  }
                }}
              >
                <span className={styles["cm-document"]}>▤</span>
                <div className={styles["cm-cv-title"]}>
                  <h2>{cv.title}</h2>
                  <p>{cv.sourceJob}</p>
                  <small>
                    Last updated {cv.updatedAt} · {cv.editStatus}
                  </small>
                </div>
                {pending ? (
                  <span className={styles["cm-pending-label"]}>
                    <i className={styles["cm-spinner"]} aria-hidden="true" />
                    {PENDING_LABEL[cv.generationStatus] ?? "Processing…"}
                  </span>
                ) : (
                  <strong
                    className={`${styles["cm-score"]} ${styles[scoreClass(cv.atsScore ?? 0)]}`}
                  >
                    {cv.atsScore !== null ? `${cv.atsScore}%` : "…"}
                  </strong>
                )}
                <div className={styles["cm-actions"]}>
                  <button
                    className={styles["cm-ats"]}
                    disabled={pending || cv.atsScore === null}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!pending && cv.atsScore !== null) setReport(cv);
                    }}
                  >
                    ✓ &nbsp; ATS Report
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      {preview && (
        <Resume
          cv={preview}
          header={pdfHeader}
          close={() => setPreview(null)}
          onSave={save}
          error={error}
          notice={notice}
        />
      )}
      {report && <AtsReport cv={report} close={() => setReport(null)} />}
    </div>
  );
}
