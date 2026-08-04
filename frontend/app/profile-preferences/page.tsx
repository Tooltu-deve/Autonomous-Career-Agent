"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getPreferences, getToken, putPreferences } from "@/lib/api";
import type { RemotePreference } from "@/types/api";
import "./profile-preferences.css";

/* ── Types ── */
type WorkFormat = "onsite" | "remote" | "hybrid";
type Currency = "VND" | "USD";

interface PreferencesData {
  positions: string[];
  salaryMin: number;
  salaryMax: number;
  currency: Currency;
  formats: WorkFormat[];
  location: string;
  experience: string;
  jobType: string;
}

/* ── Salary steps ── */
const SALARY_STEPS_VND = [
  0, 1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000,
  7_000_000, 8_000_000, 9_000_000, 10_000_000, 12_000_000, 14_000_000,
  15_000_000, 16_000_000, 18_000_000, 20_000_000, 22_000_000, 25_000_000,
  28_000_000, 30_000_000, 32_000_000, 35_000_000, 37_000_000, 40_000_000,
  42_000_000, 45_000_000, 47_000_000, 50_000_000, 55_000_000, 60_000_000,
  65_000_000, 70_000_000, 75_000_000, 80_000_000, 85_000_000, 90_000_000,
  95_000_000, 100_000_000, 110_000_000, 120_000_000, 130_000_000, 140_000_000,
  150_000_000, 160_000_000, 170_000_000, 180_000_000, 190_000_000, 200_000_000,
  220_000_000, 250_000_000,
];
const SALARY_STEPS_USD: number[] = [];
for (let i = 0; i <= 50; i++) SALARY_STEPS_USD.push(i * 200);

function formatSalary(
  idx: number,
  currency: Currency,
  steps: number[],
): string {
  const val = steps[Math.min(idx, steps.length - 1)] ?? 0;
  if (currency === "USD") return "$" + val.toLocaleString("en-US");
  if (val >= 1_000_000)
    return (val / 1_000_000).toLocaleString("vi-VN") + "M ₫";
  return val.toLocaleString("vi-VN") + " ₫";
}

const SUGGESTED_POSITIONS = [
  "Backend Engineer",
  "Frontend Developer",
  "Fullstack Developer",
  "Data Engineer",
  "DevOps Engineer",
  "AI/ML Engineer",
];

const WORK_FORMATS: {
  key: WorkFormat;
  label: string;
  desc: string;
  colorClass: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "onsite",
    label: "Onsite",
    desc: "Work at company office",
    colorClass: "pp-fmt-onsite",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    key: "remote",
    label: "Remote",
    desc: "Work remotely from anywhere",
    colorClass: "pp-fmt-remote",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 0 1 18 0" />
        <path d="M7 12a5 5 0 0 1 10 0" />
        <circle cx="12" cy="12" r="1" />
      </svg>
    ),
  },
  {
    key: "hybrid",
    label: "Hybrid",
    desc: "Mix of onsite and remote",
    colorClass: "pp-fmt-hybrid",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

/* ── Completeness ── */
function calcCompleteness(data: PreferencesData): number {
  let pct = 0;
  pct += Math.min(data.positions.length * 10, 30);
  pct += 25; // salary always set
  pct += Math.min(data.formats.length * 10, 20);
  if (data.location) pct += 10;
  if (data.experience) pct += 10;
  if (data.jobType) pct += 5;
  return Math.min(100, pct);
}

function statusLabel(pct: number): string {
  if (pct >= 95) return "Completed! 🎉";
  if (pct >= 70) return "Almost there";
  if (pct >= 40) return "Good progress";
  if (pct > 0) return "Getting started";
  return "Not started";
}

/* ── Small icons ── */
const CheckSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const XSvg = () => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const MapPinSvg = () => (
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
);
const ClockSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const BriefcaseSvg = () => (
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
);
const CoinSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export default function ProfilePreferencesPage() {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userName, setUserName] = useState("You");
  const [userInitials, setUserInitials] = useState("?");

  const [data, setData] = useState<PreferencesData>({
    positions: [],
    salaryMin: 10, // index into steps array
    salaryMax: 35,
    currency: "VND",
    formats: [],
    location: "",
    experience: "",
    jobType: "",
  });
  const [posInput, setPosInput] = useState("");

  /* ── Guard: token required; preferences already on server → dashboard ── */
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    getPreferences()
      .then(() => {
        if (!cancelled) router.replace("/dashboard");
      })
      .catch(() => {
        /* 404 = not set up yet — stay on this page */
      });

    const raw = sessionStorage.getItem("careernav_session") || "{}";
    try {
      const session = JSON.parse(raw);
      const name = (session.fullName || "").trim() || session.email || "You";
      setUserName(name);
      const parts = name.split(" ").filter(Boolean);
      setUserInitials(
        parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0]?.[0] ?? "?").toUpperCase(),
      );
    } catch {
      /* ignore */
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  /* ── Toast ── */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Positions ── */
  const addPosition = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || data.positions.includes(trimmed)) return;
    setData((d) => ({ ...d, positions: [...d.positions, trimmed] }));
  };
  const removePosition = (pos: string) => {
    setData((d) => ({ ...d, positions: d.positions.filter((p) => p !== pos) }));
  };

  /* ── Formats ── */
  const toggleFormat = (fmt: WorkFormat) => {
    setData((d) => ({
      ...d,
      formats: d.formats.includes(fmt)
        ? d.formats.filter((f) => f !== fmt)
        : [...d.formats, fmt],
    }));
  };

  /* ── Salary ── */
  const steps = data.currency === "USD" ? SALARY_STEPS_USD : SALARY_STEPS_VND;

  /* ── Save / Skip ── */
  const complete = async () => {
    const targetRole = data.positions[0]?.trim();
    if (!targetRole) {
      showToast("Add at least one target position first.");
      return;
    }
    // Backend keeps a single remote_preference: prefer hybrid > remote > onsite.
    const remotePreference: RemotePreference | null = data.formats.includes(
      "hybrid",
    )
      ? "hybrid"
      : data.formats.includes("remote")
        ? "remote"
        : data.formats.includes("onsite")
          ? "onsite"
          : null;

    setIsFinishing(true);
    try {
      await putPreferences({
        target_role: targetRole,
        preferred_locations: [
          ...(data.location.trim() ? [data.location.trim()] : []),
          ...(data.formats.includes("remote") ? ["Remote"] : []),
        ],
        remote_preference: remotePreference,
      });
      showToast("Preferences saved! Going to Dashboard...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      setIsFinishing(false);
      showToast(
        err instanceof ApiError
          ? err.message
          : "Cannot reach the server — preferences not saved.",
      );
    }
  };

  const completeness = calcCompleteness(data);

  return (
    <div className="pp-root">
      {/* Navbar */}
      <header className="pp-navbar">
        <div className="ps-brand">
          <div className="ps-brand-mark">
            <span />
            <span />
            <span />
          </div>
          <span className="ps-brand-text">CareerNav</span>
        </div>
        <button
          className="ps-skip-top"
          onClick={() => router.push("/dashboard")}
          disabled={isFinishing}
        >
          Skip to Dashboard →
        </button>
      </header>

      <div className="pp-shell">
        {/* Page header */}
        <div className="pp-page-header">
          <div>
            <h1 className="pp-h1">Job Preferences</h1>
            <p className="pp-sub">
              Let the agent know what kind of jobs you are looking for —
              positions, salary, work format, so the radar scans more
              accurately.
            </p>
          </div>
          {/* Completeness ring */}
          <div className="pp-compl-badge">
            <div
              className="pp-compl-ring"
              style={{ "--pct": completeness } as React.CSSProperties}
            >
              <span>{completeness}%</span>
            </div>
            <div>
              <div className="pp-compl-title">{statusLabel(completeness)}</div>
              <div className="pp-compl-sub">Preferences completeness</div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="pp-layout">
          {/* Left form column */}
          <div className="pp-form-col">
            {/* Section 1: Desired Positions */}
            <div className="pp-card pp-section">
              <div className="pp-section-head">
                <h2>Desired Positions</h2>
                <p>
                  Add positions you care about — the agent will prioritize the
                  most suitable jobs.
                </p>
              </div>
              {/* Pill wall */}
              <div className="pp-pill-wall">
                {data.positions.length === 0 && (
                  <span className="pp-empty-hint">
                    No positions yet — add below.
                  </span>
                )}
                {data.positions.map((pos) => (
                  <span key={pos} className="pp-position-pill">
                    <span>{pos}</span>
                    <button
                      onClick={() => removePosition(pos)}
                      aria-label={`Xóa ${pos}`}
                    >
                      <XSvg />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add input */}
              <div className="pp-pos-input-row">
                <input
                  type="text"
                  className="pp-input-bare"
                  value={posInput}
                  placeholder="Type a position and press Enter"
                  onChange={(e) => setPosInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPosition(posInput);
                      setPosInput("");
                    }
                  }}
                />
                <button
                  className="ps-btn-upload"
                  type="button"
                  onClick={() => {
                    addPosition(posInput);
                    setPosInput("");
                  }}
                >
                  Add
                </button>
              </div>

              {/* Suggested */}
              <div className="ps-suggested-label">
                Suggestions for IT Students
              </div>
              <div className="ps-suggested-chips">
                {SUGGESTED_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    className="ps-chip-suggest"
                    disabled={data.positions.includes(pos)}
                    onClick={() => addPosition(pos)}
                  >
                    + {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Job Type */}
            <div className="pp-card pp-section">
              <div className="pp-section-head">
                <h2>Job Type</h2>
                <p>Select the job type you are looking for.</p>
              </div>
              <div
                className="pp-pref-row pp-pref-row-last"
                style={{ borderBottom: "none", padding: 0 }}
              >
                <div className="pp-pref-icon">
                  <BriefcaseSvg />
                </div>
                <div className="pp-pref-text">
                  <div className="pp-pref-label">Employment Type</div>
                  <div className="pp-pref-hint">
                    Full-time, Part-time, Internship, or Freelance
                  </div>
                </div>
                <select
                  className="pp-select pp-select-sm"
                  value={data.jobType}
                  onChange={(e) =>
                    setData((d) => ({ ...d, jobType: e.target.value }))
                  }
                >
                  <option value="">Select Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            {/* Section 3: Work Format */}
            <div className="pp-card pp-section">
              <div className="pp-section-head">
                <h2>Work Format</h2>
                <p>
                  Choose the formats that suit you — you can select more than
                  one.
                </p>
              </div>
              <div className="pp-format-grid">
                {WORK_FORMATS.map((fmt) => {
                  const selected = data.formats.includes(fmt.key);
                  return (
                    <div
                      key={fmt.key}
                      className={`pp-format-option ${fmt.colorClass} ${selected ? "selected" : ""}`}
                      onClick={() => toggleFormat(fmt.key)}
                      role="checkbox"
                      aria-checked={selected}
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && toggleFormat(fmt.key)
                      }
                    >
                      <div
                        className={`pp-format-check ${selected ? "checked" : ""}`}
                      >
                        <CheckSvg />
                      </div>
                      <div className="pp-format-icon">{fmt.icon}</div>
                      <div className="pp-format-label">{fmt.label}</div>
                      <div className="pp-format-desc">{fmt.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Additional Preferences */}
            <div className="pp-card pp-section">
              <div className="pp-section-head">
                <h2>Additional Options</h2>
                <p>
                  Preferred locations and experience levels suitable for you.
                </p>
              </div>
              {/* Location */}
              <div className="pp-pref-row">
                <div className="pp-pref-icon">
                  <MapPinSvg />
                </div>
                <div className="pp-pref-text">
                  <div className="pp-pref-label">Preferred Location</div>
                  <div className="pp-pref-hint">City you want to work in</div>
                </div>
                <select
                  className="pp-select pp-select-sm"
                  value={data.location}
                  onChange={(e) =>
                    setData((d) => ({ ...d, location: e.target.value }))
                  }
                >
                  <option value="">Select city</option>
                  <option value="Ho Chi Minh">Ho Chi Minh</option>
                  <option value="Ha Noi">Ha Noi</option>
                  <option value="Da Nang">Da Nang</option>
                  <option value="Can Tho">Can Tho</option>
                  <option value="Anywhere">Anywhere</option>
                </select>
              </div>

              {/* Experience */}
              <div
                className="pp-pref-row pp-pref-row-last"
                style={{ borderBottom: "none" }}
              >
                <div className="pp-pref-icon">
                  <ClockSvg />
                </div>
                <div className="pp-pref-text">
                  <div className="pp-pref-label">Experience</div>
                  <div className="pp-pref-hint">Suitable experience level</div>
                </div>
                <select
                  className="pp-select pp-select-sm"
                  value={data.experience}
                  onChange={(e) =>
                    setData((d) => ({ ...d, experience: e.target.value }))
                  }
                >
                  <option value="">Select level</option>
                  <option value="Fresher / Intern">Fresher / Intern</option>
                  <option value="Junior (1-2 years)">Junior (1-2 years)</option>
                  <option value="Mid-level (2-5 years)">
                    Mid-level (2-5 years)
                  </option>
                  <option value="Senior (5+ years)">Senior (5+ years)</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              className="pp-btn-submit"
              onClick={complete}
              disabled={isFinishing}
            >
              {isFinishing
                ? "Saving..."
                : "Save preferences & Go to Job Radar →"}
            </button>
            <div className="pp-switch-row">
              Need to edit profile?{" "}
              <span
                onClick={() => router.back()}
                style={{ color: "#E5544F", fontWeight: 600, cursor: "pointer" }}
              >
                Back to Profile Setup
              </span>
            </div>
          </div>

          {/* Right preview column */}
          <div className="pp-preview-col">
            <div className="pp-preview-card">
              <div className="pp-section-head">
                <h2>Preview preferences</h2>
                <p>Live preview of your settings</p>
              </div>
            </div>
            <div className="pp-preview-card">
              {/* User head */}
              <div className="pp-pv-head">
                <div className="pp-pv-avatar">{userInitials}</div>
                <div>
                  <div className="pp-pv-name">{userName}</div>
                  <div className="pp-pv-sub">Job preferences preview</div>
                </div>
              </div>

              {/* Positions */}
              <div className="pp-pv-block">
                <div className="pp-pv-label">Desired Positions</div>
                {data.positions.length === 0 ? (
                  <p className="pp-pv-empty">Add vị trí để xem ở đây.</p>
                ) : (
                  <div className="pp-pv-positions">
                    {data.positions.map((p) => (
                      <span key={p} className="pp-pv-pos-tag">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Type Preview */}
              <div className="pp-pv-block">
                <div className="pp-pv-label">Job Type</div>
                <div className="pp-pv-salary-bar">
                  <div className="pp-pv-salary-icon">
                    <BriefcaseSvg />
                  </div>
                  <div>
                    <div className="pp-pv-salary-text">
                      {data.jobType || "No type selected"}
                    </div>
                    <div className="pp-pv-salary-sub">
                      Work Format (Full-time / Part-time...)
                    </div>
                  </div>
                </div>
              </div>

              {/* Formats */}
              <div className="pp-pv-block">
                <div className="pp-pv-label">Format</div>
                {data.formats.length === 0 ? (
                  <p className="pp-pv-empty">Select formats on the left.</p>
                ) : (
                  <div className="pp-pv-fmt-wrap">
                    {data.formats.map((f) => (
                      <span
                        key={f}
                        className={`pp-pv-fmt-badge pp-pv-fmt-${f}`}
                      >
                        {WORK_FORMATS.find((w) => w.key === f)?.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="pp-pv-block">
                <div className="pp-pv-label">Other Details</div>
                {!data.location && !data.experience ? (
                  <p className="pp-pv-empty">
                    Select additional options to view here.
                  </p>
                ) : (
                  <div className="pp-pv-details">
                    {data.location && (
                      <div className="pp-pv-detail">
                        <MapPinSvg />
                        <span className="pp-pv-detail-label">Location</span>
                        <span className="pp-pv-detail-value">
                          {data.location}
                        </span>
                      </div>
                    )}
                    {data.experience && (
                      <div className="pp-pv-detail">
                        <ClockSvg />
                        <span className="pp-pv-detail-label">Experience</span>
                        <span className="pp-pv-detail-value">
                          {data.experience}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`ps-toast ${toast ? "show" : ""}`} aria-live="polite">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{toast}</span>
      </div>
    </div>
  );
}
