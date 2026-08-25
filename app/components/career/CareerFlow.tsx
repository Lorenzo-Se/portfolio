"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { periodLabel, TIMELINE_START } from "@/app/data/career";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import {
  activeBranchesAtY,
  CAREER_ANCHOR_Y,
  CAREER_CARD,
  CAREER_VIEW,
  careerScrollTrack,
  layoutFlowBranches,
  layoutFlowTrunk,
  readCareerProgress,
  syncCareerLayoutConfig,
  trackStroke,
  yearTicks,
  yOf,
} from "@/app/lib/careerLayout";
import { CareerActivityCard } from "@/app/components/career/CareerActivityCard";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

export function CareerFlow() {
  const groupRef = useRef<SVGGElement>(null);
  const playheadRef = useRef<SVGLineElement>(null);
  const playheadDotRef = useRef<SVGCircleElement>(null);
  const branchRefs = useRef<Map<string, SVGGElement>>(new Map());
  const activeKeyRef = useRef("");
  const [layoutKey, setLayoutKey] = useState(0);

  const branches = useMemo(() => layoutFlowBranches(), [layoutKey]);
  const trunk = useMemo(() => layoutFlowTrunk(), [layoutKey]);
  const years = useMemo(() => yearTicks(), [layoutKey]);
  const initialPlayY = yOf(TIMELINE_START);
  const [activeBranches, setActiveBranches] = useState(() =>
    activeBranchesAtY(initialPlayY, branches),
  );
  const playheadEndX = CAREER_CARD.left - 8;

  useEffect(() => {
    const syncLayout = () => {
      if (syncCareerLayoutConfig(window.innerWidth)) {
        setLayoutKey((current) => current + 1);
      }
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, []);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="career"]');
    if (section) {
      section.style.minHeight = `calc(100vh + ${careerScrollTrack()}px)`;
    }
  }, [layoutKey]);

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

      const live = activeBranchesAtY(playY, branches);
      const nextActiveKey = live
        .map((branch) => branch.id)
        .sort()
        .join("|");
      if (nextActiveKey !== activeKeyRef.current) {
        activeKeyRef.current = nextActiveKey;
        setActiveBranches(live);
      }

      branches.forEach((branch) => {
        const isLive = live.some((entry) => entry.id === branch.id);
        branchRefs.current.get(branch.id)?.classList.toggle("is-live", isLive);
      });
    });
  }, [branches]);

  return (
    <ChapterStage id="career" index="02" title="Karriereweg">
      <div className="career-board">
        <div className="career-timeline">
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
                  x2={playheadEndX}
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
                className={`career-flow-branch${branch.isPrimary ? " is-primary" : ""}`}
                data-track={branch.trackId}
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
              x2={playheadEndX}
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
        <CareerActivityCard active={activeBranches} />
      </div>
    </ChapterStage>
  );
}
