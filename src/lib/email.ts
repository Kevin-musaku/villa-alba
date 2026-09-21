import { Resend } from "resend";
import { format } from "date-fns";
import { it, enUS, de, es, fr, type Locale } from "date-fns/locale";
import type { BookingRow } from "@/lib/supabase/types";

const FROM_ADDRESS = "Villa Alba <prenotazioni@villaalbafranciacorta.com>";

const DATE_FNS_LOCALES: Record<string, Locale> = { it, en: enUS, de, es, fr };

const ADDRESS: Record<string, string> = {
  it: "Via Pietro Gobetti 7, Villa Pedergnano di Erbusco, 25030 Franciacorta (BS), Italia",
  en: "Via Pietro Gobetti 7, Villa Pedergnano di Erbusco, 25030 Franciacorta (BS), Italy",
  de: "Via Pietro Gobetti 7, Villa Pedergnano di Erbusco, 25030 Franciacorta (BS), Italien",
  es: "Via Pietro Gobetti 7, Villa Pedergnano di Erbusco, 25030 Franciacorta (BS), Italia",
  fr: "Via Pietro Gobetti 7, Villa Pedergnano di Erbusco, 25030 Franciacorta (BS), Italie",
};

function mapsUrl(locale: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    ADDRESS[locale] ?? ADDRESS.it
  )}`;
}

type EmailLabels = {
  subject: string;
  greeting: string;
  details: string;
  reference: string;
  stayTitle: string;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  guests: string;
  nightSingle: string;
  nightPlural: string;
  priceBreakdownTitle: string;
  perNightHeader: string;
  rentalSubtotal: string;
  cleaningFee: string;
  touristTax: string;
  total: string;
  addressTitle: string;
  mapsLink: string;
  questionsTitle: string;
  contact: string;
  footerNote: string;
};

const LABELS: Record<string, EmailLabels> = {
  it: {
    subject: "Conferma prenotazione — Villa Alba",
    greeting: "Grazie",
    details: "La tua prenotazione è confermata. Ecco il riepilogo:",
    reference: "Riferimento prenotazione",
    stayTitle: "Il tuo soggiorno",
    checkIn: "Check-in",
    checkOut: "Check-out",
    checkInTime: "Dalle 16:00 alle 18:00",
    checkOutTime: "Entro le 11:00",
    guests: "Ospiti",
    nightSingle: "notte",
    nightPlural: "notti",
    priceBreakdownTitle: "Dettaglio prezzo",
    perNightHeader: "Prezzo per notte",
    rentalSubtotal: "Subtotale soggiorno",
    cleaningFee: "Pulizie finali",
    touristTax: "Tassa di soggiorno",
    total: "Totale pagato",
    addressTitle: "Dove siamo",
    mapsLink: "Apri in Google Maps",
    questionsTitle: "Domande?",
    contact:
      "Per qualunque domanda scrivici a villa.alba.franciacorta@gmail.com o chiamaci al +39 331 7359787.",
    footerNote: "Grazie per aver scelto Villa Alba — non vediamo l'ora di ospitarvi.",
  },
  en: {
    subject: "Booking confirmation — Villa Alba",
    greeting: "Thank you",
    details: "Your booking is confirmed. Here's your summary:",
    reference: "Booking reference",
    stayTitle: "Your stay",
    checkIn: "Check-in",
    checkOut: "Check-out",
    checkInTime: "From 4:00 PM to 6:00 PM",
    checkOutTime: "By 11:00 AM",
    guests: "Guests",
    nightSingle: "night",
    nightPlural: "nights",
    priceBreakdownTitle: "Price breakdown",
    perNightHeader: "Price per night",
    rentalSubtotal: "Stay subtotal",
    cleaningFee: "Final cleaning",
    touristTax: "Tourist tax",
    total: "Total paid",
    addressTitle: "Where we are",
    mapsLink: "Open in Google Maps",
    questionsTitle: "Questions?",
    contact: "For any question, email us at villa.alba.franciacorta@gmail.com or call +39 331 7359787.",
    footerNote: "Thank you for choosing Villa Alba — we look forward to welcoming you.",
  },
  de: {
    subject: "Buchungsbestätigung — Villa Alba",
    greeting: "Vielen Dank",
    details: "Ihre Buchung ist bestätigt. Hier die Zusammenfassung:",
    reference: "Buchungsnummer",
    stayTitle: "Ihr Aufenthalt",
    checkIn: "Anreise",
    checkOut: "Abreise",
    checkInTime: "Von 16:00 bis 18:00 Uhr",
    checkOutTime: "Bis 11:00 Uhr",
    guests: "Gäste",
    nightSingle: "Nacht",
    nightPlural: "Nächte",
    priceBreakdownTitle: "Preisaufschlüsselung",
    perNightHeader: "Preis pro Nacht",
    rentalSubtotal: "Zwischensumme Aufenthalt",
    cleaningFee: "Endreinigung",
    touristTax: "Kurtaxe",
    total: "Bezahlter Gesamtbetrag",
    addressTitle: "Anfahrt",
    mapsLink: "In Google Maps öffnen",
    questionsTitle: "Fragen?",
    contact:
      "Bei Fragen schreiben Sie uns an villa.alba.franciacorta@gmail.com oder rufen Sie uns an unter +39 331 7359787.",
    footerNote: "Vielen Dank, dass Sie sich für Villa Alba entschieden haben — wir freuen uns auf Sie.",
  },
  es: {
    subject: "Confirmación de reserva — Villa Alba",
    greeting: "Gracias",
    details: "Tu reserva está confirmada. Aquí tienes el resumen:",
    reference: "Referencia de reserva",
    stayTitle: "Tu estancia",
    checkIn: "Entrada",
    checkOut: "Salida",
    checkInTime: "De 16:00 a 18:00",
    checkOutTime: "Antes de las 11:00",
    guests: "Huéspedes",
    nightSingle: "noche",
    nightPlural: "noches",
    priceBreakdownTitle: "Desglose del precio",
    perNightHeader: "Precio por noche",
    rentalSubtotal: "Subtotal de la estancia",
    cleaningFee: "Limpieza final",
    touristTax: "Tasa turística",
    total: "Total pagado",
    addressTitle: "Dónde estamos",
    mapsLink: "Abrir en Google Maps",
    questionsTitle: "¿Preguntas?",
    contact:
      "Para cualquier pregunta, escríbenos a villa.alba.franciacorta@gmail.com o llámanos al +39 331 7359787.",
    footerNote: "Gracias por elegir Villa Alba — estamos deseando recibiros.",
  },
  fr: {
    subject: "Confirmation de réservation — Villa Alba",
    greeting: "Merci",
    details: "Votre réservation est confirmée. Voici le récapitulatif :",
    reference: "Référence de réservation",
    stayTitle: "Votre séjour",
    checkIn: "Arrivée",
    checkOut: "Départ",
    checkInTime: "De 16h00 à 18h00",
    checkOutTime: "Avant 11h00",
    guests: "Voyageurs",
    nightSingle: "nuit",
    nightPlural: "nuits",
    priceBreakdownTitle: "Détail du prix",
    perNightHeader: "Prix par nuit",
    rentalSubtotal: "Sous-total du séjour",
    cleaningFee: "Ménage final",
    touristTax: "Taxe de séjour",
    total: "Total payé",
    addressTitle: "Où nous trouver",
    mapsLink: "Ouvrir dans Google Maps",
    questionsTitle: "Des questions ?",
    contact:
      "Pour toute question, écrivez-nous à villa.alba.franciacorta@gmail.com ou appelez-nous au +39 331 7359787.",
    footerNote: "Merci d'avoir choisi Villa Alba — nous avons hâte de vous accueillir.",
  },
};

function formatEuros(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(dateStr: string, locale: string, pattern: string): string {
  return format(new Date(dateStr), pattern, { locale: DATE_FNS_LOCALES[locale] ?? it });
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

  const nights = booking.nightly_prices;
  const nightsCount = nights?.length ?? Math.round(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86_400_000
  );
  const nightsWord = nightsCount === 1 ? t.nightSingle : t.nightPlural;
  // Il subtotale affitto si ricalcola dalle notti quando disponibili (coerenza
  // garantita con le righe elencate sopra); per prenotazioni precedenti alla
  // migrazione che ha introdotto nightly_prices, cade sul totale aggregato
  // già salvato — non deve mai bloccare l'invio dell'email.
  const rentalCents = nights?.length
    ? nights.reduce((sum, n) => sum + n.price_cents, 0)
    : booking.rental_cents ?? 0;

  const nightlyRows = nights?.length
    ? nights
        .map(
          (n) => `
        <tr>
          <td style="padding: 3px 0;">${formatDate(n.date, locale, "EEE d MMM")}</td>
          <td style="text-align: right;">${formatEuros(n.price_cents, locale)}</td>
        </tr>`
        )
        .join("")
    : "";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #14171c; border: 1px solid #dde1e7; border-radius: 8px; overflow: hidden;">
      <div style="background: #14171c; color: #f5f3ef; padding: 28px 32px;">
        <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #a9a196;">Franciacorta</div>
        <div style="font-size: 24px; font-weight: 600; margin-top: 6px;">Villa Alba</div>
      </div>

      <div style="padding: 24px 32px 0;">
        <p>${t.greeting} ${escapeHtml(booking.guest_name)},</p>
        <p>${t.details}</p>
        <p style="color: #8a8378; font-size: 12px;">${t.reference}: ${booking.id.slice(0, 8).toUpperCase()}</p>
      </div>

      <div style="padding: 0 32px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #545b66; border-bottom: 1px solid #dde1e7; padding-bottom: 6px; margin-top: 20px;">${t.stayTitle}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
          <tr>
            <td style="padding: 6px 0; color: #545b66;">${t.checkIn}</td>
            <td style="text-align: right;">${formatDate(booking.check_in, locale, "EEE d MMMM")} · ${t.checkInTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #545b66;">${t.checkOut}</td>
            <td style="text-align: right;">${formatDate(booking.check_out, locale, "EEE d MMMM")} · ${t.checkOutTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #545b66;">${nightsCount} ${nightsWord}</td>
            <td style="text-align: right;">${booking.guests_count} ${t.guests}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 0 32px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #545b66; border-bottom: 1px solid #dde1e7; padding-bottom: 6px;">${t.priceBreakdownTitle}</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px;">
          ${
            nightlyRows
              ? `<tr><td style="padding: 4px 0; color: #8a8378; font-size: 12px;">${t.perNightHeader}</td><td></td></tr>${nightlyRows}`
              : ""
          }
          <tr>
            <td style="padding: 8px 0; border-top: 1px solid #dde1e7;">${t.rentalSubtotal}</td>
            <td style="text-align: right; border-top: 1px solid #dde1e7;">${formatEuros(rentalCents, locale)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">${t.cleaningFee}</td>
            <td style="text-align: right;">${formatEuros(booking.cleaning_fee_cents ?? 0, locale)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">${t.touristTax}</td>
            <td style="text-align: right;">${formatEuros(booking.tourist_tax_cents ?? 0, locale)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; border-top: 2px solid #14171c;">${t.total}</td>
            <td style="text-align: right; font-weight: 600; border-top: 2px solid #14171c;">${formatEuros(booking.amount_cents, locale)}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 0 32px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #545b66; border-bottom: 1px solid #dde1e7; padding-bottom: 6px;">${t.addressTitle}</h2>
        <p style="margin: 12px 0 4px;">${escapeHtml(ADDRESS[locale] ?? ADDRESS.it)}</p>
        <p style="margin: 0 0 8px;"><a href="${mapsUrl(locale)}" style="color: #14171c; text-decoration: underline;">${t.mapsLink}</a></p>
      </div>

      <div style="padding: 16px 32px 28px; border-top: 1px solid #dde1e7; margin-top: 8px;">
        <p style="font-weight: 600; margin: 0 0 4px;">${t.questionsTitle}</p>
        <p style="color: #545b66; font-size: 13px; margin: 0 0 12px;">${t.contact}</p>
        <p style="color: #a9a196; font-size: 12px; margin: 0;">${t.footerNote}</p>
      </div>
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
