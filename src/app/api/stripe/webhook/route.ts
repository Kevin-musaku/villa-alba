import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pushBookingToSmoobu, cancelSmoobuReservation } from "@/lib/smoobu/pushBooking";
import { sendBookingConfirmationEmail } from "@/lib/email";
import type Stripe from "stripe";
import type { BookingRow } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabase = getSupabaseServerClient();

  if (!stripe || !webhookSecret || !supabase) {
    return NextResponse.json({ error: "Webhook non configurato" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Firma mancante");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] firma non valida", err);
    return NextResponse.json({ error: "Firma non valida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      const { data: booking, error } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) {
        console.error("[stripe/webhook] errore aggiornamento prenotazione", error.message);
      } else if (booking) {
        // La prenotazione viene inviata a Smoobu solo ora, a pagamento
        // confermato — non al momento del checkout, per non occupare le
        // date sugli altri canali finché il cliente non ha davvero pagato.
        if ((booking as BookingRow).smoobu_push_status !== "pushed") {
          try {
            await pushBookingToSmoobu(booking as BookingRow);
          } catch (err) {
            console.error("[stripe/webhook] errore invio a Smoobu (non bloccante)", err);
          }
        }
        try {
          await sendBookingConfirmationEmail(booking as BookingRow);
        } catch (err) {
          console.error("[stripe/webhook] errore invio email di conferma (non bloccante)", err);
        }
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    if (bookingId) {
      const { data: cancelled } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("status", "pending")
        .select("smoobu_reservation_id")
        .single();

      if (cancelled?.smoobu_reservation_id) {
        try {
          await cancelSmoobuReservation(cancelled.smoobu_reservation_id);
        } catch (err) {
          console.error("[stripe/webhook] errore annullamento su Smoobu (non bloccante)", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
