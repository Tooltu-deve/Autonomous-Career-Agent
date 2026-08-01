"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { GeneratedCV, GeneratedCVContent } from "@/lib/mock/cv";
import styles from "./cv-manager.module.css";

type Props = {
  cv: GeneratedCV;
  onSave: (content: GeneratedCVContent, exportAfterSave: boolean, title: string) => void;
  onClose: () => void;
  error: string | null;
  notice: string | null;
};
const clone = (content: GeneratedCVContent) => ({
  ...content,
  skills: [...content.skills],
  experience: content.experience.map((item) => ({
    ...item,
    bullets: [...item.bullets],
  })),
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

export function CvEditor({ cv, onSave, onClose, error, notice }: Props) {
  const [draft, setDraft] = useState(() => clone(cv.cv_json.content));
  const [title, setTitle] = useState(cv.title);
  useEffect(() => setDraft(clone(cv.cv_json.content)), [cv]);
  useEffect(() => setTitle(cv.title), [cv]);
  const set = <K extends keyof GeneratedCVContent>(
    key: K,
    value: GeneratedCVContent[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const experience = draft.experience[0];
  return (
    <>
      <header className={styles["cm-modal-header"]}>
        <div>
          <h2>Edit — {cv.title}</h2>
          <p>Source job: {cv.source_job}</p>
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
            onSave(draft, false, title);
          }}
        >
          <label>CV title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Backend Engineer — MoMo" /></label>
          <label>
            Name
            <input
              value={draft.name}
              onChange={(event) => set("name", event.target.value)}
            />
          </label>
          <label>
            Headline
            <input
              value={draft.headline}
              onChange={(event) => set("headline", event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              value={draft.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </label>
          <label>
            Location
            <input
              value={draft.location}
              onChange={(event) => set("location", event.target.value)}
            />
          </label>
          <label>
            Summary{" "}
            <TextEditor
              label="Summary"
              value={draft.summary}
              onChange={(summary) => set("summary", summary)}
            />
          </label>
          <fieldset>
            <legend>Experience</legend>
            <label>
              Company
              <input
                value={experience.company}
                onChange={(event) =>
                  set("experience", [
                    { ...experience, company: event.target.value },
                  ])
                }
              />
            </label>
            <label>
              Role
              <input
                value={experience.role}
                onChange={(event) =>
                  set("experience", [
                    { ...experience, role: event.target.value },
                  ])
                }
              />
            </label>
            <label>
              Dates
              <input
                value={experience.dates}
                onChange={(event) =>
                  set("experience", [
                    { ...experience, dates: event.target.value },
                  ])
                }
              />
            </label>
            <label>
              Bullet{" "}
              <TextEditor
                label="Experience bullet"
                value={experience.bullets[0]}
                onChange={(bullet) =>
                  set("experience", [
                    {
                      ...experience,
                      bullets: [bullet, ...experience.bullets.slice(1)],
                    },
                  ])
                }
              />
            </label>
          </fieldset>
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
        <article
          className={`${styles["cm-resume"]} ${styles["cm-live-preview"]}`}
        >
          <h1>{draft.name}</h1>
          <h2>{draft.headline}</h2>
          <p className={styles["cm-contact"]}>
            {draft.email} · {draft.location}
          </p>
          <section className={styles["cm-resume-section"]}>
            <h3>Summary</h3>
            <p>{draft.summary}</p>
          </section>
          <section className={styles["cm-resume-section"]}>
            <h3>Experience</h3>
            <b>
              {experience.role} — {experience.company}
            </b>
            <small>{experience.dates}</small>
            {experience.bullets.map((bullet, index) => (
              <p key={index}>• {bullet}</p>
            ))}
          </section>
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
            "Generic HTML preview — PDF export will be added with pdf-service."}
        </span>
        <div>
          <button
            className={styles["cm-secondary"]}
            onClick={() => onSave(draft, false, title)}
          >
            Save
          </button>
          <button
            className={styles["cm-primary"]}
            onClick={() => onSave(draft, true, title)}
          >
            Save &amp; Export
          </button>
        </div>
      </footer>
    </>
  );
}
