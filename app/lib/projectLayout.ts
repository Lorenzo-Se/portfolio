import { projects } from "@/app/data/projects";
import { getScrollState } from "@/app/lib/chapterProgress";
import { getLenis } from "@/app/lib/usePortfolioScroll";

export const PROJECTS_SCROLL_STEP = 520;

export function projectsScrollTrack(
  projectCount: number = projects.length,
): number {
  return Math.max(projectCount - 1, 1) * PROJECTS_SCROLL_STEP;
}

export function projectProgressFromIndex(
  index: number,
  projectCount: number = projects.length,
): number {
  if (projectCount <= 1) {
    return 0;
  }
  return index / (projectCount - 1);
}

export function projectIndexFromProgress(
  progress: number,
  projectCount: number = projects.length,
): number {
  const position = progress * Math.max(projectCount - 1, 1);
  return Math.round(position);
}

export function projectSnapOffsets(
  section: HTMLElement,
  projectCount: number = projects.length,
): number[] {
  const track = Math.max(section.offsetHeight - window.innerHeight, 1);
  const rect = section.getBoundingClientRect();
  const stickyStart = window.scrollY + rect.top;

  return Array.from({ length: projectCount }, (_, index) => {
    const progress = projectProgressFromIndex(index, projectCount);
    return stickyStart + track * progress;
  });
}

export function isInProjectsStickyRange(section: HTMLElement | null): boolean {
  if (!section) {
    return false;
  }

  const rect = section.getBoundingClientRect();
  return rect.top <= 0 && rect.bottom >= window.innerHeight;
}

export function projectsScrollProgress(): number {
  return getScrollState().byId.projects ?? 0;
}

export function readProjectsChapterScroll(section: HTMLElement): {
  track: number;
  scrolled: number;
  progress: number;
  position: number;
} {
  const track = Math.max(section.offsetHeight - window.innerHeight, 1);
  const rect = section.getBoundingClientRect();
  const scrolled = Math.min(Math.max(-rect.top, 0), track);
  const progress = scrolled / track;
  const position = progress * Math.max(projects.length - 1, 1);
  return { track, scrolled, progress, position };
}

export function scrollToProjectIndex(
  index: number,
  onComplete?: () => void,
  options?: { immediate?: boolean },
): void {
  const section = document.querySelector<HTMLElement>('[data-chapter="projects"]');
  if (!section) {
    onComplete?.();
    return;
  }

  const offsets = projectSnapOffsets(section, projects.length);
  const target = offsets[index];
  if (target === undefined) {
    onComplete?.();
    return;
  }

  const lenis = getLenis();
  const immediate = options?.immediate ?? false;
  const currentScroll = lenis?.scroll ?? window.scrollY;

  const finish = () => {
    requestAnimationFrame(() => onComplete?.());
  };

  if (Math.abs(currentScroll - target) < 4) {
    finish();
    return;
  }

  if (lenis) {
    lenis.scrollTo(target, {
      duration: immediate ? 0 : 0.65,
      immediate,
      force: true,
      onComplete: finish,
    });
    return;
  }

  window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
  finish();
}

/** Maps wheel / touch deltas to vertical scroll while the coverflow is pinned. */
export function projectsScrollDelta(deltaX: number, deltaY: number): number {
  if (deltaX === 0 && deltaY === 0) {
    return 0;
  }

  if (deltaX === 0) {
    return deltaY;
  }

  if (deltaY === 0) {
    return deltaX * 1.2;
  }

  const dominant = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX * 1.2;
  const secondary = Math.abs(deltaY) >= Math.abs(deltaX) ? deltaX * 1.2 : deltaY;
  return dominant + secondary * 0.55;
}
