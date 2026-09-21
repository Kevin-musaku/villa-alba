import { eachDayOfInterval, subDays, format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/content/settings";
import type { PricingCalendarRow } from "@/lib/supabase/types";

export type NightPrice = { date: string; priceCents: number };

// Nessuna prenotazione reale di una villa richiede più di qualche mese:
// blocca i range abnormi (es. decenni) che altrimenti farebbero generare
// decine di migliaia di notti e altrettante righe di query per richiesta,
// un'amplificazione a costo zero per chi chiama /api/pricing o /api/checkout.
export const MAX_STAY_NIGHTS = 90;

export type StayQuote = {
  nights: NightPrice[];
  rentalCents: number;
  cleaningFeeCents: number;
  touristTaxCents: number;
  totalCents: number;
  currency: string;
  minStayNights: number;
  meetsMinStay: boolean;
};

/**
 * Calcola il prezzo totale di un soggiorno. Il totale è la somma di tre
 * parti tenute distinte (rispecchia il modello già in uso nel progetto
 * gemello VillaAlba-updated-v22): l'affitto, il costo pulizie finali (fisso,
 * una tantum) e la tassa di soggiorno (notti × ospiti × tariffa a persona
 * — non è un ricavo della struttura, va tenuta separata ai fini contabili).
 *
 * Il prezzo per notte dell'affitto segue 3 livelli di priorità: un override
 * manuale impostato dall'admin (pricing_calendar) vince sempre; altrimenti
 * si usa il prezzo impostato su Smoobu (smoobu_rates_cache, sincronizzato
 * in background); altrimenti il prezzo base del sito (site_settings).
 *
 * check_out è escluso dal conteggio notti (si paga per notte dormita, non
 * per il giorno di partenza).
 */
export async function calculateStay(
  checkIn: string,
  checkOut: string,
  guestsCount: number
): Promise<StayQuote> {
  const settings = await getSiteSettings();

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    throw new Error("Date non valide");
  }
  const requestedNights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (requestedNights > MAX_STAY_NIGHTS) {
    throw new Error(`Intervallo di date troppo ampio (massimo ${MAX_STAY_NIGHTS} notti)`);
  }

  const nightsDates = eachDayOfInterval({
    start: checkInDate,
    end: subDays(checkOutDate, 1),
  }).map((d) => format(d, "yyyy-MM-dd"));

  const supabase = getSupabaseServerClient();
  let overrides = new Map<string, number>();
  let smoobuRates = new Map<string, number>();

  if (supabase && nightsDates.length > 0) {
    const from = nightsDates[0];
    const to = nightsDates[nightsDates.length - 1];

    const [overridesRes, smoobuRes] = await Promise.all([
      supabase.from("pricing_calendar").select("date, price_cents").gte("date", from).lte("date", to),
      supabase.from("smoobu_rates_cache").select("date, price_cents").gte("date", from).lte("date", to),
    ]);

    if (overridesRes.error) {
      console.error("[pricing] errore lettura calendario prezzi", overridesRes.error.message);
    } else if (overridesRes.data) {
      overrides = new Map(
        (overridesRes.data as Pick<PricingCalendarRow, "date" | "price_cents">[]).map((r) => [
          r.date,
          r.price_cents,
        ])
      );
    }

    if (smoobuRes.error) {
      console.error("[pricing] errore lettura tariffe Smoobu", smoobuRes.error.message);
    } else if (smoobuRes.data) {
      smoobuRates = new Map(
        (smoobuRes.data as { date: string; price_cents: number }[]).map((r) => [r.date, r.price_cents])
      );
    }
  }

  const nights: NightPrice[] = nightsDates.map((date) => ({
    date,
    priceCents: overrides.get(date) ?? smoobuRates.get(date) ?? settings.basePriceCents,
  }));

  const rentalCents = nights.reduce((sum, n) => sum + n.priceCents, 0);
  const cleaningFeeCents = settings.cleaningFeeCents;
  const touristTaxCents = nights.length * guestsCount * settings.touristTaxCentsPerPersonPerNight;
  const totalCents = rentalCents + cleaningFeeCents + touristTaxCents;

  return {
    nights,
    rentalCents,
    cleaningFeeCents,
    touristTaxCents,
    totalCents,
    currency: "EUR",
    minStayNights: settings.minStayNights,
    meetsMinStay: nights.length >= settings.minStayNights,
  };
}
