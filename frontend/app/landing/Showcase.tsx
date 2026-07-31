const jobs = [
  ["S", "stripe", "Senior Frontend Engineer", "Just now", "Saved"],
  ["A", "linear", "AI Developer", "2m ago", "Tailored"],
  ["P", "vercel", "Python Backend Engineer", "4m ago", "Applied"],
  ["M", "figma", "ML Engineer Intern", "12m ago", "Interview"],
] as const;

export function Showcase() {
  return (
    <section className="showcase section-bordered">
      <div className="wrap showcase-grid">
        <div className="showcase-head" data-aos="fade-right">
          <span className="kicker">Live from your agent</span>
          <h2>Your Job Search, Fully Automated</h2>
          <p>
            Watch applications go out, ATS scores climb, and recruiter replies
            land — all while your agent keeps working quietly in the background.
          </p>
          <a className="btn-primary-lg" href="/signin?tab=register">
            Get Started for Free
          </a>
        </div>
        <div className="dash-mock" data-aos="fade-left" aria-label="Example autopilot dashboard">
          <div className="dash-topbar">
            <span>Autopilot Dashboard</span>
            <span className="dash-status">
              <i />
              Running
            </span>
          </div>
          <div className="dash-stats">
            {[
              ["142", "Applied this week"],
              ["89%", "ATS match"],
              ["17", "Replies"],
            ].map(([value, label]) => (
              <div className="dash-stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="dash-list">
            {jobs.map(([letter, color, role, time, status]) => (
              <div className="dash-row" key={role}>
                <span className={`dash-icon ${color}`}>{letter}</span>
                <strong>{role}</strong>
                <span className="dash-time">{time}</span>
                <span className="dash-pill">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
