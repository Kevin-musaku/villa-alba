"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useInView, useMotionValue, useReducedMotion, animate } from "framer-motion";
import { Waves } from "lucide-react";

function CountUpNumber({ target, inView }: { target: number; inView: boolean }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const count = useMotionValue(reduceMotion ? target : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      count.set(target);
      return;
    }
    const controls = animate(count, target, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [inView, target, count, reduceMotion]);

  useEffect(() => {
    return count.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v).toString();
    });
  }, [count]);

  return <span ref={ref}>{reduceMotion ? target : 0}</span>;
}

export function StatsStrip() {
  const t = useTranslations("villa.stats");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });

  const numericStats: { key: "sqm" | "bedrooms" | "guests"; target: number }[] = [
    { key: "sqm", target: 394 },
    { key: "bedrooms", target: 4 },
    { key: "guests", target: 8 },
  ];

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-mist shadow-[var(--shadow-sm)] sm:grid-cols-4"
    >
      {numericStats.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          className="flex flex-col items-center justify-center gap-1 bg-paper px-4 py-8 text-center"
        >
          <p className="font-display text-4xl text-ink md:text-5xl">
            <CountUpNumber target={stat.target} inView={inView} />
            {t.has(`${stat.key}.unit`) ? (
              <span className="ml-1 text-2xl text-graphite md:text-3xl">{t(`${stat.key}.unit`)}</span>
            ) : null}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{t(`${stat.key}.label`)}</p>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex flex-col items-center justify-center gap-2 bg-paper px-4 py-8 text-center"
      >
        <Waves size={30} className="text-ink" strokeWidth={1.4} />
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{t("pool.label")}</p>
      </motion.div>
    </div>
  );
}
