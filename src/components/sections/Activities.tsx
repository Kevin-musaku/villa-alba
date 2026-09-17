import { getTranslations, getLocale } from "next-intl/server";
import { getPublicActivities } from "@/lib/content/activities";
import { ActivityGrid } from "@/components/sections/ActivityGrid";

/**
 * Renderizza null (nessun heading, nessuna sezione vuota) se la sezione è
 * disattivata dall'admin o se Supabase non è ancora configurato — stesso
 * pattern di Vini.tsx.
 */
export async function Activities() {
  const { enabled, activities } = await getPublicActivities();
  if (!enabled || activities.length === 0) return null;

  const t = await getTranslations("attivita");
  const locale = await getLocale();

  return (
    <section id="attivita" className="bg-panel-slate px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">{t("kicker")}</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">{t("title")}</h2>
          <p className="mt-5 text-sm leading-relaxed text-graphite md:text-base">{t("intro")}</p>
        </div>

        <ActivityGrid activities={activities} currencyLocale={locale} />
      </div>
    </section>
  );
}
