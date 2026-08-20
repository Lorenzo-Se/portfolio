export type Project = {
  id: string;
  title: string;
  teaser: string;
  year: string;
  tags: string[];
  cover?: string;
  detailId: string;
  placeholder?: boolean;
};

export const projects: Project[] = [
  {
    id: "project-a",
    title: "Projekt Alpha",
    teaser: "Kurze Beschreibung des ersten Projekts.",
    year: "2024",
    tags: ["Tag A", "Tag B"],
    detailId: "project-a",
    placeholder: true,
  },
  {
    id: "project-b",
    title: "Projekt Beta",
    teaser: "Kurze Beschreibung des zweiten Projekts.",
    year: "2025",
    tags: ["Tag C", "Tag D"],
    detailId: "project-b",
    placeholder: true,
  },
  {
    id: "project-c",
    title: "Projekt Gamma",
    teaser: "Kurze Beschreibung des dritten Projekts.",
    year: "2025",
    tags: ["Tag E"],
    detailId: "project-c",
    placeholder: true,
  },
  {
    id: "project-d",
    title: "Projekt Delta",
    teaser: "Kurze Beschreibung des vierten Projekts.",
    year: "2026",
    tags: ["Tag F", "Tag G"],
    detailId: "project-d",
    placeholder: true,
  },
];
