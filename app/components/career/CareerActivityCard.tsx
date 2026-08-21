"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { periodLabel } from "@/app/data/career";
import { getDetail } from "@/app/data/details";
import {
  trackStroke,
  type FlowBranchLayout,
} from "@/app/lib/careerLayout";

const ROTATE_MS = 12_000;

type CareerActivityCardProps = {
  active: FlowBranchLayout[];
};

export function CareerActivityCard({ active }: CareerActivityCardProps) {
  const [index, setIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);
  const activeKey = active.map((branch) => branch.id).join("|");

  useEffect(() => {
    setIndex(0);
    setCycleKey((current) => current + 1);
  }, [activeKey]);

  useEffect(() => {
    if (active.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % active.length);
      setCycleKey((current) => current + 1);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [active.length, activeKey]);

  if (active.length === 0) {
    return (
      <aside className="career-activity-card is-empty" aria-live="polite">
        <p className="career-activity-empty">Keine parallelen Tätigkeiten</p>
      </aside>
    );
  }

  const branch = active[index] ?? active[0];
  const detail = getDetail(branch.detailId);

  return (
    <aside className="career-activity-card" aria-live="polite">
      <div
        key={`${branch.id}-${cycleKey}`}
        className="career-activity-body"
        style={{ "--track-color": trackStroke(branch.trackId) } as CSSProperties}
      >
        <span className="career-activity-track">{branch.label}</span>
        <h3 className="career-activity-title">
          {detail?.title ?? branch.label}
        </h3>
        <p className="career-activity-period">
          {periodLabel(branch.start, branch.end)}
        </p>
        {detail?.summary ? (
          <p className="career-activity-summary">{detail.summary}</p>
        ) : null}
        {detail?.items?.length ? (
          <ul className="career-activity-items">
            {detail.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {active.length > 1 ? (
        <div
          className="career-activity-nav"
          role="tablist"
          aria-label="Parallele Tätigkeiten"
        >
          {active.map((entry, entryIndex) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              className={`career-activity-line${
                entryIndex === index ? " is-active" : ""
              }${entryIndex < index ? " is-done" : ""}`}
              aria-selected={entryIndex === index}
              aria-label={entry.label}
              onClick={() => {
                setIndex(entryIndex);
                setCycleKey((current) => current + 1);
              }}
            >
              <span className="career-activity-line-track">
                <span
                  key={entryIndex === index ? cycleKey : entry.id}
                  className="career-activity-line-fill"
                  style={
                    entryIndex === index
                      ? ({
                          animationDuration: `${ROTATE_MS}ms`,
                        } as CSSProperties)
                      : undefined
                  }
                />
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
