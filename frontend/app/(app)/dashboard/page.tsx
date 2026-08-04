import Link from 'next/link';
import s from './dashboard.module.css';
import {
  WarningIcon,
  BriefcaseIcon,
  FileIcon,
  CheckCircleIcon,
  TargetIcon,
  FileTextIcon,
} from '@/components/icons';

export default function DashboardPage() {
  return (
    <main className={s.main}>
      {/* ── Page Header ── */}
      <div className={s.pageHead}>
        <div>
          <h1>Hello Minh 👋</h1>
          <p>Agent found 6 new jobs and created 2 CVs since your last visit.</p>
        </div>
        <div className={s.headRight}>
          <span className={s.agentPill}>
            <i /> Agent running · scraped 2h ago
          </span>
          <button className={`${s.btn} ${s.btnPrimary}`}>Find jobs</button>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <section className={s.stats}>
        {/* Stat 1 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: 'var(--primary-soft)',
              color: 'var(--primary-hover)',
            }}
          >
            <BriefcaseIcon />
          </div>
          <div className={s.num}>24</div>
          <div className={s.lbl}>Jobs scraped</div>
          <div className={`${s.sub} ${s.up}`}>↑ 6 new this week</div>
        </div>
        {/* Stat 2 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
              color: 'var(--success)',
            }}
          >
            <FileIcon />
          </div>
          <div className={s.num}>8</div>
          <div className={s.lbl}>CVs created</div>
          <div className={`${s.sub} ${s.up}`}>↑ 2 new</div>
        </div>
        {/* Stat 3 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',
              color: 'var(--accent-blue)',
            }}
          >
            <CheckCircleIcon />
          </div>
          <div className={s.num}>3</div>
          <div className={s.lbl}>Applying</div>
          <div className={s.sub} style={{ color: 'var(--ink-subtle)' }}>
            1 interview
          </div>
        </div>
        {/* Stat 4 */}
        <div className={`${s.card} ${s.stat}`}>
          <div
            className={s.ico}
            style={{
              background: 'color-mix(in srgb, var(--accent-purple) 16%, transparent)',
              color: 'var(--accent-purple)',
            }}
          >
            <TargetIcon />
          </div>
          <div className={s.num}>76%</div>
          <div className={s.lbl}>Average ATS</div>
          <div className={`${s.sub} ${s.up}`}>↑ 4% from last week</div>
        </div>
      </section>

      {/* ── PIPELINE + NEEDS REVIEW ── */}
      <section className={`${s.grid2} ${s.gPipe}`}>
        {/* Pipeline */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Agent Pipeline</h2>
            <Link href="/applications">Details →</Link>
          </div>
          <div className={s.pipeBody}>
            <div className={s.pipeRow}>
              <span className={s.name}>In queue</span>
              <div className={s.track}>
                <div className={s.fill} style={{ width: '18%', background: 'var(--ink-subtle)' }} />
              </div>
              <span className={s.cnt}>4</span>
            </div>
            <div className={s.pipeRow}>
              <span className={s.name}>Generating CV</span>
              <div className={s.track}>
                <div className={s.fill} style={{ width: '9%', background: 'var(--accent-blue)' }} />
              </div>
              <span className={s.cnt}>2</span>
            </div>
            <div className={s.pipeRow}>
              <span className={s.name}>Scoring ATS</span>
              <div className={s.track}>
                <div className={s.fill} style={{ width: '27%', background: 'var(--accent-purple)' }} />
              </div>
              <span className={s.cnt}>6</span>
            </div>
            <div className={s.pipeRow}>
              <span className={s.name}>Completed</span>
              <div className={s.track}>
                <div className={s.fill} style={{ width: '45%', background: 'var(--success)' }} />
              </div>
              <span className={s.cnt}>10</span>
            </div>
            <div className={s.pipeRow}>
              <span className={s.name} style={{ color: 'var(--warning)' }}>Needs review</span>
              <div className={s.track}>
                <div className={s.fill} style={{ width: '9%', background: 'var(--warning)' }} />
              </div>
              <span className={s.cnt} style={{ color: 'var(--warning)' }}>2</span>
            </div>
          </div>
        </div>

        {/* Needs Review */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Needs your review</h2>
          </div>
          <div className={s.nrBody}>
            <div className={s.nrItem}>
              <span className={s.wi}><WarningIcon /></span>
              <div className={s.t}>
                <b>Data Analyst — Tiki</b>
                <small>ATS 58% · out of retries</small>
              </div>
              <Link className={s.go} href="/cv-tailoring">Review &amp; edit</Link>
            </div>
            <div className={s.nrItem}>
              <span className={s.wi}><WarningIcon /></span>
              <div className={s.t}>
                <b>Backend Engineer — Sendo</b>
                <small>ATS 61% · missing 4 keywords</small>
              </div>
              <Link className={s.go} href="/cv-tailoring">Review &amp; edit</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── RECENT JOBS + RECENT CVS ── */}
      <section className={`${s.grid2} ${s.gLists}`}>
        {/* Recent Jobs */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Top job matches</h2>
            <Link href="/jobs">View all →</Link>
          </div>
          <div className={s.list}>
            <div className={s.li}>
              <div className={s.doc}><BriefcaseIcon /></div>
              <div className={s.meta}>
                <b>Senior AI Engineer — VNG</b>
                <small>Hanoi · Hybrid</small>
              </div>
              <span className={`${s.score} ${s.sGood}`}>92%</span>
              <button className={s.btnMini}>+ CV</button>
            </div>
            <div className={s.li}>
              <div className={s.doc}><BriefcaseIcon /></div>
              <div className={s.meta}>
                <b>ML Engineer — MoMo</b>
                <small>HCMC · Onsite</small>
              </div>
              <span className={`${s.score} ${s.sGood}`}>87%</span>
              <button className={s.btnMini}>+ CV</button>
            </div>
            <div className={s.li}>
              <div className={s.doc}><BriefcaseIcon /></div>
              <div className={s.meta}>
                <b>Backend Engineer — Grab</b>
                <small>Remote · Full-time</small>
              </div>
              <span className={`${s.score} ${s.sGood}`}>81%</span>
              <button className={s.btnMini}>+ CV</button>
            </div>
          </div>
        </div>

        {/* Recent CVs */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2>Recent CVs</h2>
            <Link href="/cv-tailoring">CV Manager →</Link>
          </div>
          <div className={s.list}>
            <div className={s.li}>
              <div className={s.doc}><FileTextIcon /></div>
              <div className={s.meta}>
                <b>Backend Engineer — MoMo</b>
                <small>Updated 2 days ago · edited</small>
              </div>
              <span className={`${s.score} ${s.sGood}`}>85%</span>
            </div>
            <div className={s.li}>
              <div className={s.doc}><FileTextIcon /></div>
              <div className={s.meta}>
                <b>AI Developer — VNG</b>
                <small>Updated 3 days ago · draft</small>
              </div>
              <span className={`${s.score} ${s.sMid}`}>78%</span>
            </div>
            <div className={s.li}>
              <div className={s.doc}><FileTextIcon /></div>
              <div className={s.meta}>
                <b>Data Analyst — Tiki</b>
                <small>Updated 5 days ago · needs review</small>
              </div>
              <span className={`${s.score} ${s.sBad}`}>58%</span>
            </div>
          </div>
        </div>
      </section>

      <p className={s.note}>
        Mockup — simulated data. Layout &amp; data sources follow schema: jobs · applications · cv_generations · ats_reports.
      </p>
    </main>
  );
}
