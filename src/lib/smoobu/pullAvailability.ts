import { eachDayOfInterval, format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { smoobuFetch, isSmoobuConfigured } from "@/lib/smoobu/client";

type SmoobuReservation = {
  id: number;
  arrival: string;
  departure: string;
  "is-blocked-booking"?: boolean;
};

type SmoobuReservationsResponse = {
  bookings: SmoobuReservation[];
};

function mockReservations(): SmoobuReservation[] {
  const today = new Date();
  const in10 = new Date(today);
  in10.setDate(in10.getDate() + 10);
  const in14 = new Date(today);
  in14.setDate(in14.getDate() + 14);
  return [
    {
      id: 999001,
      arrival: format(in10, "yyyy-MM-dd"),
      departure: format(in14, "yyyy-MM-dd"),
    },
  ];
}

/**
 * Scarica le prenotazioni da Smoobu (altri canali: Airbnb, Booking.com...)
 * per i prossimi ~18 mesi e aggiorna blocked_dates_cache. Se SMOOBU_API_KEY
 * non è impostata, non fa nulla (a meno che SMOOBU_MOCK=true, utile per
 * testare il flusso in locale senza un account Smoobu reale).
 */
export type PullAvailabilityResult =
  | { synced: number }
  | { error: "supabase_not_configured" | "smoobu_not_configured" | "smoobu_request_failed" };

export async function pullAvailability(): Promise<PullAvailabilityResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { error: "supabase_not_configured" };

  let reservations: SmoobuReservation[] | null = null;

  if (process.env.SMOOBU_MOCK === "true") {
    reservations = mockReservations();
  } else if (isSmoobuConfigured()) {
    const propertyId = process.env.SMOOBU_PROPERTY_ID;
    const res = await smoobuFetch<SmoobuReservationsResponse>("/reservations", {
      query: propertyId ? { apartmentId: propertyId } : undefined,
    });
    reservations = res?.bookings ?? null;
  } else {
    return { error: "smoobu_not_configured" };
  }

  if (!reservations) return { error: "smoobu_request_failed" };

  const rows: { date: string; source: string; smoobu_reservation_id: string }[] = [];
  for (const r of reservations) {
    const nights = eachDayOfInterval({
      start: new Date(r.arrival),
      end: new Date(r.departure),
    }).slice(0, -1);
    for (const d of nights) {
      rows.push({
        date: format(d, "yyyy-MM-dd"),
        source: "smoobu",
        smoobu_reservation_id: String(r.id),
      });
    }
  }

  await supabase.from("blocked_dates_cache").delete().eq("source", "smoobu");
  if (rows.length > 0) {
    const { error } = await supabase.from("blocked_dates_cache").upsert(rows);
    if (error) {
      console.error("[smoobu] errore salvataggio blocked_dates_cache", error.message);
      return { error: "smoobu_request_failed" };
    }
  }

  return { synced: rows.length };
}
