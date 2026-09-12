"use client";

import { useEffect } from "react";

export default function LandingReveal() {
  useEffect(() => {
    document.documentElement.dataset.slMotion = "on";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.slMotion = "reduce";
      document.querySelectorAll("[data-sl-reveal]").forEach((el) => el.classList.add("sl-in"));
      return;
    }
    const nodes = document.querySelectorAll("[data-sl-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("sl-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return null;
}
