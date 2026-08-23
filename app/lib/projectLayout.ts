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
