import { Brand } from "./Brand";
import styles from "./landing.module.css";

export function Footer() {
	return (
		<footer>
			<div className={`${styles.wrap} ${styles["footer-row"]}`}>
				<Brand />
				<span>© 2026 CareerNav</span>
				<span>
					Built for job seekers who&apos;d rather be building their career than
					tracking it
				</span>
			</div>
		</footer>
	);
}
