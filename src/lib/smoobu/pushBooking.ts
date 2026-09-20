import { getSupabaseServerClient } from "@/lib/supabase/server";
import { smoobuFetch, isSmoobuConfigured } from "@/lib/smoobu/client";
import type { BookingRow } from "@/lib/supabase/types";

type SmoobuCreateReservationResponse = { id: number };

/**
 * Dopo aver creato la prenotazione su Smoobu, prova a inviare anche le voci
 * di prezzo separate (pulizie finali, tassa di soggiorno) tramite l'endpoint
 * "price elements" di Smoobu. Best-effort e mai bloccante: se fallisce, la
 * prenotazione principale resta comunque "pushed" — solo un avviso in log.
 */
async function pushPriceElements(smoobuReservationId: number, booking: BookingRow) {
  const elements: { name: string; price: number }[] = [];

  if (booking.cleaning_fee_cents && booking.cleaning_fee_cents > 0) {
    elements.push({ name: "Pulizie finali", price: booking.cleaning_fee_cents / 100 });
  }
  if (booking.tourist_tax_cents && booking.tourist_tax_cents > 0) {
    elements.push({ name: "Tassa di soggiorno", price: booking.tourist_tax_cents / 100 });
  }

  for (const element of elements) {
    try {
      await smoobuFetch(`/reservations/${smoobuReservationId}/price-elements`, {
        method: "POST",
        body: JSON.stringify(element),
      });
    } catch (err) {
      console.warn("[smoobu] invio price-element non riuscito (non bloccante)", element.name, err);
    }
  }
}

/**
 * Invia la prenotazione a Smoobu solo dopo il pagamento confermato (chiamata
 * dal webhook Stripe su checkout.session.completed): così le altre
 * piattaforme (Airbnb, Booking.com...) vedono le date occupate solo quando
 * c'è un pagamento reale, non durante il semplice checkout. Se
 * SMOOBU_API_KEY non è impostata, segna semplicemente
 * smoobu_push_status='not_pushed' e non fa nulla: nessun errore bloccante.
 */
export async function pushBookingToSmoobu(booking: BookingRow): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  if (!isSmoobuConfigured()) {
    return null;
  }

  const propertyId = process.env.SMOOBU_PROPERTY_ID;
  if (!propertyId) {
    console.warn("[smoobu] SMOOBU_PROPERTY_ID mancante — impossibile creare la prenotazione");
    await supabase
      .from("bookings")
      .update({ smoobu_push_status: "failed" })
      .eq("id", booking.id);
    return null;
  }

  // Smoobu richiede firstName e lastName entrambi non vuoti: il sito raccoglie
  // solo un campo "nome e cognome" unico, quindi lo dividiamo qui. Se non c'è
  // uno spazio (nome singolo), ripetiamo lo stesso valore come cognome —
  // altrimenti Smoobu rifiuta la richiesta con 400 "lastName is required".
  const [firstName, ...rest] = booking.guest_name.trim().split(/\s+/);
  const lastName = rest.length > 0 ? rest.join(" ") : firstName;

  const res = await smoobuFetch<SmoobuCreateReservationResponse>("/reservations", {
    method: "POST",
    body: JSON.stringify({
      apartmentId: Number(propertyId),
      arrivalDate: booking.check_in,
      departureDate: booking.check_out,
      firstName,
      lastName,
      email: booking.guest_email,
      phone: booking.guest_phone ?? undefined,
      adults: booking.guests_count,
      channelId: 70, // "altro/diretto" nel canale Smoobu
      notice: `Prenotazione diretta dal sito — booking ${booking.id}`,
    }),
  });

  if (res?.id) {
    await supabase
      .from("bookings")
      .update({ smoobu_reservation_id: String(res.id), smoobu_push_status: "pushed" })
      .eq("id", booking.id);

    // Best-effort, non bloccante: un fallimento qui non deve mai
    // retrocedere lo stato "pushed" appena impostato sopra.
    await pushPriceElements(res.id, booking);
    return String(res.id);
  }

  await supabase
    .from("bookings")
    .update({ smoobu_push_status: "failed" })
    .eq("id", booking.id);
  return null;
}

/**
 * Annulla su Smoobu la prenotazione tentativa creata al checkout, quando il
 * pagamento scade o fallisce. Best-effort: se la chiamata fallisce (es. rete),
 * logga soltanto — la prenotazione locale resta comunque "cancelled" e non
 * blocca più il calendario del sito, anche se andrà rimossa a mano da Smoobu.
 */
export async function cancelSmoobuReservation(smoobuReservationId: string): Promise<void> {
  if (!isSmoobuConfigured()) return;

  try {
    await smoobuFetch(`/reservations/${smoobuReservationId}`, { method: "DELETE" });
  } catch (err) {
    console.error("[smoobu] errore annullamento prenotazione (non bloccante)", err);
  }
}
