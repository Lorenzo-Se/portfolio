export type SkillNode = {
  id: string;
  label: string;
  level?: number;
  children?: SkillNode[];
};

export const skillTree: SkillNode = {
  id: "root",
  label: "Skills",
  children: [
    {
      id: "backend",
      label: "Backend",
      children: [
        { id: "lang-a", label: "Sprache A", level: 88 },
        { id: "fw-a", label: "Framework A", level: 82 },
        { id: "api", label: "APIs", level: 90 },
      ],
    },
    {
      id: "frontend",
      label: "Frontend",
      children: [
        { id: "lang-b", label: "Sprache B", level: 84 },
        { id: "fw-b", label: "Framework B", level: 80 },
        { id: "css", label: "CSS", level: 86 },
      ],
    },
    {
      id: "data",
      label: "Daten",
      children: [
        { id: "sql", label: "SQL", level: 85 },
        { id: "db", label: "Datenbank", level: 78 },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      children: [
        { id: "git", label: "Git", level: 92 },
        { id: "ci", label: "CI / CD", level: 70 },
        { id: "cloud", label: "Cloud", level: 68 },
      ],
    },
  ],
};
