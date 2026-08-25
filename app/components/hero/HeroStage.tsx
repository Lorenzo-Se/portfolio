"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { HeroPointCloud } from "@/app/components/hero/HeroPointCloud";
import { site } from "@/app/data/site";
import { fitHeroTitleSize } from "@/app/lib/fitHeroTitle";

function splitChars(text: string, offset: number) {
  return text.split("").map((char, index) => {
    const dx = (index - text.length / 2) * 28;
    return (
      <span
        key={`${text}-${index}`}
        className="hero-char"
        style={{ "--dx": dx, "--i": offset + index } as CSSProperties}
      >
        {char}
      </span>
    );
  });
}

export function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    if (!stage || !title) {
      return;
    }

    const fit = () =>
      fitHeroTitleSize(stage, title, site.firstName, site.lastName);

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);

    document.fonts?.ready.then(fit).catch(() => undefined);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="chapter" data-chapter="hero" id="hero">
      <div ref={stageRef} className="chapter-stage hero-stage">
        <div className="hero-bubble-target">
          <HeroPointCloud />
        </div>
        <p className="hero-kicker">{site.location}</p>
        <h1 ref={titleRef} className="hero-title">
          <span className="hero-line">{splitChars(site.firstName, 0)}</span>
          <span className="hero-line">
            {splitChars(site.lastName, site.firstName.length)}
          </span>
        </h1>
        <div className="hero-meta">
          <span className="hero-chip">{site.role}</span>
        </div>
        <div className="hero-cue">
          <span className="hero-cue-scroll">Scrollen</span>
          <span className="hero-cue-touch">Wischen</span>
          <span className="hero-cue-line" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </section>
  );
}
