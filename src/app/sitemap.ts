import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = "https://villaalbafranciacorta.com";

// Pagine pubbliche indicizzabili. "grazie" (post-pagamento) è escluso: non ha
// contenuto proprio da indicizzare ed è pensato per essere raggiunto solo
// dopo un checkout, non da un motore di ricerca.
const PATHS = ["", "/prenota", "/privacy", "/cookie-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PATHS) {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])
    );

    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
