import {
  TIMELINE_NOW,
  TIMELINE_START,
  careerSpans,
  isBranchRoute,
  isMainRoute,
  monthsFromOrigin,
  periodLabel,
  spanHasLayoutEndEvent,
  spanReachesNowMarker,
  spanVisualEnd,
  type CareerSpan,
} from "@/app/data/career";

export const CAREER_VIEW = {
  width: 1100,
  padTop: 88,
  padLeft: 72,
  padRight: 28,
  padBottom: 48,
  pxPerMonth: 14,
} as const;

export const FLOW = {
  left: 140,
  right: CAREER_VIEW.width - 48,
  transition: 56,
  branchOffset: 118,
} as const;

/** Playhead bleibt in viewBox-Koordinaten auf dieser Y-Position. */
export const CAREER_ANCHOR_Y = 300;

export type LabelSide = "left" | "right";

export type FlowBranchLayout = CareerSpan & {
  path: string;
  lineX: number;
  labelSide: LabelSide;
  labelX: number;
  labelY: number;
  nodeX: number;
  nodeY: number;
  yStart: number;
  yEnd: number;
  isPrimary: boolean;
};

export type FlowTrunkSegment = {
  x: number;
  y1: number;
  y2: number;
};

type TimelineEvent = {
  y: number;
  spanId: string;
  kind: "start" | "end";
};

type Phase =
  | { type: "line"; x: number; y1: number; y2: number }
  | { type: "split"; fromX: number; toX: number; y: number }
  | { type: "merge"; fromX: number; toX: number; y: number };

type BranchSlot = {
  side: "left" | "right";
  lane: number;
};

type SpanBuildState = {
  phases: Phase[];
  runX: number;
  runStartY: number | null;
  onBranch: boolean;
  branchX: number | null;
};

export function totalCareerMonths(): number {
  return monthsFromOrigin("now");
}

export function careerHeight(): number {
  return (
    CAREER_VIEW.padTop +
    totalCareerMonths() * CAREER_VIEW.pxPerMonth +
    CAREER_VIEW.padBottom
  );
}

export function careerScrollTrack(): number {
  return Math.max(yOf("now") - yOf(TIMELINE_START), 640);
}

export function yOf(stamp: string): number {
  return CAREER_VIEW.padTop + monthsFromOrigin(stamp) * CAREER_VIEW.pxPerMonth;
}

export function flowCenter(): number {
  return (FLOW.left + FLOW.right) / 2;
}

function spanById(id: string): CareerSpan {
  const span = careerSpans.find((entry) => entry.id === id);
  if (!span) {
    throw new Error(`Unknown career span: ${id}`);
  }
  return span;
}

function spanStartOrder(a: string, b: string): number {
  const delta =
    monthsFromOrigin(spanById(a).start) - monthsFromOrigin(spanById(b).start);
  if (delta !== 0) {
    return delta;
  }
  return a.localeCompare(b);
}

function slotKey(slot: BranchSlot): string {
  return `${slot.side}-${slot.lane}`;
}

function xFromSlot(slot: BranchSlot): number {
  const sign = slot.side === "right" ? 1 : -1;
  return flowCenter() + sign * FLOW.branchOffset * slot.lane;
}

function activeBranchIds(active: Set<string>): string[] {
  return [...active]
    .filter((id) => isBranchRoute(spanById(id)))
    .sort(spanStartOrder);
}

function occupiedBranchSlots(
  branchIds: string[],
  excludeId?: string,
): Set<string> {
  const occupied = new Set<string>();

  for (const id of branchIds) {
    if (id === excludeId) {
      continue;
    }
    const span = spanById(id);
    if (span.branchSide && span.branchLane) {
      occupied.add(slotKey({ side: span.branchSide, lane: span.branchLane }));
    }
  }

  return occupied;
}

function resolveBranchSlot(
  spanId: string,
  concurrentBranchIds: string[],
): BranchSlot {
  const span = spanById(spanId);
  const occupied = occupiedBranchSlots(concurrentBranchIds, spanId);

  if (span.branchSide && span.branchLane) {
    const preferred = { side: span.branchSide, lane: span.branchLane };
    if (!occupied.has(slotKey(preferred))) {
      return preferred;
    }
  }

  for (let lane = 1; lane <= 4; lane += 1) {
    for (const side of ["right", "left"] as const) {
      const candidate = { side, lane };
      if (!occupied.has(slotKey(candidate))) {
        return candidate;
      }
    }
  }

  const index = concurrentBranchIds.indexOf(spanId);
  const lane = Math.floor(index / 2) + 1;
  return index % 2 === 0
    ? { side: "right", lane }
    : { side: "left", lane };
}

function branchXForSpan(spanId: string, active: Set<string>): number {
  const branches = activeBranchIds(active);
  if (!branches.includes(spanId)) {
    branches.push(spanId);
    branches.sort(spanStartOrder);
  }
  return xFromSlot(resolveBranchSlot(spanId, branches));
}

function hasMainActive(active: Set<string>): boolean {
  return [...active].some((id) => isMainRoute(spanById(id)));
}

function splitCurve(x1: number, y1: number, x2: number, y2: number): string {
  const t = FLOW.transition;
  return `C ${x1} ${y1 + t * 0.18}, ${x2} ${y1 + t * 0.78}, ${x2} ${y2}`;
}

function mergeCurve(x1: number, y0: number, x2: number, y1: number): string {
  const t = FLOW.transition;
  return `C ${x1} ${y0 + t * 0.22}, ${x2} ${y1 - t * 0.18}, ${x2} ${y1}`;
}

function consolidatePhases(phases: Phase[]): Phase[] {
  const merged: Phase[] = [];

  for (const phase of phases) {
    const last = merged[merged.length - 1];
    if (
      phase.type === "line" &&
      last?.type === "line" &&
      Math.abs(last.x - phase.x) < 0.5 &&
      Math.abs(last.y2 - phase.y1) < 0.5
    ) {
      last.y2 = phase.y2;
      continue;
    }
    merged.push({ ...phase });
  }

  return merged;
}

function buildPathFromPhases(phases: Phase[]): string {
  const compact = consolidatePhases(phases);
  if (compact.length === 0) {
    return "";
  }

  const parts: string[] = [];
  let cursorX = flowCenter();
  let cursorY = 0;
  let started = false;

  for (const phase of compact) {
    if (phase.type === "split") {
      const y0 = phase.y;
      const y1 = y0 + FLOW.transition;
      if (!started) {
        parts.push(`M ${phase.fromX} ${y0}`);
        started = true;
      } else {
        parts.push(`L ${cursorX} ${y0}`);
      }
      parts.push(splitCurve(phase.fromX, y0, phase.toX, y1));
      cursorX = phase.toX;
      cursorY = y1;
      continue;
    }

    if (phase.type === "merge") {
      const y1 = phase.y;
      const y0 = y1 - FLOW.transition;
      parts.push(`L ${cursorX} ${Math.max(y0, cursorY)}`);
      parts.push(mergeCurve(phase.fromX, y0, phase.toX, y1));
      cursorX = phase.toX;
      cursorY = y1;
      continue;
    }

    const y1 = Math.max(phase.y1, cursorY);
    const y2 = phase.y2;
    if (y2 <= y1 + 0.5) {
      continue;
    }

    if (!started) {
      parts.push(`M ${phase.x} ${y1}`);
      started = true;
    } else {
      parts.push(`L ${phase.x} ${y1}`);
    }
    parts.push(`L ${phase.x} ${y2}`);
    cursorX = phase.x;
    cursorY = y2;
  }

  return parts.join(" ");
}

function ensureSpanState(
  states: Map<string, SpanBuildState>,
  id: string,
): SpanBuildState {
  const existing = states.get(id);
  if (existing) {
    return existing;
  }
  const created: SpanBuildState = {
    phases: [],
    runX: flowCenter(),
    runStartY: null,
    onBranch: false,
    branchX: null,
  };
  states.set(id, created);
  return created;
}

function closeRun(state: SpanBuildState, y: number) {
  if (state.runStartY === null || y <= state.runStartY + 0.5) {
    return;
  }
  state.phases.push({
    type: "line",
    x: state.runX,
    y1: state.runStartY,
    y2: y,
  });
  state.runStartY = null;
}

function openRun(state: SpanBuildState, y: number) {
  state.runStartY = y;
}

const LABEL = {
  padX: 18,
  blockHeight: 36,
  gap: 10,
  charWidth: 7.8,
  subCharWidth: 6.4,
  edgeMargin: 22,
  lineCorridor: 14,
} as const;

type LineObstacle = {
  id: string;
  lineX: number;
  yStart: number;
  yEnd: number;
};

type LabelPlacement = {
  id: string;
  lineX: number;
  yStart: number;
  yEnd: number;
  side: LabelSide;
  labelY: number;
  title: string;
  sub: string;
};

function rangesOverlap(y1: number, y2: number, y3: number, y4: number): boolean {
  return y1 < y4 && y2 > y3;
}

function estimateLabelWidth(title: string, sub: string): number {
  return (
    Math.max(title.length * LABEL.charWidth, sub.length * LABEL.subCharWidth) + 16
  );
}

function labelTextX(lineX: number, side: LabelSide): number {
  return side === "right" ? lineX + LABEL.padX : lineX - LABEL.padX;
}

function labelBounds(placement: LabelPlacement) {
  const width = estimateLabelWidth(placement.title, placement.sub);
  const anchorX = labelTextX(placement.lineX, placement.side);
  const x = placement.side === "right" ? anchorX : anchorX - width;
  const y = placement.labelY - 14;
  return { x, y, width, height: LABEL.blockHeight, anchorX };
}

function labelsOverlap(a: LabelPlacement, b: LabelPlacement): boolean {
  const boxA = labelBounds(a);
  const boxB = labelBounds(b);
  return (
    boxA.x < boxB.x + boxB.width + LABEL.gap &&
    boxA.x + boxA.width + LABEL.gap > boxB.x &&
    boxA.y < boxB.y + boxB.height + LABEL.gap &&
    boxA.y + boxA.height + LABEL.gap > boxB.y
  );
}

function labelCrossesLine(
  placement: LabelPlacement,
  obstacle: LineObstacle,
): boolean {
  if (placement.id === obstacle.id) {
    return false;
  }

  const box = labelBounds(placement);
  if (!rangesOverlap(box.y, box.y + box.height, obstacle.yStart, obstacle.yEnd)) {
    return false;
  }

  const corridorLeft = obstacle.lineX - LABEL.lineCorridor;
  const corridorRight = obstacle.lineX + LABEL.lineCorridor;

  return (
    box.x < corridorRight + LABEL.gap &&
    box.x + box.width + LABEL.gap > corridorLeft
  );
}

function labelFitsOnSide(
  placement: LabelPlacement,
  side: LabelSide,
  obstacles: LineObstacle[],
): boolean {
  const width = estimateLabelWidth(placement.title, placement.sub);
  const anchorX = labelTextX(placement.lineX, side);

  if (side === "right") {
    let maxX = CAREER_VIEW.width - 24;
    for (const obstacle of obstacles) {
      if (obstacle.id === placement.id || obstacle.lineX <= placement.lineX + 1) {
        continue;
      }
      if (
        !rangesOverlap(
          placement.yStart,
          placement.yEnd,
          obstacle.yStart,
          obstacle.yEnd,
        )
      ) {
        continue;
      }
      maxX = Math.min(maxX, obstacle.lineX - LABEL.lineCorridor - LABEL.gap);
    }
    return anchorX + width <= maxX;
  }

  let minX: number = FLOW.left;
  for (const obstacle of obstacles) {
    if (obstacle.id === placement.id || obstacle.lineX >= placement.lineX - 1) {
      continue;
    }
    if (
      !rangesOverlap(
        placement.yStart,
        placement.yEnd,
        obstacle.yStart,
        obstacle.yEnd,
      )
    ) {
      continue;
    }
    minX = Math.max(minX, obstacle.lineX + LABEL.lineCorridor + LABEL.gap);
  }
  return anchorX - width >= minX;
}

function hasLabelConflict(
  target: LabelPlacement,
  all: LabelPlacement[],
  obstacles: LineObstacle[],
): boolean {
  if (all.some((other) => other.id !== target.id && labelsOverlap(target, other))) {
    return true;
  }
  if (obstacles.some((obstacle) => labelCrossesLine(target, obstacle))) {
    return true;
  }
  if (!labelFitsOnSide(target, target.side, obstacles)) {
    return true;
  }
  return false;
}

type RawBranchLayout = CareerSpan & {
  path: string;
  lineX: number;
  labelY: number;
  yStart: number;
  yEnd: number;
  isPrimary: boolean;
};

function defaultLabelSide(
  branch: RawBranchLayout,
  obstacles: LineObstacle[],
): LabelSide {
  if (isBranchRoute(branch) && branch.branchSide === "left") {
    return "left";
  }
  if (isBranchRoute(branch) && branch.branchSide === "right") {
    return "right";
  }

  const rightBranches = obstacles.filter(
    (obstacle) =>
      obstacle.id !== branch.id &&
      obstacle.lineX > flowCenter() + 0.5 &&
      rangesOverlap(branch.yStart, branch.yEnd, obstacle.yStart, obstacle.yEnd),
  );
  const leftBranches = obstacles.filter(
    (obstacle) =>
      obstacle.id !== branch.id &&
      obstacle.lineX < flowCenter() - 0.5 &&
      rangesOverlap(branch.yStart, branch.yEnd, obstacle.yStart, obstacle.yEnd),
  );

  const probe: LabelPlacement = {
    id: branch.id,
    lineX: branch.lineX,
    yStart: branch.yStart,
    yEnd: branch.yEnd,
    side: "right",
    labelY: branch.labelY,
    title: branch.label,
    sub: "",
  };

  if (rightBranches.length > 0 && labelFitsOnSide(probe, "left", obstacles)) {
    return "left";
  }
  if (leftBranches.length > 0 && labelFitsOnSide(probe, "right", obstacles)) {
    return "right";
  }
  if (rightBranches.length > 0) {
    return "left";
  }
  if (leftBranches.length > 0) {
    return "right";
  }
  return branch.lineX < flowCenter() - 0.5 ? "left" : "right";
}

function labelAnchorY(placement: LabelPlacement, span: CareerSpan): number {
  const spanHeight = placement.yEnd - placement.yStart;
  if (span.labelAnchor !== undefined) {
    return placement.yStart + spanHeight * span.labelAnchor;
  }
  if (spanReachesNowMarker(span) && isBranchRoute(span) && spanHeight < 200) {
    return placement.yStart + spanHeight * 0.72;
  }
  return placement.yStart + spanHeight / 2;
}

function clampLabelY(placement: LabelPlacement, y: number): number {
  const spanHeight = placement.yEnd - placement.yStart;
  const edgeMargin =
    spanHeight < 110 ? 12 : spanHeight < 180 ? 16 : LABEL.edgeMargin;
  const minY = placement.yStart + edgeMargin;
  const maxY = placement.yEnd - edgeMargin;
  if (maxY <= minY) {
    return placement.yStart + spanHeight / 2;
  }
  return Math.min(Math.max(y, minY), maxY);
}

function initialLabelY(yStart: number, yEnd: number, span: CareerSpan): number {
  return labelAnchorY(
    {
      id: span.id,
      lineX: 0,
      yStart,
      yEnd,
      side: "right",
      labelY: 0,
      title: span.label,
      sub: "",
    },
    span,
  );
}

function preferredBaseY(
  placement: LabelPlacement,
  obstacles: LineObstacle[],
  side: LabelSide,
): number {
  const span = spanById(placement.id);
  let candidate = labelAnchorY(placement, span);

  for (const obstacle of obstacles) {
    if (obstacle.id === placement.id) {
      continue;
    }

    const probe: LabelPlacement = { ...placement, side, labelY: candidate };
    if (!labelCrossesLine(probe, obstacle)) {
      continue;
    }

    if (
      !rangesOverlap(
        placement.yStart,
        placement.yEnd,
        obstacle.yStart,
        obstacle.yEnd,
      )
    ) {
      continue;
    }

    const spanHeight = placement.yEnd - placement.yStart;
    const obstacleStartsLater =
      obstacle.yStart > placement.yStart + spanHeight * 0.3;
    if (!obstacleStartsLater) {
      continue;
    }

    const clearAbove =
      obstacle.yStart - LABEL.gap - LABEL.blockHeight - 10;
    candidate = Math.min(candidate, clearAbove);
  }

  return clampLabelY(placement, candidate);
}

function tryPlacement(
  placement: LabelPlacement,
  all: LabelPlacement[],
  obstacles: LineObstacle[],
  labelY: number,
  side: LabelSide,
): boolean {
  const span = spanById(placement.id);
  const anchorY = labelAnchorY(placement, span);
  const targetY = Math.max(clampLabelY(placement, labelY), anchorY);
  placement.labelY = targetY;
  placement.side = side;
  return !hasLabelConflict(placement, all, obstacles);
}

function resolveLabelPlacement(
  placement: LabelPlacement,
  all: LabelPlacement[],
  obstacles: LineObstacle[],
) {
  const sides: LabelSide[] = [
    placement.side,
    placement.side === "right" ? "left" : "right",
  ];
  const maxShift = Math.min(
    280,
    Math.max(placement.yEnd - placement.yStart - LABEL.blockHeight, 0) / 2 + 64,
  );

  for (const side of sides) {
    const span = spanById(placement.id);
    const anchorY = labelAnchorY(placement, span);
    const baseY = Math.max(preferredBaseY(placement, obstacles, side), anchorY);
    const shortSpan = placement.yEnd - placement.yStart < 200;
    const shifts = shortSpan
      ? ([0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80] as const)
      : null;

    if (tryPlacement(placement, all, obstacles, baseY, side)) {
      return;
    }

    if (shortSpan && shifts) {
      for (const delta of shifts) {
        if (tryPlacement(placement, all, obstacles, baseY + delta, side)) {
          return;
        }
      }
      for (const delta of shifts) {
        if (delta === 0) {
          continue;
        }
        if (tryPlacement(placement, all, obstacles, anchorY - delta, side)) {
          return;
        }
      }
      continue;
    }

    for (let delta = 12; delta <= maxShift; delta += 12) {
      if (tryPlacement(placement, all, obstacles, baseY - delta, side)) {
        return;
      }
    }

    for (let delta = 12; delta <= maxShift; delta += 12) {
      if (tryPlacement(placement, all, obstacles, baseY + delta, side)) {
        return;
      }
    }
  }

  const span = spanById(placement.id);
  const anchorY = labelAnchorY(placement, span);
  placement.labelY = Math.max(
    preferredBaseY(placement, obstacles, sides[0] ?? placement.side),
    anchorY,
  );
  placement.side = sides[0] ?? placement.side;
}

function resolveLabelPlacements(
  placements: LabelPlacement[],
  obstacles: LineObstacle[],
) {
  const sorted = [...placements].sort(
    (a, b) => b.yEnd - b.yStart - (a.yEnd - a.yStart),
  );

  for (const placement of sorted) {
    resolveLabelPlacement(placement, placements, obstacles);
  }

  for (let pass = 0; pass < 8; pass += 1) {
    let changed = false;
    for (let index = 0; index < placements.length; index += 1) {
      for (let other = index + 1; other < placements.length; other += 1) {
        const a = placements[index];
        const b = placements[other];
        if (
          !labelsOverlap(a, b) &&
          !labelCrossesLine(a, {
            id: b.id,
            lineX: obstacles.find((o) => o.id === b.id)?.lineX ?? b.lineX,
            yStart: b.yStart,
            yEnd: b.yEnd,
          }) &&
          !labelCrossesLine(b, {
            id: a.id,
            lineX: obstacles.find((o) => o.id === a.id)?.lineX ?? a.lineX,
            yStart: a.yStart,
            yEnd: a.yEnd,
          })
        ) {
          continue;
        }

        const beforeY = b.labelY;
        const beforeSide = b.side;
        resolveLabelPlacement(b, placements, obstacles);
        if (b.labelY !== beforeY || b.side !== beforeSide) {
          changed = true;
        }

        const beforeAY = a.labelY;
        const beforeASide = a.side;
        resolveLabelPlacement(a, placements, obstacles);
        if (a.labelY !== beforeAY || a.side !== beforeASide) {
          changed = true;
        }
      }
    }
    if (!changed) {
      break;
    }
  }
}

function layoutBranchLabels(branches: RawBranchLayout[]): FlowBranchLayout[] {
  const obstacles: LineObstacle[] = branches.map((branch) => ({
    id: branch.id,
    lineX: branch.lineX,
    yStart: branch.yStart,
    yEnd: branch.yEnd,
  }));

  const placements: LabelPlacement[] = branches.map((branch) => ({
    id: branch.id,
    lineX: branch.lineX,
    yStart: branch.yStart,
    yEnd: branch.yEnd,
    side: defaultLabelSide(branch, obstacles),
    labelY: branch.labelY,
    title: branch.label,
    sub: `${periodLabel(branch.start, branch.end)}${
      branch.placeholder ? "  ·  Platzhalter" : ""
    }`,
  }));

  resolveLabelPlacements(placements, obstacles);

  const byId = new Map(placements.map((placement) => [placement.id, placement]));

  return branches.map((branch) => {
    const placement = byId.get(branch.id)!;
    const lineX = placement.lineX;
    const labelX = labelTextX(lineX, placement.side);

    return {
      ...branch,
      lineX,
      labelSide: placement.side,
      labelX,
      labelY: placement.labelY,
      nodeX: lineX,
      nodeY: placement.labelY,
    };
  });
}

export function layoutFlowBranches(): FlowBranchLayout[] {
  const timelineEnd = yOf("now");
  const events: TimelineEvent[] = careerSpans.flatMap((span) => {
    const items: TimelineEvent[] = [
      { y: yOf(span.start), spanId: span.id, kind: "start" as const },
    ];
    if (spanHasLayoutEndEvent(span)) {
      items.push({ y: yOf(span.end), spanId: span.id, kind: "end" as const });
    }
    return items;
  });

  const yValues = [...new Set(events.map((event) => event.y))].sort(
    (a, b) => a - b,
  );

  const active = new Set<string>();
  let prevY = yOf(TIMELINE_START);
  const spanStates = new Map<string, SpanBuildState>();

  for (const y of yValues) {
    const atY = events.filter((event) => event.y === y);
    const ends = atY.filter((event) => event.kind === "end");
    const starts = atY.filter((event) => event.kind === "start");
    const endingIds = new Set(ends.map((event) => event.spanId));

    if (y > prevY) {
      for (const id of active) {
        const state = ensureSpanState(spanStates, id);
        if (endingIds.has(id) && state.onBranch) {
          closeRun(state, y - FLOW.transition);
        } else {
          closeRun(state, y);
        }
      }
    }

    for (const event of ends) {
      const state = ensureSpanState(spanStates, event.spanId);
      const span = spanById(event.spanId);

      if (isBranchRoute(span)) {
        state.phases.push({
          type: "merge",
          fromX: state.runX,
          toX: flowCenter(),
          y,
        });
      } else {
        closeRun(state, y);
      }

      active.delete(event.spanId);
    }

    for (const id of active) {
      const state = ensureSpanState(spanStates, id);
      if (state.runStartY === null) {
        openRun(state, y);
      }
    }

    for (const event of starts) {
      active.add(event.spanId);
    }

    for (const event of starts) {
      const id = event.spanId;
      const span = spanById(id);
      const state = ensureSpanState(spanStates, id);

      if (isMainRoute(span)) {
        state.runX = flowCenter();
        state.onBranch = false;
        state.branchX = null;
        openRun(state, y);
        continue;
      }

      const branchX = branchXForSpan(id, active);
      state.phases.push({
        type: "split",
        fromX: flowCenter(),
        toX: branchX,
        y,
      });
      state.runX = branchX;
      state.branchX = branchX;
      state.onBranch = true;
      openRun(state, y + FLOW.transition);
    }

    for (const id of active) {
      if (starts.some((event) => event.spanId === id)) {
        continue;
      }
      const state = ensureSpanState(spanStates, id);
      if (state.runStartY === null) {
        openRun(state, y);
      }
    }

    prevY = y;
  }

  for (const id of active) {
    closeRun(ensureSpanState(spanStates, id), timelineEnd);
  }

  const raw = careerSpans.map((span) => {
    const state = spanStates.get(span.id);
    const phases = state?.phases ?? [];
    const yStart = yOf(span.start);
    const yEnd = yOf(spanVisualEnd(span));
    const labelY = initialLabelY(yStart, yEnd, span);
    const lineX =
      state?.branchX ??
      phases.findLast((phase) => phase.type === "line")?.x ??
      phases.find((phase) => phase.type === "split")?.toX ??
      flowCenter();

    return {
      ...span,
      path: buildPathFromPhases(phases),
      lineX,
      labelY,
      yStart,
      yEnd,
      isPrimary: isMainRoute(span),
    };
  });

  return layoutBranchLabels(raw);
}

export function layoutFlowTrunk(): FlowTrunkSegment[] {
  const events: TimelineEvent[] = careerSpans.flatMap((span) => {
    const items: TimelineEvent[] = [
      { y: yOf(span.start), spanId: span.id, kind: "start" as const },
    ];
    if (spanHasLayoutEndEvent(span)) {
      items.push({ y: yOf(span.end), spanId: span.id, kind: "end" as const });
    }
    return items;
  });

  const yValues = [...new Set(events.map((event) => event.y))].sort(
    (a, b) => a - b,
  );
  const timelineStart = yOf(TIMELINE_START);
  const timelineEnd = yOf("now");

  const active = new Set<string>();
  let prevY = timelineStart;
  const segments: FlowTrunkSegment[] = [];

  const processEventsAt = (y: number) => {
    const atY = events.filter((event) => event.y === y);
    for (const event of atY.filter((entry) => entry.kind === "end")) {
      active.delete(event.spanId);
    }
    for (const event of atY.filter((entry) => entry.kind === "start")) {
      active.add(event.spanId);
    }
  };

  for (const y of yValues) {
    if (y > prevY && !hasMainActive(active)) {
      segments.push({ x: flowCenter(), y1: prevY, y2: y });
    }
    processEventsAt(y);
    prevY = y;
  }

  if (timelineEnd > prevY && !hasMainActive(active)) {
    segments.push({ x: flowCenter(), y1: prevY, y2: timelineEnd });
  }

  return segments;
}

export function yearTicks(): { year: number; y: number }[] {
  const startYear = Number(TIMELINE_START.slice(0, 4));
  const endYear = Number(TIMELINE_NOW.slice(0, 4));
  const years: { year: number; y: number }[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push({ year, y: yOf(`${year}-01`) });
  }
  return years;
}

export function trackStroke(trackId: string): string {
  switch (trackId) {
    case "education":
      return "var(--accent)";
    case "work":
      return "var(--yellow-accent)";
    case "side":
      return "rgba(197, 210, 255, 0.55)";
    default:
      return "var(--line)";
  }
}

export function readCareerProgress(section: HTMLElement | null): number {
  if (!section) {
    return 0;
  }

  const fromStyle = Number.parseFloat(section.style.getPropertyValue("--p"));
  if (!Number.isNaN(fromStyle)) {
    return Math.min(Math.max(fromStyle, 0), 1);
  }

  const rect = section.getBoundingClientRect();
  const total = Math.max(rect.height - window.innerHeight, 1);
  const scrolled = Math.min(Math.max(-rect.top, 0), total);
  return scrolled / total;
}
