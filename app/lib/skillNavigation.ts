import { skillTreeConfig } from "@/app/data/skills";

export function skillsScrollTrack(): number {
  return skillTreeConfig.chapterScrollExtra;
}

export function isInSkillsStickyRange(section: HTMLElement | null): boolean {
  if (!section) {
    return false;
  }

  const rect = section.getBoundingClientRect();
  return rect.top <= 0 && rect.bottom >= window.innerHeight;
}

export function readSkillsChapterScroll(section: HTMLElement): {
  track: number;
  scrolled: number;
  progress: number;
} {
  const track = Math.max(section.offsetHeight - window.innerHeight, 1);
  const rect = section.getBoundingClientRect();
  const scrolled = Math.min(Math.max(-rect.top, 0), track);
  const progress = scrolled / track;
  return { track, scrolled, progress };
}

export function syncSkillsChapterHeight(section: HTMLElement | null): void {
  if (!section) {
    return;
  }
  section.style.minHeight = `calc(100vh + ${skillsScrollTrack()}px)`;
}
