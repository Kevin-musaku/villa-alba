import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermata",
  cancelled: "Annullata",
  refunded: "Rimborsata",
};

const SMOOBU_LABELS: Record<string, string> = {
  not_pushed: "Non inviata",
  pushed: "Sincronizzata",
  failed: "Errore invio",
};

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
      ) : bookings.length === 0 ? (
        <p className="mt-8 text-sm text-stone">Nessuna prenotazione al momento.</p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-mist bg-paper">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-mist text-xs uppercase tracking-[0.08em] text-stone">
              <tr>
                <th className="px-4 py-3">Ospite</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Ospiti</th>
                <th className="px-4 py-3">Importo</th>
                <th className="px-4 py-3">Stato</th>
                <th className="px-4 py-3">Smoobu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3">
                    <p className="text-ink">{b.guest_name}</p>
                    <p className="text-xs text-stone">{b.guest_email}</p>
                  </td>
                  <td className="px-4 py-3">{b.check_in}</td>
                  <td className="px-4 py-3">{b.check_out}</td>
                  <td className="px-4 py-3">{b.guests_count}</td>
                  <td className="px-4 py-3">
                    {(b.amount_cents / 100).toFixed(2)} {b.currency}
                  </td>
                  <td className="px-4 py-3">{STATUS_LABELS[b.status] ?? b.status}</td>
                  <td className="px-4 py-3">{SMOOBU_LABELS[b.smoobu_push_status] ?? b.smoobu_push_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
