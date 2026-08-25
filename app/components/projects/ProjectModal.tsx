"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/app/data/projects";
import { gsap } from "@/app/lib/gsap";
import { getLenis } from "@/app/lib/usePortfolioScroll";

type ProjectModalProps = {
  project: Project;
  originRect: DOMRect;
  reducedMotion: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

function modalTargetRect(): DOMRect {
  const width = Math.min(window.innerWidth * 0.92, 760);
  const height = Math.min(window.innerHeight * 0.88, 640);
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  return new DOMRect(left, top, width, height);
}

function focusWithoutScroll(element: HTMLElement | null | undefined) {
  element?.focus({ preventScroll: true });
}

export function ProjectModal({
  project,
  originRect,
  reducedMotion,
  onClose,
  returnFocusRef,
}: ProjectModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const scrollSnapshotRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;

    const backdrop = backdropRef.current;
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!backdrop || !shell || !content) {
      onClose();
      return;
    }

    if (reducedMotion) {
      focusWithoutScroll(returnFocusRef?.current);
      onClose();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        focusWithoutScroll(returnFocusRef?.current);
        onClose();
      },
    });

    tl.to(content, { opacity: 0, y: 8, duration: 0.2, ease: "power2.in" }, 0);
    tl.to(
      shell,
      {
        top: originRect.top,
        left: originRect.left,
        width: originRect.width,
        height: originRect.height,
        duration: 0.45,
        ease: "power3.inOut",
      },
      0.05,
    );
    tl.to(backdrop, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.15);
  }, [onClose, originRect, reducedMotion, returnFocusRef]);

  useEffect(() => {
    const lenis = getLenis();
    scrollSnapshotRef.current = lenis?.scroll ?? window.scrollY;
    document.body.classList.add("project-modal-open");
    lenis?.stop();

    return () => {
      document.body.classList.remove("project-modal-open");
      const snapshot = scrollSnapshotRef.current;
      lenis?.start();
      if (snapshot !== null) {
        lenis?.scrollTo(snapshot, { immediate: true, force: true });
      }
    };
  }, []);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!backdrop || !shell || !content) {
      return;
    }

    const target = modalTargetRect();

    if (reducedMotion) {
      gsap.set(backdrop, { opacity: 1 });
      gsap.set(shell, {
        top: target.top,
        left: target.left,
        width: target.width,
        height: target.height,
      });
      gsap.set(content, { opacity: 1, y: 0 });
      closeRef.current?.focus();
      return;
    }

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(shell, {
      top: originRect.top,
      left: originRect.left,
      width: originRect.width,
      height: originRect.height,
    });
    gsap.set(content, { opacity: 0, y: 12 });

    const tl = gsap.timeline({
      onComplete: () => closeRef.current?.focus(),
    });

    tl.to(
      backdrop,
      { opacity: 1, duration: 0.35, ease: "power2.out" },
      0,
    );
    tl.to(
      shell,
      {
        top: target.top,
        left: target.left,
        width: target.width,
        height: target.height,
        duration: 0.55,
        ease: "power3.inOut",
      },
      0,
    );
    tl.to(
      content,
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      0.22,
    );

    return () => {
      tl.kill();
    };
  }, [originRect, reducedMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const modal = (
    <div className="project-modal-root" data-lenis-prevent>
      <div
        ref={backdropRef}
        className="project-modal-backdrop"
        onClick={handleClose}
        aria-hidden
      />
      <div
        ref={shellRef}
        className="project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-modal-title-${project.id}`}
        data-lenis-prevent
      >
        <div className="project-modal__glow" aria-hidden />
        <div ref={contentRef} className="project-modal__body" data-lenis-prevent>
          <header className="project-modal__head">
            <div className="project-modal__head-main">
              <span className="project-modal__year">{project.year}</span>
              <h2 id={`project-modal-title-${project.id}`}>{project.title}</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="project-modal__close"
              onClick={handleClose}
            >
              Schliessen
            </button>
          </header>

          {project.cover ? (
            <div className="project-modal__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.cover} alt="" className="project-modal__cover" />
            </div>
          ) : null}

          <p className="project-modal__description">{project.description}</p>

          <footer className="project-modal__foot">
            <span className="project-modal__stack-label">Stack</span>
            <div className="coverflow-tags">
              {project.techStack.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>

            {project.demoUrl || project.githubUrl ? (
              <div className="project-modal__links">
                {project.demoUrl ? (
                  <a
                    className="coverflow-link"
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Demo
                  </a>
                ) : null}
                {project.githubUrl ? (
                  <a
                    className="coverflow-link"
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                ) : null}
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
