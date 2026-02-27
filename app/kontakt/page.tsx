import type { Metadata } from "next";
import { contact } from "@/content/portfolioData";

export const metadata: Metadata = {
  title: "Kontakt | Bewerbungsportfolio",
  description:
    "Kontaktseite mit direkter Erreichbarkeit für Anfragen rund um offene Positionen und Zusammenarbeit.",
};

export default function KontaktPage() {
  return (
    <div className="page-wrap">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
        <section>
          <p className="section-eyebrow">Kontakt</p>
          <h1 className="section-title">Lass uns ins Gespräch kommen.</h1>
          <p className="mt-5 text-white/75">
            Wenn du eine Rolle hast, bei der ich mit technischem Fokus und
            Ownership Mehrwert liefern kann, freue ich mich über deine Nachricht.
          </p>
        </section>

        <section className="glass-panel rounded-2xl p-7">
          <h2 className="text-lg font-semibold text-white">Direkte Kontaktdaten</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>E-Mail: {contact.email}</li>
            <li>Telefon: {contact.phone}</li>
            <li>Standort: {contact.city}</li>
            <li>LinkedIn: {contact.linkedin}</li>
            <li>GitHub: {contact.github}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
