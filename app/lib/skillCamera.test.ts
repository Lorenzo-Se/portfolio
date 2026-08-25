import { describe, expect, it } from "vitest";
import { collectSkillIds, skillTree, skillTreeConfig } from "@/app/data/skills";
import {
  computeExploreCamera,
  computeOverviewCamera,
  scrollHighlightCategoryId,
} from "@/app/lib/skillCamera";
import { layoutSkillTree } from "@/app/lib/skillLayout";

describe("skill camera", () => {
  const nodes = layoutSkillTree(skillTree);
  const { width: viewW, height: viewH } = skillTreeConfig.viewport;

  it("keeps sibling branches visible when zooming into a branch", () => {
    const camera = computeExploreCamera(
      nodes,
      "frontend",
      0,
      skillTreeConfig,
      viewW,
      viewH,
      skillTree,
    );

    const toScreenX = (x: number) => x * camera.scale + camera.tx;
    const data = nodes.find((node) => node.id === "data")!;
    const backend = nodes.find((node) => node.id === "backend")!;
    const tools = nodes.find((node) => node.id === "tools")!;

    expect(toScreenX(data.x)).toBeGreaterThan(viewW * 0.35);
    expect(toScreenX(data.x)).toBeLessThan(viewW + 80);
    expect(toScreenX(tools.x)).toBeGreaterThan(viewW * 0.15);
    expect(toScreenX(backend.x)).toBeGreaterThan(-120);
    expect(toScreenX(backend.x)).toBeLessThan(viewW);
  });

  it("zooms in further than the overview", () => {
    const overview = computeOverviewCamera(
      nodes,
      skillTreeConfig,
      viewW,
      viewH,
    );
    const focused = computeExploreCamera(
      nodes,
      "frontend",
      0,
      skillTreeConfig,
      viewW,
      viewH,
      skillTree,
    );

    expect(focused.scale).toBeGreaterThan(overview.scale);
  });

  it("uses a fixed overview camera without page pan", () => {
    const overview = computeOverviewCamera(
      nodes,
      skillTreeConfig,
      viewW,
      viewH,
    );
    expect(overview.pageLeafIds.size).toBe(0);
    expect(overview.scale).toBeGreaterThan(0.85);
  });

  it("highlights categories while scrolling", () => {
    const early = scrollHighlightCategoryId(nodes, 0.05, skillTreeConfig);
    const late = scrollHighlightCategoryId(nodes, 0.85, skillTreeConfig);
    expect(early).toBe("backend");
    expect(late).toBe("tools");
  });
});

describe("skillTree ids", () => {
  it("uses globally unique node ids", () => {
    const ids = collectSkillIds(skillTree);
    expect(ids.length).toBe(new Set(ids).size);
  });
});
