import { Brand } from "./Brand";

export function Footer() {
	return (
		<footer>
			<div className="wrap footer-row">
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
