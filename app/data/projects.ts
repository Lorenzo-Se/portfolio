export type Project = {
  id: string;
  title: string;
  teaser: string;
  description: string;
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
    description:
      "myVKAZU ist ein Intranet für den Verein VKAZU und mein erstes eigenes Coding-Projekt. Die Anwendung bündelt Vereinsinformationen, interne Inhalte und einfache Verwaltungsfunktionen an einem Ort. Dabei habe ich die Grundlagen von Webentwicklung, Datenbankanbindung und dem Aufbau einer nutzbaren Oberfläche gelernt.",
    year: "2023",
    techStack: ["PHP", "HTML", "Bootstrap"],
    placeholder: false,
  },
  {
    id: "project-b",
    title: "ThreeRun",
    teaser: "Eine Website für die Anmeldung und Verwaltung von Langdistanzläufen und Märschen.",
    description:
      "ThreeRun ist eine Plattform für die Anmeldung und Verwaltung von Langdistanzläufen und Märschen. Organisatoren können Events verwalten, Teilnehmende registrieren sich online, und Strecken werden über OSRM berechnet. Die Anwendung verbindet ein modernes React-Frontend mit einer Laravel-API und nutzt Websockets für Echtzeit-Updates.",
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
    description:
      "Dieses Python-Tool extrahiert Transkripte aus allen Videos einer YouTube-Playlist und exportiert sie als CSV. Es eignet sich für Recherche, Archivierung oder die Weiterverarbeitung von Inhalten. Der Fokus liegt auf einem einfachen CLI-Workflow und sauber strukturierten Ausgabedaten.",
    year: "2026",
    techStack: ["Python"],
    githubUrl: "https://github.com/Lorenzo-Se/yt-playlist-transcript",
    placeholder: false,
  },
  {
    id: "project-d",
    title: "Dropbox Diashow",
    teaser: "Ein Tool, das die Bilder von einem Dropbox-Ordner als Diashow anzeigt.",
    description:
      "Die Dropbox Diashow zeigt Bilder aus einem freigegebenen Dropbox-Ordner als Vollbild-Diashow im Browser. Ideal für Präsentationen oder private Galerien ohne eigene Bildhosting-Infrastruktur. Frontend und Backend sind bewusst schlank gehalten, damit die Anwendung schnell einsatzbereit ist.",
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
    description:
      "Diese Raycast-Erweiterung verbindet mehrere Passwort-Manager in einer einheitlichen Oberfläche. Logins lassen sich direkt aus Raycast heraus suchen und öffnen, ohne zwischen Apps zu wechseln. TypeScript bildet die UI-Logik ab, Swift die native Integration mit den jeweiligen Passwort-Managern.",
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
    description:
      "Securities Manager ist eine Anwendung zur Verwaltung und Analyse von Wertpapieren. Portfolios, Positionen und Kennzahlen werden zentral erfasst und ausgewertet. Das Projekt ist noch in Entwicklung und verbindet ein Next.js-Frontend mit einer Laravel-API und PostgreSQL als Datenbank.",
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
    description:
      "Duck Drift ist ein Multiplayer-Web-Game, bei dem das Smartphone als Controller dient. Spieler steuern über ihr Handy ein Fahrzeug auf dem Bildschirm und treten in Echtzeit gegeneinander an. Websockets und Redis sorgen für niedrige Latenz, Express.js hostet die Spiellogik.",
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
    description:
      "Dieses Portfolio präsentiert meine Projekte, meinen Karriereweg und meine Skills in einer scroll-gesteuerten Experience. Next.js und Tailwind CSS bilden die Basis, GSAP und Lenis steuern die Animationen und das Scroll-Verhalten. Du befindest dich gerade auf dieser Seite.",
    year: "2026",
    techStack: ["Next.js", "Tailwind CSS"],
    demoUrl: "https://lorenzo.seminara.ch/",
    githubUrl: "https://github.com/Lorenzo-Se/portfolio",
    placeholder: false,
  },
];
