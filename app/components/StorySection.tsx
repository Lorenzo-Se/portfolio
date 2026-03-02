type StorySectionProps = {
  id: string;
  number: string;
  title: string;
  description: string;
  points: string[];
  cta: string;
  nextId?: string;
  variant?: "profile" | "projects" | "skills" | "contact";
};

export function StorySection({
  id,
  number,
  title,
  description,
  points,
  cta,
  nextId,
  variant = "profile",
}: StorySectionProps) {
  const variantVisualClass: Record<NonNullable<StorySectionProps["variant"]>, string> = {
    profile: "",
    projects: "section-visual-projects",
    skills: "section-visual-skills",
    contact: "section-visual-contact",
  };

  return (
    <section
      id={id}
      data-section
      className={`section section-${variant} relative min-h-[118vh] snap-start overflow-hidden`}
    >
      <div className="section-grid" aria-hidden="true" />
      <div className="section-noise" aria-hidden="true" />
      <div
        className={`section-visual ${variantVisualClass[variant]} pointer-events-none absolute left-[56%] top-[14%] z-1 aspect-square w-[min(34vw,520px)] opacity-65 max-lg:left-[44%] max-lg:top-[10%] max-lg:w-[min(54vw,340px)] max-sm:hidden`}
        aria-hidden="true"
      >
        <span />
        <span />
      </div>
      <div className="section-content section-content-split relative z-2 ml-auto mr-0 grid min-h-[96vh] w-[min(1500px,calc(100%-5rem))] grid-cols-[minmax(260px,0.85fr)_minmax(360px,1.15fr)] items-center gap-20 px-0 pb-0 pt-[5.7rem] pr-[calc(240px+2.6rem)] max-lg:w-[min(1200px,calc(100%-4rem))] max-lg:grid-cols-1 max-lg:items-end max-lg:gap-12 max-lg:pb-24 max-lg:pr-0 max-sm:w-[calc(100%-2.2rem)] max-sm:pt-[5.2rem]">
        <div className="section-left">
          <span className="section-number font-mono text-(--yellow-accent) text-[0.8rem] tracking-[0.24em] shadow-[0_0_14px_rgba(255,207,74,0.45)]">
            {number}
          </span>
          <h2 className="m-0 mt-4 text-[clamp(2rem,6.6vw,5.8rem)] leading-[0.9] uppercase tracking-[-0.03em]">
            {title}
          </h2>
        </div>
        <div className="section-right">
          <p className="m-0 max-w-[56ch] leading-[1.85] tracking-[0.02em] text-[#cbd0dc]">
            {description}
          </p>
          <ul className="m-0 mt-7 grid list-none gap-3.5 p-0">
            {points.map((point) => (
              <li
                key={point}
                className="text-foreground flex min-h-[2.2rem] items-center border-l border-[rgba(197,210,255,0.35)] pl-4"
              >
                {point}
              </li>
            ))}
          </ul>
          <div className="section-actions mt-7 flex items-center gap-4">
            <a
              className="section-cta text-foreground inline-flex items-center gap-2 border-b border-(--line) pb-1.5 text-[0.75rem] uppercase tracking-[0.09em] no-underline transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-(--yellow-accent) hover:text-(--yellow-accent)"
              href={nextId ? `#${nextId}` : `#${id}`}
            >
              {cta}
            </a>
            <span className="section-tag inline-flex h-[1.8rem] items-center border border-[rgba(255,207,74,0.35)] px-2.5 text-(--muted) text-[0.65rem] tracking-[0.14em]">
              [{id.toUpperCase()}]
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
