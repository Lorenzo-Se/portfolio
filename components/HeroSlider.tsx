"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HeroSlide } from "@/content/portfolioData";

type HeroSliderProps = {
  slides: HeroSlide[];
};

const SLIDE_PAUSE_MS = 2000;
const PROGRESS_FILL_MS = 7000;
const AUTO_ADVANCE_MS = SLIDE_PAUSE_MS + PROGRESS_FILL_MS;

export function HeroSlider({ slides }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [maxSlideHeight, setMaxSlideHeight] = useState<number>();
  const measureRefs = useRef<Array<HTMLDivElement | null>>([]);

  const activeSlide = useMemo(() => slides[index], [slides, index]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [index, slides.length]);

  useEffect(() => {
    if (!slides.length) {
      return;
    }

    const updateMaxHeight = () => {
      const maxHeight = Math.max(
        ...measureRefs.current.map((node) => node?.offsetHeight ?? 0),
      );

      if (maxHeight > 0) {
        setMaxSlideHeight((prev) => (prev === maxHeight ? prev : maxHeight));
      }
    };

    updateMaxHeight();

    const observer = new ResizeObserver(updateMaxHeight);
    measureRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    window.addEventListener("resize", updateMaxHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMaxHeight);
    };
  }, [slides]);

  return (
    <section className="glass-panel relative flex flex-col overflow-hidden rounded-3xl p-8 md:p-12">
      <div className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-[#ffe76a]/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-60 w-60 rounded-full bg-[#58d5ff]/25 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_45%)]" />
      <div
        aria-hidden
        className="pointer-events-none invisible absolute left-8 right-8 top-8 md:left-12 md:right-12 md:top-12"
      >
        <div className="max-w-3xl">
          {slides.map((slide, slideIndex) => (
            <div
              key={`measure-${slide.title}`}
              ref={(node) => {
                measureRefs.current[slideIndex] = node;
              }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]">
                {slide.eyebrow}
              </p>
              <h1 className="mb-6 text-4xl font-semibold leading-tight md:text-6xl">
                {slide.title}
              </h1>
              <p className="mb-8 max-w-2xl text-base leading-7 md:text-lg">
                {slide.text}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full px-6 py-3 text-sm font-semibold">
                  {slide.cta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        key={index}
        className="hero-slide-content relative z-10 max-w-3xl"
        style={{ minHeight: maxSlideHeight }}
      >
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {activeSlide.eyebrow}
        </p>
        <h1 className="mb-6 text-4xl font-semibold leading-tight text-white md:text-6xl">
          {activeSlide.title}
        </h1>
        <p className="mb-8 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
          {activeSlide.text}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={activeSlide.href}
            className="btn-primary"
          >
            {activeSlide.cta}
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-auto flex items-center gap-2 pt-8">
        {slides.map((slide, dotIndex) => (
          <button
            key={slide.title}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className="group relative h-1.5 w-10 cursor-pointer overflow-hidden rounded-full bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#58d5ff]"
            aria-label={`Slide ${dotIndex + 1}`}
          >
            <span
              key={`${slide.title}-${dotIndex === index ? index : "static"}`}
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{
                width: "100%",
                transform:
                  dotIndex < index
                    ? "scaleX(1)"
                    : dotIndex === index
                      ? "scaleX(0)"
                      : "scaleX(0)",
                transformOrigin: "left center",
                animation:
                  dotIndex === index
                    ? `sliderFill ${PROGRESS_FILL_MS}ms linear ${SLIDE_PAUSE_MS}ms forwards`
                    : "none",
                opacity: dotIndex <= index ? 1 : 0,
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
