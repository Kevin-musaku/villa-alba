"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

export function Territorio() {
  const t = useTranslations("territorio");
  const pois = t.raw("pois") as { name: string; distance: string; type: string }[];

  return (
    <section id="territorio" className="bg-panel-sand px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
            {t("kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-graphite md:text-base">
            {t("intro")}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8 }}
          className="mt-16"
        >
          <h3 className="mb-4 text-sm uppercase tracking-[0.2em] text-stone">
            {t("mapTitle")}
          </h3>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] md:aspect-[21/9]">
            <iframe
              title="Villa Alba — Erbusco, Franciacorta"
              src="https://www.google.com/maps?q=Erbusco,+Franciacorta,+BS,+Italia&output=embed"
              className="h-full w-full grayscale-[60%] contrast-[1.05]"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

        <div className="mt-16">
          <h3 className="text-sm uppercase tracking-[0.2em] text-stone">
            {t("poiTitle")}
          </h3>
          <p className="mt-2 max-w-xl text-xs text-stone">{t("poiNote")}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pois.map((poi, i) => (
              <motion.div
                key={poi.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-[var(--radius-md)] border border-mist bg-paper p-6 shadow-[var(--shadow-xs)] transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]"
              >
                <MapPin size={18} className="text-charcoal" />
                <p className="mt-4 font-display text-lg text-ink">{poi.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-stone">
                  {poi.distance}
                </p>
                <p className="mt-3 text-sm text-graphite">{poi.type}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
