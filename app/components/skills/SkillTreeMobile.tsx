"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { skillTree, type SkillNode } from "@/app/data/skills";
import { findFocusPath } from "@/app/lib/skillLayout";
import { syncSkillsChapterHeight } from "@/app/lib/skillNavigation";
import { ChapterStage } from "@/app/components/ui/ChapterStage";

type SkillTreeMode = "overview" | "explore";

function isLeafNode(node: SkillNode): boolean {
  return !node.children?.length;
}

function LevelBar({ level }: { level: number }) {
  return (
    <div className="skill-mobile-level" aria-label={`${level}%`}>
      <div className="skill-mobile-level__track">
        <div
          className="skill-mobile-level__fill"
          style={{ width: `${level}%` }}
        />
      </div>
      <span className="skill-mobile-level__value">{level}%</span>
    </div>
  );
}

export function SkillTreeMobile() {
  const [mode, setMode] = useState<SkillTreeMode>("overview");
  const [exploreId, setExploreId] = useState("root");
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);

  const focusPath = useMemo(
    () =>
      mode === "explore"
        ? (findFocusPath(skillTree, exploreId) ?? [skillTree])
        : [skillTree],
    [exploreId, mode],
  );

  const exploreNode = focusPath[focusPath.length - 1];
  const overviewCategories = skillTree.children ?? [];
  const exploreItems = exploreNode.children ?? [];

  useEffect(() => {
    const section = document.querySelector<HTMLElement>('[data-chapter="skills"]');
    syncSkillsChapterHeight(section, true);
  }, []);

  const returnToOverview = useCallback(() => {
    setMode("overview");
    setExploreId("root");
    setSelectedLeafId(null);
  }, []);

  const enterExplore = useCallback(
    (id: string) => {
      if (id === "root") {
        returnToOverview();
        return;
      }
      setExploreId(id);
      setMode("explore");
      setSelectedLeafId(null);
    },
    [returnToOverview],
  );

  const collapseExploreFocus = useCallback(() => {
    const path = findFocusPath(skillTree, exploreId) ?? [skillTree];
    if (path.length <= 2) {
      returnToOverview();
      return;
    }
    enterExplore(path[path.length - 2].id);
  }, [enterExplore, exploreId, returnToOverview]);

  const handleItemPress = (node: SkillNode) => {
    if (isLeafNode(node)) {
      setSelectedLeafId(node.id);
      return;
    }
    enterExplore(node.id);
  };

  return (
    <ChapterStage id="skills" index="04" title="Skills">
      <div className="skill-mobile-board">
        {mode === "overview" ? (
          <p className="skill-hint">Kategorie antippen zum Öffnen</p>
        ) : (
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
        )}

        <ul className="skill-mobile-list" aria-label="Skills">
          {mode === "overview"
            ? overviewCategories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className="skill-mobile-item"
                    onClick={() => enterExplore(category.id)}
                  >
                    <span className="skill-mobile-item__label">
                      {category.label}
                    </span>
                    <span className="skill-mobile-item__chevron" aria-hidden>
                      ›
                    </span>
                  </button>
                </li>
              ))
            : exploreItems.map((item) => {
                const leaf = isLeafNode(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`skill-mobile-item${
                        leaf ? " skill-mobile-item--leaf" : ""
                      }${selectedLeafId === item.id ? " is-selected" : ""}`}
                      onClick={() => handleItemPress(item)}
                      aria-pressed={leaf ? selectedLeafId === item.id : undefined}
                    >
                      <span className="skill-mobile-item__label">
                        {item.label}
                      </span>
                      {leaf && item.level !== undefined ? (
                        <LevelBar level={item.level} />
                      ) : (
                        <span className="skill-mobile-item__chevron" aria-hidden>
                          ›
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
        </ul>
      </div>
    </ChapterStage>
  );
}
