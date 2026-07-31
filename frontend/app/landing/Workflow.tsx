import type { CSSProperties } from "react";

const steps = [
  {
    className: "profile",
    title: "Build a profile that showcases who you really are",
    body: "Skip the resume fluff. Share your strengths, interests, and what you’re looking for — we’ll highlight what sets you apart in a sea of sameness.",
  },
  {
    className: "jobs",
    title: "Get matched with roles where you can shine",
    body: "No more endless scrolling. Your agent matches you to roles based on your background, skills, and goals — far better odds than blind applications.",
  },
  {
    className: "chat",
    title: "Land interviews and offers",
    body: "We connect you with recruiters hiring right now, plus give your agent the prep tools to keep you confident when the interview invite lands.",
  },
];

export function Workflow() {
  return (
    <section className="steps" id="get-started">
      <div className="wrap">
        <div className="steps-head" data-aos="fade-up">
          <h2>
            From Profile to <em>Interview</em> in Just a Few Steps.
          </h2>
          <p>CareerNav helps you get noticed and get hired.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ className, title, body }, index) => (
            <article className="step-card" data-aos="fade-up" style={{ "--aos-delay": `${index * 120}ms` } as CSSProperties} key={title}>
              <div className={`step-visual ${className}`} aria-hidden="true">
                {index === 0 ? (
                  <div className="profile-sheet">
                    <span>●</span>
                    {[1, 2, 3].map((item) => (
                      <i key={item} />
                    ))}
                    <div>•••••</div>
                  </div>
                ) : (
                  <>
                    <div className="floating-card">
                      {index === 1 ? "▣ ━━━" : "━━━\n━━"}
                    </div>
                    <div className="floating-card second">
                      {index === 1 ? "▣ ━━━" : "━━━\n━━"}
                    </div>
                  </>
                )}
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
