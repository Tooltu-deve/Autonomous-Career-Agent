"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cloneCvContent, type CvView } from "@/lib/cv";
import type { CvContent, PdfHeader } from "@/types/api";
import styles from "./cv-manager.module.css";

type ExperienceEntry = CvContent["experience"][number];
type EducationEntry = CvContent["education"][number];

type Props = {
  cv: CvView;
  header: PdfHeader;
  onSave: (content: CvContent, exportAfterSave: boolean) => void;
  onClose: () => void;
  error: string | null;
  notice: string | null;
};

const emptyExperience = (): ExperienceEntry => ({
  title: "",
  organization: "",
  start_date: null,
  end_date: null,
  description: "",
});

const emptyEducation = (): EducationEntry => ({
  school: "",
  degree: "",
});

function TextEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: { class: styles["cm-tiptap"], "aria-label": label },
    },
    onUpdate: ({ editor }) => onChange(editor.getText()),
  });
  useEffect(() => {
    if (editor && editor.getText() !== value) editor.commands.setContent(value);
  }, [editor, value]);
  return <EditorContent editor={editor} />;
}

/** Update a single experience entry at the given index, return new array */
function updateExp(
  experience: ExperienceEntry[],
  index: number,
  patch: Partial<ExperienceEntry>,
): ExperienceEntry[] {
  return experience.map((e, i) => (i === index ? { ...e, ...patch } : e));
}

function updateEdu(
  education: EducationEntry[],
  index: number,
  patch: Partial<EducationEntry>,
): EducationEntry[] {
  return education.map((e, i) => (i === index ? { ...e, ...patch } : e));
}

function dateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return "";
  return `${start ?? ""} — ${end ?? "Present"}`;
}

export function CvEditor({
  cv,
  header,
  onSave,
  onClose,
  error,
  notice,
}: Props) {
  const [draft, setDraft] = useState(() => cloneCvContent(cv.content));

  useEffect(() => setDraft(cloneCvContent(cv.content)), [cv]);

  const set = <K extends keyof CvContent>(key: K, value: CvContent[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const addExperience = () =>
    setDraft((current) => ({
      ...current,
      experience: [...current.experience, emptyExperience()],
    }));

  const removeExperience = (index: number) =>
    setDraft((current) => ({
      ...current,
      experience: current.experience.filter((_, i) => i !== index),
    }));

  const addEducation = () =>
    setDraft((current) => ({
      ...current,
      education: [...current.education, emptyEducation()],
    }));

  const removeEducation = (index: number) =>
    setDraft((current) => ({
      ...current,
      education: current.education.filter((_, i) => i !== index),
    }));

  return (
    <>
      <header className={styles["cm-modal-header"]}>
        <div>
          <h2>Edit — {cv.title}</h2>
          <p>Source job: {cv.sourceJob}</p>
        </div>
        <button onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className={styles["cm-editor-layout"]}>
        <form
          className={styles["cm-editor"]}
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft, false);
          }}
        >
          {/* Summary */}
          <label>
            Summary{" "}
            <TextEditor
              label="Summary"
              value={draft.summary}
              onChange={(summary) => set("summary", summary)}
            />
          </label>

          {/* Experience — supports multiple entries */}
          {draft.experience.map((exp, index) => (
            <fieldset key={index} className={styles["cm-experience-fieldset"]}>
              <legend>
                Experience {draft.experience.length > 1 ? `#${index + 1}` : ""}
                {draft.experience.length > 1 && (
                  <button
                    type="button"
                    className={styles["cm-danger-sm"]}
                    onClick={() => removeExperience(index)}
                    aria-label={`Remove experience #${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </legend>
              <label>
                Title / Role
                <input
                  value={exp.title}
                  onChange={(event) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, {
                        title: event.target.value,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Organization
                <input
                  value={exp.organization}
                  onChange={(event) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, {
                        organization: event.target.value,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Start date (YYYY-MM-DD)
                <input
                  value={exp.start_date ?? ""}
                  placeholder="2024-01-01"
                  onChange={(event) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, {
                        start_date: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                End date (YYYY-MM-DD, blank = present)
                <input
                  value={exp.end_date ?? ""}
                  placeholder="2025-01-01"
                  onChange={(event) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, {
                        end_date: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Description{" "}
                <TextEditor
                  label={`Experience #${index + 1} description`}
                  value={exp.description ?? ""}
                  onChange={(description) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, { description }),
                    )
                  }
                />
              </label>
            </fieldset>
          ))}

          <button
            type="button"
            className={styles["cm-secondary"]}
            onClick={addExperience}
          >
            + Add Experience
          </button>

          {/* Education */}
          {draft.education.map((edu, index) => (
            <fieldset key={index} className={styles["cm-experience-fieldset"]}>
              <legend>
                Education {draft.education.length > 1 ? `#${index + 1}` : ""}
                {draft.education.length > 1 && (
                  <button
                    type="button"
                    className={styles["cm-danger-sm"]}
                    onClick={() => removeEducation(index)}
                    aria-label={`Remove education #${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </legend>
              <label>
                School
                <input
                  value={edu.school}
                  onChange={(event) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        school: event.target.value,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Degree
                <input
                  value={edu.degree ?? ""}
                  onChange={(event) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        degree: event.target.value,
                      }),
                    )
                  }
                />
              </label>
            </fieldset>
          ))}

          <button
            type="button"
            className={styles["cm-secondary"]}
            onClick={addEducation}
          >
            + Add Education
          </button>

          {/* Skills */}
          <label>
            Skills (comma-separated)
            <input
              value={draft.skills.join(", ")}
              onChange={(event) =>
                set(
                  "skills",
                  event.target.value
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
        </form>

        {/* Live Preview */}
        <article
          className={`${styles["cm-resume"]} ${styles["cm-live-preview"]}`}
        >
          <h1>{header.full_name ?? ""}</h1>
          <h2>{header.headline ?? ""}</h2>
          <p className={styles["cm-contact"]}>
            {[header.email, header.location].filter(Boolean).join(" · ")}
          </p>
          <section className={styles["cm-resume-section"]}>
            <h3>Summary</h3>
            <p>{draft.summary}</p>
          </section>
          {draft.experience.map((exp, index) => (
            <section key={index} className={styles["cm-resume-section"]}>
              <h3>{index === 0 ? "Experience" : ""}</h3>
              <b>
                {exp.title} — {exp.organization}
              </b>
              <small>{dateRange(exp.start_date, exp.end_date)}</small>
              {exp.description && <p>• {exp.description}</p>}
            </section>
          ))}
          {draft.education.map((edu, index) => (
            <section key={index} className={styles["cm-resume-section"]}>
              <h3>{index === 0 ? "Education" : ""}</h3>
              <b>
                {edu.school}
                {edu.degree ? ` — ${edu.degree}` : ""}
              </b>
              <small>{dateRange(edu.start_date, edu.end_date)}</small>
            </section>
          ))}
          <section className={styles["cm-resume-section"]}>
            <h3>Skills</h3>
            <div className={styles["cm-skills"]}>
              {draft.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>
        </article>
      </div>
      <footer className={styles["cm-modal-footer"]}>
        <span>
          {error ??
            notice ??
            "Header (name/contact) comes from your Master Profile."}
        </span>
        <div>
          <button
            className={styles["cm-secondary"]}
            onClick={() => onSave(draft, false)}
          >
            Save
          </button>
          <button
            className={styles["cm-primary"]}
            onClick={() => onSave(draft, true)}
          >
            Save &amp; Export PDF
          </button>
        </div>
      </footer>
    </>
  );
}
