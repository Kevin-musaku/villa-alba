"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  startOfMonth,
} from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Settings = {
  base_price_cents: number;
  min_stay_nights: number;
  cleaning_fee_cents: number;
  tourist_tax_cents_per_person_per_night: number;
};

const WEEKDAY_LABELS = ["L", "M", "M", "G", "V", "S", "D"];
const MONTHS_AHEAD = 24;

type SyncOutcome = { ok: boolean; synced?: number; error?: string };

function formatEuro(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function PricingCalendarManager() {
  const today = useMemo(() => startOfMonth(new Date()), []);
  const maxMonth = useMemo(() => addMonths(today, MONTHS_AHEAD), [today]);
  const monthOptions = useMemo(
    () => Array.from({ length: MONTHS_AHEAD + 1 }, (_, i) => addMonths(today, i)),
    [today]
  );

  const [viewMonth, setViewMonth] = useState(today);
  const [overrides, setOverrides] = useState<Map<string, number>>(new Map());
  const [smoobuRates, setSmoobuRates] = useState<Map<string, number>>(new Map());
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseForm, setBaseForm] = useState({
    basePriceEuros: "",
    minStayNights: "",
    cleaningFeeEuros: "",
    touristTaxEuros: "",
  });
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [manualEnabled, setManualEnabled] = useState(false);
  const [manualPriceInput, setManualPriceInput] = useState("");
  const [savingDate, setSavingDate] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    availability: SyncOutcome;
    rates: SyncOutcome;
  } | null>(null);

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

  async function loadMonth(month: Date) {
    setLoading(true);
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(month), "yyyy-MM-dd");

    const pricingRes = await fetch(`/api/admin/pricing?from=${from}&to=${to}`).then((r) => r.json());

    const map = new Map<string, number>();
    for (const o of (pricingRes.overrides ?? []) as { date: string; price_cents: number }[]) {
      map.set(o.date, o.price_cents);
    }
    setOverrides(map);

    const smoobuMap = new Map<string, number>();
    for (const r of (pricingRes.smoobuRates ?? []) as { date: string; price_cents: number }[]) {
      smoobuMap.set(r.date, r.price_cents);
    }
    setSmoobuRates(smoobuMap);
    setLoading(false);
  }

  async function loadSettings() {
    const settingsRes = await fetch("/api/admin/settings").then((r) => r.json());
    if (settingsRes.settings) {
      setSettings(settingsRes.settings);
      setBaseForm({
        basePriceEuros: (settingsRes.settings.base_price_cents / 100).toString(),
        minStayNights: settingsRes.settings.min_stay_nights.toString(),
        cleaningFeeEuros: (settingsRes.settings.cleaning_fee_cents / 100).toString(),
        touristTaxEuros: (settingsRes.settings.tourist_tax_cents_per_person_per_night / 100).toString(),
      });
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount
    loadSettings();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on month change
    loadMonth(viewMonth);
    setSelectedDate(null);
  }, [viewMonth]);

  function selectDate(iso: string) {
    setSelectedDate(iso);
    const override = overrides.get(iso);
    setManualEnabled(override !== undefined);
    setManualPriceInput(
      override !== undefined
        ? (override / 100).toString()
        : ((smoobuRates.get(iso) ?? settings?.base_price_cents ?? 0) / 100).toString()
    );
  }

  async function saveSelectedDate() {
    if (!selectedDate) return;
    setSavingDate(true);
    const priceCents = manualEnabled
      ? Math.round(parseFloat(manualPriceInput.replace(",", ".")) * 100)
      : null;

    if (manualEnabled && !Number.isFinite(priceCents)) {
      setError("Prezzo non valido");
      setSavingDate(false);
      return;
    }

    const ok = await withErrorHandling(() =>
      fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates: [selectedDate], priceCents }),
      })
    );
    if (ok) {
      await loadMonth(viewMonth);
      setSelectedDate(null);
    }
    setSavingDate(false);
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
    if (ok) await loadSettings();
  }

  async function syncNow() {
    setSyncing(true);
    setSyncResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/smoobu-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Sincronizzazione non riuscita");
      } else {
        setSyncResult({ availability: data.availability, rates: data.rates });
        await loadMonth(viewMonth);
      }
    } catch {
      setError("Impossibile contattare il server. Riprova.");
    }
    setSyncing(false);
  }

  const canGoPrev = isBefore(today, viewMonth);
  const canGoNext = isBefore(viewMonth, maxMonth);

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
        <button
          onClick={syncNow}
          disabled={syncing}
          className="flex items-center gap-2 border border-ink px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Sincronizzazione..." : "Sincronizza ora da Smoobu"}
        </button>
        {syncResult && (
          <p className="text-xs text-stone">
            {syncResult.availability.ok
              ? `${syncResult.availability.synced ?? 0} date bloccate`
              : `Errore date: ${syncResult.availability.error}`}
            {" · "}
            {syncResult.rates.ok
              ? `${syncResult.rates.synced ?? 0} tariffe aggiornate`
              : `Errore tariffe: ${syncResult.rates.error}`}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border border-mist bg-paper p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            disabled={!canGoPrev}
            aria-label="Mese precedente"
            className="border border-mist p-1.5 text-charcoal hover:bg-fog disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            disabled={!canGoNext}
            aria-label="Mese successivo"
            className="border border-mist p-1.5 text-charcoal hover:bg-fog disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
          <p className="font-serif text-lg capitalize text-ink">{format(viewMonth, "MMMM yyyy", { locale: it })}</p>
        </div>

        <select
          value={format(viewMonth, "yyyy-MM")}
          onChange={(e) => {
            const [y, m] = e.target.value.split("-").map(Number);
            setViewMonth(new Date(y, m - 1, 1));
          }}
          className="border border-mist bg-paper px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-charcoal"
        >
          {monthOptions.map((m) => (
            <option key={format(m, "yyyy-MM")} value={format(m, "yyyy-MM")}>
              {format(m, "MMMM yyyy", { locale: it })}
            </option>
          ))}
        </select>
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

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {loading ? (
          <p className="text-sm text-stone">Caricamento...</p>
        ) : (
          <MonthGrid
            month={viewMonth}
            overrides={overrides}
            smoobuRates={smoobuRates}
            selectedDate={selectedDate}
            onSelect={selectDate}
          />
        )}

        {selectedDate && (
          <div className="h-fit border border-mist bg-paper p-5">
            <p className="font-serif text-base capitalize text-ink">
              {format(new Date(selectedDate), "EEEE d MMMM yyyy", { locale: it })}
            </p>

            <dl className="mt-3 space-y-1 text-xs text-stone">
              {smoobuRates.get(selectedDate) !== undefined && (
                <div className="flex justify-between">
                  <dt>Tariffa Smoobu</dt>
                  <dd>{formatEuro(smoobuRates.get(selectedDate)!)} €</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Prezzo base</dt>
                <dd>{settings ? formatEuro(settings.base_price_cents) : "—"} €</dd>
              </div>
            </dl>

            <label className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-charcoal">
              <input
                type="checkbox"
                checked={manualEnabled}
                onChange={(e) => setManualEnabled(e.target.checked)}
              />
              Prezzo manuale per questa data
            </label>

            {manualEnabled && (
              <input
                value={manualPriceInput}
                onChange={(e) => setManualPriceInput(e.target.value)}
                placeholder="Prezzo €"
                className="mt-2 w-full border border-mist bg-paper px-3 py-1.5 text-sm"
              />
            )}

            {!manualEnabled && (
              <p className="mt-2 text-xs text-stone">
                Seguirà {smoobuRates.get(selectedDate) !== undefined ? "la tariffa Smoobu" : "il prezzo base"}.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={saveSelectedDate}
                disabled={savingDate}
                className="border border-ink px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
              >
                Salva
              </button>
              <button
                onClick={() => setSelectedDate(null)}
                className="border border-mist px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-charcoal"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  overrides,
  smoobuRates,
  selectedDate,
  onSelect,
}: {
  month: Date;
  overrides: Map<string, number>;
  smoobuRates: Map<string, number>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = (getDay(start) + 6) % 7;

  return (
    <div className="border border-mist bg-paper p-4">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-stone">
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
          const isSelected = selectedDate === iso;
          const source: "manual" | "smoobu" | "base" =
            override !== undefined ? "manual" : smoobuPrice !== undefined ? "smoobu" : "base";
          const effectivePrice = override ?? smoobuPrice;

          return (
            <button
              key={iso}
              onClick={() => onSelect(iso)}
              className={[
                "flex aspect-square flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
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
              {effectivePrice !== undefined && (
                <span className={isSelected ? "text-[9px] text-paper/80" : "text-[9px] text-graphite"}>
                  {Math.round(effectivePrice / 100)}€
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
