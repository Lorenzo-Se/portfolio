export type NavItem = {
  href: string;
  label: string;
};

export type HeroSlide = {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: string;
};

export type Project = {
  title: string;
  summary: string;
  tags: string[];
  result: string;
  year: string;
};

export type TimelineEntry = {
  period: string;
  title: string;
  description: string;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Start" },
  { href: "/ueber-mich", label: "Über mich" },
  { href: "/projekte", label: "Projekte" },
  { href: "/lebenslauf", label: "Lebenslauf" },
  { href: "/kontakt", label: "Kontakt" },
];

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "Bewerbungsportfolio",
    title: "Ich baue digitale Erlebnisse mit Substanz.",
    text: "Von der Idee bis zum Launch verbinde ich Produktdenken, sauberen Code und messbare Ergebnisse.",
    cta: "Projekte ansehen",
    href: "/projekte",
  },
  {
    eyebrow: "Fokus auf Wirkung",
    title: "Technik, die Nutzerinnen und Nutzer wirklich spüren.",
    text: "Ich optimiere Performance, Verständlichkeit und Conversion mit einem klaren Blick auf Business-Ziele.",
    cta: "Mehr über mich",
    href: "/ueber-mich",
  },
  {
    eyebrow: "Ready for next step",
    title: "Offen für Verantwortung im neuen Team.",
    text: "Ich suche eine Rolle, in der ich schnell Mehrwert liefere und gemeinsam ambitionierte Produkte weiterentwickle.",
    cta: "Kontakt aufnehmen",
    href: "/kontakt",
  },
];

export const skills = [
  "TypeScript",
  "React & Next.js",
  "Node.js",
  "Design Systems",
  "Performance",
  "Testing",
  "Accessibility",
  "Product Discovery",
];

export const projects: Project[] = [
  {
    title: "B2B Self-Service Portal",
    summary:
      "Konzeption und Umsetzung eines Portals für Angebots- und Vertragsprozesse mit klarer Nutzerführung.",
    tags: ["Next.js", "TypeScript", "API Integration"],
    result: "Lead-Zeit um 27% reduziert",
    year: "2025",
  },
  {
    title: "Analytics Dashboard Redesign",
    summary:
      "Neustrukturierung komplexer KPI-Strecken in ein fokussiertes Dashboard mit hoher Lesbarkeit.",
    tags: ["UX", "Frontend Architektur", "Data Viz"],
    result: "Tägliche Nutzung um 41% gesteigert",
    year: "2024",
  },
  {
    title: "Karriere-Landingpage Relaunch",
    summary:
      "Responsive Landingpage mit Storytelling-Fokus, optimierten Ladezeiten und klaren CTA-Pfaden.",
    tags: ["Performance", "SEO", "A/B Testing"],
    result: "Bewerbungsrate um 18% erhöht",
    year: "2023",
  },
];

export const timeline: TimelineEntry[] = [
  {
    period: "seit 2024",
    title: "Senior Frontend Developer",
    description:
      "Verantwortung für Architekturentscheidungen, Mentoring und Delivery in einem Produktteam.",
  },
  {
    period: "2021 - 2024",
    title: "Frontend Developer",
    description:
      "Entwicklung skalierbarer UI-Komponenten und enge Zusammenarbeit mit Design und Product.",
  },
  {
    period: "2018 - 2021",
    title: "Studium / Einstieg",
    description:
      "Grundlagen in Softwareentwicklung, Human-Centered Design und agiler Produktentwicklung.",
  },
];

export const contact = {
  email: "max.mustermann@example.com",
  phone: "+49 170 0000000",
  city: "Berlin",
  linkedin: "linkedin.com/in/maxmustermann",
  github: "github.com/maxmustermann",
};
