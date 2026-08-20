"use client";

import type { ReactNode } from "react";

type ChapterStageProps = {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function ChapterStage({
  id,
  index,
  title,
  children,
  className,
}: ChapterStageProps) {
  return (
    <section className="chapter" data-chapter={id} id={id}>
      <div className={`chapter-stage${className ? ` ${className}` : ""}`}>
        <header className="chapter-heading">
          <span className="chapter-index">{index}</span>
          <h2>{title}</h2>
        </header>
        {children}
      </div>
    </section>
  );
}
