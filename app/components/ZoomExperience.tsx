"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeroSection } from "./HeroSection";
import { ImmersiveEffects } from "./ImmersiveEffects";
import { SectionNav } from "./SectionNav";
import { StorySection } from "./StorySection";

const sections = [
  { id: "hero", number: "0101", label: "Home" },
  { id: "intro", number: "0202", label: "Profile" },
  { id: "projects", number: "0303", label: "Projects" },
  { id: "skills", number: "0404", label: "Skills" },
  { id: "contact", number: "0505", label: "Contact" },
] as const;

const stepOrder = sections.map((section) => section.id);

export function ZoomExperience() {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    const initialHash = window.location.hash.replace("#", "");
    const indexFromHash = stepOrder.indexOf(initialHash as (typeof stepOrder)[number]);
    return indexFromHash >= 0 ? indexFromHash : 0;
  });
  const [previousIndex, setPreviousIndex] = useState(activeIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const goToIndex = useCallback((nextIndex: number) => {
    if (isTransitioning || nextIndex < 0 || nextIndex >= stepOrder.length) {
      return;
    }

    setPreviousIndex(activeIndex);
    setIsTransitioning(true);
    setActiveIndex(nextIndex);
    window.history.replaceState(null, "", `#${stepOrder[nextIndex]}`);

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
    }, 900);
  }, [activeIndex, isTransitioning]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const indexFromHash = stepOrder.indexOf(hash as (typeof stepOrder)[number]);
      if (indexFromHash >= 0 && indexFromHash !== activeIndex) {
        goToIndex(indexFromHash);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [activeIndex, goToIndex]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (isTransitioning) {
        return;
      }

      if (event.deltaY > 22) {
        goToIndex(activeIndex + 1);
      } else if (event.deltaY < -22) {
        goToIndex(activeIndex - 1);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTransitioning) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        goToIndex(activeIndex + 1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        goToIndex(activeIndex - 1);
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (isTransitioning || touchStartYRef.current === null) {
        return;
      }
      const currentY = event.changedTouches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - currentY;
      if (deltaY > 24) {
        goToIndex(activeIndex + 1);
      } else if (deltaY < -24) {
        goToIndex(activeIndex - 1);
      }
      touchStartYRef.current = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [activeIndex, goToIndex, isTransitioning]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const activeId = sections[activeIndex]?.id ?? sections[0].id;
  const direction = activeIndex > previousIndex ? "next" : "prev";

  const stepStates = useMemo(() => {
    return sections.map((section, index) => {
      if (index === activeIndex) {
        return "is-current";
      }
      if (index < activeIndex) {
        return "is-past";
      }
      return "is-future";
    });
  }, [activeIndex]);

  return (
    <ImmersiveEffects>
      <div
        className={`zoom-experience relative min-h-screen overflow-hidden shadow-[inset_0_1px_0_rgba(255,207,74,0.45)] ${isTransitioning ? "is-transitioning" : ""} direction-${direction}`}
        onClickCapture={(event) => {
          const target = event.target as HTMLElement;
          const anchor = target.closest("a[href^='#']") as HTMLAnchorElement | null;
          if (!anchor) {
            return;
          }
          const id = anchor.getAttribute("href")?.replace("#", "");
          if (!id) {
            return;
          }
          const index = sections.findIndex((section) => section.id === id);
          if (index >= 0) {
            event.preventDefault();
            goToIndex(index);
          }
        }}
      >
        <SectionNav
          items={sections.map((section) => ({ ...section }))}
          activeId={activeId}
          onSelect={(id) => {
            const target = sections.findIndex((section) => section.id === id);
            if (target >= 0) {
              goToIndex(target);
            }
          }}
        />
        <main className="zoom-stage perspective-[1500px] transform-3d relative h-screen">
          <div className={`zoom-step ${stepStates[0]}`} id="hero">
            <HeroSection
              id="hero-inner"
              name="Lorenzo Seminara"
              subtitle="[Application Portfolio Placeholder]"
            />
          </div>
          <div className={`zoom-step ${stepStates[1]}`} id="intro">
            <StorySection
              id="intro-inner"
              number="0202"
              title="[Profile Narrative]"
              description="[Introduce your profile with a concise value proposition and contextual achievements placeholder.]"
              points={[
                "[Academic / Professional Background Placeholder]",
                "[Domain Focus Placeholder]",
                "[Impact Statement Placeholder]",
              ]}
              cta="[Continue]"
              nextId="projects"
              variant="profile"
            />
          </div>
          <div className={`zoom-step ${stepStates[2]}`} id="projects">
            <StorySection
              id="projects-inner"
              number="0303"
              title="[Selected Projects]"
              description="[Highlight 2-4 relevant projects with goals, constraints, and measurable outcomes.]"
              points={[
                "[Project One Placeholder]",
                "[Project Two Placeholder]",
                "[Project Three Placeholder]",
              ]}
              cta="[Continue]"
              nextId="skills"
              variant="projects"
            />
          </div>
          <div className={`zoom-step ${stepStates[3]}`} id="skills">
            <StorySection
              id="skills-inner"
              number="0404"
              title="[Skills Matrix]"
              description="[Structure technical, analytical, and collaborative competencies with role relevance.]"
              points={[
                "[Technical Skills Placeholder]",
                "[Tools & Workflow Placeholder]",
                "[Language / Soft Skills Placeholder]",
              ]}
              cta="[Continue]"
              nextId="contact"
              variant="skills"
            />
          </div>
          <div className={`zoom-step ${stepStates[4]}`} id="contact">
            <StorySection
              id="contact-inner"
              number="0505"
              title="[Contact & Next Step]"
              description="[Provide a clear call to action for interview scheduling and professional contact.]"
              points={[
                "[Email Placeholder]",
                "[Phone Placeholder]",
                "[LinkedIn / Portfolio Link Placeholder]",
              ]}
              cta="[Restart Experience]"
              nextId="hero"
              variant="contact"
            />
          </div>
        </main>
      </div>
    </ImmersiveEffects>
  );
}
