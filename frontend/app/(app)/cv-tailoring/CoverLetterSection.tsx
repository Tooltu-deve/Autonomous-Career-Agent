"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./cv-manager.module.css";

type CopyState = "idle" | "copied" | "failed";

const COPY_LABEL: Record<CopyState, string> = {
  idle: "⧉ Copy",
  copied: "Copied!",
  failed: "Copy failed",
};

/** Cover letter do ats-agent sinh — chỉ đọc, không sửa được ở màn này. */
export function CoverLetterSection({ text }: { text: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Chặn setState sau khi unmount nếu clipboard promise chưa kịp settle.
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const flash = (state: CopyState) => {
    if (!alive.current) return;
    setCopyState(state);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      // clipboard cần secure context — báo thật thay vì im lặng.
      flash("failed");
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <section>
      <div className={styles["cm-section-head"]}>
        <h3 className={styles["cm-section-title"]}>Cover Letter</h3>
        {hasText && (
          <button
            className={styles["cm-copy-btn"]}
            onClick={() => void copy()}
            type="button"
            aria-live="polite"
          >
            {COPY_LABEL[copyState]}
          </button>
        )}
      </div>
      {hasText ? (
        <div className={styles["cm-cover-letter"]}>{text}</div>
      ) : (
        <p className={styles["cm-cover-letter-empty"]}>
          No cover letter — the ATS agent did not produce one.
        </p>
      )}
    </section>
  );
}
