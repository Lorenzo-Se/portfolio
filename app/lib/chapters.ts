export const chapters = [
  { id: "hero", number: "01", label: "Start" },
  { id: "career", number: "02", label: "Weg" },
  { id: "projects", number: "03", label: "Werk" },
  { id: "skills", number: "04", label: "Skills" },
  { id: "contact", number: "05", label: "Kontakt" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

export const chapterIds = chapters.map((chapter) => chapter.id);
