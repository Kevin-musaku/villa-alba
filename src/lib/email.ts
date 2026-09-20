import { Resend } from "resend";
import type { BookingRow } from "@/lib/supabase/types";

const FROM_ADDRESS = "Villa Alba <prenotazioni@villaalbafranciacorta.com>";

const LABELS: Record<string, { subject: string; greeting: string; details: string; checkIn: string; checkOut: string; guests: string; total: string; contact: string }> = {
  it: {
    subject: "Conferma prenotazione — Villa Alba",
    greeting: "Grazie",
    details: "La tua prenotazione è confermata. Ecco il riepilogo:",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Ospiti",
    total: "Totale pagato",
    contact: "Per qualunque domanda scrivici a villa.alba.franciacorta@gmail.com.",
  },
  en: {
    subject: "Booking confirmation — Villa Alba",
    greeting: "Thank you",
    details: "Your booking is confirmed. Here's your summary:",
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    total: "Total paid",
    contact: "For any question, write to us at villa.alba.franciacorta@gmail.com.",
  },
  de: {
    subject: "Buchungsbestätigung — Villa Alba",
    greeting: "Vielen Dank",
    details: "Ihre Buchung ist bestätigt. Hier die Zusammenfassung:",
    checkIn: "Anreise",
    checkOut: "Abreise",
    guests: "Gäste",
    total: "Bezahlter Gesamtbetrag",
    contact: "Bei Fragen schreiben Sie uns an villa.alba.franciacorta@gmail.com.",
  },
  es: {
    subject: "Confirmación de reserva — Villa Alba",
    greeting: "Gracias",
    details: "Tu reserva está confirmada. Aquí tienes el resumen:",
    checkIn: "Entrada",
    checkOut: "Salida",
    guests: "Huéspedes",
    total: "Total pagado",
    contact: "Para cualquier pregunta, escríbenos a villa.alba.franciacorta@gmail.com.",
  },
  fr: {
    subject: "Confirmation de réservation — Villa Alba",
    greeting: "Merci",
    details: "Votre réservation est confirmée. Voici le récapitulatif :",
    checkIn: "Arrivée",
    checkOut: "Départ",
    guests: "Voyageurs",
    total: "Total payé",
    contact: "Pour toute question, écrivez-nous à villa.alba.franciacorta@gmail.com.",
  },
};

function formatEuros(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Invia l'email di conferma prenotazione all'ospite via Resend, in base a
 * nome/email/lingua raccolti nel form di prenotazione. Best-effort come il
 * resto delle integrazioni esterne (Stripe/Smoobu): se RESEND_API_KEY non è
 * impostata o l'invio fallisce, logga soltanto — non deve mai far fallire
 * la conferma del pagamento, che è già avvenuta.
 */
export async function sendBookingConfirmationEmail(booking: BookingRow): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY non impostata — email di conferma non inviata. Vedi docs/SETUP.md."
    );
    return;
  }

  const locale = LABELS[booking.locale] ? booking.locale : "it";
  const t = LABELS[locale];

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #14171c;">
      <h1 style="font-size: 20px;">Villa Alba</h1>
      <p>${t.greeting} ${escapeHtml(booking.guest_name)},</p>
      <p>${t.details}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 0; color: #545b66;">${t.checkIn}</td><td style="text-align: right;">${booking.check_in}</td></tr>
        <tr><td style="padding: 6px 0; color: #545b66;">${t.checkOut}</td><td style="text-align: right;">${booking.check_out}</td></tr>
        <tr><td style="padding: 6px 0; color: #545b66;">${t.guests}</td><td style="text-align: right;">${booking.guests_count}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600; border-top: 1px solid #dde1e7;">${t.total}</td><td style="text-align: right; font-weight: 600; border-top: 1px solid #dde1e7;">${formatEuros(booking.amount_cents, locale)}</td></tr>
      </table>
      <p style="color: #545b66; font-size: 13px;">${t.contact}</p>
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: booking.guest_email,
      subject: t.subject,
      html,
    });
    if (error) {
      console.error("[email] errore invio conferma (non bloccante)", error);
    }
  } catch (err) {
    console.error("[email] errore invio conferma (non bloccante)", err);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
