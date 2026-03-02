"use client";

import { useEffect } from "react";

type ImmersiveEffectsProps = {
  children: React.ReactNode;
};

export function ImmersiveEffects({ children }: ImmersiveEffectsProps) {
  useEffect(() => {
    const root = document.documentElement;

    const updatePointer = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      root.style.setProperty("--mx", x.toFixed(4));
      root.style.setProperty("--my", y.toFixed(4));
    };

    const clamp = (value: number, min = 0, max = 1) =>
      Math.min(max, Math.max(min, value));

    const updateScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      root.style.setProperty("--scroll-progress", progress.toFixed(4));

      const viewportHeight = window.innerHeight;
      let strongestActive = 0;
      let strongestIndex = 0;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const enterProgress = clamp(1 - rect.top / viewportHeight);
        const leaveProgress = clamp(-rect.top / viewportHeight);
        const isEntering = rect.top >= 0;

        const scale = isEntering
          ? 1.14 - enterProgress * 0.14
          : 1 - leaveProgress * 0.08;
        const opacity = isEntering
          ? 0.22 + enterProgress * 0.78
          : 1 - leaveProgress * 0.35;
        const translate = isEntering
          ? (1 - enterProgress) * 68
          : -leaveProgress * 54;

        const centerDistance =
          Math.abs(rect.top + rect.height / 2 - viewportHeight / 2) /
          (viewportHeight / 2);
        const active = clamp(1 - centerDistance);

        if (active > strongestActive) {
          strongestActive = active;
          strongestIndex = index;
        }

        section.style.setProperty("--section-scale", scale.toFixed(4));
        section.style.setProperty("--section-opacity", opacity.toFixed(4));
        section.style.setProperty("--section-translate-y", `${translate.toFixed(1)}px`);
        section.style.setProperty("--section-active", active.toFixed(4));
      });

      root.style.setProperty("--active-index", String(strongestIndex));
    };

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]"),
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else if (entry.intersectionRatio < 0.2) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: [0.15, 0.35, 0.6],
        rootMargin: "-8% 0px -8% 0px",
      },
    );

    sections.forEach((section) => revealObserver.observe(section));
    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    updateScroll();
    return () => {
      revealObserver.disconnect();
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <>
      <div className="portfolio-ambient" aria-hidden="true" />
      <div className="immersive-hud" aria-hidden="true" />
      <div className="immersive-vignette" aria-hidden="true" />
      {children}
    </>
  );
}
