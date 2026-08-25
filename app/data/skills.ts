export type SkillNode = {
  id: string;
  label: string;
  level?: number;
  children?: SkillNode[];
};

export type SkillTreeConfig = {
  maxLeavesPerView: number;
  overviewMaxDepth: number;
  chapterScrollExtra: number;
  scrollHighlight: boolean;
  columnWidth: number;
  branchSlotWidth: number;
  depthHeight: number;
  originY: number;
  nodeRadius: {
    root: number;
    branch: number;
    subBranch: number;
    leaf: number;
  };
  labelSize: {
    root: number;
    branch: number;
    subBranch: number;
    leaf: number;
  };
  viewport: { width: number; height: number };
  zoom: {
    overviewPadding: number;
    focusFill: number;
    focusInMinMultiplier: number;
    siblingPeekOpacity: number;
  };
};

export const skillTreeConfig: SkillTreeConfig = {
  maxLeavesPerView: 5,
  overviewMaxDepth: 1,
  chapterScrollExtra: 320,
  scrollHighlight: true,
  columnWidth: 168,
  branchSlotWidth: 200,
  depthHeight: 110,
  originY: 72,
  nodeRadius: { root: 18, branch: 13, subBranch: 11, leaf: 20 },
  labelSize: { root: 13, branch: 14, subBranch: 12, leaf: 15 },
  viewport: { width: 1100, height: 480 },
  zoom: {
    overviewPadding: 0.88,
    focusFill: 0.72,
    focusInMinMultiplier: 1.42,
    siblingPeekOpacity: 0.45,
  },
};

export const skillTree: SkillNode = {
  id: "root",
  label: "Skills",
  children: [
    {
      id: "backend",
      label: "Backend",
      children: [
        {
          id: "backend-languages",
          label: "Sprachen",
          children: [
            { id: "be-lang-php", label: "PHP", level: 90 },
            { id: "be-lang-java", label: "Java", level: 75 },
            { id: "be-lang-csharp", label: "C#", level: 65 },
          ],
        },
        {
          id: "backend-frameworks",
          label: "Frameworks",
          children: [
            { id: "be-fw-laravel", label: "Laravel", level: 85 },
            { id: "be-fw-spring", label: "Spring Boot", level: 75 },
            { id: "be-fw-dotnet", label: ".NET", level: 65 },
          ],
        },
      ],
    },
    {
      id: "frontend",
      label: "Frontend",
      children: [
        {
          id: "frontend-languages",
          label: "Sprachen",
          children: [
            { id: "fe-lang-html", label: "HTML", level: 95 },
            { id: "fe-lang-css", label: "CSS", level: 90 },
            { id: "fe-lang-ts", label: "TypeScript", level: 85 },
            { id: "fe-lang-js", label: "JavaScript", level: 88 },
          ],
        },
        {
          id: "frontend-frameworks",
          label: "Frameworks/Libraries",
          children: [
            { id: "fe-fw-react", label: "React", level: 80 },
            { id: "fe-fw-next", label: "Next.js", level: 78 },
            { id: "fe-fw-tailwind", label: "Tailwind CSS", level: 75 },
            { id: "fe-fw-shadcn", label: "Shadcn/UI", level: 85 },
          ],
        },
      ],
    },
    {
      id: "data",
      label: "Daten",
      children: [
        { id: "data-mysql", label: "MySQL", level: 95 },
        { id: "data-postgresql", label: "PostgreSQL", level: 85 },
        { id: "data-mongodb", label: "MongoDB", level: 80 },
        { id: "data-redis", label: "Redis", level: 65 },
      ],
    },
    {
      id: "apis",
      label: "APIs",
      children: [
        { id: "api-rest", label: "RESTful", level: 95 },
        { id: "api-graphql", label: "GraphQL", level: 82 },
        { id: "api-websocket", label: "WebSocket", level: 75 },
      ],
    },
    {
      id: "tools",
      label: "Tools",
      children: [
        { id: "tool-docker", label: "Docker", level: 85 },
        { id: "tool-kubernetes", label: "Kubernetes", level: 75 },
        { id: "tool-git", label: "Git", level: 88 },
        { id: "tool-bash", label: "Bash", level: 90 },
        { id: "tool-python", label: "Python", level: 75 },
      ],
    },
  ],
};

export function collectSkillIds(node: SkillNode): string[] {
  const ids = [node.id];
  node.children?.forEach((child) => {
    ids.push(...collectSkillIds(child));
  });
  return ids;
}
