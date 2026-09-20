"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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

export function BookingManager({ initialBookings }: { initialBookings: BookingRow[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(booking: BookingRow) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare la prenotazione di ${booking.guest_name} (${booking.check_in} → ${booking.check_out})? L'operazione non può essere annullata.`
    );
    if (!confirmed) return;

    setError(null);
    setDeletingId(booking.id);
    const previous = bookings;
    setBookings((prev) => prev.filter((b) => b.id !== booking.id));

    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, { method: "DELETE" });
      if (!res.ok) {
        setBookings(previous);
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Impossibile eliminare la prenotazione.");
      }
    } catch {
      setBookings(previous);
      setError("Impossibile contattare il server. Riprova.");
    } finally {
      setDeletingId(null);
    }
  }

  if (bookings.length === 0) {
    return <p className="mt-8 text-sm text-stone">Nessuna prenotazione al momento.</p>;
  }

  return (
    <div className="mt-8">
      {error && (
        <p className="mb-4 border border-charcoal/30 bg-fog px-3 py-2 text-xs text-charcoal">{error}</p>
      )}
      <div className="overflow-x-auto border border-mist bg-paper">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-mist text-xs uppercase tracking-[0.08em] text-stone">
            <tr>
              <th className="px-4 py-3">Ospite</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Ospiti</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Smoobu</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(b)}
                    disabled={deletingId === b.id}
                    className="text-charcoal hover:text-ink disabled:opacity-50"
                    aria-label="Elimina prenotazione"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
