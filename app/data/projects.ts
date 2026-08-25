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
    teaser:
      "Vereins-Intranet für VKAZU — Mitglieder, Abmeldungen und interne Verwaltung an einem Ort. Mein erstes Coding-Projekt.",
    description:
      "Intranet-Lösung für den Verein VKAZU und Einstieg in die Webentwicklung. Mitglieder werden verwaltet, Abmeldungen erfasst und weitere Vereinsprozesse digital abgebildet. Von der Datenbank bis zur Oberfläche selbst umgesetzt — der Grundstein für spätere Full-Stack-Projekte.",
    year: "2023",
    techStack: ["PHP", "HTML", "Bootstrap"],
    placeholder: false,
  },
  {
    id: "project-b",
    title: "ThreeRun",
    teaser:
      "SaaS-Produkt von Threecode für Langdistanzläufe und Märsche — Online-Anmeldung für Teilnehmer, zentrale Event-Verwaltung für Organisatoren.",
    description:
      "ThreeRun ist ein Produkt von Threecode zur Organisation von Langdistanzläufen und Märschen. Teilnehmende melden sich online an; Organisatoren verwalten Betten, Parkplätze, Teilnehmerlisten und weitere Event-Details aus einer Oberfläche. Streckenberechnung über OSRM, Echtzeit-Updates per WebSocket.",
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
    placeholder: false,
  },
  {
    id: "project-c",
    title: "Youtube Playlist Transcriptions",
    teaser:
      "Transkripte einer ganzen YouTube-Playlist auf einmal extrahieren — mit Sprach-Fallback und optionaler Sammeldatei.",
    description:
      "CLI-Tool für Recherche und Archivierung: liest alle Videos einer Playlist, bevorzugt manuelle Untertitel, fällt auf Auto-Generated zurück und übersetzt bei Bedarf. Pro Video entsteht eine strukturierte TXT-Datei mit Titel, ID, URL und Transkripttext; optional eine kombinierte Ausgabe. Am Ende eine Zusammenfassung erfolgreicher und fehlgeschlagener Videos.",
    year: "2026",
    techStack: ["Python"],
    githubUrl: "https://github.com/Lorenzo-Se/yt-playlist-transcript",
    placeholder: false,
  },
  {
    id: "project-d",
    title: "Dropbox Diashow",
    teaser:
      "Vollbild-Diashow aus einem öffentlichen Dropbox-Ordner — ohne API-Token, Account oder Hosting.",
    description:
      "Fotos aus einem Shared Link werden über einen schlanken lokalen Python-Server geladen und im Browser als Diashow angezeigt. Acht Übergangseffekte, Ken-Burns-Zoom, Vollbild und Tastatursteuerung; neue Bilder im Ordner erscheinen nach konfigurierbarem Intervall automatisch. Start per Doppelklick-Skript — kein Docker, kein eigener Bildhost.",
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
    teaser:
      "Mehrere Passwort-Manager in Raycast vereinen — Einträge suchen, kopieren und direkt in die aktive App einfügen.",
    description:
      "Raycast-Extension mit einheitlicher Suche über Built-in- und externe CLI-Adapter. Passwort, Benutzername und TOTP lassen sich kopieren oder per Paste in die Vordergrund-App einfügen; Multi-Manager-Umschalter und Session-Lock mit Touch ID (lokal/dev). Erweiterbar über ein Stdio-Protokoll für Third-Party-Adapter — TypeScript für die UI, Swift für die native Biometrie-Integration.",
    year: "2026",
    techStack: ["Typescript", "Swift", "Raycast"],
    githubUrl: "https://github.com/Lorenzo-Se/raycast-pwm",
    placeholder: false,
  },
  {
    id: "project-f",
    title: "Kryptomanager",
    cover: "/projects/securities-manager.png",
    teaser:
      "Krypto-Portfolio selbst pflegen — Positionen erfassen, Gewinn verfolgen und den Überblick über alle Bestände behalten.",
    description:
      "Anwendung zur persönlichen Verwaltung von Kryptowährungen: Bestände manuell eintragen, Gewinne und Verluste auswerten und jederzeit nachvollziehen, wie viel wo liegt. Aktuell noch in Entwicklung.",
    year: "2026",
    techStack: ["Next.js", "Shadcn/UI", "REST API", "Laravel", "PostgreSQL"],
    githubUrl: "https://github.com/Lorenzo-Se/securities-manager",
    placeholder: false,
  },
  {
    id: "project-g",
    title: "Duck Drift",
    cover: "/projects/duck-drift.png",
    teaser:
      "2D-Rennspiel im Browser: Smartphone als Controller per Neigungssensor, bis zu vier Spieler in einer Lobby.",
    description:
      "Hackathon-Projekt (ca. 5 Stunden): Host-Bildschirm rendert das Rennen, Controller verbinden sich per QR-Code und steuern ihre Ente über Neigung und Touch-Buttons. Schlanker Express/WebSocket-Relay-Server ohne Build-Step; Highscores persistent über Redis oder In-Memory-Fallback. Bewusst minimal gehalten — reines HTML/CSS/JS ohne schweres Framework.",
    year: "2026",
    techStack: ["HTML", "CSS", "Express.js", "Websocket", "Redis", "Deplo.io", "Python"],
    demoUrl: "https://server.b206b21.deploio.app/",
    githubUrl: "https://github.com/Lorenzo-Se/duck-drift",
    placeholder: false,
  },
  {
    id: "project-h",
    title: "Portfolio",
    teaser:
      "Scroll-gesteuertes Bewerbungsportfolio mit Projekten, Karriereverlauf und Skill-Tree.",
    description:
      "Persönliches Portfolio als durchgängige Scroll-Experience: Projekte im Coverflow, Karriere als Zeitachse, Skills als interaktiver Baum. Next.js und Tailwind CSS als Basis; GSAP und Lenis für Animationen und sanftes Scroll-Verhalten. Alle Inhalte zentral in `app/data/` gepflegt.",
    year: "2026",
    techStack: ["Next.js", "Tailwind CSS"],
    demoUrl: "https://lorenzo.seminara.ch/",
    githubUrl: "https://github.com/Lorenzo-Se/portfolio",
    placeholder: false,
  },
];
