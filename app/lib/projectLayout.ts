import { projects } from "@/app/data/projects";

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
