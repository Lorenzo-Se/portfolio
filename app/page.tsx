import type { Metadata } from "next";
import Link from "next/link";
import { HeroSlider } from "@/components/HeroSlider";
import { ProjectCard } from "@/components/ProjectCard";
import { heroSlides, projects, skills } from "@/content/portfolioData";

export const metadata: Metadata = {
  title: "Start | Bewerbungsportfolio",
  description:
    "Übersicht zu Profil, Projekten und Kontakt für Bewerbungen im Bereich Frontend und Produktentwicklung.",
};

export default function Home() {
  return (
    <div className="page-wrap">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-14 md:py-20">
        <HeroSlider slides={heroSlides} />

        <section className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="section-eyebrow">Profil</p>
            <h2 className="section-title">Technik mit klarem Produktfokus.</h2>
            <p className="mt-4 text-white/75">
              Ich entwickle performante Frontends und begleite Features entlang
              des gesamten Produktzyklus. Mein Ziel: komplexe Anforderungen in
              intuitive Erlebnisse übersetzen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            {skills.map((skill) => (
              <span
                key={skill}
                className="glass-chip rounded-full px-3 py-1.5 text-sm text-white/85"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Ausgewählte Arbeiten</p>
              <h2 className="section-title">Projekte mit messbarer Wirkung</h2>
            </div>
            <Link href="/projekte" className="text-sm text-[#58d5ff] hover:text-white">
              Alle Projekte ansehen
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-8 md:p-10">
          <p className="section-eyebrow">Nächster Schritt</p>
          <h2 className="section-title">Lass uns gemeinsam etwas Starkes bauen.</h2>
          <p className="mt-4 max-w-2xl text-white/75">
            Ich freue mich auf eine Rolle, in der ich Verantwortung übernehme,
            ein Team unterstütze und die Produktqualität sichtbar verbessere.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/kontakt" className="btn-primary">
              Gespräch vereinbaren
            </Link>
            <Link href="/lebenslauf" className="btn-secondary">
              Lebenslauf ansehen
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
