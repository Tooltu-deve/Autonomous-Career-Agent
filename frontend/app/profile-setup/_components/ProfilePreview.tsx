"use client";

/**
 * ProfilePreview — right-sidebar live preview of the user's profile data.
 * Pure display component: no state, no side-effects.
 */
import { EyeIcon } from "./Icons";
import type { ProfileData } from "../_types/types";

interface Props {
  data: ProfileData;
  initials: string;
}

export function ProfilePreview({ data, initials }: Props) {
  return (
    <div className="ps-preview-card">
      <div className="ps-preview-header">
        <h3>
          <EyeIcon /> Live Resume Preview
        </h3>
        <span className="ps-live-pill">🟢 Realtime</span>
      </div>

      <div className="ps-pv-user">
        <div className="ps-pv-avatar">{initials}</div>
        <div>
          <div className="ps-pv-name">{data.name || "Your Name"}</div>
          <div className="ps-pv-headline">
            {data.headline || "Professional Headline"}
          </div>
        </div>
      </div>

      <div className="ps-pv-meta">
        <span className="ps-pv-chip">
          📄 Template: {data.preferred_template.toUpperCase()}
        </span>
        {data.location && (
          <span className="ps-pv-chip">📍 {data.location}</span>
        )}
        {data.email && <span className="ps-pv-chip">✉️ {data.email}</span>}
        {data.phone && <span className="ps-pv-chip">📞 {data.phone}</span>}
        {data.github && <span className="ps-pv-chip">🔗 {data.github}</span>}
      </div>

      {data.summary && (
        <div className="ps-pv-block">
          <div className="ps-pv-block-title">PROFESSIONAL SUMMARY</div>
          <div className="ps-pv-block-text">{data.summary}</div>
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="ps-pv-block">
          <div className="ps-pv-block-title">SKILLS</div>
          <div className="ps-pv-skills">
            {data.skills.map((s) => (
              <span key={s} className="ps-pv-skill-tag">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.education.some((e) => e.university) && (
        <div className="ps-pv-block">
          <div className="ps-pv-block-title">EDUCATION</div>
          {data.education
            .filter((e) => e.university)
            .map((e) => (
              <div
                key={e.id}
                className="ps-pv-block-text"
                style={{ marginBottom: "6px" }}
              >
                <strong>{e.university}</strong>
                {e.degree && <> — {e.degree}</>}
              </div>
            ))}
        </div>
      )}

      {data.projects.some((p) => p.name) && (
        <div className="ps-pv-block">
          <div className="ps-pv-block-title">PROJECTS</div>
          {data.projects
            .filter((p) => p.name)
            .map((p) => (
              <div
                key={p.id}
                className="ps-pv-block-text"
                style={{ marginBottom: "8px" }}
              >
                <strong>{p.name}</strong>
                {p.description && (
                  <>
                    <br />
                    {p.description}
                  </>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
