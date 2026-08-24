"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/app/data/projects";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import { projectIndexFromProgress } from "@/app/lib/projectLayout";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

export function ProjectCoverflow() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeProject = projects[active];

  useEffect(() => {
    return onScrollFrame((state) => {
      const p = state.byId.projects ?? 0;
      const position = p * Math.max(projects.length - 1, 1);
      const nextActive = projectIndexFromProgress(p, projects.length);
      setActive((current) => (current === nextActive ? current : nextActive));
      const cards = boardRef.current?.querySelectorAll<HTMLElement>("[data-card]");
      cards?.forEach((card, index) => {
        const delta = index - position;
        const x = delta * 265;
        const rot = Math.max(-62, Math.min(62, delta * -42));
        const z = -Math.abs(delta) * 170;
        const scale = 1 - Math.min(Math.abs(delta) * 0.16, 0.42);
        const opacity = 1 - Math.min(Math.abs(delta) * 0.32, 0.72);
        card.style.transform = `translate(-50%, -54%) translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(20 - Math.abs(Math.round(delta)));
        card.style.filter = `blur(${Math.min(Math.abs(delta) * 0.6, 2.4)}px)`;
      });
    });
  }, []);

  return (
    <ChapterStage id="projects" index="03" title="Projekte">
      <div
        ref={boardRef}
        className="coverflow"
        role="listbox"
        aria-label="Projekte"
        aria-activedescendant={`project-${activeProject?.id}`}
      >
        {projects.map((project, index) => (
          <article
            key={project.id}
            id={`project-${project.id}`}
            data-card
            role="option"
            aria-selected={index === active}
            className={`coverflow-card${index === active ? " is-active" : ""}${project.cover ? " has-media" : ""}`}
          >
            <div className="coverflow-card__glow" aria-hidden />
            <header className="coverflow-card__head">
              <span className="coverflow-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              {project.placeholder ? (
                <span className="coverflow-flag">Platzhalter</span>
              ) : null}
            </header>
            {project.cover ? (
              <div className="coverflow-card__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.cover} alt="" className="coverflow-cover" />
              </div>
            ) : null}
            <div className="coverflow-card__body">
              <h3>{project.title}</h3>
              <p>{project.teaser}</p>
            </div>
            <footer className="coverflow-card__foot">
              <span className="coverflow-stack-label">Stack</span>
              <div className="coverflow-tags">
                {project.techStack.map((tech) => (
                  <span key={tech}>{tech}</span>
                ))}
              </div>
            </footer>
          </article>
        ))}
      </div>
      <div className="coverflow-meta">
        <p className="coverflow-lead">{activeProject?.year}</p>
        {activeProject?.demoUrl || activeProject?.githubUrl ? (
          <div className="coverflow-links">
            {activeProject.demoUrl ? (
              <a
                className="coverflow-link"
                href={activeProject.demoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Demo
              </a>
            ) : null}
            {activeProject.githubUrl ? (
              <a
                className="coverflow-link"
                href={activeProject.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </ChapterStage>
  );
}
