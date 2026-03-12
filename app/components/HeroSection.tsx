type HeroSectionProps = {
  id: string;
  name: string;
  subtitle: string;
};

export function HeroSection({ id, name, subtitle }: HeroSectionProps) {
  const [firstName, lastName = ""] = name.split(" ");

  return (
    <section
      id={id}
      data-section
      className="section section-hero relative min-h-[118vh] snap-start overflow-hidden scroll-mt-0"
    >
      <div className="section-grid" aria-hidden="true" />
      <div className="hero-orb hero-orb-a" aria-hidden="true" />
      <div className="hero-orb hero-orb-b" aria-hidden="true" />
      <div className="hero-wireframe" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="section-content hero-content relative z-2 ml-auto mr-0 flex min-h-screen w-[min(1500px,calc(100%-5rem))] flex-col justify-end px-0 pb-28 pt-[5.7rem] pr-[calc(240px+2.6rem)] max-lg:w-[min(1200px,calc(100%-4rem))] max-lg:pr-0 max-sm:w-[calc(100%-2.2rem)] max-sm:pt-[8.6rem]">
        <div className="hero-topline flex items-center justify-between gap-4">
          <p className="section-kicker m-0 mb-6 text-(--muted) text-[0.72rem] uppercase tracking-[0.24em]">
            [Digital Portfolio Experience]
          </p>
        </div>
        <h1 className="hero-title m-0 grid max-w-[10ch] text-[clamp(3.2rem,11vw,9.5rem)] leading-[0.86] uppercase tracking-[-0.045em] max-sm:max-w-[9ch]">
          <span>{firstName}</span>
          <span>{lastName}</span>
        </h1>
        <p className="hero-subtitle mt-6 max-w-[44ch] text-(--muted) text-[clamp(0.9rem,1.1vw,1rem)] uppercase tracking-[0.07em]">
          {subtitle}
        </p>
        <div className="hero-meta mt-10 flex flex-wrap gap-3">
          <span className="rounded-full border border-[rgba(255,207,74,0.35)] px-4 py-1.5 text-(--muted) text-[0.68rem] uppercase tracking-[0.14em]">
            [Location Placeholder]
          </span>
          <span className="rounded-full border border-[rgba(255,207,74,0.35)] px-4 py-1.5 text-(--muted) text-[0.68rem] uppercase tracking-[0.14em]">
            [Role Placeholder]
          </span>
          <span className="rounded-full border border-[rgba(255,207,74,0.35)] px-4 py-1.5 text-(--muted) text-[0.68rem] uppercase tracking-[0.14em]">
            [Availability Placeholder]
          </span>
        </div>
        <a
          className="hero-enter mt-9 w-fit border border-[rgba(255,207,74,0.45)] bg-[rgba(8,12,20,0.5)] px-4 py-3 text-(--yellow-accent) text-[0.68rem] uppercase tracking-[0.2em] no-underline transition-[background-color,border-color,box-shadow] duration-200 hover:border-(--yellow-accent) hover:bg-(--yellow-soft) hover:shadow-[0_0_0_1px_rgba(255,207,74,0.4),0_0_24px_rgba(255,207,74,0.22)]"
          href="#intro"
        >
          [Enter Portfolio]
        </a>
      </div>
    </section>
  );
}
