"use client";

import React from "react";

export type WorkFormat = "onsite" | "remote" | "hybrid";

export const WORK_FORMATS: {
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

export const CheckSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export const XSvg = () => (
  <svg
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const MapPinSvg = () => (
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

interface Props {
  positions: string[];
  posInput: string;
  formats: WorkFormat[];
  location: string;
  errorMsg?: string;
  setPosInput: (val: string) => void;
  onAddPosition: (name: string) => void;
  onRemovePosition: (pos: string) => void;
  onToggleFormat: (fmt: WorkFormat) => void;
  setLocation: (val: string) => void;
}

export function PreferencesForm({
  positions,
  posInput,
  formats,
  location,
  errorMsg,
  setPosInput,
  onAddPosition,
  onRemovePosition,
  onToggleFormat,
  setLocation,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {errorMsg && (
        <div
          style={{
            padding: "10px 14px",
            background: "#FDF2F2",
            border: "1px solid #F87171",
            borderRadius: "10px",
            color: "#991B1B",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Section 1: Desired Positions */}
      <div className="pp-section" style={{ marginBottom: 0 }}>
        <div
          className="pp-section-head"
          style={{ marginBottom: "12px", paddingBottom: "8px" }}
        >
          <h2 style={{ fontSize: "15px" }}>Desired Positions</h2>
          <p style={{ fontSize: "12.5px" }}>
            Add positions you care about — the agent will prioritize suitable
            jobs.
          </p>
        </div>
        <div className="pp-pill-wall" style={{ marginBottom: "12px" }}>
          {positions.length === 0 && (
            <span className="pp-empty-hint">
              No positions yet — add below.
            </span>
          )}
          {positions.map((pos) => (
            <span key={pos} className="pp-position-pill">
              <span>{pos}</span>
              <button
                type="button"
                onClick={() => onRemovePosition(pos)}
                aria-label={`Remove ${pos}`}
              >
                <XSvg />
              </button>
            </span>
          ))}
        </div>

        <div className="pp-pos-input-row" style={{ marginBottom: 0 }}>
          <input
            type="text"
            className="pp-input-bare"
            value={posInput}
            placeholder="Type a position and press Enter"
            onChange={(e) => setPosInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddPosition(posInput);
                setPosInput("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              onAddPosition(posInput);
              setPosInput("");
            }}
            style={{
              height: "42px",
              padding: "0 18px",
              background: "#1e1f21",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Section 2: Work Format */}
      <div className="pp-section" style={{ marginBottom: 0 }}>
        <div
          className="pp-section-head"
          style={{ marginBottom: "12px", paddingBottom: "8px" }}
        >
          <h2 style={{ fontSize: "15px" }}>Work Format</h2>
          <p style={{ fontSize: "12.5px" }}>
            Choose the format that suits you best.
          </p>
        </div>
        <div className="pp-format-grid">
          {WORK_FORMATS.map((fmt) => {
            const selected = formats.includes(fmt.key);
            return (
              <div
                key={fmt.key}
                className={`pp-format-option ${fmt.colorClass} ${
                  selected ? "selected" : ""
                }`}
                onClick={() => onToggleFormat(fmt.key)}
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleFormat(fmt.key);
                  }
                }}
                style={{ padding: "14px 10px" }}
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

      {/* Section 3: Preferred Location */}
      <div className="pp-section" style={{ marginBottom: 0 }}>
        <div
          className="pp-section-head"
          style={{ marginBottom: "12px", paddingBottom: "8px" }}
        >
          <h2 style={{ fontSize: "15px" }}>Preferred Location</h2>
          <p style={{ fontSize: "12.5px" }}>Preferred city for work.</p>
        </div>
        <div
          className="pp-pref-row"
          style={{ borderBottom: "none", padding: "4px 0" }}
        >
          <div className="pp-pref-icon">
            <MapPinSvg />
          </div>
          <div className="pp-pref-text">
            <div className="pp-pref-label">Preferred Location</div>
          </div>
          <select
            className="pp-select pp-select-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", maxWidth: "200px" }}
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
    </div>
  );
}
