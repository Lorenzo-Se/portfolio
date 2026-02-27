import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0f17]/65 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-white/70 md:flex-row md:items-center">
        <p>© {new Date().getFullYear()} Max Mustermann</p>
        <div className="flex items-center gap-4">
          <Link href="/kontakt" className="hover:text-white">
            Kontakt
          </Link>
          <Link href="/lebenslauf" className="hover:text-white">
            Lebenslauf
          </Link>
        </div>
      </div>
    </footer>
  );
}
