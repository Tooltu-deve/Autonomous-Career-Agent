"use client";

import { useEffect } from "react";

export function ScrollAnimations() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-aos]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("aos-animate", entry.isIntersecting);
        });
      },
      { threshold: 0.15 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
