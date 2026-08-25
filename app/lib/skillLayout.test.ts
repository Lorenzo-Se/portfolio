import { describe, expect, it } from "vitest";
import { skillTree, skillTreeConfig } from "@/app/data/skills";
import {
  buildVisibleSkillTree,
  collectLeaves,
  findNode,
  layoutSkillSubtree,
  pruneTreeToLeaves,
  skillPageCount,
} from "@/app/lib/skillLayout";

const sampleTree = {
  id: "root",
  label: "Root",
  children: [
    {
      id: "a",
      label: "A",
      children: [
        { id: "a1", label: "A1", level: 80 },
        { id: "a2", label: "A2", level: 70 },
        { id: "a3", label: "A3", level: 60 },
      ],
    },
    {
      id: "b",
      label: "B",
      children: [
        { id: "b1", label: "B1", level: 90 },
        { id: "b2", label: "B2", level: 85 },
        { id: "b3", label: "B3", level: 75 },
      ],
    },
  ],
};

describe("layoutSkillSubtree", () => {
  it("places root above leaves", () => {
    const nodes = layoutSkillSubtree(sampleTree, skillTreeConfig);
    const root = nodes.find((node) => node.id === "root");
    const leaves = nodes.filter((node) => node.isLeaf);
    expect(root).toBeDefined();
    expect(leaves.length).toBe(6);
    for (const leaf of leaves) {
      expect(leaf.y).toBeGreaterThan(root!.y);
    }
  });
});

describe("pruneTreeToLeaves", () => {
  it("keeps only selected leaves and their ancestors", () => {
    const pruned = pruneTreeToLeaves(sampleTree, ["a1", "a2", "a3", "b1", "b2"]);
    expect(pruned).not.toBeNull();
    const leaves = collectLeaves(pruned!);
    expect(leaves.map((leaf) => leaf.id)).toEqual([
      "a1",
      "a2",
      "a3",
      "b1",
      "b2",
    ]);
    expect(findNode(pruned!, "b3")).toBeNull();
  });
});

describe("buildVisibleSkillTree", () => {
  it("paginates leaves into pages of five", () => {
    const page0 = buildVisibleSkillTree(
      sampleTree,
      "root",
      0,
      { ...skillTreeConfig, maxLeavesPerView: 5 },
    );
    const page1 = buildVisibleSkillTree(
      sampleTree,
      "root",
      1,
      { ...skillTreeConfig, maxLeavesPerView: 5 },
    );

    const leaves0 = page0.nodes.filter((node) => node.isLeaf).map((n) => n.id);
    const leaves1 = page1.nodes.filter((node) => node.isLeaf).map((n) => n.id);

    expect(leaves0).toEqual(["a1", "a2", "a3", "b1", "b2"]);
    expect(leaves1).toEqual(["b3"]);
  });

  it("uses multiple explore pages for a branch with many leaves", () => {
    const frontend = findNode(skillTree, "frontend");
    expect(frontend).not.toBeNull();
    expect(
      skillPageCount(frontend!, skillTreeConfig.maxLeavesPerView),
    ).toBe(2);
  });
});
