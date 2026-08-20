"use client";

import { useEffect, useRef } from "react";
import { AmbientScene } from "@/app/components/canvas/AmbientScene";
import { CareerFlow } from "@/app/components/career/CareerFlow";
import { ContactStage } from "@/app/components/contact/ContactStage";
import { HeroStage } from "@/app/components/hero/HeroStage";
import { ChapterHud } from "@/app/components/hud/ChapterHud";
import { ProjectCoverflow } from "@/app/components/projects/ProjectCoverflow";
import { SkillTree } from "@/app/components/skills/SkillTree";
import { useReducedMotion } from "@/app/lib/reducedMotion";
import { usePortfolioScroll } from "@/app/lib/usePortfolioScroll";

export function PortfolioExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  usePortfolioScroll(rootRef, { reducedMotion: reduced });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty(
        "--mx",
        String(event.clientX / window.innerWidth),
      );
      document.documentElement.style.setProperty(
        "--my",
        String(event.clientY / window.innerHeight),
      );
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={rootRef}
      className={`experience${reduced ? " is-reduced" : ""}`}
    >
      <AmbientScene reduced={reduced} />
      <ChapterHud />
      <main className="experience-main">
        <HeroStage />
        <CareerFlow />
        <ProjectCoverflow />
        <SkillTree />
        <ContactStage reduced={reduced} />
      </main>
    </div>
  );
}
