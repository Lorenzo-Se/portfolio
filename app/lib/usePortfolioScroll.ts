"use client";

import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";
import { chapters } from "@/app/lib/chapters";
import { publishScrollState } from "@/app/lib/chapterProgress";
import {
  isInProjectsStickyRange,
  projectSnapOffsets,
  projectsScrollDelta,
  projectsScrollTrack,
} from "@/app/lib/projectLayout";
import {
  syncSkillsChapterHeight,
} from "@/app/lib/skillNavigation";
import { syncCareerLayoutConfig } from "@/app/lib/careerLayout";
import { isMobileViewport } from "@/app/lib/breakpoints";
import { projects } from "@/app/data/projects";
import { gsap, ScrollTrigger } from "@/app/lib/gsap";

type Options = {
  reducedMotion: boolean;
};

let lenisInstance: Lenis | null = null;

export function getLenis() {
  return lenisInstance;
}

export function scrollToChapter(id: string) {
  const target = document.querySelector<HTMLElement>(`[data-chapter="${id}"]`);
  if (!target) {
    return;
  }
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: 1.15, offset: 0 });
    return;
  }
  target.scrollIntoView({ behavior: "smooth" });
}

export function usePortfolioScroll(
  rootRef: RefObject<HTMLElement | null>,
  { reducedMotion }: Options,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const sections = chapters
      .map((chapter) =>
        root.querySelector<HTMLElement>(`[data-chapter="${chapter.id}"]`),
      )
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length !== chapters.length) {
      return;
    }

    const applyHash = (id: string) => {
      if (window.location.hash !== `#${id}`) {
        window.history.replaceState(null, "", `#${id}`);
      }
    };

    const measure = () => {
      const byId: Record<string, number> = {};
      let activeIndex = 0;
      const focusLine = window.innerHeight * 0.38;
      let focused = false;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const total = Math.max(rect.height - window.innerHeight, 1);
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = reducedMotion ? 1 : scrolled / total;
        section.style.setProperty("--p", String(progress));
        byId[chapters[index].id] = progress;

        if (rect.top <= focusLine && rect.bottom > focusLine) {
          activeIndex = index;
          focused = true;
        }
      });

      if (!focused) {
        let best = Number.POSITIVE_INFINITY;
        sections.forEach((section, index) => {
          const rect = section.getBoundingClientRect();
          const center = rect.top + rect.height * 0.5;
          const dist = Math.abs(center - focusLine);
          if (rect.bottom > 0 && rect.top < window.innerHeight && dist < best) {
            best = dist;
            activeIndex = index;
          }
        });
      }

      const doc = document.documentElement;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

      publishScrollState({ progress, activeIndex, byId });
      applyHash(chapters[activeIndex].id);
    };

    let ticker: ((time: number) => void) | undefined;
    let chapterSnap: Snap | undefined;
    let snapPausedForProjects = false;
    const chapterSnapRemovers: Array<() => void> = [];

    const syncProjectSnaps = () => {
      const section = root.querySelector<HTMLElement>('[data-chapter="projects"]');
      if (!section) {
        return;
      }

      section.style.minHeight = `calc(100vh + ${projectsScrollTrack(projects.length)}px)`;
    };

    const syncChapterSnapPoints = () => {
      if (!chapterSnap) {
        return;
      }

      chapterSnapRemovers.splice(0).forEach((remove) => remove());

      const projectsSection = root.querySelector<HTMLElement>(
        '[data-chapter="projects"]',
      );
      if (projectsSection) {
        projectSnapOffsets(projectsSection, projects.length).forEach(
          (offset) => {
            chapterSnapRemovers.push(chapterSnap!.add(offset));
          },
        );
      }

      chapterSnap.resize();
    };

    const projectsSection = () =>
      root.querySelector<HTMLElement>('[data-chapter="projects"]');

    const syncProjectSnapState = () => {
      if (!chapterSnap) {
        return;
      }

      const inProjects = isInProjectsStickyRange(projectsSection());
      if (inProjects && !snapPausedForProjects) {
        chapterSnap.stop();
        snapPausedForProjects = true;
      } else if (!inProjects && snapPausedForProjects) {
        chapterSnap.start();
        snapPausedForProjects = false;
      }
    };

    if (!reducedMotion) {
      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 1.35,
      });
      lenis.options.virtualScroll = (data) => {
        const { deltaX, deltaY, event } = data;
        if (
          event.target instanceof Element &&
          (event.target.closest(".project-modal-root") ||
            event.target.closest("[data-lenis-prevent]"))
        ) {
          return true;
        }

        if (document.body.classList.contains("project-modal-open")) {
          return true;
        }

        if (!isInProjectsStickyRange(projectsSection())) {
          return true;
        }

        if (event.type.includes("wheel") && "ctrlKey" in event && event.ctrlKey) {
          return true;
        }

        const delta = projectsScrollDelta(deltaX, deltaY);
        if (delta === 0) {
          return true;
        }

        if (event.cancelable) {
          event.preventDefault();
        }

        lenis.scrollTo(lenis.targetScroll + delta, {
          programmatic: false,
          lerp: 0.1,
        });
        return false;
      };
      lenisInstance = lenis;
      chapterSnap = new Snap(lenis, {
        type: "proximity",
        distanceThreshold: 120,
        debounce: 420,
        duration: 0.65,
      });
      syncProjectSnaps();
      syncSkillsChapterHeight(
        root.querySelector<HTMLElement>('[data-chapter="skills"]'),
        isMobileViewport(),
      );
      syncChapterSnapPoints();
      lenis.on("scroll", () => {
        syncProjectSnapState();
        ScrollTrigger.update();
        measure();
      });
      ticker = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
    } else {
      syncProjectSnaps();
      syncSkillsChapterHeight(
        root.querySelector<HTMLElement>('[data-chapter="skills"]'),
        isMobileViewport(),
      );
      sections.forEach((section) => section.style.setProperty("--p", "1"));
      publishScrollState({
        progress: 1,
        activeIndex: 0,
        byId: Object.fromEntries(chapters.map((chapter) => [chapter.id, 1])),
      });
    }

    const onResize = () => {
      syncCareerLayoutConfig(window.innerWidth);
      ScrollTrigger.refresh();
      syncProjectSnaps();
      syncSkillsChapterHeight(
        root.querySelector<HTMLElement>('[data-chapter="skills"]'),
        isMobileViewport(),
      );
      syncChapterSnapPoints();
      measure();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", measure, { passive: true });

    const fromHash = window.location.hash.replace("#", "");
    const hashIndex = chapters.findIndex((chapter) => chapter.id === fromHash);

    requestAnimationFrame(() => {
      syncProjectSnaps();
      syncSkillsChapterHeight(
        root.querySelector<HTMLElement>('[data-chapter="skills"]'),
        isMobileViewport(),
      );
      syncChapterSnapPoints();
      syncProjectSnapState();
      measure();
      if (hashIndex > 0) {
        const target = sections[hashIndex];
        if (lenisInstance) {
          lenisInstance.scrollTo(target, { immediate: true });
        } else {
          target.scrollIntoView();
        }
      }
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", measure);
      if (ticker) {
        gsap.ticker.remove(ticker);
      }
      chapterSnapRemovers.forEach((remove) => remove());
      chapterSnap?.destroy();
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, [reducedMotion, rootRef]);
}
