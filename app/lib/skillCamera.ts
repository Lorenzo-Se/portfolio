import type { SkillNode, SkillTreeConfig } from "@/app/data/skills";
import {
  chunkLeaves,
  findFocusPath,
  findNode,
  skillBounds,
  skillBoundsWithLabels,
  type LaidOutSkill,
} from "@/app/lib/skillLayout";

export type SkillCamera = {
  tx: number;
  ty: number;
  scale: number;
  pageLeafIds: Set<string>;
};

export type SkillTreeMode = "overview" | "explore";

export function collectSubtreeIds(node: SkillNode): Set<string> {
  const ids = new Set<string>();
  const walk = (current: SkillNode) => {
    ids.add(current.id);
    current.children?.forEach(walk);
  };
  walk(node);
  return ids;
}

export function laidOutLeavesUnderFocus(
  nodes: LaidOutSkill[],
  focusId: string,
  tree: SkillNode,
): LaidOutSkill[] {
  const focusNode = findNode(tree, focusId) ?? tree;
  const subtreeIds =
    focusId === "root" ? null : collectSubtreeIds(focusNode);

  return nodes
    .filter((node) => {
      if (!node.isLeaf) {
        return false;
      }
      if (!subtreeIds) {
        return true;
      }
      return subtreeIds.has(node.id);
    })
    .sort((a, b) => a.x - b.x);
}

export function pageLeafIdsForView(
  nodes: LaidOutSkill[],
  focusId: string,
  pageIndex: number,
  tree: SkillNode,
  config: SkillTreeConfig,
): Set<string> {
  const leaves = laidOutLeavesUnderFocus(nodes, focusId, tree);
  const chunks = chunkLeaves(leaves, config.maxLeavesPerView);
  const page = Math.min(Math.max(pageIndex, 0), chunks.length - 1);
  return new Set(chunks[page].map((leaf) => leaf.id));
}

function overviewNodes(
  nodes: LaidOutSkill[],
  config: SkillTreeConfig,
): LaidOutSkill[] {
  return nodes.filter((node) => node.depth <= config.overviewMaxDepth);
}

export function computeOverviewBaseScale(
  nodes: LaidOutSkill[],
  config: SkillTreeConfig,
  viewW: number,
  viewH: number,
): number {
  const bounds = skillBounds(overviewNodes(nodes, config));
  return Math.min(
    (viewW * config.zoom.overviewPadding) / Math.max(bounds.width, 1),
    (viewH * config.zoom.overviewPadding) / Math.max(bounds.height, 1),
  );
}

export function computeOverviewCamera(
  nodes: LaidOutSkill[],
  config: SkillTreeConfig,
  viewW: number,
  viewH: number,
): SkillCamera {
  const bbox = overviewNodes(nodes, config);
  const bounds = skillBounds(bbox);
  const scale = computeOverviewBaseScale(nodes, config, viewW, viewH);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  return {
    tx: viewW / 2 - cx * scale,
    ty: viewH / 2 - cy * scale,
    scale,
    pageLeafIds: new Set(),
  };
}

export function computeExploreCamera(
  nodes: LaidOutSkill[],
  exploreId: string,
  pageIndex: number,
  config: SkillTreeConfig,
  viewW: number,
  viewH: number,
  tree: SkillNode,
): SkillCamera {
  const focusPath = findFocusPath(tree, exploreId) ?? [tree];
  const focusNode = focusPath[focusPath.length - 1];
  const pageLeafIds = pageLeafIdsForView(
    nodes,
    exploreId,
    pageIndex,
    tree,
    config,
  );

  const subtreeIds = collectSubtreeIds(focusNode);
  const fullBbox = nodes.filter(
    (node) => node.id === "root" || subtreeIds.has(node.id),
  );
  const fullBounds = skillBoundsWithLabels(fullBbox);

  const overviewScale = computeOverviewBaseScale(nodes, config, viewW, viewH);
  const idealScale = Math.min(
    (viewW * config.zoom.focusFill) / Math.max(fullBounds.width, 1),
    (viewH * 0.9) / Math.max(fullBounds.height, 1),
  );

  let scale = Math.max(
    idealScale,
    overviewScale * config.zoom.focusInMinMultiplier,
  );

  const cx = (fullBounds.minX + fullBounds.maxX) / 2;

  const siblingBranches = nodes.filter(
    (node) => node.depth === 1 && node.id !== focusNode.id,
  );
  const peekMargin = 64;

  for (const sibling of siblingBranches) {
    const deltaX = sibling.x - cx;
    if (deltaX > 0) {
      scale = Math.min(scale, (viewW / 2 + peekMargin) / deltaX);
    } else if (deltaX < 0) {
      scale = Math.min(scale, (-viewW / 2 - peekMargin) / deltaX);
    }
  }

  scale = Math.max(scale, overviewScale * 1.08);

  const pageBbox = nodes.filter(
    (node) =>
      node.id === "root" ||
      (subtreeIds.has(node.id) && !node.isLeaf) ||
      pageLeafIds.has(node.id),
  );
  const pageBounds = skillBoundsWithLabels(pageBbox);
  const pageCx = (pageBounds.minX + pageBounds.maxX) / 2;
  const pageCy = (pageBounds.minY + pageBounds.maxY) / 2;

  return {
    tx: viewW / 2 - pageCx * scale,
    ty: viewH / 2 - pageCy * scale,
    scale,
    pageLeafIds,
  };
}

export function interpolateSkillCamera(
  from: SkillCamera,
  to: SkillCamera,
  t: number,
): SkillCamera {
  const clamped = Math.min(Math.max(t, 0), 1);
  return {
    tx: from.tx + (to.tx - from.tx) * clamped,
    ty: from.ty + (to.ty - from.ty) * clamped,
    scale: from.scale + (to.scale - from.scale) * clamped,
    pageLeafIds: clamped < 0.5 ? from.pageLeafIds : to.pageLeafIds,
  };
}

export function skillRevealProgress(scrollProgress: number): number {
  return Math.min(scrollProgress / 0.55, 1);
}

export function scrollHighlightCategoryId(
  nodes: LaidOutSkill[],
  scrollProgress: number,
  config: SkillTreeConfig,
): string | null {
  if (!config.scrollHighlight) {
    return null;
  }

  const categories = nodes
    .filter((node) => node.depth === 1)
    .sort((a, b) => a.x - b.x);

  if (categories.length === 0) {
    return null;
  }

  const slot = scrollProgress * categories.length;
  const index = Math.min(Math.floor(slot), categories.length - 1);
  return categories[index]?.id ?? null;
}

export function nodeLayerOpacity(
  node: LaidOutSkill,
  mode: SkillTreeMode,
  exploreId: string,
  explorePage: number,
  highlightId: string | null,
  nodes: LaidOutSkill[],
  tree: SkillNode,
  config: SkillTreeConfig,
): number {
  if (mode === "overview") {
    if (node.depth > config.overviewMaxDepth) {
      return 0;
    }
    if (node.depth === 1 && highlightId && node.id === highlightId) {
      return 1;
    }
    if (node.depth === 1 && highlightId) {
      return 0.55;
    }
    return 1;
  }

  const focusNode = findNode(tree, exploreId);
  if (!focusNode) {
    return 1;
  }

  const focusPath = findFocusPath(tree, exploreId) ?? [tree];
  const focusPathIds = new Set(focusPath.map((segment) => segment.id));
  const subtreeIds = collectSubtreeIds(focusNode);
  const pageLeafIds = pageLeafIdsForView(
    nodes,
    exploreId,
    explorePage,
    tree,
    config,
  );

  if (node.id === "root") {
    return 0.88;
  }

  if (focusPathIds.has(node.id)) {
    if (node.isLeaf) {
      return pageLeafIds.has(node.id) ? 1 : 0.22;
    }
    return 1;
  }

  if (subtreeIds.has(node.id)) {
    return 0.35;
  }

  if (node.depth === 1) {
    return config.zoom.siblingPeekOpacity;
  }

  return 0;
}
