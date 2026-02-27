"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/content/portfolioData";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0f17]/60 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-white">
          MM
        </Link>
        <ul className="glass-soft flex flex-wrap items-center gap-1 rounded-full p-1 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-white/90 text-[#0b0f17]"
                      : "text-white/80 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
