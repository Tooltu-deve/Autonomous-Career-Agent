import type { CSSProperties } from "react";
import styles from "./landing.module.css";

const lines = (widths: string[]) => (
  <>
    {widths.map((width) => (
      <i className={styles["mock-line"]} style={{ width }} key={width} />
    ))}
  </>
);

function AtsVisual() {
  return (
    <div className={`${styles["tool-visual"]} ${styles["ats-visual"]}`}>
      <div className={styles["ats-checklist"]}>
        <p>
          <b>✓</b>Your project contains metrics.
        </p>
        <p>
          <b>✓</b>Phone number is valid.
        </p>
        <p>
          <b className={styles.bad}>×</b>Github link is missing.
        </p>
      </div>
      <div className={styles["ats-score-card"]}>
        <span className={styles["ats-gauge"]}>75</span>
        <span>
          <strong>Resume Score</strong>
          <small>View 12 issues found</small>
        </span>
        <i>→</i>
      </div>
    </div>
  );
}

function BrowserVisual({ networking = false }: { networking?: boolean }) {
  return (
    <div className={styles["tool-visual"]}>
      <div className={styles["browser-mock"]}>
        <div className={styles["browser-topbar"]}>
          <i />
          <i />
          <i />
          <span />
        </div>
        <div className={styles["browser-body"]}>
          <div>
            <b>● Nguyen Van Phu</b>
            <strong>Software Engineer</strong>
            {lines(["88%", "65%", "75%"])}
          </div>
          <div>
            <b>
              {networking ? "Outreach to Recruiters" : "My Cover Letter"}
            </b>
            {networking ? (
              <>
                <p className={styles["avatar-line"]}>● {lines(["60%"])}</p>
                {lines(["85%", "70%"])}
              </>
            ) : (
              <>{lines(["92%", "80%", "58%"])}</>
            )}
            <em>{networking ? "Generate with AI" : "Generate"}</em>
          </div>
        </div>
      </div>
    </div>
  );
}

function JournalVisual() {
  return (
    <div className={styles["tool-visual"]}>
      <div className={styles["journal-mock"]}>
        <b>💪 &nbsp; Building Momentum</b>
        <div className={styles["journal-tools"]}>B <i>I</i> ≔ 🔗</div>
        {lines(["45%"])}
        <p>
          <strong>💡 AI Assistant</strong>
          <br />
          Your own space to document your experiences, projects, and wins for
          this role
        </p>
      </div>
    </div>
  );
}

function ListVisual() {
  return (
    <div className={styles["tool-visual"]}>
      <div className={styles["joblist-mock"]}>
        <div>
          <b>New Grad Product Management Jobs</b>
          <p>
            <i>N</i>
            {lines(["75%"])}
          </p>
          <p>
            <i>C</i>
            {lines(["60%"])}
          </p>
        </div>
        <div>
          <p>
            <i>i</i>
            {lines(["70%"])}
          </p>
        </div>
      </div>
    </div>
  );
}

const featureCards = [
  {
    title: "Resume ATS Score",
    description: "See what’s wrong with your resume and how to fix it",
    visual: <AtsVisual />,
  },
  {
    title: "Create personal resumes & Cover Letter",
    description:
      "Craft personalized cover letters and tailored resumes based on who you are and each employer’s standards.",
    visual: <BrowserVisual />,
  },
  {
    title: "AI critiques",
    description: "Reviews resumes and makes sharp corrections.",
    visual: <JournalVisual />,
  },
  {
    title: "Export CV to PDF",
    description: "Download tailored resumes in PDF format.",
    visual: <BrowserVisual networking />,
  },
  {
    title: "Job Lists",
    description:
      "Track all your jobs, search, and filter careers according to your preferences.",
    visual: <ListVisual />,
  },
];

export function Features() {
  return (
    <section className={`${styles.tools} ${styles["section-bordered"]}`} id="features">
      <div className={styles.wrap}>
        <div className={styles["tools-head"]} data-aos="zoom-in">
          <h2>
            More tools to help you
            <br />
            <span>stand out from the crowd.</span>
          </h2>
          <p>
            Explore all the features we offer to supercharge your job or
            internship search.
          </p>
        </div>
        <div className={styles["tools-grid"]}>
          {featureCards.map(({ title, description, visual }, index) => {
            const animation = ["fade-right", "fade-left", "fade-right", "fade-up", "fade-left"][index];
            const delay = [0, 150, 100, 250, 400][index];

            return (
            <article className={styles["tool-card"]} data-aos={animation} style={{ "--aos-delay": `${delay}ms` } as CSSProperties} key={title}>
              {visual}
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
