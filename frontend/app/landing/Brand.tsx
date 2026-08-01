import styles from "./landing.module.css";

export function Brand() {
  return (
    <div className={styles.brand} aria-label="CareerNav">
      <span className={styles["brand-mark"]} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className={styles["brand-name"]}>CareerNav</span>
    </div>
  );
}
