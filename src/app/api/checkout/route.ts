import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { BookingRequestSchema } from "@/lib/validation/schemas";
import { calculateStay } from "@/lib/pricing/calculateStay";
import { isRangeAvailable } from "@/lib/availability/getBlockedDates";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/client";

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Il sistema di prenotazione non è ancora configurato." },
      { status: 503 }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Pagamenti non ancora configurati." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = BookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const { checkIn, checkOut, guestsCount, guestName, guestEmail, guestPhone, locale } = parsed.data;

  if (new Date(checkOut) <= new Date(checkIn)) {
    return NextResponse.json({ error: "Intervallo di date non valido" }, { status: 400 });
  }

  const available = await isRangeAvailable(checkIn, checkOut);
  if (!available) {
    return NextResponse.json({ error: "Le date selezionate non sono più disponibili" }, { status: 409 });
  }

  const quote = await calculateStay(checkIn, checkOut, guestsCount);
  if (!quote.meetsMinStay) {
    return NextResponse.json(
      { error: `Soggiorno minimo di ${quote.minStayNights} notti` },
      { status: 400 }
    );
  }
  if (quote.totalCents <= 0) {
    return NextResponse.json({ error: "Impossibile calcolare il prezzo" }, { status: 400 });
  }

  const { data: booking, error: insertError } = await supabase
    .from("bookings")
    .insert({
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestsCount,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone ?? null,
      amount_cents: quote.totalCents,
      rental_cents: quote.rentalCents,
      cleaning_fee_cents: quote.cleaningFeeCents,
      tourist_tax_cents: quote.touristTaxCents,
      currency: quote.currency,
      status: "pending",
      locale,
    })
    .select()
    .single();

  if (insertError || !booking) {
    console.error("[checkout] errore creazione prenotazione", insertError?.message);
    return NextResponse.json({ error: "Errore durante la creazione della prenotazione" }, { status: 500 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Pagamenti non ancora configurati." }, { status: 503 });
  }

  const origin = req.nextUrl.origin;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: quote.currency.toLowerCase(),
        unit_amount: quote.rentalCents,
        product_data: {
          name: `Soggiorno Villa Alba — ${checkIn} → ${checkOut}`,
          description: `${quote.nights.length} notti, ${guestsCount} ospiti`,
        },
      },
    },
  ];

  if (quote.cleaningFeeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: quote.currency.toLowerCase(),
        unit_amount: quote.cleaningFeeCents,
        product_data: { name: "Pulizie finali" },
      },
    });
  }

  if (quote.touristTaxCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: quote.currency.toLowerCase(),
        unit_amount: quote.touristTaxCents,
        product_data: {
          name: "Tassa di soggiorno",
          description: `${guestsCount} ospiti × ${quote.nights.length} notti`,
        },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: guestEmail,
      line_items: lineItems,
      metadata: { booking_id: booking.id },
      success_url: `${origin}/${locale}/grazie?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/prenota`,
    });

    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] errore creazione sessione Stripe", err);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    return NextResponse.json({ error: "Errore durante la creazione del pagamento" }, { status: 500 });
  }
}
