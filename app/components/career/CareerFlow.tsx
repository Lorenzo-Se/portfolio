"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { periodLabel, TIMELINE_START } from "@/app/data/career";
import { getDetail } from "@/app/data/details";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import {
  CAREER_ANCHOR_Y,
  CAREER_VIEW,
  careerScrollTrack,
  layoutFlowBranches,
  layoutFlowTrunk,
  readCareerProgress,
  trackStroke,
  yearTicks,
  yOf,
} from "@/app/lib/careerLayout";
import { DetailPanel } from "@/app/components/ui/DetailPanel";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

export function CareerFlow() {
  const groupRef = useRef<SVGGElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);
  const playheadDotRef = useRef<SVGCircleElement>(null);
  const branchRefs = useRef<Map<string, SVGGElement>>(new Map());
  const [openId, setOpenId] = useState<string | null>(null);
  const branches = useMemo(() => layoutFlowBranches(), []);
  const trunk = useMemo(() => layoutFlowTrunk(), []);
  const years = useMemo(() => yearTicks(), []);
  const openDetail = openId
    ? getDetail(branches.find((branch) => branch.id === openId)?.detailId ?? "")
    : undefined;

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="career"]');
    if (section) {
      section.style.minHeight = `calc(100vh + ${careerScrollTrack()}px)`;
    }
  }, []);

  useEffect(() => {
    const startY = yOf(TIMELINE_START);
    const endY = yOf("now");

    return onScrollFrame(() => {
      const section =
        groupRef.current?.closest<HTMLElement>('[data-chapter="career"]') ?? null;
      const progress = readCareerProgress(section);
      const playY = startY + (endY - startY) * progress;
      const shift = CAREER_ANCHOR_Y - playY;

      playheadRef.current?.setAttribute("y1", String(playY));
      playheadRef.current?.setAttribute("y2", String(playY));
      playheadDotRef.current?.setAttribute("cy", String(playY));
      groupRef.current?.setAttribute("transform", `translate(0 ${shift})`);

      branches.forEach((branch) => {
        const live = playY >= branch.yStart - 8 && playY <= branch.yEnd + 8;
        branchRefs.current.get(branch.id)?.classList.toggle("is-live", live);
      });
    });
  }, [branches]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleBranch = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <ChapterStage id="career" index="02" title="Karriereweg">
      <div className="career-board">
        <svg
          className="career-svg"
          viewBox={`0 0 ${CAREER_VIEW.width} 640`}
          role="img"
          aria-label="Karrierefluss mit verzweigender Zeitlinie"
        >
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

            {trunk.map((segment, index) => (
              <line
                key={`trunk-${index}`}
                className="career-flow-trunk"
                x1={segment.x}
                x2={segment.x}
                y1={segment.y1}
                y2={segment.y2}
              />
            ))}

            {branches.map((branch) => (
              <g
                key={branch.id}
                ref={(node) => {
                  if (node) {
                    branchRefs.current.set(branch.id, node);
                  } else {
                    branchRefs.current.delete(branch.id);
                  }
                }}
                className={`career-flow-branch${openId === branch.id ? " is-open" : ""}${branch.isPrimary ? " is-primary" : ""}`}
                data-track={branch.trackId}
                tabIndex={0}
                role="button"
                aria-label={branch.label}
                onClick={() => toggleBranch(branch.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleBranch(branch.id);
                  }
                }}
              >
                <path
                  className="career-flow-hit"
                  d={branch.path}
                  stroke={trackStroke(branch.trackId)}
                />
                <path
                  className="career-flow-line"
                  d={branch.path}
                  stroke={trackStroke(branch.trackId)}
                />
                <circle
                  className="career-flow-node"
                  cx={branch.nodeX}
                  cy={branch.nodeY}
                  r="4"
                  fill={trackStroke(branch.trackId)}
                />
                <text
                  className="career-flow-label"
                  x={branch.labelX}
                  y={branch.labelY - 6}
                  textAnchor={branch.labelSide === "left" ? "end" : "start"}
                >
                  {branch.label}
                </text>
                <text
                  className="career-flow-sub"
                  x={branch.labelX}
                  y={branch.labelY + 12}
                  textAnchor={branch.labelSide === "left" ? "end" : "start"}
                >
                  {periodLabel(branch.start, branch.end)}
                  {branch.placeholder ? "  ·  Platzhalter" : ""}
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
