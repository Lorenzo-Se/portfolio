import type { Metadata } from "next";
import { timeline } from "@/content/portfolioData";

export const metadata: Metadata = {
  title: "Lebenslauf | Bewerbungsportfolio",
  description:
    "Übersicht der beruflichen Stationen, Verantwortungen und Entwicklungsschwerpunkte.",
};

export default function LebenslaufPage() {
  return (
    <div className="page-wrap">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 md:py-20">
        <p className="section-eyebrow">Lebenslauf</p>
        <h1 className="section-title">Berufliche Stationen</h1>

        <div className="mt-10 space-y-6">
          {timeline.map((item) => (
            <article
              key={item.title}
              className="glass-panel rounded-2xl p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#58d5ff]">
                {item.period}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">{item.title}</h2>
              <p className="mt-3 text-white/75">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
