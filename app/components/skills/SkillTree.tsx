"use client";

import { useEffect, useMemo, useRef } from "react";
import { skillTree } from "@/app/data/skills";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import { layoutSkillTree, skillBounds } from "@/app/lib/skillLayout";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

function edgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

export function SkillTree() {
  const nodes = useMemo(() => layoutSkillTree(skillTree), []);
  const bounds = useMemo(() => skillBounds(nodes), [nodes]);
  const nodeRefs = useRef<Map<string, SVGGElement>>(new Map());
  const edgeRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const padX = 160;
  const padY = 80;
  const viewW = bounds.width + padX + 48;
  const viewH = bounds.height + padY * 2;
  const maxDepth = Math.max(...nodes.map((node) => node.depth));

  useEffect(() => {
    edgeRefs.current.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = String(length);
      path.style.strokeDashoffset = String(length);
    });

    return onScrollFrame((state) => {
      const p = state.byId.skills ?? 0;
      nodes.forEach((node) => {
        const start = node.depth / (maxDepth + 0.8);
        const local = Math.min(Math.max((p - start) / 0.28, 0), 1);
        const group = nodeRefs.current.get(node.id);
        if (group) {
          group.style.opacity = String(local);
          group.classList.toggle("is-on", local > 0.55);
        }
        const edge = edgeRefs.current.get(node.id);
        if (edge) {
          const length = Number(edge.style.strokeDasharray) || edge.getTotalLength();
          edge.style.strokeDashoffset = String(length * (1 - local));
        }
      });
    });
  }, [maxDepth, nodes]);

  return (
    <ChapterStage id="skills" index="04" title="Skills">
      <div className="skill-board">
        <svg
          className="skill-svg"
          viewBox={`${bounds.minX - 48} ${bounds.minY - padY} ${viewW} ${viewH}`}
          role="img"
          aria-label="Skill-Baum"
        >
          <defs>
            <linearGradient id="skill-stroke" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,207,74,0.85)" />
              <stop offset="100%" stopColor="rgba(197,210,255,0.7)" />
            </linearGradient>
          </defs>
          {nodes.map((node) =>
            node.parentX !== undefined && node.parentY !== undefined ? (
              <path
                key={`e-${node.id}`}
                ref={(el) => {
                  if (el) {
                    edgeRefs.current.set(node.id, el);
                  } else {
                    edgeRefs.current.delete(node.id);
                  }
                }}
                className="skill-edge"
                d={edgePath(node.parentX, node.parentY, node.x, node.y)}
              />
            ) : null,
          )}
          {nodes.map((node) => (
            <g
              key={node.id}
              ref={(el) => {
                if (el) {
                  nodeRefs.current.set(node.id, el);
                } else {
                  nodeRefs.current.delete(node.id);
                }
              }}
              className="skill-node"
              opacity={0}
            >
              <circle className="skill-node-core" cx={node.x} cy={node.y} r={node.depth === 0 ? 16 : 8} />
              {node.level ? (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={14}
                  fill="none"
                  stroke="rgba(255,207,74,0.7)"
                  strokeWidth="2"
                  strokeDasharray={`${(node.level / 100) * 88} 88`}
                  transform={`rotate(-90 ${node.x} ${node.y})`}
                />
              ) : null}
              <text
                className="skill-label"
                x={node.x + 18}
                y={node.y + 4}
              >
                {node.label}
              </text>
              {node.level ? (
                <text className="skill-level" x={node.x + 18} y={node.y + 18}>
                  {node.level}%
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </ChapterStage>
  );
}
