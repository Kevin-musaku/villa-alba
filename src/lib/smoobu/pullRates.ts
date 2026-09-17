import { addMonths, eachDayOfInterval, format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { smoobuFetch, isSmoobuConfigured } from "@/lib/smoobu/client";

const WINDOW_MONTHS = 18;
const CHUNK_MONTHS = 3;

// Forma reale verificata dal vivo contro l'account Smoobu (settembre 2026):
// { data: { [apartmentId]: { [date]: { price: number, min_length_of_stay, available } } } }
type SmoobuRatesResponse = {
  data?: Record<string, Record<string, { price?: number | string }>>;
};

function mockRates(): Map<string, number> {
  const map = new Map<string, number>();
  const today = new Date();
  const in60 = new Date(today);
  in60.setDate(in60.getDate() + 60);
  const in65 = new Date(today);
  in65.setDate(in65.getDate() + 65);
  for (const d of eachDayOfInterval({ start: in60, end: in65 })) {
    map.set(format(d, "yyyy-MM-dd"), 32000); // 320€, diverso dal prezzo base, per testare la priorità
  }
  return map;
}

/**
 * Estrae le tariffe di un blocco dalla risposta Smoobu in modo difensivo:
 * se la forma non è quella attesa, logga un avviso e tratta il blocco come
 * "zero righe" invece di interrompere l'intera sincronizzazione.
 */
function parseRatesChunk(json: SmoobuRatesResponse | null, apartmentId: string): Map<string, number> | null {
  if (!json || typeof json !== "object") return null;
  const byApartment = json.data?.[apartmentId];
  if (!byApartment || typeof byApartment !== "object") {
    console.warn("[smoobu] formato risposta /rates non riconosciuto, blocco ignorato");
    return null;
  }

  const map = new Map<string, number>();
  for (const [date, entry] of Object.entries(byApartment)) {
    const raw = entry?.price;
    const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (Number.isFinite(num)) map.set(date, Math.round(num * 100));
  }
  return map;
}

/**
 * Scarica le tariffe per notte impostate su Smoobu per i prossimi ~18 mesi
 * e aggiorna smoobu_rates_cache. Usata da calculateStay() come livello di
 * priorità intermedio: un override manuale (pricing_calendar) vince sempre,
 * altrimenti si usa il prezzo Smoobu, altrimenti il prezzo base del sito.
 * Se SMOOBU_API_KEY/SECRET non sono impostate, non fa nulla (a meno di
 * SMOOBU_MOCK=true, per testare il flusso in locale).
 */
export type PullRatesResult =
  | { synced: number }
  | { error: "supabase_not_configured" | "smoobu_not_configured" | "smoobu_request_failed" };

export async function pullRates(): Promise<PullRatesResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: "supabase_not_configured" };

  const today = new Date();
  const windowEnd = addMonths(today, WINDOW_MONTHS);

  if (process.env.SMOOBU_MOCK === "true") {
    const rates = mockRates();
    const rows = Array.from(rates, ([date, price_cents]) => ({ date, price_cents }));
    await supabase
      .from("smoobu_rates_cache")
      .delete()
      .gte("date", format(today, "yyyy-MM-dd"))
      .lte("date", format(windowEnd, "yyyy-MM-dd"));
    if (rows.length > 0) {
      const { error } = await supabase.from("smoobu_rates_cache").upsert(rows);
      if (error) {
        console.error("[smoobu] errore salvataggio smoobu_rates_cache", error.message);
        return { error: "smoobu_request_failed" };
      }
    }
    return { synced: rows.length };
  }

  if (!isSmoobuConfigured()) return { error: "smoobu_not_configured" };

  const propertyId = process.env.SMOOBU_PROPERTY_ID;
  if (!propertyId) return { error: "smoobu_not_configured" };

  const merged = new Map<string, number>();
  let anySucceeded = false;

  let chunkStart = today;
  while (chunkStart < windowEnd) {
    const chunkEnd = new Date(Math.min(addMonths(chunkStart, CHUNK_MONTHS).getTime(), windowEnd.getTime()));

    const res = await smoobuFetch<SmoobuRatesResponse>("/rates", {
      query: {
        "apartments[]": propertyId,
        start_date: format(chunkStart, "yyyy-MM-dd"),
        end_date: format(chunkEnd, "yyyy-MM-dd"),
      },
    });

    if (res) {
      anySucceeded = true;
      const chunkRates = parseRatesChunk(res, propertyId);
      if (chunkRates) {
        for (const [date, cents] of chunkRates) merged.set(date, cents);
      }
    }

    chunkStart = chunkEnd;
  }

  if (!anySucceeded) return { error: "smoobu_request_failed" };

  await supabase
    .from("smoobu_rates_cache")
    .delete()
    .gte("date", format(today, "yyyy-MM-dd"))
    .lte("date", format(windowEnd, "yyyy-MM-dd"));

  if (merged.size > 0) {
    const rows = Array.from(merged, ([date, price_cents]) => ({ date, price_cents }));
    const { error } = await supabase.from("smoobu_rates_cache").upsert(rows);
    if (error) {
      console.error("[smoobu] errore salvataggio smoobu_rates_cache", error.message);
      return { error: "smoobu_request_failed" };
    }
  }

  return { synced: merged.size };
}
