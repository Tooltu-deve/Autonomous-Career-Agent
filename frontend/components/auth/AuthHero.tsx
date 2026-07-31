import s from './auth.module.css';

export function AuthHero() {
  return (
    <aside className={s.left}>
      <div className={s.brand}>
        <div className={s['brand-mark']}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={s['brand-name']}>CareerNav</div>
      </div>

      <div className={s['left-body']}>
        <h2>
          Your career,<br />
          <em>on autopilot.</em>
        </h2>
        <p>
          AI finds the jobs, tailors your CV for each one, and scores your ATS match — all
          while you focus on what matters.
        </p>
      </div>

      <div className={s['visual-card']}>
        <div className={s['vc-label']}>ATS MATCH SCORE</div>
        <div className={s['vc-score']}>84%</div>
        <div className={s['vc-sub']}>↑ 6% from last week</div>
        <div className={s['vc-bar-wrap']}>
          <div className={s['vc-bar-row']}>
            <div className={s['vc-bar-label']}>Keywords</div>
            <div className={s['vc-bar-track']}>
              <div className={s['vc-bar-fill']} style={{ width: '88%', background: 'var(--accent-green)' }}></div>
            </div>
          </div>
          <div className={s['vc-bar-row']}>
            <div className={s['vc-bar-label']}>Skills</div>
            <div className={s['vc-bar-track']}>
              <div className={s['vc-bar-fill']} style={{ width: '74%', background: 'var(--accent-blue)' }}></div>
            </div>
          </div>
          <div className={s['vc-bar-row']}>
            <div className={s['vc-bar-label']}>Experience</div>
            <div className={s['vc-bar-track']}>
              <div className={s['vc-bar-fill']} style={{ width: '80%', background: 'var(--primary)' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.stats}>
        <div className={s['stat-chip']}>
          <div className={`${s['stat-dot']} ${s['sd-red']}`}></div>
          <div className={s['stat-text']}><b>120%</b> more interview invites on average</div>
        </div>
        <div className={s['stat-chip']}>
          <div className={`${s['stat-dot']} ${s['sd-blue']}`}></div>
          <div className={s['stat-text']}>CVs tailored to <b>each JD</b> in under 30s</div>
        </div>
        <div className={s['stat-chip']}>
          <div className={`${s['stat-dot']} ${s['sd-green']}`}></div>
          <div className={s['stat-text']}>Supports <b>LinkedIn, TopCV, ITViec</b> &amp; more</div>
        </div>
      </div>
    </aside>
  );
}
