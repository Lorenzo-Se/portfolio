export type Project = {
  id: string;
  title: string;
  teaser: string;
  year: string;
  techStack: string[];
  cover?: string;
  demoUrl?: string;
  githubUrl?: string;
  placeholder?: boolean;
};

export const projects: Project[] = [
  {
    id: "project-a",
    title: "myVKAZU",
    cover: "/projects/myVKAZU.png",
    teaser: "Ein Intranet für den Verein VKAZU. Dies war mein erstes Coding Projekt.",
    year: "2023",
    techStack: ["PHP", "HTML", "Bootstrap"],
    placeholder: false,
  },
  {
    id: "project-b",
    title: "ThreeRun",
    teaser: "Eine Website für die Anmeldung und Verwaltung von Langdistanzläufen und Märschen.",
    cover: "/projects/ThreeRun.png",
    year: "2025",
    techStack: [
      "React",
      "Shadcn/UI",
      "REST API",
      "Websocket",
      "Laravel",
      "MySQL",
      "OSRM",
    ],
    demoUrl: "https://dev.threerun.ch",
    placeholder: false,
  },
  {
    id: "project-c",
    title: "Youtube Playlist Transcriptions",
    teaser: "Ein Tool, das die Transkripte von YouTube-Playlists in einem CSV-Format exportiert.",
    year: "2026",
    techStack: ["Python"],
    githubUrl: "https://github.com/Lorenzo-Se/yt-playlist-transcript",
    placeholder: false,
  },
  {
    id: "project-d",
    title: "Dropbox Diashow",
    teaser: "Ein Tool, das die Bilder von einem Dropbox-Ordner als Diashow anzeigt.",
    year: "2026",
    techStack: ["Python", "HTML", "CSS", "JavaScript"],
    demoUrl: "https://lorenzo-se.github.io/diashow-dropbox/",
    githubUrl: "https://github.com/Lorenzo-Se/diashow-dropbox",
    placeholder: false,
  },
  {
    id: "project-e",
    title: "Raycast Password Manager Extension",
    cover: "/projects/raycast-pwm.png",
    teaser: "Raycast-Erweiterung, um auf mehrere Passwort-Manager und deren Logins direkt zuzugreifen.",
    year: "2026",
    techStack: ["Typescript", "Swift", "Raycast"],
    githubUrl: "https://github.com/Lorenzo-Se/raycast-pwm",
    placeholder: false,
  },
  {
    id: "project-f",
    title: "Securities Manager (work in progress)",
    cover: "/projects/securities-manager.png",
    teaser: "Ein Tool, um Wertpapiere zu verwalten und zu analysieren.",
    year: "2026",
    techStack: ["Next.js", "Shadcn/UI", "REST API", "Laravel", "PostgreSQL"],
    githubUrl: "https://github.com/Lorenzo-Se/securities-manager",
    placeholder: false,
  },
  {
    id: "project-g",
    title: "Duck Drift",
    cover: "/projects/duck-drift.png",
    teaser: "Ein Web-Game, bei dem man die das Handy als Controller nutzt und Renne fährt",
    year: "2026",
    techStack: ["HTML", "CSS", "Express.js", "Websocket", "Redis", "Deplo.io", "Python"],
    demoUrl: "https://server.b206b21.deploio.app/",
    githubUrl: "https://github.com/Lorenzo-Se/duck-drift",
    placeholder: false,
  },
  {
    id: "project-h",
    title: "Portfolio",
    teaser: "Mein persönliches Portfolio, das ich mit Next.js und Tailwind CSS erstellt habe. Sie befinden sich gerade hier.",
    year: "2026",
    techStack: ["Next.js", "Tailwind CSS"],
    demoUrl: "https://lorenzo.seminara.ch/",
    githubUrl: "https://github.com/Lorenzo-Se/portfolio",
    placeholder: false,
  }
];
