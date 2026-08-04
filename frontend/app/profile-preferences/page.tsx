"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getPreferences, getToken, putPreferences } from "@/lib/api";
import { getInitials } from "@/lib/format";
import { KEYS } from "@/lib/storage";
import type { RemotePreference } from "@/types/api";
import "./profile-preferences.css";

/* ── Types ── */
type WorkFormat = "onsite" | "remote" | "hybrid";

/* Chỉ gồm các field backend nhận (PUT /profile/preferences) —
 * salary/experience/jobType đã bỏ vì scraper không dùng chúng. */
export interface PreferencesData {
  positions: string[];
  formats: WorkFormat[];
  location: string;
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
  pct += Math.min(data.positions.length * 20, 40);
  pct += Math.min(data.formats.length * 15, 30);
  if (data.location) pct += 30;
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

export default function ProfilePreferencesPage() {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userName, setUserName] = useState("You");
  const [userInitials, setUserInitials] = useState("?");

  const [data, setData] = useState<PreferencesData>({
    positions: [],
    formats: [],
    location: "",
  });
  const [posInput, setPosInput] = useState("");

  /* ── Load existing preferences & token guard ── */
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }

    try {
      const session = JSON.parse(sessionStorage.getItem(KEYS.session) || "{}");
      const name = (session.fullName || "").trim() || session.email || "You";
      setUserName(name);
      setUserInitials(getInitials(name));
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      // Server là nguồn sự thật duy nhất cho preferences
      try {
        const pref = await getPreferences();
        if (cancelled || !pref) return;

        setData((d) => ({
          ...d,
          positions: pref.target_role ? [pref.target_role] : d.positions,
          location: pref.preferred_locations?.[0] || d.location,
          formats: pref.remote_preference
            ? [pref.remote_preference]
            : d.formats,
        }));
      } catch {
        /* 404 or network error — stay on page with default form */
      }
    })();

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

  /* ── Save / Skip ── */
  const complete = async () => {
    const targetRole = data.positions[0]?.trim();
    if (!targetRole) {
      showToast("Add at least one target position first.");
      return;
    }

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

      showToast("Preferences saved! Returning to Profile...");
      setTimeout(() => router.push("/profile"), 800);
    } catch (err) {
      // Lưu thất bại: ở lại trang, báo lỗi thật — không giả vờ thành công.
      setIsFinishing(false);
      showToast(
        err instanceof ApiError
          ? `Save failed: ${err.message}`
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

            {/* Section 2: Work Format */}
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
                <p>Preferred location suitable for you.</p>
              </div>
              {/* Location */}
              <div
                className="pp-pref-row pp-pref-row-last"
                style={{ borderBottom: "none" }}
              >
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
                  <p className="pp-pv-empty">
                    Add positions to preview them here.
                  </p>
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
                {!data.location ? (
                  <p className="pp-pv-empty">
                    Select a preferred location to view here.
                  </p>
                ) : (
                  <div className="pp-pv-details">
                    <div className="pp-pv-detail">
                      <MapPinSvg />
                      <span className="pp-pv-detail-label">Location</span>
                      <span className="pp-pv-detail-value">
                        {data.location}
                      </span>
                    </div>
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
