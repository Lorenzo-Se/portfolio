"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { skillTree, skillTreeConfig } from "@/app/data/skills";
import { onScrollFrame } from "@/app/lib/chapterProgress";
import { gsap } from "@/app/lib/gsap";
import {
  computeExploreCamera,
  computeOverviewCamera,
  nodeLayerOpacity,
  scrollHighlightCategoryId,
  skillRevealProgress,
  type SkillCamera,
  type SkillTreeMode,
} from "@/app/lib/skillCamera";
import {
  findFocusPath,
  findNode,
  isTerminalFocus,
  layoutSkillTree,
  skillPageCount,
  type LaidOutSkill,
} from "@/app/lib/skillLayout";
import {
  isInSkillsStickyRange,
  readSkillsChapterScroll,
  syncSkillsChapterHeight,
} from "@/app/lib/skillNavigation";
import { useReducedMotion } from "@/app/lib/reducedMotion";
import { useSkillMobileLayout } from "@/app/lib/skillViewport";
import { ChapterStage } from "@/app/components/ui/ChapterStage";
import { SkillTreeMobile } from "@/app/components/skills/SkillTreeMobile";

const { width: VIEW_W, height: VIEW_H } = skillTreeConfig.viewport;

function edgeEndpoints(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) {
    return { x1, y1, x2, y2 };
  }
  const nx = dx / len;
  const ny = dy / len;
  return {
    x1: x1 + nx * r1,
    y1: y1 + ny * r1,
    x2: x2 - nx * r2,
    y2: y2 - ny * r2,
  };
}

function edgePath(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
) {
  const end = edgeEndpoints(x1, y1, r1, x2, y2, r2);
  const midY = (end.y1 + end.y2) / 2;
  if (Math.abs(end.x2 - end.x1) < 1) {
    const nudge = 5;
    return `M ${end.x1} ${end.y1} C ${end.x1 - nudge} ${midY}, ${end.x2 + nudge} ${midY}, ${end.x2} ${end.y2}`;
  }
  return `M ${end.x1} ${end.y1} C ${end.x1} ${midY}, ${end.x2} ${midY}, ${end.x2} ${end.y2}`;
}

function applyCameraToGroup(
  group: SVGGElement | null,
  camera: SkillCamera,
) {
  if (!group) {
    return;
  }
  group.setAttribute(
    "transform",
    `translate(${camera.tx},${camera.ty}) scale(${camera.scale})`,
  );
}

export function SkillTree() {
  const isMobile = useSkillMobileLayout();
  return isMobile ? <SkillTreeMobile /> : <SkillTreeDesktop />;
}

function SkillTreeDesktop() {
  const reducedMotion = useReducedMotion();
  const treeConfig = skillTreeConfig;
  const skillBoardRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<SkillTreeMode>("overview");
  const [exploreId, setExploreId] = useState("root");
  const [explorePage, setExplorePage] = useState(0);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const fullNodes = useMemo(() => layoutSkillTree(skillTree), []);
  const nodeById = useMemo(
    () => new Map(fullNodes.map((node) => [node.id, node])),
    [fullNodes],
  );
  const cameraGroupRef = useRef<SVGGElement>(null);
  const nodeRefs = useRef<Map<string, SVGGElement>>(new Map());
  const edgeRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const cameraTweenRef = useRef<gsap.core.Tween | null>(null);
  const modeRef = useRef(mode);
  const exploreIdRef = useRef(exploreId);
  const explorePageRef = useRef(explorePage);
  const highlightIdRef = useRef<string | null>(null);
  const cameraAnimatingRef = useRef(false);
  const cameraStateRef = useRef<SkillCamera>({
    tx: 0,
    ty: 0,
    scale: 1,
    pageLeafIds: new Set(),
  });

  const focusPath = useMemo(
    () =>
      mode === "explore"
        ? (findFocusPath(skillTree, exploreId) ?? [skillTree])
        : [skillTree],
    [exploreId, mode],
  );

  const exploreNode = focusPath[focusPath.length - 1];
  const explorePageCount = useMemo(
    () =>
      mode === "explore"
        ? skillPageCount(exploreNode, treeConfig.maxLeavesPerView)
        : 1,
    [exploreNode, mode, treeConfig.maxLeavesPerView],
  );

  const maxDepth = Math.max(...fullNodes.map((node) => node.depth), 0);

  modeRef.current = mode;
  exploreIdRef.current = exploreId;
  explorePageRef.current = explorePage;
  highlightIdRef.current = highlightId;

  const updateNodeLayers = useCallback(
    (revealProgress: number) => {
      const currentMode = modeRef.current;
      const currentExploreId = exploreIdRef.current;
      const currentExplorePage = explorePageRef.current;
      const currentHighlight = highlightIdRef.current;
      const focusNode =
        currentMode === "explore" ? findNode(skillTree, currentExploreId) : null;
      const terminalFocus =
        focusNode !== null && isTerminalFocus(focusNode);

      fullNodes.forEach((node) => {
        const layerOpacity = nodeLayerOpacity(
          node,
          currentMode,
          currentExploreId,
          currentExplorePage,
          currentHighlight,
          fullNodes,
          skillTree,
          treeConfig,
        );
        const group = nodeRefs.current.get(node.id);
        const edge = edgeRefs.current.get(node.id);

        if (layerOpacity <= 0.05) {
          if (group) {
            group.style.opacity = "0";
            group.style.pointerEvents = "none";
            group.classList.remove("is-category-active");
          }
          if (edge) {
            edge.style.opacity = "0";
          }
          return;
        }

        const reveal =
          currentMode === "explore" || revealProgress >= 1 ? 1 : revealProgress;
        const start = node.depth / (maxDepth + 0.8);
        const local =
          reveal >= 1
            ? 1
            : Math.min(Math.max((reveal - start) / 0.28, 0), 1);
        const opacity = local * layerOpacity;

        if (group) {
          group.style.opacity = String(opacity);
          const interactive =
            currentMode === "overview"
              ? node.depth === 1
              : node.id === "root" ||
                node.id === currentExploreId ||
                !node.isLeaf ||
                (node.isLeaf &&
                  (findFocusPath(skillTree, currentExploreId) ?? [])
                    .map((segment) => segment.id)
                    .includes(node.parentId ?? ""));
          group.style.pointerEvents =
            opacity > 0.2 && local > 0.4 && interactive ? "auto" : "none";
          const litLeaf =
            node.isLeaf &&
            terminalFocus &&
            layerOpacity >= 0.95 &&
            local >= 0.95;
          const litBranch =
            !node.isLeaf && local > 0.55 && layerOpacity > 0.5;
          group.classList.toggle("is-on", litBranch || litLeaf);
          group.classList.toggle(
            "is-peek",
            !node.isLeaf && layerOpacity < 1 && layerOpacity >= 0.35,
          );
          group.classList.toggle(
            "is-dimmed",
            layerOpacity < 0.6 && layerOpacity > 0.05,
          );
          group.classList.toggle(
            "is-category-active",
            currentMode === "overview" &&
              node.depth === 1 &&
              node.id === currentHighlight,
          );
        }
        if (edge) {
          const parent = node.parentId
            ? nodeById.get(node.parentId)
            : undefined;
          const parentLayer = parent
            ? nodeLayerOpacity(
                parent,
                currentMode,
                currentExploreId,
                currentExplorePage,
                currentHighlight,
                fullNodes,
                skillTree,
                treeConfig,
              )
            : 1;
          const edgeLocal =
            reveal >= 1
              ? 1
              : Math.min(
                  Math.max(
                    (reveal - (node.depth - 1) / (maxDepth + 0.8)) / 0.28,
                    0,
                  ),
                  1,
                );
          const edgeOpacity =
            Math.min(layerOpacity, parentLayer) *
            (reveal >= 1 || currentMode === "explore" ? 1 : edgeLocal);
          edge.style.removeProperty("stroke-dasharray");
          edge.style.removeProperty("stroke-dashoffset");
          edge.style.opacity = String(edgeOpacity);
        }
      });
    },
    [fullNodes, maxDepth, nodeById],
  );

  const applyCamera = useCallback((camera: SkillCamera) => {
    cameraStateRef.current = camera;
    applyCameraToGroup(cameraGroupRef.current, camera);
  }, []);

  const animateCameraTo = useCallback(
    (target: SkillCamera, onComplete?: () => void) => {
      if (cameraTweenRef.current) {
        cameraTweenRef.current.kill();
        cameraTweenRef.current = null;
      }

      if (reducedMotion) {
        applyCamera(target);
        updateNodeLayers(1);
        onComplete?.();
        return;
      }

      cameraAnimatingRef.current = true;
      const from = {
        tx: cameraStateRef.current.tx,
        ty: cameraStateRef.current.ty,
        scale: cameraStateRef.current.scale,
        reveal: 1,
      };

      cameraTweenRef.current = gsap.to(from, {
        tx: target.tx,
        ty: target.ty,
        scale: target.scale,
        reveal: 1,
        duration: 0.68,
        ease: "power2.inOut",
        onUpdate: () => {
          applyCamera({
            tx: from.tx,
            ty: from.ty,
            scale: from.scale,
            pageLeafIds: target.pageLeafIds,
          });
          updateNodeLayers(from.reveal);
        },
        onComplete: () => {
          applyCamera(target);
          updateNodeLayers(1);
          cameraAnimatingRef.current = false;
          cameraTweenRef.current = null;
          onComplete?.();
        },
      });
    },
    [applyCamera, reducedMotion, updateNodeLayers],
  );

  const applyOverviewView = useCallback(
    (scrollProgress: number) => {
      const revealProgress = skillRevealProgress(scrollProgress);
      const highlight = scrollHighlightCategoryId(
        fullNodes,
        scrollProgress,
        treeConfig,
      );
      setHighlightId(highlight);
      highlightIdRef.current = highlight;
      applyCamera(
        computeOverviewCamera(
          fullNodes,
          treeConfig,
          VIEW_W,
          VIEW_H,
        ),
      );
      updateNodeLayers(revealProgress);
    },
    [applyCamera, fullNodes, treeConfig, updateNodeLayers],
  );

  const refreshCamera = useCallback(() => {
    if (cameraAnimatingRef.current) {
      return;
    }

    if (modeRef.current === "explore") {
      applyCamera(
        computeExploreCamera(
          fullNodes,
          exploreIdRef.current,
          explorePageRef.current,
          treeConfig,
          VIEW_W,
          VIEW_H,
          skillTree,
        ),
      );
      updateNodeLayers(1);
      return;
    }

    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');
    const progress =
      section && isInSkillsStickyRange(section)
        ? readSkillsChapterScroll(section).progress
        : 0;
    applyOverviewView(progress);
  }, [applyCamera, applyOverviewView, fullNodes, treeConfig, updateNodeLayers]);

  useEffect(() => {
    const onLayoutChange = () => refreshCamera();

    const board = skillBoardRef.current;
    const observer = board ? new ResizeObserver(onLayoutChange) : null;
    if (board) {
      observer?.observe(board);
    }
    window.addEventListener("resize", onLayoutChange);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onLayoutChange);
    };
  }, [refreshCamera]);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');
    syncSkillsChapterHeight(section, false);
  }, []);

  useLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');
    const progress =
      section && isInSkillsStickyRange(section)
        ? readSkillsChapterScroll(section).progress
        : 0;
    const reveal =
      modeRef.current === "explore" ? 1 : skillRevealProgress(progress);
    updateNodeLayers(reveal);
  }, [fullNodes, updateNodeLayers]);

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');

    if (reducedMotion) {
      const camera =
        mode === "overview"
          ? computeOverviewCamera(
              fullNodes,
              treeConfig,
              VIEW_W,
              VIEW_H,
            )
          : computeExploreCamera(
              fullNodes,
              exploreId,
              explorePage,
              treeConfig,
              VIEW_W,
              VIEW_H,
              skillTree,
            );
      applyCamera(camera);
      updateNodeLayers(1);
      return;
    }

    const syncFromSection = () => {
      if (cameraAnimatingRef.current || modeRef.current === "explore") {
        return;
      }

      if (!section || !isInSkillsStickyRange(section)) {
        return;
      }

      const { progress } = readSkillsChapterScroll(section);
      applyOverviewView(progress);
    };

    syncFromSection();

    return onScrollFrame(() => {
      syncFromSection();
    });
  }, [
    applyCamera,
    applyOverviewView,
    exploreId,
    explorePage,
    fullNodes,
    mode,
    reducedMotion,
    updateNodeLayers,
  ]);

  const returnToOverview = useCallback(() => {
    setMode("overview");
    setExploreId("root");
    setExplorePage(0);
    setSelectedLeafId(null);
    modeRef.current = "overview";
    exploreIdRef.current = "root";
    explorePageRef.current = 0;

    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');
    const progress =
      section && isInSkillsStickyRange(section)
        ? readSkillsChapterScroll(section).progress
        : 0;

    animateCameraTo(
      computeOverviewCamera(fullNodes, treeConfig, VIEW_W, VIEW_H),
      () => applyOverviewView(progress),
    );
  }, [animateCameraTo, applyOverviewView, fullNodes]);

  const enterExplore = useCallback(
    (id: string) => {
      if (id === "root") {
        returnToOverview();
        return;
      }

      setShowHint(false);
      setSelectedLeafId(null);
      setExploreId(id);
      setExplorePage(0);
      setMode("explore");
      exploreIdRef.current = id;
      explorePageRef.current = 0;
      modeRef.current = "explore";

      const target = computeExploreCamera(
        fullNodes,
        id,
        0,
        treeConfig,
        VIEW_W,
        VIEW_H,
        skillTree,
      );
      animateCameraTo(target);
    },
    [animateCameraTo, fullNodes, returnToOverview],
  );

  const collapseExploreFocus = useCallback(() => {
    const currentId = exploreIdRef.current;
    const path = findFocusPath(skillTree, currentId) ?? [skillTree];

    if (path.length <= 2) {
      returnToOverview();
      return;
    }

    const parentId = path[path.length - 2].id;
    enterExplore(parentId);
  }, [enterExplore, returnToOverview]);

  const goToExplorePage = useCallback(
    (index: number) => {
      if (index === explorePage || index < 0 || index >= explorePageCount) {
        return;
      }
      setExplorePage(index);
      explorePageRef.current = index;
      animateCameraTo(
        computeExploreCamera(
          fullNodes,
          exploreId,
          index,
          treeConfig,
          VIEW_W,
          VIEW_H,
          skillTree,
        ),
      );
    },
    [animateCameraTo, exploreId, explorePage, explorePageCount, fullNodes],
  );

  const handleNodeClick = useCallback(
    (node: LaidOutSkill) => {
      if (node.isLeaf) {
        setSelectedLeafId(node.id);
        return;
      }

      if (node.id === "root") {
        if (mode === "explore") {
          returnToOverview();
        }
        return;
      }

      if (mode === "overview" && node.depth === 1) {
        enterExplore(node.id);
        return;
      }

      if (mode === "explore") {
        if (node.id === exploreId) {
          collapseExploreFocus();
          return;
        }

        if (node.depth === 1) {
          enterExplore(node.id);
          return;
        }

        const pathIds = new Set(
          (findFocusPath(skillTree, exploreId) ?? []).map((n) => n.id),
        );
        if (pathIds.has(node.id) || node.depth > 1) {
          enterExplore(node.id);
        }
      }
    },
    [
      collapseExploreFocus,
      enterExplore,
      exploreId,
      mode,
      returnToOverview,
    ],
  );

  const isNodeInteractive = (node: LaidOutSkill) => {
    if (mode === "overview") {
      return node.depth === 1;
    }
    if (node.id === "root") {
      return true;
    }
    if (node.isLeaf) {
      const pathIds = new Set(focusPath.map((segment) => segment.id));
      return pathIds.has(node.parentId ?? "");
    }
    return !node.isLeaf;
  };

  return (
    <ChapterStage id="skills" index="04" title="Skills">
      <div className="skill-board" ref={skillBoardRef}>
        {mode === "overview" && showHint && !reducedMotion ? (
          <p className="skill-hint">Kategorie anklicken zum Vergrössern</p>
        ) : null}

        {mode === "explore" ? (
          <nav className="skill-breadcrumb" aria-label="Skill-Fokus">
            <span className="skill-breadcrumb-segment">
              <button
                type="button"
                className="skill-breadcrumb-btn"
                onClick={() => returnToOverview()}
              >
                Skills
              </button>
            </span>
            {focusPath.slice(1).map((segment, index, arr) => {
              const isLast = index === arr.length - 1;
              return (
                <span key={segment.id} className="skill-breadcrumb-segment">
                  <span className="skill-breadcrumb-sep" aria-hidden="true">
                    ›
                  </span>
                  <button
                    type="button"
                    className="skill-breadcrumb-btn"
                    onClick={() =>
                      isLast
                        ? collapseExploreFocus()
                        : enterExplore(segment.id)
                    }
                    aria-current={isLast ? "location" : undefined}
                  >
                    {segment.label}
                  </button>
                </span>
              );
            })}
          </nav>
        ) : null}

        {mode === "explore" && explorePageCount > 1 && !reducedMotion ? (
          <div className="skill-page-dots" role="tablist" aria-label="Skill-Seiten">
            {Array.from({ length: explorePageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                className={`skill-page-dot${index === explorePage ? " is-active" : ""}`}
                aria-selected={index === explorePage}
                aria-label={`Seite ${index + 1} von ${explorePageCount}`}
                onClick={() => goToExplorePage(index)}
              />
            ))}
            <span className="skill-page-label">
              {String(explorePage + 1).padStart(2, "0")} /{" "}
              {String(explorePageCount).padStart(2, "0")}
            </span>
          </div>
        ) : null}

        <svg
          className="skill-svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label="Skill-Baum"
        >
          <defs>
            <linearGradient id="skill-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(197,210,255,0.7)" />
              <stop offset="100%" stopColor="rgba(255,207,74,0.85)" />
            </linearGradient>
          </defs>
          <g ref={cameraGroupRef} className="skill-camera">
            {fullNodes.map((node) => {
              const parent = node.parentId
                ? nodeById.get(node.parentId)
                : undefined;
              if (!parent) {
                return null;
              }
              return (
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
                  d={edgePath(
                    parent.x,
                    parent.y,
                    parent.nodeRadius,
                    node.x,
                    node.y,
                    node.nodeRadius,
                  )}
                />
              );
            })}
            {fullNodes.map((node) => (
              <g
                key={node.id}
                ref={(el) => {
                  if (el) {
                    nodeRefs.current.set(node.id, el);
                  } else {
                    nodeRefs.current.delete(node.id);
                  }
                }}
                className={`skill-node${
                  node.isLeaf ? " skill-node--leaf" : " skill-node--branch"
                }${selectedLeafId === node.id ? " is-selected" : ""}`}
                opacity={reducedMotion ? 1 : 0}
                data-depth={node.depth}
                onClick={() => handleNodeClick(node)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleNodeClick(node);
                  }
                }}
                role="button"
                tabIndex={isNodeInteractive(node) ? 0 : -1}
                aria-label={node.label}
              >
                {isNodeInteractive(node) ? (
                  <circle
                    className="skill-node-hit"
                    cx={node.x}
                    cy={node.y}
                    r={node.nodeRadius + 8}
                    fill="transparent"
                  />
                ) : null}
                <circle
                  className="skill-node-core"
                  cx={node.x}
                  cy={node.y}
                  r={node.nodeRadius}
                />
                {node.level ? (
                  <circle
                    className="skill-level-ring"
                    cx={node.x}
                    cy={node.y}
                    r={node.nodeRadius + 4}
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${(node.level / 100) * (2 * Math.PI * (node.nodeRadius + 4))} ${2 * Math.PI * (node.nodeRadius + 4)}`}
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                  />
                ) : null}
                <text
                  className="skill-label"
                  x={node.x + node.nodeRadius + 6}
                  y={node.y + 4}
                  style={{ fontSize: `${node.labelSize}px` }}
                >
                  {node.label}
                </text>
                {node.level ? (
                  <text
                    className="skill-level"
                    x={node.x + node.nodeRadius + 6}
                    y={node.y + node.labelSize + 6}
                  >
                    {node.level}%
                  </text>
                ) : null}
              </g>
            ))}
          </g>
        </svg>
      </div>
    </ChapterStage>
  );
}
