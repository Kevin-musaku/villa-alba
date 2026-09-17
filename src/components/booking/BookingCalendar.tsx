"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DateRange = { from: string | null; to: string | null };

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];

function toIso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function BookingCalendar({
  blockedDates,
  range,
  onChange,
  labels,
}: {
  blockedDates: Set<string>;
  range: DateRange;
  onChange: (range: DateRange) => void;
  labels: { checkIn: string; checkOut: string; selectPrompt: string; legend: string };
}) {
  const today = startOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));

  const months = useMemo(() => [visibleMonth, addMonths(visibleMonth, 1)], [visibleMonth]);

  function isDisabled(day: Date) {
    if (isBefore(day, today)) return true;
    return blockedDates.has(toIso(day));
  }

  function handleClick(day: Date) {
    if (isDisabled(day)) return;
    const iso = toIso(day);

    if (!range.from || (range.from && range.to)) {
      onChange({ from: iso, to: null });
      return;
    }

    // second click: set check-out, unless the user clicked before the current start
    if (isBefore(day, new Date(range.from))) {
      onChange({ from: iso, to: null });
      return;
    }

    // reject if any night in the new range is blocked
    const nights = eachDayOfInterval({ start: new Date(range.from), end: day }).slice(0, -1);
    const hasBlocked = nights.some((n) => blockedDates.has(toIso(n)));
    if (hasBlocked) {
      onChange({ from: iso, to: null });
      return;
    }

    onChange({ from: range.from, to: iso });
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-mist bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.15em] text-stone">
        <span>{labels.checkIn}: <span className="text-ink">{range.from ?? "—"}</span></span>
        <span>{labels.checkOut}: <span className="text-ink">{range.to ?? "—"}</span></span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
          disabled={isBefore(addMonths(visibleMonth, -1), startOfMonth(today))}
          className="p-2 text-charcoal transition-colors hover:text-ink disabled:opacity-20"
          aria-label="Mese precedente"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-xs uppercase tracking-[0.2em] text-stone">{labels.selectPrompt}</p>
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="p-2 text-charcoal transition-colors hover:text-ink"
          aria-label="Mese successivo"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {months.map((month) => (
          <MonthGrid
            key={month.toISOString()}
            month={month}
            range={range}
            isDisabled={isDisabled}
            onSelect={handleClick}
          />
        ))}
      </div>

      <p className="mt-6 text-xs text-stone">{labels.legend}</p>
    </div>
  );
}

function MonthGrid({
  month,
  range,
  isDisabled,
  onSelect,
}: {
  month: Date;
  range: DateRange;
  isDisabled: (d: Date) => boolean;
  onSelect: (d: Date) => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = (getDay(start) + 6) % 7; // Monday-first grid

  const from = range.from ? new Date(range.from) : null;
  const to = range.to ? new Date(range.to) : null;

  return (
    <div>
      <p className="mb-3 text-center font-display text-lg capitalize text-ink">
        {format(month, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-stone">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const disabled = isDisabled(day);
          const isStart = from && isSameDay(day, from);
          const isEnd = to && isSameDay(day, to);
          const inRange = from && to && isWithinInterval(day, { start: from, end: to });

          return (
            <button
              type="button"
              key={day.toISOString()}
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={[
                "aspect-square text-xs transition-colors",
                disabled
                  ? "cursor-not-allowed text-mist line-through"
                  : "text-charcoal hover:bg-fog",
                "rounded-[var(--radius-xs)]",
                isStart || isEnd ? "bg-ink text-paper hover:bg-ink" : "",
                inRange && !isStart && !isEnd ? "bg-fog" : "",
              ].join(" ")}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
