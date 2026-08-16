import { Fragment } from "react";

import type { CvContent, PdfHeader, TemplateName } from "@/types/api";
import styles from "./cv-manager.module.css";

type Props = {
  content: CvContent;
  header: PdfHeader;
  template: TemplateName;
};

function formatMonthYear(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    // Backend dates are calendar dates rather than instants. Formatting in UTC
    // prevents an ISO value such as 2025-01-01 from becoming December 2024 for
    // users west of UTC.
    timeZone: "UTC",
  });
}

function dateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "";
  return `${formatMonthYear(start)} — ${formatMonthYear(end) || "Present"}`;
}

function Contact({ header }: { header: PdfHeader }) {
  // Order and link labels mirror the .tex templates, where the profile URLs
  // render as the site name rather than the bare URL.
  return (
    <p className={styles["cm-contact"]}>
      {[
        header.location,
        header.phone,
        header.email,
        header.github_url && "GitHub",
        header.linkedin_url && "LinkedIn",
      ]
        .filter(Boolean)
        .join(" · ")}
    </p>
  );
}

function Header({ header }: { header: PdfHeader }) {
  return (
    <header className={styles["cm-preview-header"]}>
      <h1>{header.full_name ?? ""}</h1>
      <h2>{header.headline ?? ""}</h2>
      <Contact header={header} />
    </header>
  );
}

function Description({
  value,
}: {
  value: string[] | string | null | undefined;
}) {
  const lines = Array.isArray(value) ? value : value ? [value] : [];
  if (lines.length === 0) return null;
  return (
    <ul className={styles["cm-resume-bullets"]}>
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
}

function Experience({ content, title }: { content: CvContent; title: string }) {
  if (content.experience.length === 0) return null;
  return (
    <section className={styles["cm-resume-section"]} data-section="experience">
      <h3>{title}</h3>
      {content.experience.map((entry, index) => (
        <div className={styles["cm-preview-entry"]} key={index}>
          <b>
            {entry.title} — {entry.organization}
          </b>
          <small>{dateRange(entry.start_date, entry.end_date)}</small>
          <Description value={entry.description} />
        </div>
      ))}
    </section>
  );
}

function Education({ content }: { content: CvContent }) {
  if (content.education.length === 0) return null;
  return (
    <section className={styles["cm-resume-section"]} data-section="education">
      <h3>Education</h3>
      {content.education.map((entry, index) => (
        <div className={styles["cm-preview-entry"]} key={index}>
          <b>
            {entry.school}
            {entry.degree ? ` — ${entry.degree}` : ""}
            {entry.field_of_study ? ` — ${entry.field_of_study}` : ""}
          </b>
          <small>{dateRange(entry.start_date, entry.end_date)}</small>
          <Description value={entry.description} />
        </div>
      ))}
    </section>
  );
}

function Skills({ content }: { content: CvContent }) {
  // Drop half-typed groups so the preview matches what the PDF renderer keeps.
  const groups = (content.skill_groups ?? []).filter(
    (group) => group.skills.length > 0,
  );
  if (groups.length === 0) return null;
  return (
    <section className={styles["cm-resume-section"]} data-section="skills">
      <h3>Skills</h3>
      {/* Grid definition list: the category column sizes to the widest label so
          the colons line up, mirroring the aligned tabular in the templates. */}
      <dl className={styles["cm-skills"]}>
        {groups.map((group, index) => (
          <Fragment key={index}>
            <dt>{group.category}</dt>
            <dd>{group.skills.join(", ")}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

function Certifications({ content }: { content: CvContent }) {
  const certifications = content.certifications ?? [];
  if (certifications.length === 0) return null;
  return (
    <section
      className={styles["cm-resume-section"]}
      data-section="certifications"
    >
      <h3>Certifications</h3>
      {certifications.map((entry, index) => (
        <div className={styles["cm-preview-entry"]} key={index}>
          <b>{entry.title}</b>
          <small>{formatMonthYear(entry.obtain_date)}</small>
        </div>
      ))}
    </section>
  );
}

function Summary({
  content,
  title = "Summary",
}: {
  content: CvContent;
  title?: string;
}) {
  return (
    <section className={styles["cm-resume-section"]} data-section="summary">
      <h3>{title}</h3>
      <p>{content.summary}</p>
    </section>
  );
}

export function CvPreview({ content, header, template }: Props) {
  if (template === "modern") {
    return (
      <article
        className={`${styles["cm-resume"]} ${styles["cm-live-preview"]} ${styles["cm-preview-modern"]}`}
        data-template="modern"
        aria-label="CV preview — Modern template"
      >
        <aside className={styles["cm-modern-sidebar"]}>
          <Header header={header} />
          <Education content={content} />
        </aside>
        <div className={styles["cm-modern-main"]}>
          <Summary content={content} />
          <Skills content={content} />
          <Experience content={content} title="Work Experience" />
          <Certifications content={content} />
        </div>
      </article>
    );
  }

  if (template === "academic") {
    return (
      <article
        className={`${styles["cm-resume"]} ${styles["cm-live-preview"]} ${styles["cm-preview-academic"]}`}
        data-template="academic"
        aria-label="CV preview — Academic template"
      >
        <Header header={header} />
        <Summary content={content} />
        <Education content={content} />
        <Skills content={content} />
        <Experience content={content} title="Professional Appointments" />
        <Certifications content={content} />
      </article>
    );
  }

  return (
    <article
      className={`${styles["cm-resume"]} ${styles["cm-live-preview"]} ${styles["cm-preview-classic"]}`}
      data-template="classic"
      aria-label="CV preview — Classic template"
    >
      <Header header={header} />
      <Summary content={content} title="Objective" />
      <Education content={content} />
      <Skills content={content} />
      <Experience content={content} title="Work Experience" />
      <Certifications content={content} />
    </article>
  );
}
