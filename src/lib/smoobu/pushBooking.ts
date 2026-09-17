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
 * Dopo un pagamento confermato, spinge la prenotazione diretta su Smoobu
 * così le altre piattaforme (Airbnb, Booking.com...) vedono le date come
 * occupate. Se SMOOBU_API_KEY non è impostata, segna semplicemente
 * smoobu_push_status='not_pushed' e non fa nulla: nessun errore bloccante,
 * il pagamento resta comunque confermato.
 */
export async function pushBookingToSmoobu(booking: BookingRow): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  if (!isSmoobuConfigured()) {
    return;
  }

  const propertyId = process.env.SMOOBU_PROPERTY_ID;
  if (!propertyId) {
    console.warn("[smoobu] SMOOBU_PROPERTY_ID mancante — impossibile creare la prenotazione");
    await supabase
      .from("bookings")
      .update({ smoobu_push_status: "failed" })
      .eq("id", booking.id);
    return;
  }

  const res = await smoobuFetch<SmoobuCreateReservationResponse>("/reservations", {
    method: "POST",
    body: JSON.stringify({
      apartmentId: Number(propertyId),
      arrivalDate: booking.check_in,
      departureDate: booking.check_out,
      firstName: booking.guest_name,
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
  } else {
    await supabase
      .from("bookings")
      .update({ smoobu_push_status: "failed" })
      .eq("id", booking.id);
  }
}
