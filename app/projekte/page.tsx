import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/content/portfolioData";

export const metadata: Metadata = {
  title: "Projekte | Bewerbungsportfolio",
  description:
    "Ausgewählte Projekte mit Fokus auf Umsetzung, Technologien und messbaren Ergebnissen.",
};

export default function ProjektePage() {
  return (
    <div className="page-wrap">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 md:py-20">
        <p className="section-eyebrow">Projekte</p>
        <h1 className="section-title">Ausgewählte Arbeiten</h1>
        <p className="mt-5 max-w-3xl text-white/75">
          Diese Beispiele zeigen, wie ich Produktziele in konkrete Features und
          belastbare Ergebnisse übersetze.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
