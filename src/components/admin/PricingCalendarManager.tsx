"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";

type Override = { date: string; price_cents: number; note: string | null };
type Settings = {
  base_price_cents: number;
  min_stay_nights: number;
  cleaning_fee_cents: number;
  tourist_tax_cents_per_person_per_night: number;
};

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];
const MONTHS_AHEAD = 6;

export function PricingCalendarManager() {
  const [overrides, setOverrides] = useState<Map<string, number>>(new Map());
  const [smoobuRates, setSmoobuRates] = useState<Map<string, number>>(new Map());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [baseForm, setBaseForm] = useState({
    basePriceEuros: "",
    minStayNights: "",
    cleaningFeeEuros: "",
    touristTaxEuros: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function withErrorHandling(fn: () => Promise<Response>) {
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Errore durante il salvataggio (${res.status})`);
        return false;
      }
      return true;
    } catch {
      setError("Impossibile contattare il server. Riprova.");
      return false;
    }
  }

  const firstMonth = startOfMonth(new Date());
  const months = useMemo(
    () => Array.from({ length: MONTHS_AHEAD }, (_, i) => addMonths(firstMonth, i)),
    [firstMonth]
  );

  async function load() {
    setLoading(true);
    const from = format(firstMonth, "yyyy-MM-dd");
    const to = format(endOfMonth(addMonths(firstMonth, MONTHS_AHEAD - 1)), "yyyy-MM-dd");

    const [pricingRes, settingsRes] = await Promise.all([
      fetch(`/api/admin/pricing?from=${from}&to=${to}`).then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json()),
    ]);

    const map = new Map<string, number>();
    for (const o of (pricingRes.overrides ?? []) as Override[]) {
      map.set(o.date, o.price_cents);
    }
    setOverrides(map);

    const smoobuMap = new Map<string, number>();
    for (const r of (pricingRes.smoobuRates ?? []) as { date: string; price_cents: number }[]) {
      smoobuMap.set(r.date, r.price_cents);
    }
    setSmoobuRates(smoobuMap);

    if (settingsRes.settings) {
      setSettings(settingsRes.settings);
      setBaseForm({
        basePriceEuros: (settingsRes.settings.base_price_cents / 100).toString(),
        minStayNights: settingsRes.settings.min_stay_nights.toString(),
        cleaningFeeEuros: (settingsRes.settings.cleaning_fee_cents / 100).toString(),
        touristTaxEuros: (settingsRes.settings.tourist_tax_cents_per_person_per_night / 100).toString(),
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable for this one-time mount fetch
  }, []);

  function toggleDate(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  async function applyPrice() {
    const priceCents = Math.round(parseFloat(priceInput.replace(",", ".")) * 100);
    if (!Number.isFinite(priceCents) || selected.size === 0) return;

    const ok = await withErrorHandling(() =>
      fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: Array.from(selected), priceCents }),
      })
    );
    if (ok) {
      setSelected(new Set());
      setPriceInput("");
      await load();
    }
  }

  async function resetSelected() {
    if (selected.size === 0) return;
    const ok = await withErrorHandling(() =>
      fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: Array.from(selected), priceCents: null }),
      })
    );
    if (ok) {
      setSelected(new Set());
      await load();
    }
  }

  async function saveBaseSettings(e: React.FormEvent) {
    e.preventDefault();
    const basePriceCents = Math.round(parseFloat(baseForm.basePriceEuros.replace(",", ".")) * 100);
    const minStayNights = parseInt(baseForm.minStayNights, 10);
    const cleaningFeeCents = Math.round(parseFloat(baseForm.cleaningFeeEuros.replace(",", ".")) * 100);
    const touristTaxCentsPerPersonPerNight = Math.round(
      parseFloat(baseForm.touristTaxEuros.replace(",", ".")) * 100
    );

    const ok = await withErrorHandling(() =>
      fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basePriceCents,
          minStayNights,
          cleaningFeeCents,
          touristTaxCentsPerPersonPerNight,
        }),
      })
    );
    if (ok) await load();
  }

  if (loading) return <p className="text-sm text-stone">Caricamento...</p>;

  return (
    <div>
      {error && (
        <p className="mb-4 border border-charcoal/30 bg-fog px-3 py-2 text-xs text-charcoal">{error}</p>
      )}

      <form onSubmit={saveBaseSettings} className="flex flex-wrap items-end gap-4 border border-mist bg-paper p-6">
        <div>
          <label className="block text-xs uppercase tracking-[0.1em] text-stone">Prezzo base a notte (€)</label>
          <input
            value={baseForm.basePriceEuros}
            onChange={(e) => setBaseForm((f) => ({ ...f, basePriceEuros: e.target.value }))}
            className="mt-1 w-32 border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.1em] text-stone">Soggiorno minimo (notti)</label>
          <input
            value={baseForm.minStayNights}
            onChange={(e) => setBaseForm((f) => ({ ...f, minStayNights: e.target.value }))}
            className="mt-1 w-24 border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.1em] text-stone">Costo pulizie finali (€)</label>
          <input
            value={baseForm.cleaningFeeEuros}
            onChange={(e) => setBaseForm((f) => ({ ...f, cleaningFeeEuros: e.target.value }))}
            className="mt-1 w-32 border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.1em] text-stone">
            Tassa di soggiorno (€ a persona/notte)
          </label>
          <input
            value={baseForm.touristTaxEuros}
            onChange={(e) => setBaseForm((f) => ({ ...f, touristTaxEuros: e.target.value }))}
            className="mt-1 w-32 border border-mist bg-paper px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="border border-ink px-4 py-2 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper">
          Salva
        </button>
        {settings && (
          <p className="text-xs text-stone">
            Attuale: {(settings.base_price_cents / 100).toFixed(2)} € · min. {settings.min_stay_nights} notti · pulizie{" "}
            {(settings.cleaning_fee_cents / 100).toFixed(2)} € · tassa{" "}
            {(settings.tourist_tax_cents_per_person_per_night / 100).toFixed(2)} €/persona/notte
          </p>
        )}
      </form>

      <div className="mt-6 flex flex-wrap items-center gap-3 border border-mist bg-paper p-4">
        <p className="text-xs text-stone">
          {selected.size > 0 ? `${selected.size} date selezionate` : "Seleziona una o più date nel calendario"}
        </p>
        <input
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          placeholder="Prezzo €"
          className="w-28 border border-mist bg-paper px-3 py-1.5 text-sm"
          disabled={selected.size === 0}
        />
        <button
          onClick={applyPrice}
          disabled={selected.size === 0 || !priceInput}
          className="border border-ink px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          Applica prezzo
        </button>
        <button
          onClick={resetSelected}
          disabled={selected.size === 0}
          className="border border-mist px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-charcoal disabled:opacity-40"
        >
          Rimuovi prezzo manuale
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-stone">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" /> Manuale
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-graphite" /> Smoobu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border border-mist" /> Base
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((month) => (
          <MonthGrid
            key={month.toISOString()}
            month={month}
            overrides={overrides}
            smoobuRates={smoobuRates}
            selected={selected}
            onToggle={toggleDate}
          />
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  overrides,
  smoobuRates,
  selected,
  onToggle,
}: {
  month: Date;
  overrides: Map<string, number>;
  smoobuRates: Map<string, number>;
  selected: Set<string>;
  onToggle: (date: string) => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = (getDay(start) + 6) % 7;

  return (
    <div className="border border-mist bg-paper p-4">
      <p className="mb-3 text-center font-serif text-base capitalize text-ink">
        {format(month, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] uppercase text-stone">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const override = overrides.get(iso);
          const smoobuPrice = smoobuRates.get(iso);
          const isSelected = selected.has(iso);
          const source: "manual" | "smoobu" | "base" =
            override !== undefined ? "manual" : smoobuPrice !== undefined ? "smoobu" : "base";
          const effectivePrice = override ?? smoobuPrice;

          return (
            <button
              key={iso}
              onClick={() => onToggle(iso)}
              title={effectivePrice !== undefined ? `${(effectivePrice / 100).toFixed(2)} €` : undefined}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                isSelected
                  ? "bg-ink text-paper"
                  : source === "manual"
                    ? "bg-ink/10 text-ink"
                    : source === "smoobu"
                      ? "bg-graphite/10 text-ink"
                      : "text-charcoal hover:bg-fog",
              ].join(" ")}
            >
              <span>{format(day, "d")}</span>
              {effectivePrice !== undefined && !isSelected && (
                <span className="text-[8px] text-graphite">{Math.round(effectivePrice / 100)}€</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
