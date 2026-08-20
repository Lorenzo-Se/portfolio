"use client";

import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import { chapters } from "@/app/lib/chapters";
import { publishScrollState } from "@/app/lib/chapterProgress";
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
      let best = Number.POSITIVE_INFINITY;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const total = Math.max(rect.height - window.innerHeight, 1);
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        const progress = reducedMotion ? 1 : scrolled / total;
        section.style.setProperty("--p", String(progress));
        byId[chapters[index].id] = progress;

        const dist = Math.abs(rect.top);
        if (rect.bottom > window.innerHeight * 0.22 && dist < best) {
          best = dist;
          activeIndex = index;
        }
      });

      const doc = document.documentElement;
      const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

      publishScrollState({ progress, activeIndex, byId });
      applyHash(chapters[activeIndex].id);
    };

    let ticker: ((time: number) => void) | undefined;

    if (!reducedMotion) {
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
      });
      lenisInstance = lenis;
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
      sections.forEach((section) => section.style.setProperty("--p", "1"));
      publishScrollState({
        progress: 1,
        activeIndex: 0,
        byId: Object.fromEntries(chapters.map((chapter) => [chapter.id, 1])),
      });
    }

    const onResize = () => {
      ScrollTrigger.refresh();
      measure();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", measure, { passive: true });

    const fromHash = window.location.hash.replace("#", "");
    const hashIndex = chapters.findIndex((chapter) => chapter.id === fromHash);

    requestAnimationFrame(() => {
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
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, [reducedMotion, rootRef]);
}
