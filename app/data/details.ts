export type Detail = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  items?: string[];
};

export const details: Detail[] = [
  {
    id: "career-edu-1",
    eyebrow: "Ausbildung",
    title: "Primarstufe",
    summary: "Schulhaus Früebli, Primarschule Dielsdorf.",
    items: [],
  },
  {
    id: "career-edu-2",
    eyebrow: "Ausbildung",
    title: "Primarstufe",
    summary: "Schulhaus Gumpenwiesen, Primarschule Dielsdorf.",
    items: [],
  },
  {
    id: "career-edu-3",
    eyebrow: "Ausbildung",
    title: "Sekundarabschluss A",
    summary: "Abschluss der Sekundarstufe I.",
    items: [],
  },
  {
    id: "career-edu-4",
    eyebrow: "Ausbildung",
    title: "Mathematisch-naturwissenschaftliches Gymnasium",
    summary: "Wechsel zur Informatikmittelschule (IMS) aufgrund vertieftem Interesse an Informatik.",
    items: [],
  },
  {
    id: "career-edu-5",
    eyebrow: "Ausbildung",
    title: "Informatikmittelschule",
    summary: "Berufliche Grundbildung mit vertiefter Allgemeinbildung in Informatik und Wirtschaft.",
    items: [
      "Informatiker EFZ, Fachrichtung Applikationsentwicklung",
      "Berufsmaturität Wirtschaft und Dienstleistungen, Typ Wirtschaft",
    ],
  },
  {
    id: "career-work-1",
    eyebrow: "Beruf",
    title: "Tätigkeit A",
    summary: "Platzhaltertext zur ersten beruflichen Station. Überlappt bewusst mit der Ausbildung.",
    items: ["Aufgabe 1", "Aufgabe 2"],
  },
  {
    id: "career-work-2",
    eyebrow: "Beruf",
    title: "Tätigkeit B",
    summary: "Platzhaltertext zur aktuellen Tätigkeit.",
    items: ["Verantwortung 1", "Verantwortung 2"],
  },
  {
    id: "career-side-1",
    eyebrow: "Nebenwege",
    title: "Nebenweg A",
    summary: "Platzhalter für parallele Aktivitäten — Verein, Freies, Engagement.",
  },
  {
    id: "career-side-2",
    eyebrow: "Nebenwege",
    title: "Nebenweg B",
    summary: "Platzhalter für eine laufende parallele Spur.",
  },
  {
    id: "project-a",
    eyebrow: "2024",
    title: "Projekt Alpha",
    summary: "Was das Projekt tut, warum es existiert, welche Rolle du hattest.",
    items: ["Feature 1", "Feature 2", "Feature 3"],
  },
  {
    id: "project-b",
    eyebrow: "2025",
    title: "Projekt Beta",
    summary: "Platzhalter für das zweite Projekt.",
    items: ["Feature 1", "Feature 2"],
  },
  {
    id: "project-c",
    eyebrow: "2025",
    title: "Projekt Gamma",
    summary: "Platzhalter für das dritte Projekt.",
    items: ["Feature 1", "Feature 2"],
  },
  {
    id: "project-d",
    eyebrow: "2026",
    title: "Projekt Delta",
    summary: "Platzhalter für das vierte Projekt.",
    items: ["Feature 1", "Feature 2"],
  },
];

export function getDetail(id: string): Detail | undefined {
  return details.find((detail) => detail.id === id);
}
