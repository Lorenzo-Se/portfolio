"use client";

import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import Snap from "lenis/snap";
import { chapters } from "@/app/lib/chapters";
import { publishScrollState } from "@/app/lib/chapterProgress";
import { projectSnapOffsets, projectsScrollTrack } from "@/app/lib/projectLayout";
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
    let projectSnap: Snap | undefined;
    const projectSnapRemovers: Array<() => void> = [];

    const syncProjectSnaps = () => {
      const section = root.querySelector<HTMLElement>('[data-chapter="projects"]');
      if (!section) {
        return;
      }

      section.style.minHeight = `calc(100vh + ${projectsScrollTrack(projects.length)}px)`;
      if (!projectSnap) {
        return;
      }

      projectSnapRemovers.splice(0).forEach((remove) => remove());
      projectSnapOffsets(section, projects.length).forEach((offset) => {
        projectSnapRemovers.push(projectSnap!.add(offset));
      });
      projectSnap.resize();
    };

    if (!reducedMotion) {
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
      });
      lenisInstance = lenis;
      projectSnap = new Snap(lenis, {
        type: "proximity",
        distanceThreshold: 180,
        debounce: 320,
        duration: 0.85,
      });
      syncProjectSnaps();
      lenis.on("scroll", () => {
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
      sections.forEach((section) => section.style.setProperty("--p", "1"));
      publishScrollState({
        progress: 1,
        activeIndex: 0,
        byId: Object.fromEntries(chapters.map((chapter) => [chapter.id, 1])),
      });
    }

    const onResize = () => {
      ScrollTrigger.refresh();
      syncProjectSnaps();
      measure();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", measure, { passive: true });

    const fromHash = window.location.hash.replace("#", "");
    const hashIndex = chapters.findIndex((chapter) => chapter.id === fromHash);

    requestAnimationFrame(() => {
      syncProjectSnaps();
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
      projectSnapRemovers.forEach((remove) => remove());
      projectSnap?.destroy();
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, [reducedMotion, rootRef]);
}
