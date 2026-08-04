"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import s from "./dashboard.module.css";
import {
  WarningIcon,
  BriefcaseIcon,
  FileIcon,
  CheckCircleIcon,
  TargetIcon,
  FileTextIcon,
} from "@/components/icons";
import { ApiError, listApplications, listJobs } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type {
  ApplicationListItem,
  GenerationStatus,
  JobOut,
} from "@/types/api";

const CV_DONE: GenerationStatus[] = [
  "cv_generated",
  "ats_scoring",
  "completed",
  "needs_review",
];

const PIPELINE_ROWS: {
  label: string;
  statuses: GenerationStatus[];
  color: string;
  warn?: boolean;
}[] = [
  {
    label: "In queue",
    statuses: ["saved", "cv_queued"],
    color: "var(--ink-subtle)",
  },
  {
    label: "Generating CV",
    statuses: ["cv_generating"],
    color: "var(--accent-blue)",
  },
  {
    label: "Scoring ATS",
    statuses: ["cv_generated", "ats_scoring"],
    color: "var(--accent-purple)",
  },
  { label: "Completed", statuses: ["completed"], color: "var(--success)" },
  {
    label: "Needs review",
    statuses: ["needs_review", "failed"],
    color: "var(--warning)",
    warn: true,
  },
];

export default function DashboardPage() {
  const { session } = useAuth();
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listApplications(), listJobs(1, 30)])
      .then(([appsRes, jobsRes]) => {
        if (cancelled) return;
        setApps(appsRes.items);
        setJobs(jobsRes.items);
        setJobsTotal(jobsRes.total);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.message : "Cannot reach the server.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const cvCount = apps.filter((a) =>
      CV_DONE.includes(a.generation_status),
    ).length;
    const applying = apps.filter(
      (a) => a.pipeline_stage === "applied" || a.pipeline_stage === "interview",
    ).length;
    const interviews = apps.filter(
      (a) => a.pipeline_stage === "interview",
    ).length;
    const scores = apps
      .map((a) => a.overall_score)
      .filter((v): v is number => v != null);
    const avgAts = scores.length
      ? Math.round(scores.reduce((acc, v) => acc + v, 0) / scores.length)
      : null;
    return { cvCount, applying, interviews, avgAts };
  }, [apps]);

  const pipelineCounts = useMemo(
    () =>
      PIPELINE_ROWS.map((row) => ({
        ...row,
        count: apps.filter((a) => row.statuses.includes(a.generation_status))
          .length,
      })),
    [apps],
  );

  const needsReview = useMemo(
    () =>
      apps
        .filter(
          (a) =>
            a.generation_status === "needs_review" ||
            a.generation_status === "failed",
        )
        .slice(0, 3),
    [apps],
  );

  const recentCvs = useMemo(
    () => apps.filter((a) => CV_DONE.includes(a.generation_status)).slice(0, 3),
    [apps],
  );

  const firstName = session?.fullName?.split(" ")[0] ?? "there";

  return (
    <main className={s.main}>
      {/* ── Page Header ── */}
      <div className={s.pageHead}>
        <div>
          <h1>Hello {firstName} 👋</h1>
          <p>
            {loadError
              ? loadError
              : `${jobsTotal} jobs on your radar · ${stats.cvCount} tailored CVs so far.`}
          </p>
        </div>
        <div className={s.headRight}>
          <span className={s.agentPill}>
            <i /> Agent ready
          </span>
          <Link href="/jobs" className={`${s.btn} ${s.btnPrimary}`}>
            Find jobs
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <section className={s.stats}>
        {/* Stat 1 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary-hover)",
            }}
          >
            <BriefcaseIcon />
          </div>
          <div className={s.num}>{jobsTotal}</div>
          <div className={s.lbl}>Jobs scraped</div>
          <div className={s.sub} style={{ color: "var(--ink-subtle)" }}>
            from LinkedIn & Indeed
          </div>
        </div>
        {/* Stat 2 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: "color-mix(in srgb, var(--success) 12%, transparent)",
              color: "var(--success)",
            }}
          >
            <FileIcon />
          </div>
          <div className={s.num}>{stats.cvCount}</div>
          <div className={s.lbl}>CVs created</div>
          <div className={s.sub} style={{ color: "var(--ink-subtle)" }}>
            tailored by the agent
          </div>
        </div>
        {/* Stat 3 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background:
                "color-mix(in srgb, var(--accent-blue) 15%, transparent)",
              color: "var(--accent-blue)",
            }}
          >
            <CheckCircleIcon />
          </div>
          <div className={s.num}>{stats.applying}</div>
          <div className={s.lbl}>Applying</div>
          <div className={s.sub} style={{ color: "var(--ink-subtle)" }}>
            {stats.interviews} interview{stats.interviews === 1 ? "" : "s"}
          </div>
        </div>
        {/* Stat 4 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background:
                "color-mix(in srgb, var(--accent-purple) 16%, transparent)",
              color: "var(--accent-purple)",
            }}
          >
            <TargetIcon />
          </div>
          <div className={s.num}>
            {stats.avgAts !== null ? `${stats.avgAts}%` : "—"}
          </div>
          <div className={s.lbl}>Average ATS</div>
          <div className={s.sub} style={{ color: "var(--ink-subtle)" }}>
            across scored CVs
          </div>
        </div>
      </section>

      {/* ── PIPELINE + NEEDS REVIEW ── */}
      <section className={`${s.grid2} ${s.gPipe}`}>
        {/* Pipeline */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Agent Pipeline</h2>
            <Link href="/applications">Details →</Link>
          </div>
          <div className={s.pipeBody}>
            {pipelineCounts.map((row) => (
              <div className={s.pipeRow} key={row.label}>
                <span
                  className={s.name}
                  style={row.warn ? { color: "var(--warning)" } : undefined}
                >
                  {row.label}
                </span>
                <div className={s.track}>
                  <div
                    className={s.fill}
                    style={{
                      width: apps.length
                        ? `${Math.round((row.count / apps.length) * 100)}%`
                        : "0%",
                      background: row.color,
                    }}
                  />
                </div>
                <span
                  className={s.cnt}
                  style={row.warn ? { color: "var(--warning)" } : undefined}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Review */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Needs your review</h2>
          </div>
          <div className={s.nrBody}>
            {needsReview.length === 0 && (
              <div className={s.nrItem}>
                <div className={s.t}>
                  <b>Nothing to review</b>
                  <small>
                    CVs that fail the ATS threshold will show up here.
                  </small>
                </div>
              </div>
            )}
            {needsReview.map((app) => (
              <div className={s.nrItem} key={app.id}>
                <span className={s.wi}>
                  <WarningIcon />
                </span>
                <div className={s.t}>
                  <b>
                    {app.job_title} — {app.company}
                  </b>
                  <small>
                    {app.overall_score != null
                      ? `ATS ${app.overall_score}% · out of retries`
                      : "CV generation failed"}
                  </small>
                </div>
                <Link className={s.go} href="/cv-tailoring">
                  Review &amp; edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT JOBS + RECENT CVS ── */}
      <section className={`${s.grid2} ${s.gLists}`}>
        {/* Recent Jobs */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Latest jobs on radar</h2>
            <Link href="/jobs">View all →</Link>
          </div>
          <div className={s.list}>
            {jobs.length === 0 && (
              <div className={s.li}>
                <div className={s.meta}>
                  <b>No jobs yet</b>
                  <small>
                    Run a scan from the Job Radar to fill this list.
                  </small>
                </div>
              </div>
            )}
            {jobs.slice(0, 3).map((job) => (
              <div className={s.li} key={job.id}>
                <div className={s.doc}>
                  <BriefcaseIcon />
                </div>
                <div className={s.meta}>
                  <b>
                    {job.title} — {job.company}
                  </b>
                  <small>
                    {[job.location, job.employment_type]
                      .filter(Boolean)
                      .join(" · ") || job.source}
                  </small>
                </div>
                <Link href="/jobs" className={s.btnMini}>
                  + CV
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent CVs */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Recent CVs</h2>
            <Link href="/cv-tailoring">CV Manager →</Link>
          </div>
          <div className={s.list}>
            {recentCvs.length === 0 && (
              <div className={s.li}>
                <div className={s.meta}>
                  <b>No CVs yet</b>
                  <small>Generate a tailored CV from the Job Radar.</small>
                </div>
              </div>
            )}
            {recentCvs.map((app) => (
              <div className={s.li} key={app.id}>
                <div className={s.doc}>
                  <FileTextIcon />
                </div>
                <div className={s.meta}>
                  <b>
                    {app.job_title} — {app.company}
                  </b>
                  <small>
                    Added {timeAgo(app.created_at)} ·{" "}
                    {app.generation_status.replace(/_/g, " ")}
                  </small>
                </div>
                {app.overall_score != null && (
                  <span
                    className={`${s.score} ${
                      app.overall_score >= 75
                        ? s.sGood
                        : app.overall_score >= 60
                          ? s.sMid
                          : s.sBad
                    }`}
                  >
                    {app.overall_score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
