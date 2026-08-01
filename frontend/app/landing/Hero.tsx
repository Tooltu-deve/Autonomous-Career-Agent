import Image from "next/image";
import Link from "next/link";
import { Brand } from "./Brand";
import styles from "./Hero.module.css";
import landingStyles from "./landing.module.css";
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
      <section className={landingStyles.hero}>
        <div className={`${landingStyles.wrap} ${landingStyles["hero-grid"]}`}>
          <div>
            <span className={landingStyles.eyebrow}>✨ AI career agent</span>
            <h1>
              Navigate your career <em>autonomously.</em>
            </h1>
            <p>
              Stop losing hours to manual job filtering and resume tweaking.
              Your agent tracks opportunities, tightens your ATS score, and gets
              you to the interview.
            </p>
            <div className={landingStyles["hero-ctas"]}>
              <Link className={landingStyles["btn-primary-lg"]} href="/signin?tab=register">
                Get Started for Free
              </Link>
              <span className={landingStyles["hero-subcta"]}>No credit card needed</span>
            </div>
          </div>
          <div className={landingStyles["radar-wrap"]} aria-hidden="true">
            <i className={`${landingStyles["radar-ring"]} ${landingStyles.r3}`} />
            <i className={`${landingStyles["radar-ring"]} ${landingStyles.r2}`} />
            <i className={`${landingStyles["radar-ring"]} ${landingStyles.r1}`} />
            <i className={landingStyles["radar-pulse"]} />
            <span className={`${landingStyles["radar-node"]} ${landingStyles.n1}`}>
              <b />
              VNG — AI Developer
            </span>
            <span className={`${landingStyles["radar-node"]} ${landingStyles.n2}`}>
              <b />
              FPT — ML Intern
            </span>
            <span className={`${landingStyles["radar-node"]} ${landingStyles.n3}`}>
              <b />
              Axon — Backend
            </span>
            <span className={`${landingStyles["radar-node"]} ${landingStyles.n4}`}>
              <b />
              Grab — QA
            </span>
            <span className={landingStyles["radar-core"]}>
              <Brand />
            </span>
          </div>
        </div>
      </section>
      <section
        className={landingStyles["marquee-section"]}
        aria-label="Job platforms the agent works with"
      >
        <div className={landingStyles.wrap}>
          <p className={landingStyles["marquee-label"]}>
            Plays nicely with the boards you&apos;re already on
          </p>
        </div>
        <div className={landingStyles.marquee}>
          <div className={landingStyles["marquee-track"]}>
            {[...boards, ...boards].map(([name, color], index) => (
              <span
                className={landingStyles["marquee-item"]}
                aria-hidden={index >= boards.length}
                key={`${name}-${index}`}
              >
                <i className={[landingStyles.dot, landingStyles[color]].filter(Boolean).join(" ")} />
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
