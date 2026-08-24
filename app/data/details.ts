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
    title: "Co-Founder",
    summary:
      "Mitgründung einer Schweizer Softwareagentur in Bassersdorf für massgeschneiderte Web-Lösungen und eigene SaaS-Produkte",
    items: [
      "Webentwicklung mit React und Next.js",
      "Konzeption und Weiterentwicklung eigener SaaS-Produkte",
      "UI/UX und Frontend-Entwicklung",
    ],
  },
  {
    id: "career-side-1",
    eyebrow: "Nebenwege",
    title: "Verkehrskadetten Abt. Zürcher Unterland",
    summary:
      "Freiwilliges Engagement für Verkehrssicherheit durch Regulierung von Fussgängerstreifen und Unterstützung bei örtlichen Anlässen.",
  },
  {
    id: "career-side-2",
    eyebrow: "Nebenwege",
    title: "Activ Fitness Dielsdorf",
    summary: "",
  },
];

export function getDetail(id: string): Detail | undefined {
  return details.find((detail) => detail.id === id);
}
