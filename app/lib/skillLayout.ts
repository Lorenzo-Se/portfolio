import type { SkillNode, SkillTreeConfig } from "@/app/data/skills";
import { skillTreeConfig } from "@/app/data/skills";

export type LaidOutSkill = {
  id: string;
  label: string;
  level?: number;
  depth: number;
  isLeaf: boolean;
  x: number;
  y: number;
  nodeRadius: number;
  labelSize: number;
  parentId?: string;
  parentX?: number;
  parentY?: number;
};

export type LeafInfo = {
  id: string;
  path: string[];
};

type SizedNode = SkillNode & {
  width: number;
  children?: SizedNode[];
};

function measure(node: SkillNode, columnWidth: number): SizedNode {
  if (!node.children?.length) {
    return {
      id: node.id,
      label: node.label,
      level: node.level,
      width: 1,
    };
  }
  const children = node.children.map((child) => measure(child, columnWidth));
  const width = children.reduce((sum, child) => sum + child.width, 0);
  return {
    id: node.id,
    label: node.label,
    level: node.level,
    width,
    children,
  };
}

/** Focus shows only leaves (no sub-branches), e.g. Tools or Backend › Sprachen. */
export function isTerminalFocus(node: SkillNode): boolean {
  const children = node.children;
  if (!children?.length) {
    return true;
  }
  return children.every((child) => !child.children?.length);
}

export function findNode(root: SkillNode, id: string): SkillNode | null {
  if (root.id === id) {
    return root;
  }
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}

export function findFocusPath(
  root: SkillNode,
  id: string,
  acc: SkillNode[] = [],
): SkillNode[] | null {
  if (root.id === id) {
    return [...acc, root];
  }
  for (const child of root.children ?? []) {
    const path = findFocusPath(child, id, [...acc, root]);
    if (path) {
      return path;
    }
  }
  return null;
}

export function collectLeaves(
  node: SkillNode,
  path: string[] = [],
): LeafInfo[] {
  if (!node.children?.length) {
    return [{ id: node.id, path: [...path, node.id] }];
  }
  return node.children.flatMap((child) =>
    collectLeaves(child, [...path, node.id]),
  );
}

export function pruneTreeToLeaves(
  node: SkillNode,
  leafIds: Set<string> | string[],
): SkillNode | null {
  const ids = leafIds instanceof Set ? leafIds : new Set(leafIds);
  if (!node.children?.length) {
    return ids.has(node.id) ? { ...node } : null;
  }
  const children = node.children
    .map((child) => pruneTreeToLeaves(child, ids))
    .filter((child): child is SkillNode => child !== null);
  if (children.length === 0) {
    return null;
  }
  return {
    id: node.id,
    label: node.label,
    level: node.level,
    children,
  };
}

export function chunkLeaves<T>(leaves: T[], pageSize: number): T[][] {
  if (leaves.length === 0) {
    return [[]];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < leaves.length; i += pageSize) {
    chunks.push(leaves.slice(i, i + pageSize));
  }
  return chunks;
}

export function skillPageCount(
  focusNode: SkillNode,
  maxLeavesPerView: number = skillTreeConfig.maxLeavesPerView,
): number {
  const leaves = collectLeaves(focusNode);
  if (leaves.length === 0) {
    return 1;
  }
  return Math.ceil(leaves.length / maxLeavesPerView);
}

export function nodeVisual(
  depth: number,
  isLeaf: boolean,
  config: SkillTreeConfig,
): { nodeRadius: number; labelSize: number } {
  if (isLeaf) {
    return {
      nodeRadius: config.nodeRadius.leaf,
      labelSize: config.labelSize.leaf,
    };
  }
  if (depth === 0) {
    return {
      nodeRadius: config.nodeRadius.root,
      labelSize: config.labelSize.root,
    };
  }
  if (depth === 1) {
    return {
      nodeRadius: config.nodeRadius.branch,
      labelSize: config.labelSize.branch,
    };
  }
  return {
    nodeRadius: config.nodeRadius.subBranch,
    labelSize: config.labelSize.subBranch,
  };
}

function place(
  node: SizedNode,
  left: number,
  depth: number,
  originY: number,
  depthHeight: number,
  columnWidth: number,
  config: SkillTreeConfig,
  parent?: LaidOutSkill,
  acc: LaidOutSkill[] = [],
  branchSlotWidth?: number,
): LaidOutSkill[] {
  const naturalWidth = node.width * columnWidth;
  const layoutSpan = branchSlotWidth ?? naturalWidth;
  const x = left + layoutSpan / 2;
  const y = originY + depth * depthHeight;
  const isLeaf = !node.children?.length;
  const visual = nodeVisual(depth, isLeaf, config);
  const current: LaidOutSkill = {
    id: node.id,
    label: node.label,
    level: node.level,
    depth,
    isLeaf,
    x,
    y,
    nodeRadius: visual.nodeRadius,
    labelSize: visual.labelSize,
    parentId: parent?.id,
    parentX: parent?.x,
    parentY: parent?.y,
  };
  acc.push(current);
  if (!node.children?.length) {
    return acc;
  }
  let childCursor =
    branchSlotWidth !== undefined
      ? left + (branchSlotWidth - naturalWidth) / 2
      : left;
  for (const child of node.children) {
    place(
      child,
      childCursor,
      depth + 1,
      originY,
      depthHeight,
      columnWidth,
      config,
      current,
      acc,
    );
    childCursor += child.width * columnWidth;
  }
  return acc;
}

export function layoutSkillSubtree(
  root: SkillNode,
  config: SkillTreeConfig = skillTreeConfig,
): LaidOutSkill[] {
  const sized = measure(root, config.columnWidth);
  const branchSlot = config.branchSlotWidth;

  if (!branchSlot || !sized.children?.length) {
    return place(
      sized,
      0,
      0,
      config.originY,
      config.depthHeight,
      config.columnWidth,
      config,
    );
  }

  const totalWidth = sized.children.length * branchSlot;
  const acc: LaidOutSkill[] = [];
  const rootVisual = nodeVisual(0, false, config);
  const rootNode: LaidOutSkill = {
    id: sized.id,
    label: sized.label,
    level: sized.level,
    depth: 0,
    isLeaf: false,
    x: totalWidth / 2,
    y: config.originY,
    nodeRadius: rootVisual.nodeRadius,
    labelSize: rootVisual.labelSize,
  };
  acc.push(rootNode);

  let cursor = 0;
  for (const child of sized.children) {
    place(
      child,
      cursor,
      1,
      config.originY,
      config.depthHeight,
      config.columnWidth,
      config,
      rootNode,
      acc,
      branchSlot,
    );
    cursor += branchSlot;
  }
  return acc;
}

export function layoutSkillTree(
  root: SkillNode,
  config: SkillTreeConfig = skillTreeConfig,
): LaidOutSkill[] {
  return layoutSkillSubtree(root, config);
}

export function buildVisibleSkillTree(
  root: SkillNode,
  focusId: string,
  pageIndex: number,
  config: SkillTreeConfig = skillTreeConfig,
  options?: { allLeaves?: boolean },
): { nodes: LaidOutSkill[]; focusNode: SkillNode; leafIds: string[] } {
  const focusNode = findNode(root, focusId) ?? root;
  const leaves = collectLeaves(focusNode);
  const pageSize = options?.allLeaves ? leaves.length : config.maxLeavesPerView;
  const chunks = chunkLeaves(leaves, Math.max(pageSize, 1));
  const page = Math.min(Math.max(pageIndex, 0), chunks.length - 1);
  const leafIds = chunks[page].map((leaf) => leaf.id);
  const pruned = pruneTreeToLeaves(focusNode, leafIds);
  if (!pruned) {
    return {
      nodes: layoutSkillSubtree(focusNode, config),
      focusNode,
      leafIds,
    };
  }
  return {
    nodes: layoutSkillSubtree(pruned, config),
    focusNode,
    leafIds,
  };
}

export function skillBounds(nodes: LaidOutSkill[]) {
  if (nodes.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const radii = nodes.map((node) => node.nodeRadius);
  const minX = Math.min(...xs.map((x, i) => x - radii[i]));
  const maxX = Math.max(...xs.map((x, i) => x + radii[i]));
  const minY = Math.min(...ys.map((y, i) => y - radii[i]));
  const maxY = Math.max(...ys.map((y, i) => y + radii[i]));
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/** Bounds including estimated label width (labels sit right of nodes). */
export function skillBoundsWithLabels(
  nodes: LaidOutSkill[],
  charWidthFactor = 0.58,
  labelGap = 6,
  extraPadding = 16,
): ReturnType<typeof skillBounds> {
  if (nodes.length === 0) {
    return skillBounds(nodes);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const labelWidth = node.label.length * node.labelSize * charWidthFactor;
    const labelMaxX =
      node.x + node.nodeRadius + labelGap + labelWidth + extraPadding;
    minX = Math.min(minX, node.x - node.nodeRadius);
    maxX = Math.max(maxX, labelMaxX);
    minY = Math.min(minY, node.y - node.nodeRadius);
    maxY = Math.max(
      maxY,
      node.y + node.nodeRadius + (node.level ? node.labelSize + 6 : 0),
    );
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
