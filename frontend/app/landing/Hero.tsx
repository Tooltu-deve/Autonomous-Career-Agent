import Image from "next/image";
import Link from "next/link";
import { Brand } from "./Brand";
import styles from "./Hero.module.css";
import landingImage from "../images/landing.png";

const boards = [
  ["TopCV", "coral"],
  ["LinkedIn", "blue"],
  ["Indeed", "purple"],
  ["Glassdoor", "green"],
  ["VietnamWorks", "yellow"],
  ["ITviec", "success"],
  ["CareerBuilder", "coral-dark"],
  ["ZipRecruiter", "blue"],
] as const;

export function Hero() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">✨ AI career agent</span>
            <h1>
              Navigate your career <em>autonomously.</em>
            </h1>
            <p>
              Stop losing hours to manual job filtering and resume tweaking.
              Your agent tracks opportunities, tightens your ATS score, and gets
              you to the interview.
            </p>
            <div className="hero-ctas">
              <Link className="btn-primary-lg" href="/signin?tab=register">
                Get Started for Free
              </Link>
              <span className="hero-subcta">No credit card needed</span>
            </div>
          </div>
          <div className="radar-wrap" aria-hidden="true">
            <i className="radar-ring r3" />
            <i className="radar-ring r2" />
            <i className="radar-ring r1" />
            <i className="radar-pulse" />
            <span className="radar-node n1">
              <b />
              VNG — AI Developer
            </span>
            <span className="radar-node n2">
              <b />
              FPT — ML Intern
            </span>
            <span className="radar-node n3">
              <b />
              Axon — Backend
            </span>
            <span className="radar-node n4">
              <b />
              Grab — QA
            </span>
            <span className="radar-core">
              <Brand />
            </span>
          </div>
        </div>
      </section>
      <section
        className="marquee-section"
        aria-label="Job platforms the agent works with"
      >
        <div className="wrap">
          <p className="marquee-label">
            Plays nicely with the boards you&apos;re already on
          </p>
        </div>
        <div className="marquee">
          <div className="marquee-track">
            {[...boards, ...boards].map(([name, color], index) => (
              <span
                className="marquee-item"
                aria-hidden={index >= boards.length}
                key={`${name}-${index}`}
              >
                <i className={`dot ${color}`} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.previewSection} aria-label="CareerNav landing page preview">
        <div className={`${styles.previewWrap} wrap`} data-aos="zoom-in">
          <Image
            className={styles.previewImage}
            src={landingImage}
            alt="Resume templates created with CareerNav"
            sizes="100vw"
          />
        </div>
      </section>
    </>
  );
}
