import './landing/landing.css';
import { Features } from './landing/Features';
import { Footer } from './landing/Footer';
import { Header } from './landing/Header';
import { Hero } from './landing/Hero';
import { ScrollAnimations } from './landing/ScrollAnimations';
import styles from './landing/ScrollAnimations.module.css';
import { Showcase } from './landing/Showcase';
import { Workflow } from './landing/Workflow';

export default function Home() {
  return (
    <main className={styles.scrollRoot}>
      <ScrollAnimations />
      <Header />
      <Hero />
      <Showcase />
      <Features />
      <Workflow />
      <Footer />
    </main>
  );
}
