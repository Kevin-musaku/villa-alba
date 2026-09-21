/**
 * Invia un'email di conferma prenotazione finta, per verificare a occhio il
 * template senza dover fare un pagamento Stripe reale.
 * Uso: npx tsx scripts/send-test-email.ts [locale] [email-destinatario]
 * Esempio: npx tsx scripts/send-test-email.ts en villa.alba.franciacorta@gmail.com
 */
import { readFileSync } from "fs";
import { join } from "path";
import { sendBookingConfirmationEmail } from "../src/lib/email";
import type { BookingRow } from "../src/lib/supabase/types";

// tsx non carica .env.local da solo (è una feature di Next.js): lo leggiamo
// a mano e impostiamo RESEND_API_KEY su process.env prima di procedere.
const envPath = join(__dirname, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match) continue;
  const [, key, rawValue] = match;
  const value = rawValue.replace(/^"(.*)"$/, "$1");
  if (!(key in process.env)) process.env[key] = value;
}

const locale = process.argv[2] ?? "it";
const to = process.argv[3] ?? "villa.alba.franciacorta@gmail.com";

const fakeBooking: BookingRow = {
  id: "00000000-test-0000-0000-000000000000",
  check_in: "2026-09-22",
  check_out: "2026-09-25",
  guests_count: 4,
  guest_name: "Mario Rossi",
  guest_email: to,
  guest_phone: "+39 333 1234567",
  amount_cents: 118000,
  rental_cents: 96000,
  cleaning_fee_cents: 8000,
  tourist_tax_cents: 14000,
  nightly_prices: [
    { date: "2026-09-22", price_cents: 32000 },
    { date: "2026-09-23", price_cents: 32000 },
    { date: "2026-09-24", price_cents: 32000 },
  ],
  currency: "EUR",
  status: "confirmed",
  stripe_checkout_session_id: null,
  stripe_payment_intent_id: null,
  smoobu_reservation_id: null,
  smoobu_push_status: "not_pushed",
  locale,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

sendBookingConfirmationEmail(fakeBooking).then(() => {
  console.log(`Email di test (${locale}) inviata a ${to}`);
});
