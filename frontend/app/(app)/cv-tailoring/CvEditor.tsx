"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cloneCvContent, type CvView } from "@/lib/cv";
import type { CvContent, PdfHeader, TemplateName } from "@/types/api";
import styles from "./cv-manager.module.css";
import { CvPreview } from "./CvPreview";

type ExperienceEntry = CvContent["experience"][number];
type EducationEntry = CvContent["education"][number];
type CertificationEntry = CvContent["certifications"][number];
type SkillGroupEntry = CvContent["skill_groups"][number];

type Props = {
  cv: CvView;
  header: PdfHeader;
  template: TemplateName;
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
  description: [],
});

const emptyEducation = (): EducationEntry => ({
  school: "",
  degree: "",
  field_of_study: "",
  start_date: null,
  end_date: null,
  description: [],
});

const emptyCertification = (): CertificationEntry => ({
  title: "",
  obtain_date: "",
});

const emptySkillGroup = (): SkillGroupEntry => ({ category: "", skills: [] });

const parseSkills = (text: string): string[] =>
  text
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

/* ── Bullets ↔ editable text ──
 * The CV stores each responsibility as its own bullet; in the editor each
 * paragraph is one bullet. Blank lines are dropped so a stray Enter does not
 * become an empty bullet in the PDF. */
const textToBullets = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

/** Tiptap separates paragraphs with a blank line, so bullets must round-trip
 *  through the same shape the editor produces — otherwise every keystroke
 *  looks like a change and setContent() resets the editor mid-typing. */
const bulletsToText = (lines: string[] | string | null | undefined): string =>
  Array.isArray(lines) ? lines.join("\n\n") : (lines ?? "");

/** Comma-separated skills for one group. The raw text is held locally so a
 *  trailing "," or " " survives the keystroke — deriving the value from the
 *  parsed array (the previous behaviour) erased it on every change. Resync only
 *  when the parent array stops matching what this text parses to, i.e. a
 *  different CV was loaded — same guard as TextEditor above. */
function SkillsInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  const [text, setText] = useState(() => value.join(", "));
  useEffect(() => {
    if (parseSkills(text).join("\0") !== value.join("\0"))
      setText(value.join(", "));
    // `text` is intentionally omitted: including it would reset the input
    // mid-typing, which is exactly the bug this component fixes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label>
      {label}
      <input
        value={text}
        placeholder="AWS, Docker, Kubernetes"
        onChange={(event) => {
          setText(event.target.value);
          onChange(parseSkills(event.target.value));
        }}
      />
    </label>
  );
}

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
    if (!editor) return;
    // Compare on the normalised bullets, not the raw text: the editor may use
    // a different amount of whitespace for the same content, and resetting on
    // every keystroke would move the caret and drop the paragraph being typed.
    const same =
      textToBullets(editor.getText()).join("\0") ===
      textToBullets(value).join("\0");
    if (!same) editor.commands.setContent(value);
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

function updateCertification(
  certifications: CertificationEntry[],
  index: number,
  patch: Partial<CertificationEntry>,
): CertificationEntry[] {
  return certifications.map((certification, i) =>
    i === index ? { ...certification, ...patch } : certification,
  );
}

function updateSkillGroup(
  groups: SkillGroupEntry[],
  index: number,
  patch: Partial<SkillGroupEntry>,
): SkillGroupEntry[] {
  return groups.map((group, i) =>
    i === index ? { ...group, ...patch } : group,
  );
}

export function CvEditor({
  cv,
  header,
  template,
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

  const addCertification = () =>
    setDraft((current) => ({
      ...current,
      certifications: [...current.certifications, emptyCertification()],
    }));

  const removeCertification = (index: number) =>
    setDraft((current) => ({
      ...current,
      certifications: current.certifications.filter((_, i) => i !== index),
    }));

  const addSkillGroup = () =>
    setDraft((current) => ({
      ...current,
      skill_groups: [...current.skill_groups, emptySkillGroup()],
    }));

  const removeSkillGroup = (index: number) =>
    setDraft((current) => ({
      ...current,
      skill_groups: current.skill_groups.filter((_, i) => i !== index),
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
                  value={bulletsToText(exp.description)}
                  onChange={(text) =>
                    set(
                      "experience",
                      updateExp(draft.experience, index, {
                        description: textToBullets(text),
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
              <label>
                Field of Study
                <input
                  value={edu.field_of_study ?? ""}
                  placeholder="e.g., Computer Science"
                  onChange={(event) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        field_of_study: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Start date (YYYY-MM-DD)
                <input
                  value={edu.start_date ?? ""}
                  placeholder="2020-09-01"
                  onChange={(event) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        start_date: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                End date (YYYY-MM-DD, blank = present)
                <input
                  value={edu.end_date ?? ""}
                  placeholder="2024-06-01"
                  onChange={(event) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        end_date: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Note (optional){" "}
                <TextEditor
                  label={`Education #${index + 1} note`}
                  value={bulletsToText(edu.description)}
                  onChange={(text) =>
                    set(
                      "education",
                      updateEdu(draft.education, index, {
                        description: textToBullets(text),
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

          {/* Certifications */}
          {draft.certifications.map((certification, index) => (
            <fieldset key={index} className={styles["cm-experience-fieldset"]}>
              <legend>
                Certification{" "}
                {draft.certifications.length > 1 ? `#${index + 1}` : ""}
                {draft.certifications.length > 1 && (
                  <button
                    type="button"
                    className={styles["cm-danger-sm"]}
                    onClick={() => removeCertification(index)}
                    aria-label={`Remove certification #${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </legend>
              <label>
                Certification name
                <input
                  value={certification.title}
                  placeholder="e.g., AWS Certified Developer"
                  onChange={(event) =>
                    set(
                      "certifications",
                      updateCertification(draft.certifications, index, {
                        title: event.target.value,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Obtained date (YYYY-MM-DD)
                <input
                  value={certification.obtain_date ?? ""}
                  placeholder="2025-01-01"
                  onChange={(event) =>
                    set(
                      "certifications",
                      updateCertification(draft.certifications, index, {
                        obtain_date: event.target.value,
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
            onClick={addCertification}
          >
            + Add Certification
          </button>

          {/* Skills — grouped by category, rendered as two aligned columns */}
          {draft.skill_groups.map((group, index) => (
            <fieldset key={index} className={styles["cm-experience-fieldset"]}>
              <legend>
                Skill Group{" "}
                {draft.skill_groups.length > 1 ? `#${index + 1}` : ""}
                {/* Unlike experience, shown even for a single group: a CV with
                    no skill groups is valid, the section simply disappears. */}
                <button
                  type="button"
                  className={styles["cm-danger-sm"]}
                  onClick={() => removeSkillGroup(index)}
                  aria-label={`Remove skill group #${index + 1}`}
                >
                  Remove
                </button>
              </legend>
              <label>
                Category
                <input
                  value={group.category}
                  placeholder="e.g., Cloud Platforms"
                  onChange={(event) =>
                    set(
                      "skill_groups",
                      updateSkillGroup(draft.skill_groups, index, {
                        category: event.target.value,
                      }),
                    )
                  }
                />
              </label>
              <SkillsInput
                label="Skills (comma-separated)"
                value={group.skills}
                onChange={(skills) =>
                  set(
                    "skill_groups",
                    updateSkillGroup(draft.skill_groups, index, { skills }),
                  )
                }
              />
            </fieldset>
          ))}

          <button
            type="button"
            className={styles["cm-secondary"]}
            onClick={addSkillGroup}
          >
            + Add Skill Group
          </button>
        </form>

        <CvPreview content={draft} header={header} template={template} />
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
