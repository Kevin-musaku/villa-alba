"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NAV_ITEMS: {
  key: "villa" | "territorio" | "vini" | "attivita" | "galleria" | "regole" | "contatti";
  href: string;
}[] = [
  { key: "villa", href: "#villa" },
  { key: "territorio", href: "#territorio" },
  { key: "vini", href: "#vini" },
  { key: "attivita", href: "#attivita" },
  { key: "galleria", href: "#galleria" },
  { key: "regole", href: "#regole" },
  { key: "contatti", href: "#contatti" },
];

export function Header() {
  const t = useTranslations("nav");
  const tLang = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function switchLocale(nextLocale: string) {
    router.replace(pathname, { locale: nextLocale });
    setLangOpen(false);
  }

  return (
    <header className="fixed top-0 z-50 w-full">
      <div
        aria-hidden
        className={`absolute inset-0 backdrop-blur-[6px] transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        } bg-white/[0.96] shadow-[0_1px_0_var(--color-line)]`}
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-mono text-base tracking-[0.06em] text-ink"
        >
          Villa Alba
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="group relative text-sm uppercase tracking-[0.12em] text-charcoal transition-colors hover:text-ink"
            >
              {t(item.key)}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="font-mono rounded-[var(--radius-xs)] border border-current px-3.5 py-2 text-[10px] tracking-[0.05em] text-charcoal transition-all duration-200 hover:-translate-y-px hover:text-ink"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              {locale.toUpperCase()} ▾
            </button>
            {langOpen && (
              <ul
                role="listbox"
                className="absolute right-0 mt-2.5 w-40 rounded-[var(--radius-md)] border border-mist bg-white py-1.5 shadow-[var(--shadow-lg)]"
              >
                {routing.locales.map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => switchLocale(l)}
                      className={`block w-full rounded-[var(--radius-xs)] px-3 py-2 text-left text-sm transition-colors hover:bg-paper ${
                        l === locale ? "text-ink font-semibold" : "text-graphite"
                      }`}
                    >
                      {tLang(l as "it" | "en" | "de" | "es" | "fr")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/prenota"
            className="font-mono rounded-[var(--radius-sm)] bg-ink px-5 py-2.5 text-[10px] tracking-[0.08em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-graphite hover:shadow-[var(--shadow-md)]"
          >
            {t("prenota")}
          </Link>
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-mist/60 bg-paper px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-5">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-base uppercase tracking-[0.1em] text-charcoal"
              >
                {t(item.key)}
              </a>
            ))}
            <Link
              href="/prenota"
              onClick={() => setMobileOpen(false)}
              className="font-mono mt-2 inline-block rounded-[var(--radius-sm)] bg-ink px-5 py-2.5 text-center text-[10px] tracking-[0.08em] text-white"
            >
              {t("prenota")}
            </Link>
          </nav>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-mist/60 pt-5">
            {routing.locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  switchLocale(l);
                  setMobileOpen(false);
                }}
                className={`text-sm uppercase tracking-[0.08em] ${
                  l === locale ? "text-ink font-medium" : "text-graphite"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
