import {
  TIMELINE_NOW,
  TIMELINE_START,
  careerSpans,
  careerTracks,
  monthsFromOrigin,
  type CareerSpan,
} from "@/app/data/career";

export const CAREER_VIEW = {
  width: 1100,
  padTop: 88,
  padLeft: 72,
  padRight: 28,
  padBottom: 48,
  pxPerMonth: 14,
  laneGap: 18,
} as const;

export type SpanLayout = CareerSpan & {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function totalCareerMonths(): number {
  return monthsFromOrigin("now");
}

export function careerHeight(): number {
  return (
    CAREER_VIEW.padTop +
    totalCareerMonths() * CAREER_VIEW.pxPerMonth +
    CAREER_VIEW.padBottom
  );
}

export function yOf(stamp: string): number {
  return CAREER_VIEW.padTop + monthsFromOrigin(stamp) * CAREER_VIEW.pxPerMonth;
}

export function laneWidth(): number {
  const inner = CAREER_VIEW.width - CAREER_VIEW.padLeft - CAREER_VIEW.padRight;
  const gaps = (careerTracks.length - 1) * CAREER_VIEW.laneGap;
  return (inner - gaps) / careerTracks.length;
}

export function layoutSpans(): SpanLayout[] {
  const width = laneWidth();
  return careerSpans.map((span) => {
    const trackIndex = careerTracks.findIndex((track) => track.id === span.trackId);
    const x =
      CAREER_VIEW.padLeft +
      Math.max(0, trackIndex) * (width + CAREER_VIEW.laneGap);
    const y = yOf(span.start);
    const height = Math.max(yOf(span.end) - y - 6, 36);
    return { ...span, x, y, width, height };
  });
}

export function yearTicks(): { year: number; y: number }[] {
  const startYear = Number(TIMELINE_START.slice(0, 4));
  const endYear = Number(TIMELINE_NOW.slice(0, 4));
  const years: { year: number; y: number }[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push({ year, y: yOf(`${year}-01`) });
  }
  return years;
}
