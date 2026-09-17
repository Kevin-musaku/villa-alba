import { eachDayOfInterval, subDays, format, addMonths } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";

/**
 * Unisce le date bloccate dalle nostre prenotazioni (pending/confirmed)
 * con quelle sincronizzate da Smoobu (altri canali). Ritorna un array di
 * stringhe "yyyy-MM-dd" da disabilitare nel calendario di prenotazione.
 */
export async function getBlockedDates(
  from: string = format(new Date(), "yyyy-MM-dd"),
  to: string = format(addMonths(new Date(), 18), "yyyy-MM-dd")
): Promise<string[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const blocked = new Set<string>();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("check_in, check_out")
    .in("status", ["pending", "confirmed"])
    .lte("check_in", to)
    .gte("check_out", from);

  if (bookingsError) {
    console.error("[availability] errore lettura prenotazioni", bookingsError.message);
  } else {
    for (const b of (bookings ?? []) as Pick<BookingRow, "check_in" | "check_out">[]) {
      const nights = eachDayOfInterval({
        start: new Date(b.check_in),
        end: subDays(new Date(b.check_out), 1),
      });
      nights.forEach((d) => blocked.add(format(d, "yyyy-MM-dd")));
    }
  }

  const { data: cached, error: cacheError } = await supabase
    .from("blocked_dates_cache")
    .select("date")
    .gte("date", from)
    .lte("date", to);

  if (cacheError) {
    console.error("[availability] errore lettura cache Smoobu", cacheError.message);
  } else {
    for (const row of cached ?? []) {
      blocked.add(row.date as string);
    }
  }

  return Array.from(blocked).sort();
}

export async function isRangeAvailable(checkIn: string, checkOut: string): Promise<boolean> {
  const blocked = new Set(await getBlockedDates(checkIn, checkOut));
  const nights = eachDayOfInterval({
    start: new Date(checkIn),
    end: subDays(new Date(checkOut), 1),
  });
  return nights.every((d) => !blocked.has(format(d, "yyyy-MM-dd")));
}
