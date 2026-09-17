"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PlaceholderImage } from "@/lib/placeholder-images";
import { StatsStrip } from "./StatsStrip";

export type VillaPanelData = {
  key: string;
  image: PlaceholderImage;
  title: string;
  description: string;
};

// Stessa palette moderna usata per gli sfondi delle altre sezioni del sito
// (Territorio/Vini/Galleria/Attività) — riusata qui per dare a ogni coppia
// di camere un proprio sfondo distinto, coerente con il resto del sito.
const PAIR_BACKGROUNDS = ["bg-panel-sand", "bg-panel-sage", "bg-panel-mauve", "bg-panel-slate"];

function Panel({
  image,
  title,
  description,
  reverse,
}: {
  image: PlaceholderImage;
  title: string;
  description: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${
        reverse ? "md:[direction:rtl]" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={`relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] [direction:ltr] ${
          reverse ? "md:mb-10" : "md:mt-10"
        }`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 hover:scale-105"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="[direction:ltr]"
      >
        <h3 className="font-display text-3xl text-ink md:text-4xl">{title}</h3>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-graphite md:text-base">
          {description}
        </p>
      </motion.div>
    </div>
  );
}

function panelPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function LaVillaPanels({
  panels,
  amenitiesTitle,
  amenities,
}: {
  panels: VillaPanelData[];
  amenitiesTitle: string;
  amenities: string[];
}) {
  return (
    <>
      <div className="mb-20 md:mb-28">
        <StatsStrip />
      </div>

      <div className="space-y-16 md:space-y-20">
        {panelPairs(panels).map((pair, pairIndex) => (
          <div
            key={pair.map((p) => p.key).join("-")}
            className={`${PAIR_BACKGROUNDS[pairIndex % PAIR_BACKGROUNDS.length]} space-y-24 rounded-[var(--radius-lg)] p-6 md:space-y-32 md:p-12`}
          >
            {pair.map((panel, i) => (
              <Panel
                key={panel.key}
                image={panel.image}
                title={panel.title}
                description={panel.description}
                reverse={i % 2 === 1}
              />
            ))}
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 0.7 }}
        className="mt-28 border-t border-mist pt-16 md:mt-36"
      >
        <h3 className="font-display text-2xl text-ink md:text-3xl">{amenitiesTitle}</h3>
        <ul className="mt-8 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
          {amenities.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-graphite md:text-base">
              <Check size={18} className="mt-0.5 shrink-0 text-charcoal" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </>
  );
}
