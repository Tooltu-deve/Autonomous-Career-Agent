"use client";

/**
 * TemplatePicker — grid of 3 CV templates with crossfade hover preview.
 * Each preview mirrors the real LaTeX layout in
 * services/pdf-service/app/templates/{classic,modern,academic}.tex.j2 —
 * keep them in sync when the .tex.j2 files change.
 */
import type { TemplateName } from "@/types/api";
import { CheckIcon } from "./Icons";

interface Props {
  selectedTemplate: TemplateName;
  onSelect: (id: TemplateName) => void;
}

const TEMPLATES: {
  id: TemplateName;
  name: string;
  badge: string;
  desc: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "classic",
    name: "Classic",
    badge: "ATS Standard",
    desc: "Timeless single-column serif layout, maximum ATS compatibility.",
    // classic.tex.j2: centered header + contact table, uppercase sections
    // with a rule — Objective / Work Experience / Education / Skills.
    preview: (
      <div className="ps-tpl-preview ps-tpl-classic">
        <div className="ps-tpl-header-classic">
          <div className="ps-tpl-name">NGUYEN VAN A</div>
          <div className="ps-tpl-sub">Software Engineer</div>
          <div className="ps-tpl-sub">Ho Chi Minh City</div>
          <div className="ps-tpl-sub">
            <b>Email:</b> a@email.com &nbsp;|&nbsp; <b>Phone:</b> +84 901 234
            567
          </div>
          <div className="ps-tpl-sub">
            <b>GitHub:</b> github.com/nva &nbsp;|&nbsp; <b>LinkedIn:</b>
            /in/nva
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">OBJECTIVE</div>
          <div className="ps-tpl-entry">
            Backend engineer with 3 years of experience building reliable APIs.
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">WORK EXPERIENCE</div>
          <div className="ps-tpl-row">
            <strong>Company A</strong>
            <span>2022 -- Present</span>
          </div>
          <div className="ps-tpl-entry">
            <strong>Senior Developer</strong>
          </div>
          <div className="ps-tpl-bullet">
            Built REST APIs serving 10k users; cut response time by 40%.
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">EDUCATION</div>
          <div className="ps-tpl-row">
            <strong>University of Science</strong>
            <span>2019 -- 2023</span>
          </div>
          <div className="ps-tpl-entry">BSc --- Computer Science</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-classic">SKILLS</div>
          <div className="ps-tpl-entry">
            python, fastapi, postgresql, docker, react
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    badge: "Recommended",
    desc: "Two-column sans-serif layout with a dark sidebar for contact & skills.",
    // modern.tex.j2: charcoal LEFT SIDEBAR (name, headline, CONTACT, SKILLS)
    // + right column (SUMMARY, WORK EXPERIENCE, EDUCATION).
    preview: (
      <div className="ps-tpl-preview ps-tpl-modern">
        <div className="ps-tpl-modern-side">
          <div className="ps-tpl-modern-name">Nguyen Van A</div>
          <div className="ps-tpl-modern-headline">Software Engineer</div>
          <div className="ps-tpl-modern-shead">CONTACT</div>
          <div className="ps-tpl-modern-item">
            <b>Email</b>
            <br />
            a@email.com
          </div>
          <div className="ps-tpl-modern-item">
            <b>Phone</b>
            <br />
            +84 901 234 567
          </div>
          <div className="ps-tpl-modern-item">
            <b>Location</b>
            <br />
            Ho Chi Minh City
          </div>
          <div className="ps-tpl-modern-shead">SKILLS</div>
          <div className="ps-tpl-modern-item">python</div>
          <div className="ps-tpl-modern-item">fastapi</div>
          <div className="ps-tpl-modern-item">postgresql</div>
          <div className="ps-tpl-modern-item">docker</div>
        </div>
        <div className="ps-tpl-modern-main">
          <div className="ps-tpl-stitle-modern">SUMMARY</div>
          <div className="ps-tpl-entry">
            Backend engineer with 3 years of experience building reliable APIs.
          </div>
          <div className="ps-tpl-stitle-modern">WORK EXPERIENCE</div>
          <div className="ps-tpl-row">
            <strong>Senior Developer</strong>
            <span>2022 -- Present</span>
          </div>
          <div className="ps-tpl-italic">Company A</div>
          <div className="ps-tpl-bullet">
            Built REST APIs serving 10k users.
          </div>
          <div className="ps-tpl-stitle-modern">EDUCATION</div>
          <div className="ps-tpl-row">
            <strong>University of Science</strong>
            <span>2019 -- 2023</span>
          </div>
          <div className="ps-tpl-italic">BSc --- Computer Science</div>
        </div>
      </div>
    ),
  },
  {
    id: "academic",
    name: "Academic",
    badge: "Detailed",
    desc: "Formal serif CV — education first, suited to research & teaching.",
    // academic.tex.j2: centered header, small-caps sections — Summary /
    // Education (first!) / Professional Appointments / Technical Skills.
    preview: (
      <div className="ps-tpl-preview ps-tpl-academic">
        <div className="ps-tpl-header-academic">
          <div className="ps-tpl-name-academic">Nguyen Van A</div>
          <div className="ps-tpl-sub-academic">Software Engineer</div>
          <div className="ps-tpl-sub-academic">Ho Chi Minh City</div>
          <div className="ps-tpl-sub-academic">
            Email: a@email.com &nbsp;|&nbsp; Phone: +84 901 234 567
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">Summary</div>
          <div className="ps-tpl-entry-academic">
            Backend engineer with 3 years of experience building reliable APIs.
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">Education</div>
          <div className="ps-tpl-row">
            <strong>BSc in Computer Science</strong>
            <span>2019 -- 2023</span>
          </div>
          <div className="ps-tpl-italic">University of Science</div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">
            Professional Appointments
          </div>
          <div className="ps-tpl-row">
            <strong>Senior Developer</strong>
            <span>2022 -- Present</span>
          </div>
          <div className="ps-tpl-italic">Company A</div>
          <div className="ps-tpl-bullet">
            Built REST APIs serving 10k users.
          </div>
        </div>
        <div className="ps-tpl-section">
          <div className="ps-tpl-stitle-academic">
            Technical Skills &amp; Competencies
          </div>
          <div className="ps-tpl-bullet">
            python, fastapi, postgresql, docker, react
          </div>
        </div>
      </div>
    ),
  },
];

export function TemplatePicker({ selectedTemplate, onSelect }: Props) {
  return (
    <div className="ps-template-section">
      <div className="ps-template-title">Select Preferred CV Template</div>
      <div className="ps-template-sub">
        Hover a card to preview the layout &bull; Click to select
      </div>

      <div className="ps-template-picker">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className={`ps-template-card ${selectedTemplate === tpl.id ? "active" : ""}`}
            onClick={() => onSelect(tpl.id)}
          >
            {/* Front face: info text (visible by default, fades out on hover) */}
            <div className="ps-template-front">
              {selectedTemplate === tpl.id && (
                <div className="ps-template-check">
                  <CheckIcon />
                </div>
              )}
              <span className="ps-template-badge">{tpl.badge}</span>
              <span className="ps-template-name">{tpl.name}</span>
              <span className="ps-template-desc">{tpl.desc}</span>
              <div className="ps-template-hint">Hover to preview →</div>
            </div>

            {/* Back face: CV preview (invisible by default, fades in on hover) */}
            <div className="ps-template-back">
              {selectedTemplate === tpl.id && (
                <div className="ps-template-check">
                  <CheckIcon />
                </div>
              )}
              {tpl.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
