"use client";

import type { Detail } from "@/app/data/details";

type DetailPanelProps = {
  detail?: Detail;
  onClose: () => void;
};

export function DetailPanel({ detail, onClose }: DetailPanelProps) {
  return (
    <aside
      className={`detail-panel${detail ? " is-open" : ""}`}
      aria-hidden={!detail}
    >
      <button type="button" className="detail-close" onClick={onClose}>
        Schliessen
      </button>
      {detail ? (
        <>
          <span className="detail-eyebrow">{detail.eyebrow}</span>
          <h3>{detail.title}</h3>
          <p>{detail.summary}</p>
          {detail.items?.length ? (
            <ul>
              {detail.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}
