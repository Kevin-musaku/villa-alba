import { useTranslations } from "next-intl";
import { Mail, Phone, MapPin, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer id="contatti" className="border-t border-mist bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-mono text-lg tracking-[0.06em]">
              {t("title")}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
              Franciacorta &middot; Erbusco
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              {t("addressTitle")}
            </h3>
            <p className="mt-4 flex items-start gap-3 text-sm leading-relaxed text-fog">
              <MapPin size={18} className="mt-0.5 shrink-0" />
              <span>{t("address")}</span>
            </p>
          </div>

          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              {t("contactTitle")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-fog">
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0" />
                <a
                  href="mailto:villa.alba.franciacorta@gmail.com"
                  className="hover:text-white"
                >
                  villa.alba.franciacorta@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FileText size={18} className="shrink-0" />
                <a
                  href="mailto:villa.alba.franciacorta@pec.it"
                  className="hover:text-white"
                >
                  villa.alba.franciacorta@pec.it{" "}
                  <span className="text-stone">({t("pecLabel")})</span>
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0" />
                <a href="tel:+393317359787" className="hover:text-white">
                  +39 331 7359787
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="font-mono mt-14 flex flex-col gap-4 border-t border-charcoal pt-6 text-[10px] uppercase tracking-[0.1em] text-stone md:flex-row md:items-center md:justify-between">
          <span>
            &copy; {new Date().getFullYear()} {t("title")} &mdash; {t("rights")}
          </span>
          <span>
            {t("vatLabel")}: 04800230981 &middot; {t("cirLabel")}: 017069-CIM-00008 &middot; {t("cinLabel")}: IT017069B4DFBMK2K7
          </span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              {t("privacyLink")}
            </Link>
            <Link href="/cookie-policy" className="hover:text-white">
              {t("cookieLink")}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
