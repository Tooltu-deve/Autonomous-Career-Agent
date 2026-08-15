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
  });
}

function dateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "";
  return `${formatMonthYear(start)} — ${formatMonthYear(end) || "Present"}`;
}

function Contact({ header }: { header: PdfHeader }) {
  return (
    <p className={styles["cm-contact"]}>
      {[
        header.email,
        header.phone,
        header.location,
        header.github_url,
        header.linkedin_url,
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

function Description({ value }: { value: string[] | string | null | undefined }) {
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
  if (content.skills.length === 0) return null;
  return (
    <section className={styles["cm-resume-section"]} data-section="skills">
      <h3>Skills</h3>
      <div className={styles["cm-skills"]}>{content.skills.join(", ")}</div>
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
          <small>{entry.obtain_date}</small>
        </div>
      ))}
    </section>
  );
}

function Summary({ content, title = "Summary" }: { content: CvContent; title?: string }) {
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
        <Experience content={content} title="Professional Appointments" />
        <Certifications content={content} />
        <Skills content={content} />
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
      <Experience content={content} title="Work Experience" />
      <Education content={content} />
      <Certifications content={content} />
      <Skills content={content} />
    </article>
  );
}
