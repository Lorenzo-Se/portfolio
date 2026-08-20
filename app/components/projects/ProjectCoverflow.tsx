"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/app/data/projects";
import { getDetail } from "@/app/data/details";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import { DetailPanel } from "@/app/components/ui/DetailPanel";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

export function ProjectCoverflow() {
  const boardRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const openDetail = openId ? getDetail(openId) : undefined;

  useEffect(() => {
    return onScrollFrame((state) => {
      const p = state.byId.projects ?? 0;
      const position = p * Math.max(projects.length - 1, 1);
      const nextActive = Math.round(position);
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ChapterStage id="projects" index="03" title="Projekte">
      <div
        ref={boardRef}
        className="coverflow"
        role="listbox"
        aria-label="Projekte"
        aria-activedescendant={`project-${projects[active]?.id}`}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" && projects[active]) {
            setOpenId(projects[active].id);
          }
        }}
      >
        {projects.map((project, index) => (
          <article
            key={project.id}
            id={`project-${project.id}`}
            data-card
            role="option"
            aria-selected={index === active}
            className="coverflow-card"
            onClick={() => setOpenId(project.id)}
          >
            {project.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.cover} alt="" className="coverflow-cover" />
            ) : null}
            <span className="coverflow-index">
              {String(index + 1).padStart(2, "0")}
              {project.placeholder ? " · Platzhalter" : ""}
            </span>
            <h3>{project.title}</h3>
            <p>{project.teaser}</p>
            <div className="coverflow-tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="coverflow-lead">{projects[active]?.year}</p>
      <DetailPanel detail={openDetail} onClose={() => setOpenId(null)} />
    </ChapterStage>
  );
}
