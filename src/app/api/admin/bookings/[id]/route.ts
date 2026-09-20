import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { cancelSmoobuReservation } from "@/lib/smoobu/pushBooking";

/**
 * Elimina una prenotazione dall'admin. Se era stata inviata a Smoobu, annulla
 * anche la prenotazione lì (best-effort) per liberare subito le date sul
 * calendario condiviso con gli altri canali. Non tocca Stripe: un eventuale
 * rimborso del pagamento va gestito a parte, manualmente.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });

  const { id } = await params;

  const { data: booking } = await supabase
    .from("bookings")
    .select("smoobu_reservation_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (booking?.smoobu_reservation_id) {
    await cancelSmoobuReservation(booking.smoobu_reservation_id);
  }

  return NextResponse.json({ ok: true });
}
