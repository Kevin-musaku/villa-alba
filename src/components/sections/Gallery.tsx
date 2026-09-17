"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { galleryImages as fallbackGalleryImages } from "@/lib/placeholder-images";

type GalleryItem = { category: string; image: { src: string; alt: string } };

export function Gallery({ items }: { items?: GalleryItem[] }) {
  const t = useTranslations("gallery");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const galleryImages = items && items.length > 0 ? items : fallbackGalleryImages;

  return (
    <section id="galleria" className="bg-panel-mauve px-6 py-28 md:px-10 md:py-36">
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

        <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {galleryImages.map((item, i) => (
            <motion.button
              key={item.image.src}
              onClick={() => setOpenIndex(i)}
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
              className={`relative overflow-hidden rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] ${
                i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
              }`}
            >
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <span className="font-mono absolute bottom-2 left-2 rounded-[var(--radius-xs)] bg-ink/70 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-paper">
                {t(`categories.${item.category}`)}
              </span>
            </motion.button>
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
