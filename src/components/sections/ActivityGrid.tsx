"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import type { PublicActivity } from "@/lib/content/activities";

export function ActivityGrid({
  activities,
  currencyLocale,
}: {
  activities: PublicActivity[];
  currencyLocale: string;
}) {
  const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat(currencyLocale, { style: "currency", currency }).format(cents / 100);

  return (
    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2">
      {activities.map((activity, i) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
          className="group overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-white shadow-[var(--shadow-xs)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)]"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-fog">
            {activity.imageSrc ? (
              <Image
                src={activity.imageSrc}
                alt={activity.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <CalendarCheck size={40} strokeWidth={1.2} className="text-stone" />
              </div>
            )}
            <span className="font-mono absolute right-3 top-3 rounded-full bg-ink px-3 py-1.5 text-xs text-paper shadow-[var(--shadow-sm)]">
              {formatPrice(activity.priceCents, activity.currency)}
            </span>
          </div>
          <div className="p-6">
            <h3 className="font-display text-xl text-ink">{activity.name}</h3>
            {activity.description && (
              <p className="mt-3 text-sm leading-relaxed text-graphite">{activity.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
