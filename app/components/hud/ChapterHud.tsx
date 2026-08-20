"use client";

import { chapters } from "@/app/lib/chapters";
import { useActiveIndex } from "@/app/lib/useActiveIndex";
import { scrollToChapter } from "@/app/lib/usePortfolioScroll";

export function ChapterHud() {
  const activeIndex = useActiveIndex();

  return (
    <nav className="hud" aria-label="Kapitel">
      <div className="hud-progress" aria-hidden="true">
        <span />
      </div>
      {chapters.map((chapter, index) => (
        <button
          key={chapter.id}
          type="button"
          className={`hud-item${index === activeIndex ? " is-active" : ""}`}
          onClick={() => scrollToChapter(chapter.id)}
        >
          <span className="hud-dot" />
          <span>
            {chapter.number} {chapter.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
