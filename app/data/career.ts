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
  location?: string;
  detailId: string;
  placeholder?: boolean;
};

/** Erster Monat der Zeitachse (YYYY-MM). */
export const TIMELINE_START = "2018-01";

/** „Heute“ für offene Spannen mit end: "now". */
export const TIMELINE_NOW = "2026-08";

export const careerTracks: CareerTrack[] = [
  { id: "education", label: "Ausbildung" },
  { id: "work", label: "Beruf" },
  { id: "side", label: "Nebenwege" },
];

export const careerSpans: CareerSpan[] = [
  {
    id: "edu-1",
    trackId: "education",
    label: "Ausbildung A",
    start: "2018-08",
    end: "2022-07",
    location: "Ort",
    detailId: "career-edu-1",
    placeholder: true,
  },
  {
    id: "edu-2",
    trackId: "education",
    label: "Ausbildung B",
    start: "2022-08",
    end: "now",
    location: "Ort",
    detailId: "career-edu-2",
    placeholder: true,
  },
  {
    id: "work-1",
    trackId: "work",
    label: "Tätigkeit A",
    start: "2021-06",
    end: "2023-12",
    location: "Ort",
    detailId: "career-work-1",
    placeholder: true,
  },
  {
    id: "work-2",
    trackId: "work",
    label: "Tätigkeit B",
    start: "2024-01",
    end: "now",
    location: "Ort",
    detailId: "career-work-2",
    placeholder: true,
  },
  {
    id: "side-1",
    trackId: "side",
    label: "Nebenweg A",
    start: "2020-03",
    end: "2022-10",
    detailId: "career-side-1",
    placeholder: true,
  },
  {
    id: "side-2",
    trackId: "side",
    label: "Nebenweg B",
    start: "2023-02",
    end: "now",
    detailId: "career-side-2",
    placeholder: true,
  },
];

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
