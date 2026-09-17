"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Cigarette, PawPrint, LogIn, LogOut, Users, PartyPopper } from "lucide-react";

const ICONS = [Cigarette, PawPrint, LogIn, LogOut, Users, PartyPopper];

export function HouseRules() {
  const t = useTranslations("houseRules");
  const rules = t.raw("rules") as { title: string; description: string }[];

  return (
    <section id="regole" className="bg-ink px-6 py-28 text-paper md:px-10 md:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
            {t("kicker")}
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-[var(--radius-md)] border border-charcoal p-6 transition-colors duration-200 hover:border-graphite"
              >
                <Icon size={22} className="text-fog" />
                <p className="mt-4 font-display text-xl">{rule.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-mist">
                  {rule.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
