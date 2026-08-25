"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/app/data/projects";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import { gsap } from "@/app/lib/gsap";
import {
  projectIndexFromProgress,
  readProjectsChapterScroll,
  scrollToProjectIndex,
} from "@/app/lib/projectLayout";
import { useReducedMotion } from "@/app/lib/reducedMotion";
import { ProjectModal } from "@/app/components/projects/ProjectModal";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

const CARD_SPREAD = 265;

function applyCoverflowLayout(
  board: HTMLDivElement | null,
  position: number,
) {
  const cards = board?.querySelectorAll<HTMLElement>("[data-card]");
  cards?.forEach((card, index) => {
    const delta = index - position;
    const x = delta * CARD_SPREAD;
    const rot = Math.max(-62, Math.min(62, delta * -42));
    const z = -Math.abs(delta) * 170;
    const scale = 1 - Math.min(Math.abs(delta) * 0.16, 0.42);
    const opacity = 1 - Math.min(Math.abs(delta) * 0.32, 0.72);
    card.style.transform = `translate(-50%, -54%) translateX(${x}px) translateZ(${z}px) rotateY(${rot}deg) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.zIndex = String(20 - Math.abs(Math.round(delta)));
    card.style.filter = `blur(${Math.min(Math.abs(delta) * 0.6, 2.4)}px)`;
  });
}

function cardAtPoint(
  board: HTMLDivElement,
  clientX: number,
  clientY: number,
): { index: number; card: HTMLElement } | null {
  const cards = board.querySelectorAll<HTMLElement>("[data-card]");
  let bestIndex = -1;
  let bestCard: HTMLElement | null = null;
  let bestZ = -1;

  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return;
    }

    const z = Number(card.style.zIndex) || 0;
    if (z > bestZ) {
      bestZ = z;
      bestIndex = index;
      bestCard = card;
    }
  });

  if (bestCard === null || bestIndex < 0) {
    return null;
  }

  return { index: bestIndex, card: bestCard };
}

export function ProjectCoverflow() {
  const boardRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const lastFocusedCardRef = useRef<HTMLElement | null>(null);
  const positionRef = useRef(0);
  const lockedPositionRef = useRef<number | null>(null);
  const snapTweenRef = useRef<gsap.core.Tween | null>(null);
  const snappingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const reducedMotion = useReducedMotion();
  const activeProject = projects[active];

  useEffect(() => {
    return onScrollFrame((state) => {
      if (snappingRef.current || openProject) {
        return;
      }

      const locked = lockedPositionRef.current;
      const position =
        locked ??
        (state.byId.projects ?? 0) * Math.max(projects.length - 1, 1);
      positionRef.current = position;
      const nextActive = projectIndexFromProgress(
        position / Math.max(projects.length - 1, 1),
        projects.length,
      );
      setActive((current) => (current === nextActive ? current : nextActive));
      applyCoverflowLayout(boardRef.current, position);
    });
  }, [openProject]);

  const closeModal = useCallback(() => {
    snapTweenRef.current?.kill();
    snappingRef.current = false;
    lockedPositionRef.current = null;
    setOpenProject(null);
    setOriginRect(null);
  }, []);

  const openModalAt = useCallback(
    (index: number, project: Project, card: HTMLElement) => {
      positionRef.current = index;
      lockedPositionRef.current = index;
      applyCoverflowLayout(boardRef.current, index);
      setActive(index);

      const rect = card.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        snappingRef.current = false;
        lockedPositionRef.current = null;
        return;
      }

      lastFocusedCardRef.current = card;
      setOriginRect(rect);
      setOpenProject(project);
      snappingRef.current = false;

      scrollToProjectIndex(index, undefined, { immediate: true });
    },
    [],
  );

  function snapToAndOpen(index: number, project: Project, card: HTMLElement) {
    if (openProject || snappingRef.current) {
      return;
    }

    snappingRef.current = true;
    snapTweenRef.current?.kill();

    const section = document.querySelector<HTMLElement>('[data-chapter="projects"]');
    const startPosition = section
      ? readProjectsChapterScroll(section).position
      : positionRef.current;

    if (reducedMotion || Math.abs(index - startPosition) < 0.02) {
      openModalAt(index, project, card);
      return;
    }

    const proxy = { pos: startPosition };
    snapTweenRef.current = gsap.to(proxy, {
      pos: index,
      duration: 0.55,
      ease: "power3.inOut",
      onUpdate: () => {
        positionRef.current = proxy.pos;
        applyCoverflowLayout(boardRef.current, proxy.pos);
      },
      onComplete: () => {
        const element = cardRefs.current.get(project.id) ?? card;
        openModalAt(index, project, element);
      },
    });
  }

  function handleBoardClick(event: React.MouseEvent<HTMLDivElement>) {
    const board = boardRef.current;
    if (!board || openProject || snappingRef.current) {
      return;
    }

    const hit = cardAtPoint(board, event.clientX, event.clientY);
    if (!hit) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const project = projects[hit.index];
    if (!project) {
      return;
    }

    snapToAndOpen(hit.index, project, hit.card);
  }

  function updateBoardCursor(clientX: number, clientY: number) {
    const board = boardRef.current;
    if (!board) {
      return;
    }

    if (openProject || snappingRef.current) {
      board.style.cursor = "";
      return;
    }

    const hit = cardAtPoint(board, clientX, clientY);
    board.style.cursor = hit ? "pointer" : "";
  }

  function handleBoardPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    updateBoardCursor(event.clientX, event.clientY);
  }

  function handleBoardPointerLeave() {
    const board = boardRef.current;
    if (board) {
      board.style.cursor = "";
    }
  }

  return (
    <ChapterStage id="projects" index="03" title="Projekte">
      <div
        ref={boardRef}
        className={`coverflow${openProject ? " is-modal-open" : ""}`}
        role="listbox"
        aria-label="Projekte"
        aria-activedescendant={`project-${activeProject?.id}`}
        tabIndex={0}
        onClick={handleBoardClick}
        onPointerMove={handleBoardPointerMove}
        onPointerLeave={handleBoardPointerLeave}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            const activeCard = cardRefs.current.get(activeProject?.id ?? "");
            if (!activeCard || openProject || !activeProject || snappingRef.current) {
              return;
            }
            event.preventDefault();
            snapToAndOpen(active, activeProject, activeCard);
          }
        }}
      >
        {projects.map((project, index) => (
          <article
            key={project.id}
            ref={(node) => {
              if (node) {
                cardRefs.current.set(project.id, node);
              } else {
                cardRefs.current.delete(project.id);
              }
            }}
            id={`project-${project.id}`}
            data-card
            data-index={index}
            role="option"
            aria-selected={index === active}
            className={`coverflow-card${index === active ? " is-active" : ""}${project.cover ? " has-media" : ""}${openProject?.id === project.id ? " is-opening" : ""}`}
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
                onClick={(event) => event.stopPropagation()}
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
                onClick={(event) => event.stopPropagation()}
              >
                GitHub
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      {openProject && originRect ? (
        <ProjectModal
          project={openProject}
          originRect={originRect}
          reducedMotion={reducedMotion}
          onClose={closeModal}
          returnFocusRef={lastFocusedCardRef}
        />
      ) : null}
    </ChapterStage>
  );
}
