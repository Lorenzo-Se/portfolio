export type CareerRoute = "main" | "branch";

export type CareerTrack = {
  id: string;
  label: string;
};

export type CareerSpan = {
  id: string;
  trackId: string;
  label: string;
  start: string;
  end: string;
  /** Hauptader (Mitte) oder Nebenpfad (zweigt ab / führt zurück). */
  route: CareerRoute;
  /** Nur für branch: Seite relativ zur Hauptader. */
  branchSide?: "left" | "right";
  /** Nur für branch: Spur-Abstand von der Mitte (1 = nächste Spur). */
  branchLane?: number;
  /** Label-Position entlang des Eintrags (0 = Start, 1 = Ende). */
  labelAnchor?: number;
  location?: string;
  detailId: string;
  placeholder?: boolean;
};

/** Erster Monat der Zeitachse (YYYY-MM). */
export const TIMELINE_START = "2015-08";

/** „Heute“ für offene Spannen mit end: "now". */
export const TIMELINE_NOW = "2026-12";

export const careerTracks: CareerTrack[] = [
  { id: "education", label: "Ausbildung" },
  { id: "work", label: "Beruf" },
  { id: "side", label: "Freizeitbeschäftigung" },
];

export const careerSpans: CareerSpan[] = [
  {
    id: "edu-1",
    trackId: "education",
    label: "Primarschule Früebli",
    route: "main",
    start: "2015-08",
    end: "2018-07",
    location: "Dielsdorf",
    detailId: "career-edu-1",
    placeholder: false,
  },
  {
    id: "edu-2",
    trackId: "education",
    label: "Primarschule Gumpenwiesen",
    route: "main",
    start: "2018-08",
    end: "2021-07",
    location: "Dielsdorf",
    detailId: "career-edu-2",
    placeholder: false,
  },
  {
    id: "edu-3",
    trackId: "education",
    label: "Sekundarschule Dielsdorf",
    route: "main",
    start: "2021-08",
    end: "2023-07",
    location: "Dielsdorf",
    detailId: "career-edu-3",
    placeholder: false,
  },
  {
    id: "edu-4",
    trackId: "education",
    label: "MNG Rämibühl",
    route: "main",
    start: "2023-08",
    end: "2024-07",
    location: "Zürich",
    detailId: "career-edu-4",
    placeholder: false,
  },
  {
    id: "edu-5",
    trackId: "education",
    label: "Kantonsschule Hottingen",
    route: "main",
    start: "2024-08",
    end: "2028-07",
    location: "Zürich",
    detailId: "career-edu-5",
    placeholder: false,
  },
  {
    id: "work-1",
    trackId: "work",
    label: "ThreeCode GmbH",
    route: "branch",
    branchSide: "right",
    branchLane: 1,
    start: "2024-11",
    end: "now",
    location: "Ort",
    detailId: "career-work-1",
    placeholder: false,
  },
  {
    id: "side-1",
    trackId: "side",
    label: "Verkehrskadett",
    route: "branch",
    branchSide: "left",
    branchLane: 2,
    start: "2022-04",
    end: "now",
    detailId: "career-side-1",
    placeholder: false,
  },
  {
    id: "side-2",
    trackId: "side",
    label: "Kraftsport",
    route: "branch",
    branchSide: "left",
    branchLane: 1,
    labelAnchor: 0.78,
    start: "2026-05",
    end: "now",
    detailId: "career-side-2",
    placeholder: false,
  },
];

export function isOngoingSpan(span: CareerSpan): boolean {
  return span.end === "now";
}

/** Endzeitpunkt für Layout/Geometrie – nie hinter TIMELINE_NOW. */
export function spanVisualEnd(span: CareerSpan): string {
  const resolved = resolveEnd(span.end);
  if (monthsFromOrigin(resolved) > monthsFromOrigin(TIMELINE_NOW)) {
    return TIMELINE_NOW;
  }
  return resolved;
}

/** Linie läuft bis zur Now-Markierung (end: "now" oder Enddatum danach). */
export function spanReachesNowMarker(span: CareerSpan): boolean {
  if (span.end === "now") {
    return true;
  }
  return monthsFromOrigin(resolveEnd(span.end)) > monthsFromOrigin(TIMELINE_NOW);
}

export function spanHasLayoutEndEvent(span: CareerSpan): boolean {
  return !spanReachesNowMarker(span);
}

export function isMainRoute(span: CareerSpan): boolean {
  return span.route === "main";
}

export function isBranchRoute(span: CareerSpan): boolean {
  return span.route === "branch";
}

export function resolveEnd(end: string): string {
  return end === "now" ? TIMELINE_NOW : end;
}

export function monthsFromOrigin(stamp: string): number {
  const value = resolveEnd(stamp);
  const [year, month] = value.split("-").map(Number);
  const [originYear, originMonth] = TIMELINE_START.split("-").map(Number);
  return (year - originYear) * 12 + (month - originMonth);
}

export function periodLabel(start: string, end: string): string {
  const format = (value: string) => {
    if (value === "now") {
      return "heute";
    }
    const [year, month] = value.split("-");
    return `${month}.${year}`;
  };
  return `${format(start)} – ${format(end)}`;
}
