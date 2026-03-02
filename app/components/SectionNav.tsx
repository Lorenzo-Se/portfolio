"use client";

type NavItem = {
  id: string;
  number: string;
  label: string;
};

type SectionNavProps = {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SectionNav({ items, activeId, onSelect }: SectionNavProps) {
  const activeNumber = (() => {
    const current = items.find((item) => item.id === activeId);
    return current?.number ?? "0000";
  })();

  return (
    <aside
      className="fixed right-4 top-1/2 z-20 w-60 -translate-y-1/2 border border-[rgba(255,207,74,0.28)] bg-[rgba(3,5,10,0.74)] p-5 shadow-[0_0_0_1px_rgba(190,210,255,0.08),0_20px_40px_rgba(0,0,0,0.35)] backdrop-blur-md max-lg:right-4 max-lg:top-1/2 max-lg:bottom-auto max-lg:left-auto max-lg:w-60 max-lg:-translate-y-1/2 max-sm:left-3 max-sm:right-3 max-sm:top-3 max-sm:w-auto max-sm:translate-y-0 max-sm:p-3"
      aria-label="Section navigation"
    >
      <div className="mb-4 font-mono text-(--yellow-accent) text-[2.35rem] tracking-[0.12em] text-shadow-[0_0_18px_rgba(255,207,74,0.45)]">
        {activeNumber}
      </div>
      <ul className="m-0 grid list-none gap-2 p-0 max-sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`flex items-center justify-between gap-2 border-b border-[rgba(255,255,255,0.02)] px-0.5 py-1.5 text-[0.68rem] uppercase tracking-[0.12em] no-underline transition-[color,border-color,padding-left] duration-200 ${activeId === item.id
                ? "border-(--yellow-accent) pl-1.5 text-(--yellow-accent)"
                : "text-[#a0a9bb] hover:border-(--yellow-accent) hover:pl-1.5 hover:text-(--yellow-accent)"
                }`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(item.id);
              }}
            >
              <span>{item.number}</span>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-[rgba(197,210,255,0.18)] pt-3 text-(--muted) text-[0.64rem] uppercase tracking-[0.14em]">
        [Scroll / swipe to navigate]
      </p>
    </aside>
  );
}
