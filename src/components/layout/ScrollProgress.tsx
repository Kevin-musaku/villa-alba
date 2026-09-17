"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 top-0 z-[70] h-[2px] w-full origin-left bg-ink/80"
      style={{ scaleX: reduceMotion ? scrollYProgress : smoothed }}
    />
  );
}
