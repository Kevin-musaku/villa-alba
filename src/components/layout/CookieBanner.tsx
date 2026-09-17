"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const CONSENT_KEY = "villa-alba-cookie-consent";

export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let shouldShow = true;
    try {
      shouldShow = !localStorage.getItem(CONSENT_KEY);
    } catch {
      shouldShow = true;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage (external system) once on mount to decide initial visibility
    if (shouldShow) setVisible(true);
  }, []);

  function accept(value: "all" | "necessary") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // localStorage non disponibile: il banner ricomparirà al prossimo caricamento, non bloccante.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-mist bg-paper/98 px-6 py-5 shadow-[var(--shadow-lg)] backdrop-blur-sm md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-relaxed text-graphite">
          {t("text")}{" "}
          <Link href="/cookie-policy" className="underline hover:text-ink">
            {t("linkLabel")}
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => accept("necessary")}
            className="rounded-[var(--radius-sm)] border border-mist px-4 py-2 text-xs uppercase tracking-[0.1em] text-charcoal transition-colors hover:bg-fog"
          >
            {t("necessaryOnly")}
          </button>
          <button
            onClick={() => accept("all")}
            className="rounded-[var(--radius-sm)] bg-ink px-4 py-2 text-xs uppercase tracking-[0.1em] text-paper transition-colors hover:bg-graphite"
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
