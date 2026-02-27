import type { Metadata } from "next";
import { skills } from "@/content/portfolioData";

export const metadata: Metadata = {
  title: "Über mich | Bewerbungsportfolio",
  description:
    "Persönliches Profil, Arbeitsweise und Schwerpunkte für eine Bewerbung im digitalen Produktumfeld.",
};

export default function UeberMichPage() {
  return (
    <div className="page-wrap">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="section-eyebrow">Über mich</p>
        <h1 className="section-title">Ich verbinde Produktdenken und Engineering.</h1>
        <p className="mt-5 text-white/75">
          Ich arbeite gerne dort, wo Strategie, Design und Entwicklung
          zusammenkommen. In Projekten übernehme ich Verantwortung vom ersten
          Konzept bis zur sauberen technischen Umsetzung und messbaren
          Ergebnisverbesserung.
        </p>

        <div className="glass-panel mt-10 rounded-2xl p-7">
          <h2 className="text-xl font-semibold text-white">Arbeitsweise</h2>
          <p className="mt-3 text-white/75">
            Klar priorisieren, schnell iterieren, präzise umsetzen. Ich lege
            Wert auf gute Kommunikation, solide Architektur und nachhaltige
            Entwicklungsgeschwindigkeit im Team.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-white">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="glass-chip rounded-full px-3 py-1.5 text-sm text-white/85"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
