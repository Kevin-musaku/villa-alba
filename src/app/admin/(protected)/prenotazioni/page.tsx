import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";
import { BookingManager } from "@/components/admin/BookingManager";

export default async function AdminPrenotazioniPage() {
  const supabase = getSupabaseServerClient();
  let bookings: BookingRow[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("check_in", { ascending: false });
    bookings = (data as BookingRow[]) ?? [];
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Prenotazioni</h1>
      <p className="mt-2 max-w-2xl text-sm text-graphite">
        Elenco delle prenotazioni dirette effettuate dal sito tramite Stripe.
      </p>

      {!supabase ? (
        <p className="mt-8 text-sm text-stone">Supabase non è ancora configurato.</p>
      ) : (
        <BookingManager initialBookings={bookings} />
      )}
    </div>
  );
}
