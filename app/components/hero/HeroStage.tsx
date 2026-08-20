"use client";

import type { CSSProperties } from "react";
import { HeroPointCloud } from "@/app/components/hero/HeroPointCloud";
import { site } from "@/app/data/site";

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
  return (
    <section className="chapter" data-chapter="hero" id="hero">
      <div className="chapter-stage hero-stage">
        <div className="hero-bubble-target">
          <HeroPointCloud />
        </div>
        <p className="hero-kicker">{site.location}</p>
        <h1 className="hero-title">
          <span className="hero-line">{splitChars(site.firstName, 0)}</span>
          <span className="hero-line">
            {splitChars(site.lastName, site.firstName.length)}
          </span>
        </h1>
        <div className="hero-meta">
          <span className="hero-chip">{site.role}</span>
        </div>
        <div className="hero-cue">
          <span>Scroll</span>
          <span className="hero-cue-line" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </section>
  );
}
