import Link from "next/link";
import { Brand } from "./Brand";

export function Header() {
  return (
    <header className="topnav">
      <div className="wrap topnav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features">Explore Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="nav-actions">
          <Link className="btn-ghost" href="/signin">
            Sign In
          </Link>
          <Link className="btn-primary" href="/signin?tab=register">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
