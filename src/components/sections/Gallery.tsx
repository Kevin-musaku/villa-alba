"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { galleryImages as fallbackGalleryImages } from "@/lib/placeholder-images";

type GalleryItem = { category: string; image: { src: string; alt: string } };

// Stessa palette usata per le coppie di camere in "La Villa" — ogni coppia
// di foto qui riceve il proprio sfondo distinto, in tema con il resto sito.
const PAIR_BACKGROUNDS = ["bg-panel-sand", "bg-panel-sage", "bg-panel-slate", "bg-panel-mauve"];

function chunkInPairs<T>(items: T[]): T[][] {
  const pairs: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2));
  }
  return pairs;
}

export function Gallery({ items }: { items?: GalleryItem[] }) {
  const t = useTranslations("gallery");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const galleryImages = items && items.length > 0 ? items : fallbackGalleryImages;
  const pairs = chunkInPairs(galleryImages);

  return (
    <section id="galleria" className="bg-paper px-6 py-28 md:px-10 md:py-36">
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

        <div className="mt-16 space-y-8">
          {pairs.map((pair, pairIndex) => (
            <div
              key={pair.map((p) => p.image.src).join("-")}
              className={`${PAIR_BACKGROUNDS[pairIndex % PAIR_BACKGROUNDS.length]} rounded-[var(--radius-lg)] p-6 md:p-10`}
            >
              <p className="font-mono mb-4 text-[10px] uppercase tracking-[0.15em] text-graphite">
                {t(`categories.${pair[0].category}`)}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {pair.map((item) => {
                  const globalIndex = galleryImages.indexOf(item);
                  return (
                    <motion.button
                      key={item.image.src}
                      onClick={() => setOpenIndex(globalIndex)}
                      initial={{ opacity: 0, scale: 0.96 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-10%" }}
                      transition={{ duration: 0.5 }}
                      className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-sm)]"
                    >
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="(min-width: 640px) 45vw, 100vw"
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-6"
            onClick={() => setOpenIndex(null)}
          >
            <button
              className="absolute right-6 top-6 text-paper"
              onClick={() => setOpenIndex(null)}
              aria-label="Chiudi"
            >
              <X size={32} />
            </button>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[var(--radius-lg)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryImages[openIndex].image.src}
                alt={galleryImages[openIndex].image.alt}
                fill
                sizes="80vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
