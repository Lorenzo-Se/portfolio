import type { SkillNode } from "@/app/data/skills";

export type LaidOutSkill = {
  id: string;
  label: string;
  level?: number;
  depth: number;
  x: number;
  y: number;
  parentId?: string;
  parentX?: number;
  parentY?: number;
};

type SizedNode = SkillNode & {
  width: number;
  children?: SizedNode[];
};

const COL_W = 168;
const DEPTH_H = 118;

function measure(node: SkillNode): SizedNode {
  if (!node.children?.length) {
    return {
      id: node.id,
      label: node.label,
      level: node.level,
      width: 1,
    };
  }
  const children = node.children.map(measure);
  const width = children.reduce((sum, child) => sum + child.width, 0);
  return {
    id: node.id,
    label: node.label,
    level: node.level,
    width,
    children,
  };
}

function place(
  node: SizedNode,
  left: number,
  depth: number,
  originY: number,
  parent?: LaidOutSkill,
  acc: LaidOutSkill[] = [],
): LaidOutSkill[] {
  const x = left + (node.width * COL_W) / 2;
  const y = originY - depth * DEPTH_H;
  const current: LaidOutSkill = {
    id: node.id,
    label: node.label,
    level: node.level,
    depth,
    x,
    y,
    parentId: parent?.id,
    parentX: parent?.x,
    parentY: parent?.y,
  };
  acc.push(current);
  if (!node.children?.length) {
    return acc;
  }
  let cursor = left;
  for (const child of node.children) {
    place(child, cursor, depth + 1, originY, current, acc);
    cursor += child.width * COL_W;
  }
  return acc;
}

export function layoutSkillTree(
  root: SkillNode,
  originY = 220,
): LaidOutSkill[] {
  const sized = measure(root);
  return place(sized, 0, 0, originY);
}

export function skillBounds(nodes: LaidOutSkill[]) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
