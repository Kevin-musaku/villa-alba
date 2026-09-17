"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { heroImage as fallbackHeroImage } from "@/lib/placeholder-images";

export function Hero({ image }: { image?: { src: string; alt: string } }) {
  const t = useTranslations("hero");
  const heroImage = image ?? fallbackHeroImage;
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1, 1.12]);
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -30]);
  const contentY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] overflow-hidden">
      <motion.div
        style={{ scale: imageScale, y: imageY, willChange: "transform" }}
        className="absolute inset-0"
      >
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="monochrome object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-ink/70" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-paper"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-fog md:text-xs"
        >
          {t("kicker")}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-balance text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] tracking-tight md:tracking-[-0.01em]"
        >
          {t("title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-6 max-w-xl text-sm leading-relaxed text-fog md:text-base"
        >
          {t("subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Link
            href="/prenota"
            className="font-mono mt-10 inline-block rounded-[var(--radius-sm)] bg-mist px-7 py-3.5 text-[11px] tracking-[0.15em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--shadow-sm)]"
          >
            {t("cta")}
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: contentOpacity }}
        className="font-mono absolute bottom-10 right-8 z-10 flex flex-row-reverse items-center gap-2.5 text-[9px] uppercase tracking-[0.2em] text-white/80"
      >
        <span>{t("scroll")}</span>
        <span className="relative block h-[42px] w-[26px] rounded-[var(--radius-sm)] border border-white/65">
          <motion.span
            className="absolute left-1/2 top-2 h-2.5 w-px -translate-x-1/2 bg-white"
            animate={reduceMotion ? { y: 0, opacity: 1 } : { y: [0, 17], opacity: [1, 0] }}
            transition={reduceMotion ? undefined : { duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
