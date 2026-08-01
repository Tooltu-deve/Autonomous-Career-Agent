import Link from "next/link";
import { Brand } from "./Brand";
import styles from "./landing.module.css";

export function Header() {
  return (
    <header className={styles.topnav}>
      <div className={`${styles.wrap} ${styles["topnav-inner"]}`}>
        <Brand />
        <nav className={styles["nav-links"]} aria-label="Main navigation">
          <a href="#features">Explore Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className={styles["nav-actions"]}>
          <Link className={styles["btn-ghost"]} href="/signin">
            Sign In
          </Link>
          <Link className={styles["btn-primary"]} href="/signin?tab=register">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
