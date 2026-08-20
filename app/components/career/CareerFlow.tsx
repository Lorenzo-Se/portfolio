"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  careerTracks,
  periodLabel,
  TIMELINE_START,
} from "@/app/data/career";
import { getDetail } from "@/app/data/details";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import {
  CAREER_VIEW,
  careerHeight,
  layoutSpans,
  yearTicks,
  yOf,
} from "@/app/lib/careerLayout";
import { DetailPanel } from "@/app/components/ui/DetailPanel";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

export function CareerFlow() {
  const groupRef = useRef<SVGGElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);
  const playheadDotRef = useRef<SVGCircleElement>(null);
  const spanRefs = useRef<Map<string, SVGGElement>>(new Map());
  const [openId, setOpenId] = useState<string | null>(null);
  const spans = useMemo(() => layoutSpans(), []);
  const years = useMemo(() => yearTicks(), []);
  const height = careerHeight();
  const openDetail = openId
    ? getDetail(spans.find((span) => span.id === openId)?.detailId ?? "")
    : undefined;

  useEffect(() => {
    const startY = yOf(TIMELINE_START);
    const endY = yOf("now");

    return onScrollFrame((state) => {
      const p = state.byId.career ?? 0;
      const playY = startY + (endY - startY) * p;
      playheadRef.current?.setAttribute("y1", String(playY));
      playheadRef.current?.setAttribute("y2", String(playY));
      playheadDotRef.current?.setAttribute("cy", String(playY));

      const shift = 210 - playY;
      groupRef.current?.setAttribute("transform", `translate(0 ${shift})`);

      spans.forEach((span) => {
        const live = playY >= span.y - 8 && playY <= span.y + span.height + 8;
        spanRefs.current.get(span.id)?.classList.toggle("is-live", live);
      });
    });
  }, [spans]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ChapterStage id="career" index="02" title="Karriereweg">
      <div className="career-board">
        <svg
          className="career-svg"
          viewBox={`0 0 ${CAREER_VIEW.width} 640`}
          role="img"
          aria-label="Karrierefluss mit parallelen Spuren"
        >
          {careerTracks.map((track, index) => {
            const width = spans[0]?.width ?? 200;
            const x =
              CAREER_VIEW.padLeft + index * (width + CAREER_VIEW.laneGap);
            return (
              <text
                key={track.id}
                className="career-track"
                x={x + 10}
                y="28"
              >
                {track.label}
              </text>
            );
          })}
          <g ref={groupRef}>
            {years.map((tick) => (
              <g key={tick.year}>
                <text className="career-year" x="8" y={tick.y + 4}>
                  {tick.year}
                </text>
                <line
                  x1="58"
                  x2={CAREER_VIEW.width - 12}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="rgba(197, 210, 255, 0.08)"
                />
              </g>
            ))}
            {careerTracks.map((track, index) => {
              const width = spans[0]?.width ?? 200;
              const x =
                CAREER_VIEW.padLeft + index * (width + CAREER_VIEW.laneGap);
              return (
                <g key={track.id}>
                  <rect
                    className="career-lane"
                    x={x}
                    y={CAREER_VIEW.padTop - 12}
                    width={width}
                    height={height - CAREER_VIEW.padTop + 8}
                    rx="10"
                  />
                </g>
              );
            })}
            {spans.map((span) => (
              <g
                key={span.id}
                ref={(node) => {
                  if (node) {
                    spanRefs.current.set(span.id, node);
                  } else {
                    spanRefs.current.delete(span.id);
                  }
                }}
                className={`career-span${openId === span.id ? " is-open" : ""}`}
                tabIndex={0}
                role="button"
                onClick={() =>
                  setOpenId((current) => (current === span.id ? null : span.id))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setOpenId((current) => (current === span.id ? null : span.id));
                  }
                }}
              >
                <rect
                  className="career-span-body"
                  x={span.x + 8}
                  y={span.y}
                  width={span.width - 16}
                  height={span.height}
                  rx="8"
                />
                <text className="career-span-label" x={span.x + 20} y={span.y + 22}>
                  {span.label}
                </text>
                <text className="career-span-sub" x={span.x + 20} y={span.y + 38}>
                  {periodLabel(span.start, span.end)}
                  {span.placeholder ? "  ·  Platzhalter" : ""}
                </text>
              </g>
            ))}
            <line
              ref={playheadRef}
              className="career-playhead"
              x1="52"
              x2={CAREER_VIEW.width - 16}
              y1={yOf(TIMELINE_START)}
              y2={yOf(TIMELINE_START)}
            />
            <circle
              ref={playheadDotRef}
              className="career-playhead-dot"
              cx="52"
              cy={yOf(TIMELINE_START)}
              r="4"
            />
          </g>
        </svg>
      </div>
      <DetailPanel detail={openDetail} onClose={() => setOpenId(null)} />
    </ChapterStage>
  );
}
